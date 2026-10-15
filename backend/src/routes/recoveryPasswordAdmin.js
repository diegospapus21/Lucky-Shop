// Rutas para la recuperación de contraseñas de administradores
import express from "express";

import recoveryPasswordAdminController from "../controllers/recoveryPasswordAdminController.js";
import { requestCodeLimiter, verifyCodeLimiter } from "../middlewares/recoveryLimiters.js";

const router = express.Router();

// POST /api/recoveryPasswordAdmin/requestCode   Enviar código de recuperación al correo del administrador
router.route("/requestCode").post(requestCodeLimiter, recoveryPasswordAdminController.requestCode);

// POST /api/recoveryPasswordAdmin/verifyCode    Validar el código de recuperación
router.route("/verifyCode").post(verifyCodeLimiter, recoveryPasswordAdminController.verifyCode);

// POST /api/recoveryPasswordAdmin/newPassword   Guardar la nueva contraseña del administrador
router.route("/newPassword").post(recoveryPasswordAdminController.newPassword);

export default router;