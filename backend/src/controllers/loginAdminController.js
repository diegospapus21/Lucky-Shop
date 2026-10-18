//Controlador para la autenticación de administradores
import adminModel from "../models/admin.js";

import bcrypt from "bcryptjs";

import { emitirToken, obtenerToken, verificarToken } from "../utils/authToken.js";

const loginAdminController = {};

//POST - Iniciar sesión como administrador
loginAdminController.login = async (req, res) => {
  const { email, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Correo inválido" });
  }

  try {
    const adminFound = await adminModel.findOne({ email });

    if (!adminFound) {
      return res.status(400).json({ message: "Admin not found" });
    }

    if (adminFound.timeOut && adminFound.timeOut > Date.now()) {
      return res.status(403).json({ message: "Cuenta bloqueada" });
    }

    const isMatch = await bcrypt.compare(password, adminFound.password);

    if (!isMatch) {
      adminFound.loginAttemps = (adminFound.loginAttemps || 0) + 1;

      if (adminFound.loginAttemps >= 5) {
        adminFound.timeOut = Date.now() + 5 * 60 * 1000;
        adminFound.loginAttemps = 0;

        await adminFound.save();

        return res
          .status(403)
          .json({ message: "Cuenta bloqueda por multiples intentos fallidos" });
      }

      await adminFound.save();

      return res.status(401).json({message: "Contraseña incorrecta"})

    }
    

    // Login exitoso: se resetean los intentos fallidos (y se guarda el cambio)
    adminFound.loginAttemps = 0;
    adminFound.timeOut = null;
    await adminFound.save();

    // La sesión dura solo mientras la ventana esté abierta (cookie de sesión)
    // y el token vence a las 2 horas.
    emitirToken(res, { id: adminFound._id, userType: "Admin" });

    return res.status(200).json({ message: "Login exitoso" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//GET - Verificar si hay una sesión de admin activa
loginAdminController.checkSession = async (req, res) => {
  try {
    const token = obtenerToken(req);

    if (!token) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // Valida firma, vencimiento y que no haya sido cerrado (revocado)
    const decoded = await verificarToken(token);

    if (decoded.userType !== "Admin") {
      return res.status(403).json({ message: "No autorizado" });
    }

    const adminFound = await adminModel
      .findById(decoded.id)
      .select("name lastName email telefono");

    if (!adminFound) {
      return res.status(401).json({ message: "No autenticado" });
    }

    return res.status(200).json({
      message: "Sesión activa",
      admin: {
        id: adminFound._id,
        name: adminFound.name,
        lastName: adminFound.lastName,
        email: adminFound.email,
        telefono: adminFound.telefono,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

//Exportamos el controlador para usarlo en las rutas
export default loginAdminController;