//Controlador para la autenticación de clientes
import cleintesModel from "../models/clientes.js";

import bcrypt from "bcryptjs";

import { emitirToken, esMovil, obtenerToken, verificarToken } from "../utils/authToken.js";

const loginClientesController = {};

//POST - Iniciar sesión como cliente
loginClientesController.login = async (req, res) => {
  const { password } = req.body;
  // Normalizamos el correo igual que en el registro (sin espacios, minusculas)
  // para que coincida sin importar como lo haya escrito el usuario
  const email = req.body.email?.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Correo inválido" });
  }

  try {
    const clienteFound = await cleintesModel.findOne({ email });

    if (!clienteFound) {
      return res.status(400).json({ message: "Cliente not found" });
    }

    if (clienteFound.timeOut && clienteFound.timeOut > Date.now()) {
      return res.status(403).json({ message: "Cuenta bloqueada" });
    }

    const isMatch = await bcrypt.compare(password, clienteFound.password);

    if (!isMatch) {
      clienteFound.loginAttemps = (clienteFound.loginAttemps || 0) + 1;

      if (clienteFound.loginAttemps >= 5) {
        clienteFound.timeOut = Date.now() + 5 * 60 * 1000;
        clienteFound.loginAttemps = 0;

        await clienteFound.save();

        return res
          .status(403)
          .json({ message: "Cuenta bloqueda por multiples intentos fallidos" });
      }

      await clienteFound.save();

      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Login exitoso: se resetean los intentos y se registra la fecha de último acceso
    clienteFound.loginAttemps = 0;
    clienteFound.timeOut = null;
    clienteFound.ultimoAcceso = new Date();
    await clienteFound.save();

    // La sesión dura solo mientras la ventana/app esté abierta (cookie de sesión)
    // y el token vence a las pocas horas. Ya no existe "recordarme".
    const token = emitirToken(res, { id: clienteFound._id, userType: "Clientes" });

    const cliente = {
      _id: clienteFound._id,
      email: clienteFound.email,
      name: clienteFound.name,
      lastName: clienteFound.lastName,
    };

    // La web usa solo la cookie httpOnly (el token NO se le entrega al JavaScript).
    // La app móvil no maneja cookies, así que solo a ella se le devuelve el token.
    if (esMovil(req)) {
      return res.status(200).json({ message: "Login exitoso", token, cliente });
    }

    return res.status(200).json({ message: "Login exitoso", cliente });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//GET - Verificar si hay una sesión de cliente activa
loginClientesController.checkSession = async (req, res) => {
  try {
    // Aceptamos el token desde la cookie (web) o desde el header Bearer (móvil).
    const token = obtenerToken(req);

    if (!token) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // Valida firma, vencimiento y que no haya sido cerrado (revocado)
    const decoded = await verificarToken(token);

    if (decoded.userType !== "Clientes") {
      return res.status(403).json({ message: "No autorizado" });
    }

    const clienteFound = await cleintesModel
      .findById(decoded.id)
      .select("email name lastName profileImage ultimoAcceso");

    if (!clienteFound) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // Si el cliente tiene la sesión abierta y no vuelve a hacer login,
    // actualizamos su último acceso aquí, máximo una vez por hora
    const UNA_HORA = 60 * 60 * 1000;
    if (
      !clienteFound.ultimoAcceso ||
      Date.now() - new Date(clienteFound.ultimoAcceso).getTime() > UNA_HORA
    ) {
      await cleintesModel.updateOne(
        { _id: clienteFound._id },
        { ultimoAcceso: new Date() },
      );
    }

    return res.status(200).json({
      message: "Sesión activa",
      cliente: {
        _id: clienteFound._id,
        email: clienteFound.email,
        name: clienteFound.name,
        lastName: clienteFound.lastName,
        profileImage: clienteFound.profileImage || "",
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

//Exportamos el controlador para usarlo en las rutas
export default loginClientesController;