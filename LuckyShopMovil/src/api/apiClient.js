/**
 * apiClient.js
 * Envoltura ligera sobre la función NATIVA fetch de JavaScript (Fetch API).
 * No usamos Axios: fetch viene incluido en React Native y cubre todas nuestras
 * necesidades (GET/POST/PUT, headers, JSON), por lo que evitamos una dependencia
 * extra.
 *
 * Su única responsabilidad es adjuntar automáticamente el token de sesión en el
 * header `Authorization: Bearer <token>` cuando existe, de modo que las
 * peticiones a rutas protegidas del backend (perfil, favoritos, etc.) se
 * autentiquen sin tener que repetir esa lógica en cada hook.
 */
import { obtenerToken } from "../utils/storage";

/**
 * apiFetch(url, options)
 * @param {string} url      URL completa del endpoint.
 * @param {object} options  Opciones estándar de fetch (method, body, headers...).
 * @returns {Promise<Response>} La respuesta cruda de fetch.
 *
 * - Inyecta Content-Type: application/json salvo que se envíe FormData.
 * - Inyecta el token Bearer si hay sesión activa.
 * - Envía X-Plataforma: movil para que el backend le entregue el token en el login
 *   (a la web nunca se le entrega: ella usa solo una cookie httpOnly).
 */
export const apiFetch = async (url, options = {}) => {
  const token = await obtenerToken();

  const esFormData = options.body instanceof FormData;

  const headers = {
    "X-Plataforma": "movil",
    ...(esFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  return fetch(url, { ...options, headers });
};

export default apiFetch;
