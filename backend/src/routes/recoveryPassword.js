// Rutas para la recuperación de contraseñas de clientes
import express from "express";

import recoveryPasswordController from "../controllers/recoveryPasswordController.js";
import { requestCodeLimiter, verifyCodeLimiter } from "../middlewares/recoveryLimiters.js";

const router = express.Router();

// POST /api/recoveryPassword/requestCode   Enviar código de recuperación al correo del cliente
router.route("/requestCode")
.post(requestCodeLimiter, recoveryPasswordController.requestCode);

// POST /api/recoveryPassword/verifyCode    Validar el código ingresado por el cliente
router.route("/verifyCode")
.post(verifyCodeLimiter, recoveryPasswordController.verifyCode);

// POST /api/recoveryPassword/newPassword   Guardar la nueva contraseña del cliente (si el código fue validado)
router.route("/newPassword")
.post(recoveryPasswordController.newPassword);

export default router;