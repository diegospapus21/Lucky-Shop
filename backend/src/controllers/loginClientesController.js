//Controlador para la autenticación de clientes
import cleintesModel from "../models/clientes.js";

import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";

import { config } from "../../config.js";

const loginClientesController = {};

//POST - Iniciar sesión como cliente
loginClientesController.login = async (req, res) => {
  const { password, recordarme } = req.body;
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

    // Si "recordarme" está marcado, la sesión dura 30 días; si no, solo 1 día.
    //Esto es para cuando el cliente marque "Recordar contraseña se guarde"
    const duracion = recordarme ? "30d" : "1d";
    const maxAgeMs = recordarme ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    const token = jsonwebtoken.sign(
      { id: clienteFound._id, userType: "Clientes" },
      config.JWT.secret,
      { expiresIn: duracion },
    );

    // FIX: Configuración de la cookie obligatoria para Vercel / Producción
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie("authCookie", token, {
      maxAge: maxAgeMs,
      httpOnly: true,
      secure: isProduction,               // 'true' en producción (HTTPS obligatorio)
      sameSite: isProduction ? 'none' : 'lax', // 'none' permite enviar cookies cross-site entre Vercel y tu backend
    });

    // La web usa la cookie de arriba. Para la app móvil devolvemos también el
    // token y los datos del cliente en el cuerpo de la respuesta, de modo que
    // el móvil pueda guardarlos y enviarlos como Authorization: Bearer.
    return res.status(200).json({
      message: "Login exitoso",
      token,
      cliente: {
        _id: clienteFound._id,
        email: clienteFound.email,
        name: clienteFound.name,
        lastName: clienteFound.lastName,
      },
    });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//GET - Verificar si hay una sesión de cliente activa
loginClientesController.checkSession = async (req, res) => {
  try {
    // Aceptamos el token desde la cookie (web) o desde el header Bearer (móvil).
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
    const token = req.cookies.authCookie || bearer;

    if (!token) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const decoded = jsonwebtoken.verify(token, config.JWT.secret);

    if (decoded.userType !== "Clientes") {
      return res.status(403).json({ message: "No autorizado" });
    }

    const clienteFound = await cleintesModel.findById(decoded.id).select("-password");

    if (!clienteFound) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // Si el cliente tiene la sesión abierta (cookie de 30 días) y no vuelve a
    // hacer login, actualizamos su último acceso aquí, máximo una vez por hora
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
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

//Exportamos el controlador para usarlo en las rutas
export default loginClientesController;