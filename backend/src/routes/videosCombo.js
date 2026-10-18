// routes/videosCombo.js — rutas para el módulo de "Videos combos"
import express from "express";
import videosComboController from "../controllers/videosComboController.js";
import upload from "../utils/cloudinaryConfig.js"; 
import { validateAuthToken } from "../middlewares/validateAuthToken.js"; 

const router = express.Router();

// GET  /videosCombo      -> lista todos los combos (panel admin)
// POST /videosCombo      -> crea un combo nuevo, subiendo el video vía Cloudinary (admin)
router.route("/")
.get(validateAuthToken("Admin"), videosComboController.getVideosCombo)
.post(validateAuthToken("Admin"), upload.single("video"), videosComboController.insertVideoCombo);

// GET /videosCombo/mios  -> lista solo los combos del cliente autenticado (página pública "Videos")
router.route("/mios")
.get(validateAuthToken("Clientes"), videosComboController.getMisVideosCombo);

// PATCH /videosCombo/:id/status  -> el cliente acepta o deniega su propio combo
router.route("/:id/status")
.patch(validateAuthToken("Clientes"), videosComboController.actualizarStatus);

// PATCH /videosCombo/:id/status-admin  -> la admin corrige el estado desde el panel (sin validar dueño)
router.route("/:id/status-admin")
.patch(validateAuthToken("Admin"), videosComboController.actualizarStatusAdmin);

// DELETE /videosCombo/:id  -> elimina un combo (panel admin)
router.route("/:id")
.delete(validateAuthToken("Admin"), videosComboController.deleteVideoCombo);

export default router;