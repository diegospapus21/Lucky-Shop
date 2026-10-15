import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import HTMLRecoveryEmail from "../utils/sendMailRecovery.js";
import { sendEmail } from "../utils/sendMailMailjet.js"; // nuevo metodo de envio de correos
import { hashCode, codesMatch, readRecoveryToken } from "../utils/recoveryCode.js";
import { config } from "../../config.js";

// Controlador para manejar la recuperación de contraseña de clientes
import clientesModel from "../models/clientes.js";

const recoveryPasswordController = {};

const SESION_VENCIDA =
  "El código o la sesión ha expirado. Solicita un nuevo código.";

//POST - Solicitar un código de recuperación y enviarlo al correo del cliente
recoveryPasswordController.requestCode = async (req, res) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const userFound = await clientesModel.findOne({ email });

    if (!userFound) {
      return res.status(404).json({ message: "user not found" });
    }

    const randomCode = crypto.randomBytes(3).toString("hex");

    // En el token va solo el hash del código, nunca el código en claro
    const token = jsonwebtoken.sign(
      { email, codeHash: hashCode(email, randomCode), userType: "Clientes", verified: false },
      config.JWT.secret,
      { expiresIn: "15m" },
    );

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

    // El token viaja en el cuerpo (web y móvil): no depende de cookies entre dominios.
    return res.status(200).json({ message: "email sent", recoveryToken: token });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//POST - Verificar que el código ingresado sea correcto
recoveryPasswordController.verifyCode = async (req, res) => {
  try {
    const decoded = readRecoveryToken(req, "Clientes");

    if (!decoded || decoded.verified || !decoded.codeHash) {
      return res.status(401).json({ message: SESION_VENCIDA });
    }

    if (!codesMatch(decoded.email, req.body?.code, decoded.codeHash)) {
      return res.status(400).json({ message: "El código PIN ingresado es incorrecto." });
    }

    const newToken = jsonwebtoken.sign(
      { email: decoded.email, userType: "Clientes", verified: true },
      config.JWT.secret,
      { expiresIn: "15m" },
    );

    return res.status(200).json({ message: "Code verified successfully", recoveryToken: newToken });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//POST - Establecer una nueva contraseña después de verificar el código
recoveryPasswordController.newPassword = async (req, res) => {
  try {
    const { newPassword, confirmNewPassword } = req.body ?? {};

    if (!newPassword || newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Las contraseñas no coinciden" });
    }

    const decoded = readRecoveryToken(req, "Clientes");

    if (!decoded) {
      return res.status(401).json({ message: SESION_VENCIDA });
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

    res.clearCookie("recoveryCookie");

    return res.status(200).json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//Exportamos el controlador para usarlo en las rutas
export default recoveryPasswordController;