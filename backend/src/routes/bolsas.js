import express from "express";
import bolsasController from "../controllers/bolsasController.js";
import upload from "../utils/cloudinaryConfig.js";
import { validateAuthToken } from "../middlewares/validateAuthToken.js";

//Utilizo Router() para definir los metodos (ger, post, put)
//para mi endpoint

const router = express.Router();

// Rutas principales para el endpoint /api/bolsas
// GET  /api/bolsas           Listar todas las bolsas (público; filtros opcionales: ?estado=&search=)
// POST /api/bolsas          Crear nueva bolsa (solo admin; incluye middleware upload para múltiples imágenes)
router
  .route("/")
  .get(bolsasController.getBolsas)
  .post(validateAuthToken("Admin"), upload.array("imagenes", 5), bolsasController.insertBolsas);

// Rutas específicas por ID para el endpoint /api/bolsas/:id
// GET    /api/bolsas/:id    Obtener los detalles de una bolsa por su ID
// PUT    /api/bolsas/:id    Actualizar una bolsa (permite subir nuevas imágenes)
// DELETE /api/bolsas/:id    Eliminar una bolsa y sus imágenes asociadas
router
  .route("/:id")
  .get(bolsasController.getBolsaById)
  .put(validateAuthToken("Admin"), upload.array("imagenes", 5), bolsasController.updateBolsas)
  .delete(validateAuthToken("Admin"), bolsasController.deleteBolsas);

export default router;
