// Rutas para la integración con la pasarela de pagos Wompi
 
import express from "express";
import wompiController from "../controllers/wompiController.js";
import { validateAuthToken } from "../middlewares/validateAuthToken.js";

const router = express.Router()

// Los pagos solo los puede iniciar un cliente con sesión iniciada
 
// POST /api/wompi/token        Solicitar un token de autenticación a Wompi
router.route("/token").post(validateAuthToken("Clientes"), wompiController.generaToken)
 
// POST /api/wompi/paymentTest  Procesar un pago de prueba sin 3D Secure
router.route("/paymentTest").post(validateAuthToken("Clientes"), wompiController.paymentTest)
 
// POST /api/wompi/payment3DS   Procesar un pago real con 3D Secure
router.route("/payment3DS").post(validateAuthToken("Clientes"), wompiController.payment3DS);
 
export default router;
