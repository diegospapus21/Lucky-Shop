import express from "express"
import combosCompradosController from "../controllers/combosCompradosController.js"
import upload from "../utils/cloudinaryConfig.js"
import { validateAuthToken } from "../middlewares/validateAuthToken.js";

const router = express.Router()

// Rutas principales para el endpoint /api/combosComprados
// GET  /api/combosComprados          Listar todas las compras de combos registradas
// POST /api/combosComprados          Registrar una nueva compra y subir el video (urlVideo)
router.route("/")
.get(validateAuthToken("Admin"), combosCompradosController.getAllcombosComprados)
.post(validateAuthToken("Admin"), upload.single("urlVideo"), combosCompradosController.insertcombosComprados)

// Rutas específicas por ID para el endpoint /api/combosComprados/:id
// GET    /api/combosComprados/:id     Obtener el detalle de una compra específica
// PUT    /api/combosComprados/:id    Actualizar estado o reemplazar video de la compra
// DELETE /api/combosComprados/:id    Eliminar el registro de la compra
router.route("/:id")
.get(validateAuthToken("Admin"), combosCompradosController.getcombosCompradosById)
.put(validateAuthToken("Admin"), upload.single("urlVideo"), combosCompradosController.updatecombosComprados)
.delete(validateAuthToken("Admin"), combosCompradosController.deletecombosComprados)

export default router; 