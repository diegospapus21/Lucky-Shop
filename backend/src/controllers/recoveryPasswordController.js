import jsonwebtoken from "jsonwebtoken"; 
import bcrypt from "bcryptjs"; 
import crypto from "crypto"; 

import HTMLRecoveryEmail from "../utils/sendMailRecovery.js";
import { sendEmail } from "../utils/sendMailMailjet.js"; // nuevo metodo de envio de correos
import { config } from "../../config.js";

// Controlador para manejar la recuperación de contraseña de clientes
import clientesModel from "../models/clientes.js";

const recoveryPasswordController = {};

const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  maxAge: 15 * 60 * 1000,
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
};

//POST - Solicitar un código de recuperación y enviarlo al correo del cliente
recoveryPasswordController.requestCode = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    const userFound = await clientesModel.findOne({ email });

    if (!userFound) {
      return res.status(404).json({ message: "user not found" });
    }

    const randomCode = crypto.randomBytes(3).toString("hex");

    const token = jsonwebtoken.sign(
      { email, randomCode, userType: "Clientes", verified: false },
      config.JWT.secret,
      { expiresIn: "15m" },
    );

    res.cookie("recoveryCookie", token, cookieOptions);

    // Enviamos el código de recuperación usando Mailjet
    try {
      await sendEmail(
        email,
        "Código de recuperación",
        HTMLRecoveryEmail(randomCode)
      );
    } catch (mailError) {
      console.log("error enviando correo: " + mailError);
      return res.status(500).json({ message: "Error sending email" });
    }

    // Devolvemos el token también en el body para frontend web (cuando se bloquean cookies cross-site) y móvil.
    return res.status(200).json({ message: "email sent", recoveryToken: token });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//POST - Verificar que el código ingresado sea correcto
recoveryPasswordController.verifyCode = async (req, res) => {
  try {
    // Aceptamos el código y, opcionalmente, el token del body (móvil y web sin cookies).
    const { code, recoveryToken } = req.body;

    const token = req.cookies.recoveryCookie || recoveryToken;
    if (!token) {
      return res.status(400).json({
        message: "No se encontró la sesión de recuperación o ha expirado. Solicita un nuevo código.",
      });
    }

    let decoded;
    try {
      decoded = jsonwebtoken.verify(token, config.JWT.secret);
    } catch (jwtError) {
      return res.status(401).json({
        message: "El código o la sesión ha expirado. Solicita un nuevo código.",
      });
    }

    if (!code || code.trim().toLowerCase() !== decoded.randomCode?.trim().toLowerCase()) {
      return res.status(400).json({ message: "El código PIN ingresado es incorrecto." });
    }

    const newToken = jsonwebtoken.sign(
      { email: decoded.email, userType: "Clientes", verified: true },
      config.JWT.secret,
      { expiresIn: "15m" },
    );

    res.cookie("recoveryCookie", newToken, cookieOptions);

    // Devolvemos el token renovado (verificado) en el body
    return res.status(200).json({ message: "Code verified successfully", recoveryToken: newToken });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//POST - Establecer una nueva contraseña después de verificar el código
recoveryPasswordController.newPassword = async (req, res) => {
  try {
    const { newPassword, confirmNewPassword, recoveryToken } = req.body;

    if (!newPassword || newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Las contraseñas no coinciden" });
    }

    // Token desde la cookie (web) o desde el body (móvil o web sin cookies).
    const token = req.cookies.recoveryCookie || recoveryToken;
    if (!token) {
      return res.status(400).json({
        message: "Sesión de recuperación no encontrada o expirada. Solicita un nuevo código.",
      });
    }

    let decoded;
    try {
      decoded = jsonwebtoken.verify(token, config.JWT.secret);
    } catch (jwtError) {
      return res.status(401).json({
        message: "La sesión ha expirado. Solicita un nuevo código.",
      });
    }

    if (!decoded.verified) {
      return res.status(400).json({ message: "El código no ha sido verificado" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await clientesModel.findOneAndUpdate(
      { email: decoded.email },
      { password: passwordHash },
      { new: true },
    );

    res.clearCookie("recoveryCookie", cookieOptions);

    return res.status(200).json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//Exportamos el controlador para usarlo en las rutas
export default recoveryPasswordController;