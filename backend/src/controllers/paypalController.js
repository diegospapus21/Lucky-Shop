// Controlador para la integración de pagos con PayPal (API REST v2 de Orders)
// Lo usan tanto la web pública como la app móvil.
import fetch from "node-fetch";
import mongoose from "mongoose";
import { config } from "../../config.js";
import productosModel from "../models/productos.js";

const paypalController = {};

// Costo de envío que cobra la web pública (la app móvil tiene envío gratis)
const COSTO_ENVIO = 4;

// URLs a las que PayPal redirige en la app móvil al aprobar o cancelar.
// No necesitan existir: la app las intercepta dentro del WebView.
const URL_RETORNO_MOVIL = "https://luckyshop.app/paypal/exito";
const URL_CANCELAR_MOVIL = "https://luckyshop.app/paypal/cancelado";

// Error con código HTTP para responder al cliente con el status correcto
const errorHttp = (status, message) => Object.assign(new Error(message), { status });

// Pide a PayPal un access token usando el Client ID y el Secret (autenticación Basic)
const obtenerAccessToken = async () => {
  const { clientId, clientSecret, apiUrl } = config.paypal;
  if (!clientId || !clientSecret) {
    throw errorHttp(500, "Faltan las credenciales de PayPal en el .env");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    console.log("PayPal token error:", await response.text());
    throw errorHttp(502, "No se pudo autenticar con PayPal");
  }

  const data = await response.json();
  return data.access_token;
};

// Calcula el total con los precios de la BASE DE DATOS, no con los que manda el cliente,
// para que nadie pueda modificar el precio desde el navegador o la app.
// productos: [{ idProducto, cantidad }]
const calcularTotal = async (productos, incluirEnvio) => {
  if (!Array.isArray(productos) || productos.length === 0) {
    throw errorHttp(400, "El carrito está vacío");
  }

  const ids = productos.map((p) => p.idProducto);
  if (!ids.every((id) => mongoose.isValidObjectId(id))) {
    throw errorHttp(400, "Hay productos inválidos en el carrito");
  }

  const encontrados = await productosModel.find({ _id: { $in: ids } });
  const porId = new Map(encontrados.map((p) => [String(p._id), p]));

  let subtotal = 0;
  const cantidadPorProducto = new Map(); // suma cantidades si un producto aparece repetido

  for (const { idProducto, cantidad } of productos) {
    const producto = porId.get(String(idProducto));
    const cant = Number(cantidad);

    if (!producto) throw errorHttp(400, "Un producto del carrito ya no existe");
    if (!Number.isInteger(cant) || cant < 1) throw errorHttp(400, "Cantidad inválida");

    cantidadPorProducto.set(producto, (cantidadPorProducto.get(producto) || 0) + cant);
    subtotal += producto.precio * cant;
  }

  // Validamos el stock disponible
  for (const [producto, cant] of cantidadPorProducto) {
    if (cant > producto.stock) {
      throw errorHttp(400, `No hay suficiente stock de "${producto.nombre}"`);
    }
  }

  const total = subtotal + (incluirEnvio ? COSTO_ENVIO : 0);
  return total.toFixed(2); // PayPal espera el monto como texto con 2 decimales
};

// POST - Crear una orden de PayPal
// Body: { productos: [{ idProducto, cantidad }], incluirEnvio: boolean, plataforma: "web" | "movil" }
paypalController.createOrder = async (req, res) => {
  try {
    const { productos, incluirEnvio = false, plataforma = "web" } = req.body;

    const total = await calcularTotal(productos, incluirEnvio);
    const accessToken = await obtenerAccessToken();

    const orden = {
      intent: "CAPTURE",
      purchase_units: [
        {
          description: "Compra en LuckyShop",
          amount: { currency_code: "USD", value: total },
        },
      ],
    };

    // En móvil el pago se abre en un WebView, así que PayPal necesita saber a dónde volver
    if (plataforma === "movil") {
      orden.payment_source = {
        paypal: {
          experience_context: {
            brand_name: "LuckyShop",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: URL_RETORNO_MOVIL,
            cancel_url: URL_CANCELAR_MOVIL,
          },
        },
      };
    }

    const response = await fetch(`${config.paypal.apiUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orden),
    });

    const data = await response.json();
    if (!response.ok) {
      console.log("PayPal createOrder error:", JSON.stringify(data));
      return res.status(502).json({ message: "PayPal no pudo crear la orden" });
    }

    // Link donde el cliente aprueba el pago (lo usa la app móvil)
    const approveUrl = data.links?.find(
      (l) => l.rel === "payer-action" || l.rel === "approve"
    )?.href;

    return res.status(200).json({
      id: data.id,
      total,
      approveUrl,
      returnUrl: URL_RETORNO_MOVIL,
      cancelUrl: URL_CANCELAR_MOVIL,
    });
  } catch (error) {
    console.log("error " + error);
    return res
      .status(error.status || 500)
      .json({ message: error.status ? error.message : "Internal server error" });
  }
};

// POST - Capturar (cobrar) una orden que el cliente ya aprobó
// Body: { orderID }
paypalController.captureOrder = async (req, res) => {
  try {
    const { orderID } = req.body;
    if (!orderID) return res.status(400).json({ message: "Falta el orderID" });

    const accessToken = await obtenerAccessToken();

    const response = await fetch(
      `${config.paypal.apiUrl}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.log("PayPal captureOrder error:", JSON.stringify(data));
      return res.status(502).json({ message: "PayPal no pudo completar el pago" });
    }

    const captura = data.purchase_units?.[0]?.payments?.captures?.[0];

    return res.status(200).json({
      status: data.status, // "COMPLETED" cuando el cobro fue exitoso
      orderID: data.id,
      captureID: captura?.id,
      monto: captura?.amount?.value,
    });
  } catch (error) {
    console.log("error " + error);
    return res
      .status(error.status || 500)
      .json({ message: error.status ? error.message : "Internal server error" });
  }
};

export default paypalController;
