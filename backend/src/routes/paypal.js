// Rutas para la integración con la pasarela de pagos PayPal
import express from "express";
import paypalController from "../controllers/paypalController.js";

const router = express.Router();

// POST /api/paypal/create-order   Crear una orden de PayPal con el total del carrito
router.route("/create-order").post(paypalController.createOrder);

// POST /api/paypal/capture-order  Cobrar la orden después de que el cliente la aprueba
router.route("/capture-order").post(paypalController.captureOrder);

export default router;
