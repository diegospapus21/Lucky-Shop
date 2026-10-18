import express from "express"
import clientesController from "../controllers/clientesController.js";
import { validateAuthToken } from "../middlewares/validateAuthToken.js";

//Utilizo Router() para definir los metodos (get, post, put)
//para mi endpoint

const router = express.Router();

// Todas las rutas de clientes son SOLO para el administrador (contienen datos personales)

// Rutas principales para el endpoint /api/clientes
// GET  /api/clientes          Listar todos los clientes registrados (solo campos necesarios)
router
  .route("/")
  .get(validateAuthToken("Admin"), clientesController.getAllClients )

// Rutas específicas por ID para el endpoint /api/clientes/:id
// PUT    /api/clientes/:id     Actualizar los datos generales de un cliente (ej. hecho por un admin)
// DELETE /api/clientes/:id     Eliminar un cliente del sistema
router
  .route("/:id")
  .put(validateAuthToken("Admin"), clientesController.updateClients)
  .delete(validateAuthToken("Admin"), clientesController.deleteClient);

export default router;
