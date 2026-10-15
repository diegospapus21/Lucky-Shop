// Límites de intentos para la recuperación de contraseña (evita adivinar el código por fuerza bruta)
import rateLimit from "express-rate-limit";

const mensaje = {
  message: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
};

// Solicitar / reenviar el código por correo
export const requestCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: mensaje,
});

// Verificar el código ingresado
export const verifyCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: mensaje,
});