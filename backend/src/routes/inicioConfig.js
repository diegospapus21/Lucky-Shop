import express from "express";
import inicioConfigController from "../controllers/inicioConfigController.js";
import upload from "../utils/cloudinaryConfig.js";
import { validateAuthToken } from "../middlewares/validateAuthToken.js";

const router = express.Router();

// GET /api/inicioConfig  Configuración de la página de inicio (público)
// PUT /api/inicioConfig  Editar la página de inicio (solo admin)
router
  .route("/")
  .get(inicioConfigController.getInicioConfig)
  .put(validateAuthToken("Admin"), upload.single("imagen"), inicioConfigController.updateInicioConfig);

export default router;
