import { obtenerToken, verificarToken } from "../utils/authToken.js";

// Middleware genérico: valida que exista un token de sesión válido y no revocado.
// Si se le pasa un userType ("Admin" | "Clientes"), además exige que coincida.
export const validateAuthToken = (userType) => {
  return async (req, res, next) => {
    try {
      // La app WEB envía el token en la cookie authCookie.
      // La app MÓVIL lo envía en el header Authorization: Bearer <token>.
      const token = obtenerToken(req);

      if (!token) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const decoded = await verificarToken(token);

      if (userType && decoded.userType !== userType) {
        return res.status(403).json({ message: "No autorizado" });
      }

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }
  };
};

export default validateAuthToken;
