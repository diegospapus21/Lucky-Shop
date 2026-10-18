import promocionesModel from "../models/promocionesModel.js";

const promocionesController = {};

// Datos del producto que realmente se necesitan junto a cada promoción
// (sin la lista de "favoritos" de clientes ni campos internos)
const POPULATE_PRODUCTO = {
  path: "idProducto",
  select: "nombre precio stock estado descripcion imagenes imagenPresentacion idCategoria subCategoria",
};

const MAX_DIAS_PROMOCION = 365; // una promoción no puede durar más de un año

// Fecha de hoy (YYYY-MM-DD) en la hora de El Salvador, para no rechazar "hoy" por la zona horaria del servidor
const hoyISO = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/El_Salvador" });

// Toma solo la parte YYYY-MM-DD de una fecha (string o Date); devuelve null si no es válida
const soloDia = (valor) => {
  const texto = valor instanceof Date ? valor.toISOString() : String(valor || "");
  const dia = texto.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return null;
  const f = new Date(`${dia}T00:00:00Z`);
  return Number.isNaN(f.getTime()) || f.toISOString().slice(0, 10) !== dia ? null : dia;
};

const diasEntre = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);

// Valida que las fechas tengan sentido. Devuelve un mensaje de error o null si todo está bien.
//  - fechaInicio y fechaFin deben ser fechas reales
//  - la fecha de inicio y la fecha fin no pueden ser pasadas (solo se revisan si cambiaron,
//    para poder editar el descuento de una promoción que ya inició o que ya venció)
//  - la fecha fin no puede ser anterior a la de inicio
//  - la duración máxima es de un año
const validarFechasPromocion = (inicio, fin, original = null) => {
  const dIni = soloDia(inicio);
  const dFin = soloDia(fin);
  if (!dIni || !dFin) return "Las fechas de la promoción no son válidas";

  const hoy = hoyISO();
  const cambioInicio = !original || soloDia(original.fechaInicio) !== dIni;
  const cambioFin = !original || soloDia(original.fechaFin) !== dFin;

  if (cambioInicio && dIni < hoy) return "La fecha de inicio no puede ser una fecha pasada";
  if (cambioFin && dFin < hoy) return "La fecha fin no puede ser una fecha pasada";
  if (dFin < dIni) return "La fecha fin no puede ser anterior a la de inicio";
  if (diasEntre(dIni, dFin) > MAX_DIAS_PROMOCION) return "La promoción no puede durar más de un año";
  return null;
};

// GET ALL — para el apartado de promociones del admin
promocionesController.getPromociones = async (req, res) => {
  try {
    const promociones = await promocionesModel
      .find()
      .select("-__v -updatedAt")
      .populate(POPULATE_PRODUCTO)
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json(promociones);
  } catch (error) {
    console.error("getPromociones error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET ACTIVAS — solo las vigentes hoy (para el carrito / tienda)
promocionesController.getPromocionesActivas = async (req, res) => {
  try {
    const ahora = new Date();
    const promociones = await promocionesModel
      .find({
        estado: "activa",
        fechaInicio: { $lte: ahora },
        fechaFin: { $gte: ahora },
      })
      .select("idProducto descuento fechaInicio fechaFin")
      .populate(POPULATE_PRODUCTO)
      .lean();
    return res.status(200).json(promociones);
  } catch (error) {
    console.error("getPromocionesActivas error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// INSERT
promocionesController.insertPromocion = async (req, res) => {
  try {
    let { idProducto, descuento, fechaInicio, fechaFin } = req.body;

    if (!idProducto || descuento === undefined || !fechaInicio || !fechaFin) {
      return res
        .status(400)
        .json({ message: "Producto, descuento y fechas son requeridos" });
    }

    if (isNaN(descuento) || descuento < 1 || descuento > 99) {
      return res.status(400).json({ message: "Descuento inválido (1-99)" });
    }

    const errorFechas = validarFechasPromocion(fechaInicio, fechaFin);
    if (errorFechas) {
      return res.status(400).json({ message: errorFechas });
    }

    // La fecha inicio se ajusta al comienzo del día (00:00:00) y la fecha fin
    // al final del día (23:59:59.999), para que la promoción esté vigente
    // durante todo el rango de días seleccionado, sin importar la hora actual.
    const inicioDelDia = new Date(fechaInicio);
    inicioDelDia.setHours(0, 0, 0, 0);

    const finDelDia = new Date(fechaFin);
    finDelDia.setHours(23, 59, 59, 999);

    const newPromocion = new promocionesModel({
      idProducto,
      descuento: Number(descuento),
      fechaInicio: inicioDelDia,
      fechaFin: finDelDia,
      estado: "activa",
    });

    await newPromocion.save();
    return res.status(201).json({
      message: "Promoción creada exitosamente",
      promocion: newPromocion,
    });
  } catch (error) {
    console.error("insertPromocion error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// UPDATE — editar una promoción existente
promocionesController.updatePromocion = async (req, res) => {
  try {
    let { idProducto, descuento, fechaInicio, fechaFin, estado } = req.body;

    if (descuento !== undefined && (isNaN(descuento) || descuento < 1 || descuento > 99)) {
      return res.status(400).json({ message: "Descuento inválido (1-99)" });
    }

    // Si se cambian las fechas, se validan contra la promoción actual
    if (fechaInicio || fechaFin) {
      const actual = await promocionesModel.findById(req.params.id).select("fechaInicio fechaFin").lean();
      if (!actual) {
        return res.status(404).json({ message: "Promoción no encontrada" });
      }
      const errorFechas = validarFechasPromocion(
        fechaInicio || actual.fechaInicio,
        fechaFin || actual.fechaFin,
        actual,
      );
      if (errorFechas) {
        return res.status(400).json({ message: errorFechas });
      }
    }

    // Armamos solo los campos que llegaron, ajustando las horas de las fechas
    const updateData = {};
    if (idProducto) updateData.idProducto = idProducto;
    if (descuento !== undefined) updateData.descuento = Number(descuento);
    if (estado) updateData.estado = estado;

    if (fechaInicio) {
      const inicioDelDia = new Date(fechaInicio);
      inicioDelDia.setHours(0, 0, 0, 0);
      updateData.fechaInicio = inicioDelDia;
    }
    if (fechaFin) {
      const finDelDia = new Date(fechaFin);
      finDelDia.setHours(23, 59, 59, 999);
      updateData.fechaFin = finDelDia;
    }

    const promocionActualizada = await promocionesModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!promocionActualizada) {
      return res.status(404).json({ message: "Promoción no encontrada" });
    }

    return res.status(200).json({
      message: "Promoción actualizada exitosamente",
      promocion: promocionActualizada,
    });
  } catch (error) {
    console.error("updatePromocion error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// DELETE
promocionesController.deletePromocion = async (req, res) => {
  try {
    const promocion = await promocionesModel.findByIdAndDelete(req.params.id);
    if (!promocion) {
      return res.status(404).json({ message: "Promoción no encontrada" });
    }
    return res
      .status(200)
      .json({ message: "Promoción eliminada exitosamente" });
  } catch (error) {
    console.error("deletePromocion error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// TOGGLE ESTADO
promocionesController.toggleEstado = async (req, res) => {
  try {
    const promocion = await promocionesModel.findById(req.params.id);
    if (!promocion) {
      return res.status(404).json({ message: "Promoción no encontrada" });
    }
    promocion.estado = promocion.estado === "activa" ? "inactiva" : "activa";
    await promocion.save();
    return res.status(200).json({
      message: `Promoción ${promocion.estado}`,
      estado: promocion.estado,
    });
  } catch (error) {
    console.error("toggleEstado error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default promocionesController;