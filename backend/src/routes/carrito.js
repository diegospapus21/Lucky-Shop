import express from "express";
import carritoController from "../controllers/carritoController.js";
import { validateAuthToken } from "../middlewares/validateAuthToken.js";

//Utilizo Router() para definir los metodos (ger, post, put)
//para mi endpoint

const router = express.Router();

// Rutas principales para el endpoint /api/carrito
// GET  /api/carrito           Listar todos los carritos de compras (solo admin)
// POST /api/carrito           Crear un carrito (cliente con sesión iniciada; queda a su nombre)
router
  .route("/")
  .get(validateAuthToken("Admin"), carritoController.getCarrito)
  .post(validateAuthToken("Clientes"), carritoController.insertCarrito);

// Rutas específicas por ID para el endpoint /api/carrito/:id (solo admin)
// GET    /api/carrito/:id     Obtener un carrito por su ID
// PUT    /api/carrito/:id    Actualizar los productos o el estado del carrito
// DELETE /api/carrito/:id     Eliminar el carrito
router
  .route("/:id")
  .get(validateAuthToken("Admin"), carritoController.getCarritoById)
  .put(validateAuthToken("Admin"), carritoController.updateCarrito)
  .delete(validateAuthToken("Admin"), carritoController.deleteCarrito);

export default router;
