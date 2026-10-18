// Utilidades para manejar el token de sesión (JWT) de forma segura
import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";

import { config } from "../../config.js";
import tokenRevocadoModel from "../models/tokenRevocado.js";

const isProduction = () => process.env.NODE_ENV === "production";

// Duración máxima del token según el tipo de usuario.
// Son cortas a propósito: el token solo sirve para la sesión actual.
const DURACION = { Admin: "2h", Clientes: "4h" };

// Opciones de la cookie de sesión.
// IMPORTANTE: no lleva maxAge ni expires, así que es una "cookie de sesión":
// el navegador la borra solo al cerrarse. Se usan las MISMAS opciones para
// crearla y para borrarla (si no coinciden, el navegador no la borra).
export const cookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: isProduction() ? "none" : "lax",
  path: "/",
});

// ¿La petición viene de la app móvil? (la web nunca recibe el token en el cuerpo)
export const esMovil = (req) => req.headers["x-plataforma"] === "movil";

// Crea un token nuevo con un identificador único (jti) y lo guarda en la cookie de sesión.
// Devuelve el token (la app móvil lo necesita para enviarlo como Bearer).
export const emitirToken = (res, payload) => {
  const token = jsonwebtoken.sign(
    { ...payload, jti: crypto.randomUUID() },
    config.JWT.secret,
    { expiresIn: DURACION[payload.userType] || "2h" },
  );

  res.cookie("authCookie", token, cookieOptions());
  return token;
};

// Lee el token de la petición: cookie (web) o header Authorization: Bearer (móvil)
export const obtenerToken = (req) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  return req.cookies?.authCookie || bearer;
};

// Valida firma, vencimiento y que el token NO haya sido revocado (cerrado).
// Lanza un error si algo falla. Los tokens viejos sin jti ya no se aceptan.
export const verificarToken = async (token) => {
  const decoded = jsonwebtoken.verify(token, config.JWT.secret);

  if (!decoded.jti) throw new Error("Token sin identificador");

  const revocado = await tokenRevocadoModel.exists({ jti: decoded.jti });
  if (revocado) throw new Error("Token revocado");

  return decoded;
};

// Invalida un token para siempre (se usa al cerrar sesión)
export const revocarToken = async (token) => {
  if (!token) return;
  try {
    const decoded = jsonwebtoken.verify(token, config.JWT.secret, {
      ignoreExpiration: true,
    });
    if (!decoded.jti) return;

    await tokenRevocadoModel.updateOne(
      { jti: decoded.jti },
      { jti: decoded.jti, expiraEn: new Date((decoded.exp || 0) * 1000) },
      { upsert: true },
    );
  } catch (error) {
    // Si el token no es válido no hay nada que revocar
  }
};
