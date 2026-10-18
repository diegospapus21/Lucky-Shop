import express from "express";
import promocionesController from "../controllers/promocionesController.js";
import { validateAuthToken } from "../middlewares/validateAuthToken.js";

const router = express.Router();

// GET  /api/promociones        Todas las promociones (solo admin)
// POST /api/promociones        Crear una promoción (solo admin; el servidor valida las fechas)
router.route("/")
  .get(validateAuthToken("Admin"), promocionesController.getPromociones)
  .post(validateAuthToken("Admin"), promocionesController.insertPromocion);

// GET /api/promociones/activas  Promociones vigentes hoy (público, para la tienda)
router.route("/activas")
  .get(promocionesController.getPromocionesActivas);

router.route("/:id")
  .put(validateAuthToken("Admin"), promocionesController.updatePromocion)
  .delete(validateAuthToken("Admin"), promocionesController.deletePromocion);

router.route("/:id/toggle")
  .put(validateAuthToken("Admin"), promocionesController.toggleEstado);

export default router;
