// Rutas para la gestión de productos del catálogo
import express from "express";
import productosController from "../controllers/productosController.js";
import upload from "../utils/cloudinaryConfig.js";
import { validateAuthToken } from "../middlewares/validateAuthToken.js";

const router = express.Router();

// Rutas principales para el endpoint /api/productos
// GET  /api/productos           Listar todos los productos (público; soporta filtros: ?categoria=&estado=&search=)
// POST /api/productos          Crear nuevo producto y subir sus imágenes (solo admin)
router
  .route("/")
  .get(productosController.getProductos)
  .post(validateAuthToken("Admin"), upload.array("imagenes", 5), productosController.insertProducto);

// Rutas específicas por ID para el endpoint /api/productos/:id
// GET    /api/productos/:id     Obtener todos los detalles de un producto específico (público)
// PUT    /api/productos/:id    Actualizar la información de un producto (solo admin)
// DELETE /api/productos/:id    Eliminar un producto y sus imágenes asociadas (solo admin)
router
  .route("/:id")
  .get(productosController.getProductoById)
  .put(validateAuthToken("Admin"), upload.array("imagenes", 5), productosController.updateProducto)
  .delete(validateAuthToken("Admin"), productosController.deleteProducto);

// PATCH /api/productos/:id/toggle  Alternar el estado del producto (activo <-> inactivo) (solo admin)
router.patch("/:id/toggle", validateAuthToken("Admin"), productosController.toggleEstado);

export default router;
