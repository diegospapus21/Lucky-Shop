// Rutas para el registro y gestión de ventas finalizadas
import express from "express";
import ventaController from "../controllers/ventaController.js";
import { validateAuthToken } from "../middlewares/validateAuthToken.js";

const router = express.Router();

// Rutas principales para el endpoint /api/venta
// GET  /api/venta           Listar todas las ventas (SOLO admin; filtros opcionales: ?estado=&search=)
// POST /api/venta           Crear un nuevo registro de venta (cliente con sesión iniciada)
router.route("/")
.get(validateAuthToken("Admin"), ventaController.getVenta)
.post(validateAuthToken("Clientes"), ventaController.insertVenta);

// GET /api/venta/mias       Compras del cliente que inició sesión (para su Historial)
// IMPORTANTE: va antes de "/:id" para que "mias" no se tome como un ID
router.route("/mias")
.get(validateAuthToken("Clientes"), ventaController.getMisVentas);

// POST /api/venta/search_name Buscar ventas específicas por número/nombre de referencia (solo admin)
router.route("/search_name")
.post(validateAuthToken("Admin"), ventaController.searchByName);

// Rutas específicas por ID para el endpoint /api/venta/:id (solo admin)
// GET    /api/venta/:id     Obtener todos los detalles de una venta específica
// PUT    /api/venta/:id     Actualizar estado u otros detalles de la venta
// DELETE /api/venta/:id     Eliminar un registro de venta
router.route("/:id")
.put(validateAuthToken("Admin"), ventaController.updateVenta) 
.delete(validateAuthToken("Admin"), ventaController.deleteVenta)
.get(validateAuthToken("Admin"), ventaController.getVentaById);


export default router;
