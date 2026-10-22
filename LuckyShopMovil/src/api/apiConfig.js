/**
 * apiConfig.js
 * -----------------------------------------------------------------------------
 * Punto ÚNICO de configuración de la API. La app móvil consume EXACTAMENTE la
 * misma base de datos que la app web, a través del mismo backend de Express.
 */

// Dirección base del backend. Si existe la variable EXPO_PUBLIC_API_URL (por
// ejemplo en un archivo .env) se usa esa; si no, se usa el servidor de Render.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://lucky-shop-3.onrender.com/api";

/**
 * endpoints
 * Rutas del backend agrupadas por módulo. Centralizarlas evita repetir textos
 * por toda la app y facilita el mantenimiento si una ruta cambia.
 */
export const endpoints = {
  // Autenticación de clientes
  login: `${API_BASE_URL}/loginClientes`,
  checkSession: `${API_BASE_URL}/loginClientes/checkSession`,
  logout: `${API_BASE_URL}/logout`,

  // Registro de clientes
  register: `${API_BASE_URL}/registerClientes`,
  verifyRegister: `${API_BASE_URL}/registerClientes/verifyCodeEmail`,

  // Recuperación de contraseña
  recoveryRequestCode: `${API_BASE_URL}/recoveryPassword/requestCode`,
  recoveryVerifyCode: `${API_BASE_URL}/recoveryPassword/verifyCode`,
  recoveryNewPassword: `${API_BASE_URL}/recoveryPassword/newPassword`,

  // Datos de la tienda
  productos: `${API_BASE_URL}/productos`,
  bolsas: `${API_BASE_URL}/bolsas`,
  promociones: `${API_BASE_URL}/promociones`, // Se usa en usePromociones (/activas)
  perfil: `${API_BASE_URL}/perfilCliente`,    // Incluye los favoritos del cliente

  // Pedidos y pagos
  carrito: `${API_BASE_URL}/carrito`,
  venta: `${API_BASE_URL}/venta`,
  wompiToken: `${API_BASE_URL}/wompi/token`,
  wompiPayment: `${API_BASE_URL}/wompi/paymentTest`,
};

export default endpoints;