//Controlador para gestionar las ventas y pagos
import mongoose from "mongoose";
import ventaModel from "../models/venta.js";
import carritoModel from "../models/carrito.js";
import gananciasModel from "../models/ganancias.js";
import productsModel from "../models/productos.js";
import bolsasModel from "../models/bolsas.js";

const ventaController = {};

const POPULATE_CARRITO = {
  path: "IdCarrito",
  populate: [
    { path: "idCliente", select: "name lastName email" },
    { path: "productos.idProducto", select: "nombre precio imagenPresentacion descripcion" },
  ],
};

// A falta de un campo "estado" propio, se deriva de los dos booleanos existentes:
// status=false -> Cancelado, statusPago=false (con status activo) -> Pendiente, ambos true -> Completado
const derivarEstado = (status, statusPago) => {
  const activo = status === undefined ? true : status;
  const pagado = statusPago === undefined ? true : statusPago;
  if (!activo) return "Cancelado";
  if (!pagado) return "Pendiente";
  return "Completado";
};

const enriquecerVenta = (venta) => {
  const obj = venta.toObject ? venta.toObject() : venta;
  const carrito = obj.IdCarrito;
  const cliente = carrito?.idCliente
    ? `${carrito.idCliente.name || ""} ${carrito.idCliente.lastName || ""}`.trim()
    : "";

  return {
    ...obj,
    cliente: cliente || "Cliente",
    monto: Number(carrito?.total ?? 0),
    estado: derivarEstado(obj.status, obj.statusPago),
    estadoPedido: obj.estadoPedido || "pendiente", // pendiente | aceptado | rechazado
    enviado: !!obj.enviado,
  };
};

// Crea, actualiza o elimina la ganancia vinculada a una venta según su estado.
// Si la venta está "Completado", crea/actualiza la ganancia con el monto y fecha actuales.
// Si deja de estar "Completado" (se cancela, se pone pendiente), elimina la ganancia asociada
// para que no siga sumando al balance en Finanzas.
const sincronizarGanancia = async (ventaId, estado, monto, fecha) => {
  try {
    if (estado !== "Completado") {
      await gananciasModel.deleteOne({ "ventas.idVenta": ventaId });
      return;
    }

    await gananciasModel.findOneAndUpdate(
      { "ventas.idVenta": ventaId }, // busca si ya existe una ganancia para esta venta
      {
        $setOnInsert: {
          ventas: [{ idVenta: ventaId }],
          gastos: [],
        },
        $set: {
          totalGanancias: monto,
          // Finanzas agrupa por mes usando "fechaMes"; "fecha" se conserva por compatibilidad
          fechaMes: fecha || new Date(),
          fecha: fecha || new Date(),
        },
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("sincronizarGanancia error:", error);
  }
};

//GET - Obtener todas las ventas con filtros opcionales por estado y nombre del cliente
ventaController.getVenta = async (req, res) => {
  try {
    const { estado, search } = req.query;

    const ventas = await ventaModel
      .find()
      .select("-__v -updatedAt")
      .sort({ createdAt: -1 })
      .populate(POPULATE_CARRITO);

    let resultado = ventas.map(enriquecerVenta);

    if (estado) {
      resultado = resultado.filter(
        (v) => v.estado.toLowerCase() === String(estado).toLowerCase()
      );
    }

    if (search) {
      const termino = String(search).toLowerCase();
      resultado = resultado.filter(
        (v) =>
          v.cliente.toLowerCase().includes(termino) ||
          (v.referencia || "").toLowerCase().includes(termino)
      );
    }

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("getVenta error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//GET - Obtener SOLO las compras del cliente que inició sesión (para su Historial).
//Antes la web descargaba todas las ventas de todos los clientes y las filtraba en el navegador.
ventaController.getMisVentas = async (req, res) => {
  try {
    // Carritos que pertenecen a este cliente
    const carritos = await carritoModel
      .find({ idCliente: req.user.id })
      .select("_id")
      .lean();

    const ventas = await ventaModel
      .find({ IdCarrito: { $in: carritos.map((c) => c._id) } })
      .select("IdCarrito direcion referencia metodoPago statusPago phone fecha status estadoPedido enviado createdAt")
      .sort({ createdAt: -1 })
      .populate({
        path: "IdCarrito",
        select: "total productos",
        populate: {
          path: "productos.idProducto",
          select: "nombre precio imagenPresentacion descripcion",
        },
      });

    // Se agrega "estado" y "monto" y se quita "cliente" (el cliente ya es quien consulta)
    const resultado = ventas.map((v) => {
      const venta = enriquecerVenta(v);
      delete venta.cliente;
      return venta;
    });

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("getMisVentas error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//POST - Insertar una nueva venta y sincronizar la ganancia
ventaController.insertVenta = async (req, res) => {
  try {
    const { IdCarrito, direcion, referencia, metodoPago, statusPago, phone, fecha, status } = req.body;

    if (!IdCarrito) {
      return res.status(400).json({ message: "IdCarrito es obligatorio para registrar una venta" });
    }

    // Un cliente solo puede registrar ventas de SU propio carrito
    if (req.user?.userType === "Clientes") {
      const carrito = await carritoModel.findById(IdCarrito).select("idCliente").lean();
      if (!carrito || String(carrito.idCliente) !== String(req.user.id)) {
        return res.status(403).json({ message: "No autorizado" });
      }
    }

    const newVenta = new ventaModel({ IdCarrito, direcion, referencia, metodoPago, statusPago, phone, fecha, status });
    await newVenta.save();

    const ventaGuardada = await ventaModel.findById(newVenta._id).populate(POPULATE_CARRITO);
    const ventaEnriquecida = enriquecerVenta(ventaGuardada);

    await sincronizarGanancia(ventaGuardada._id, ventaEnriquecida.estado, ventaEnriquecida.monto, ventaEnriquecida.fecha);

    // Descontar stock de los productos vendidos y cambiar estado a 'agotado' si llega a 0
    try {
      if (ventaGuardada?.IdCarrito?.productos && Array.isArray(ventaGuardada.IdCarrito.productos)) {
        for (const item of ventaGuardada.IdCarrito.productos) {
          const prodId = item.idProducto?._id || item.idProducto;
          const cant = Number(item.cantidad) || 0;
          if (prodId && cant > 0) {
            const prod = await productsModel.findById(prodId);
            if (prod) {
              const nuevoStock = Math.max(0, (prod.stock || 0) - cant);
              prod.stock = nuevoStock;
              if (nuevoStock === 0 && prod.estado === "activo") {
                prod.estado = "agotado";
              }
              await prod.save();
            } else {
              const bolsa = await bolsasModel.findById(prodId);
              if (bolsa) {
                const nuevoStock = Math.max(0, (bolsa.stock || 0) - cant);
                bolsa.stock = nuevoStock;
                if (nuevoStock === 0 && bolsa.estado === "activo") {
                  bolsa.estado = "agotado";
                }
                await bolsa.save();
              }
            }
          }
        }
      }
    } catch (stockError) {
      console.error("Error al actualizar stock de productos tras la venta:", stockError);
    }

    return res.status(201).json(ventaEnriquecida);
  } catch (error) {
    console.error("insertVenta error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//DELETE - Eliminar una venta por su ID y su ganancia asociada (si existe)
ventaController.deleteVenta = async (req, res) => {
  try {
    const ventaEliminada = await ventaModel.findByIdAndDelete(req.params.id);
    if (!ventaEliminada) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    await gananciasModel.deleteOne({ "ventas.idVenta": req.params.id });

    return res.status(200).json({ message: "Venta deleted" });
  } catch (error) {
    console.error("deleteVenta error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//PUT - Actualizar una venta por su ID y sincronizar la ganancia
ventaController.updateVenta = async (req, res) => {
  try {
    const { IdCarrito, direcion, referencia, metodoPago, statusPago, phone, fecha, status, enviado } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }
    const actual = await ventaModel.findById(req.params.id);
    if (!actual) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Un pedido rechazado queda bloqueado: no se reactiva ni se marca como enviado
    if (actual.estadoPedido === "rechazado" && (status === true || statusPago === true || enviado === true)) {
      return res.status(409).json({ message: "El pedido fue rechazado y ya no se puede reactivar ni enviar." });
    }

    // Un pedido enviado no se puede cancelar/rechazar (tampoco por esta vía)
    const quedaEnviado = enviado === undefined ? !!actual.enviado : !!enviado;
    if (quedaEnviado && status === false) {
      return res.status(409).json({ message: "El pedido ya fue enviado y no se puede cancelar ni rechazar." });
    }

    const cambios = { IdCarrito, direcion, referencia, metodoPago, statusPago, phone, fecha, status };
    if (enviado !== undefined) {
      cambios.enviado = !!enviado;
      cambios.fechaEnvio = enviado ? (actual.fechaEnvio || new Date()) : null;
    }

    const ventaActualizada = await ventaModel.findByIdAndUpdate(
      req.params.id,
      cambios,
      { new: true },
    ).populate(POPULATE_CARRITO);

    if (!ventaActualizada) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    const ventaEnriquecida = enriquecerVenta(ventaActualizada);

    await sincronizarGanancia(ventaActualizada._id, ventaEnriquecida.estado, ventaEnriquecida.monto, ventaEnriquecida.fecha);

    return res.status(200).json(ventaEnriquecida);
  } catch (error) {
    console.error("updateVenta error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//PUT - El administrador acepta o rechaza un pedido.
// Reglas: solo se decide una vez (después los botones quedan bloqueados) y un pedido
// que ya fue enviado no se puede rechazar. Rechazar cancela la venta y quita su ganancia.
ventaController.decidirPedido = async (req, res) => {
  try {
    const { decision } = req.body;

    if (!["aceptado", "rechazado"].includes(decision)) {
      return res.status(400).json({ message: "Decisión inválida: debe ser 'aceptado' o 'rechazado'" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Condiciones en la misma consulta que actualiza, así dos clics seguidos no pueden decidir dos veces
    const filtro = {
      _id: req.params.id,
      status: { $ne: false }, // un pedido cancelado ya no se decide
      $or: [{ estadoPedido: { $exists: false } }, { estadoPedido: "pendiente" }],
    };
    if (decision === "rechazado") filtro.enviado = { $ne: true }; // ya enviado: no se puede rechazar

    const cambios = { estadoPedido: decision, fechaDecision: new Date() };
    if (decision === "rechazado") cambios.status = false; // pasa a "Cancelado"

    const venta = await ventaModel
      .findOneAndUpdate(filtro, { $set: cambios }, { new: true })
      .populate(POPULATE_CARRITO);

    if (!venta) {
      // No se pudo decidir: se explica el motivo
      const existente = await ventaModel.findById(req.params.id);
      if (!existente) {
        return res.status(404).json({ message: "Venta no encontrada" });
      }
      const yaDecidido = (existente.estadoPedido && existente.estadoPedido !== "pendiente") || existente.status === false;
      if (yaDecidido) {
        return res.status(409).json({ message: "Este pedido ya fue aceptado, rechazado o cancelado y no se puede cambiar." });
      }
      return res.status(409).json({ message: "El pedido ya fue enviado y no se puede rechazar." });
    }

    const ventaEnriquecida = enriquecerVenta(venta);
    // Al rechazar (Cancelado) se elimina la ganancia asociada para que no sume en Finanzas
    await sincronizarGanancia(venta._id, ventaEnriquecida.estado, ventaEnriquecida.monto, ventaEnriquecida.fecha);

    return res.status(200).json(ventaEnriquecida);
  } catch (error) {
    console.error("decidirPedido error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//GET - Obtener una venta por su ID
ventaController.getVentaById = async (req, res) => {
  try {
    const venta = await ventaModel.findById(req.params.id).populate(POPULATE_CARRITO);
    if (!venta) {
      return res.status(404).json({ message: "venta not found" });
    }
    return res.status(200).json(enriquecerVenta(venta));
  } catch (error) {
    console.log("error" + error)
    return res.status(500).json({message: "internal server error"})
  }
};

//POST - Buscar ventas por nombre de referencia
ventaController.searchByName = async (req, res) => {
  try {
    const { referencia } = req.body;

    const venta = await ventaModel.find({
      referencia: {$regex: referencia, $options: "i"}
    })

    if(!venta){
      return res.status(404).json({message: "not venta found"})
    }

    return res.status(200).json(venta)
  } catch (error) {
    console.log("error" + error)
    return res.status(500).json({message: "internal server error"})
  }
};

//Exportamos el controlador para usarlo en las rutas
export default ventaController;