/**
 * apiConfig.js
 * -----------------------------------------------------------------------------
 * Punto ÚNICO de configuración de la API. La app móvil consume EXACTAMENTE la
 * misma base de datos que la app web, a través del mismo backend de Express.
 *
 * IMPORTANTE — cómo elegir el valor de API_BASE_URL:
 *
 *   1) Emulador Android (Android Studio):   http://10.0.2.2:4000/api
 *   2) Navegador / Expo web:                http://localhost:4000/api
 *   3) Teléfono físico con Expo Go:         http://<IP-LOCAL-DE-TU-PC>:4000/api
 *        (ejemplo: http://192.168.0.15:4000/api  — obtén tu IP con `ipconfig`
 *         en Windows o `ifconfig`/`ip a` en Linux/Mac; PC y teléfono deben
 *         estar en la MISMA red WiFi)
 *   4) Backend ya desplegado en Render:      https://tu-backend.onrender.com/api
 *
 * Cambia SOLO esta constante según dónde estés probando.
 */
export const API_BASE_URL = "http://10.0.2.2:4000/api";

/**
 * endpoints
 * Rutas del backend agrupadas por módulo. Centralizarlas evita repetir strings
 * mágicos por toda la app y facilita el mantenimiento si una ruta cambia.
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
  perfil: `${API_BASE_URL}/perfilCliente`,

  // Pedidos y pagos
  carrito: `${API_BASE_URL}/carrito`,
  venta: `${API_BASE_URL}/venta`,
  paypalCreateOrder: `${API_BASE_URL}/paypal/create-order`,
  paypalCaptureOrder: `${API_BASE_URL}/paypal/capture-order`,
};

export default endpoints;
