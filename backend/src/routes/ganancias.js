import express from "express"
import gananciasController from "../controllers/gananciasController.js";
import { validateAuthToken } from "../middlewares/validateAuthToken.js";
//Utilizo Router() para definir los metodos (get, post, put)
//para mi endpoint.

const router = express.Router();

// Rutas principales para el endpoint /api/ganancias
// GET  /api/ganancias           Listar todos los reportes de ganancias (ventas vs gastos)
// POST /api/ganancias           Crear un nuevo registro de ganancias
router
  .route("/")
  .get(validateAuthToken("Admin"), gananciasController.getAllGanancias)
  .post(validateAuthToken("Admin"), gananciasController.insertGanancias)

// Rutas específicas por ID para el endpoint /api/ganancias/:id
// GET    /api/ganancias/:id     Obtener un registro de ganancia específico
// PUT    /api/ganancias/:id     Actualizar montos o recalcular ganancia
// DELETE /api/ganancias/:id     Eliminar un registro
router
  .route("/:id")
  .get(validateAuthToken("Admin"), gananciasController.getGananciaById)
  .put(validateAuthToken("Admin"), gananciasController.updateGanancia)
  .delete(validateAuthToken("Admin"), gananciasController.deleteGanancia);

export default router;