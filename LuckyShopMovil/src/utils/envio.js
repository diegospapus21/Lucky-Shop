/**
 * envio.js
 * Datos de envío que se muestran y cobran en el carrito.
 * Cambia aquí el costo o el tiempo de entrega y se actualiza en toda la app.
 */

// Costo de envío fijo (el mismo que cobra la web), solo si hay productos en el carrito
export const COSTO_ENVIO = 4.0;

// Tiempo estipulado para recibir el pedido. AJUSTAR al plazo real de la tienda.
export const TIEMPO_ENTREGA = "2 a 3 días hábiles";

export const MENSAJE_ENTREGA = `Tiempo estimado de entrega: ${TIEMPO_ENTREGA}.`;
