// Utilidades compartidas para la recuperación de contraseña (clientes y admin).
// El código NUNCA se guarda en claro dentro del token (un JWT se puede leer):
// se guarda solo un HMAC firmado con el secreto del servidor.
import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
import { config } from "../../config.js";

// Hash del código ligado al correo; sin el secreto del servidor no se puede revertir ni falsificar
export const hashCode = (email, code) =>
  crypto
    .createHmac("sha256", config.JWT.secret)
    .update(`${email}:${code}`)
    .digest("hex");

// Compara el código ingresado contra el hash del token (sin distinguir mayúsculas/espacios)
export const codesMatch = (email, code, expectedHash) => {
  const normalized = String(code ?? "").trim().toLowerCase();
  const a = Buffer.from(hashCode(email, normalized), "hex");
  const b = Buffer.from(String(expectedHash ?? ""), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Lee el token de recuperación: primero del cuerpo (web y móvil), y como respaldo de la cookie.
// Devuelve null si falta, venció, es inválido o es de otro tipo de usuario.
export const readRecoveryToken = (req, userType) => {
  const token = req.body?.recoveryToken || req.cookies?.recoveryCookie;
  if (!token) return null;
  try {
    const decoded = jsonwebtoken.verify(token, config.JWT.secret);
    return decoded.userType === userType ? decoded : null;
  } catch {
    return null;
  }
};