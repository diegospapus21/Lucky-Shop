import crypto from "crypto"; //Generar codigo aleatorio
import jsonwebtoken from "jsonwebtoken"; // Token
import bcryptjs from "bcryptjs"; //Encriptar
// Controlador para registrar nuevos administradores
import adminModel from "../models/admin.js";
import {config} from "../../config.js";
import { sendEmail } from "../utils/sendMailMailjet.js"; //nuevo metodo de envio de corrreos

import { validateAuthToken } from "../middlewares/validateAuthToken.js"

//array de funciones
const registerAdminController = {};

registerAdminController.register = async (req, res) => {
  //#1- Solicitar los datos
  const {
    name,
    lastName,
    email,
    password,
    isVerified
  } = req.body;

  try {

    //Validar que el correo no exista en la base de datos
    const existsAdmin = await  adminModel.findOne({email});
    if (existsAdmin){
      return res.status(400).json({message: "Admin already exist"})
    }

    //  Encriptar la contraseña
    const passwordHased = await bcryptjs.hash(password, 10)

    //Generar un codigo aleatorio
    const randomNumber = crypto.randomBytes(3).toString("hex")

    //Guardamos en un token la informacion
    const token = jsonwebtoken.sign(
      //#1- ¿Que vamos a guardar?
      {randomNumber,
        name,
        lastName,
        email,
      password: passwordHased,
      isVerified
    },

      //#2-Secret key
        config.JWT.secret,
      //#3-Cuando expira
      {expiresIn:"15m"}
    );

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    };

    res.cookie("RegistrarionAdminCookie", token, cookieOptions);

    //Enviamos el codigo aleatorio por correo electronico usando Mailjet
    try {
      await sendEmail(
        email,
        "Verificación de cuenta",
        `<p>Para verificar tu cuenta, utiliza este código: <strong>${randomNumber}</strong></p><p>Expira en 15 minutos.</p>`
      );
    } catch (mailError) {
      console.log("error enviando correo: " + mailError)
      return res.status(500).json({message:"Error sending email"})
    }

    return res.status(200).json({message:"Email sent", registrationToken: token})

  } catch (error) {
    console.log("error"+error)
    return res.status(500).json({message: "Internal server error"})
  }

};

//Verificar el codigo que acabamos de enviar

registerAdminController.verifyCode = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    };

    //Solicitamos el codigo que escribieron en el frontend
    const {verificationCodeRequest, registrationToken} = req.body

    //Obtener el token de las cookies o del body
    const token = req.cookies.RegistrarionAdminCookie || registrationToken
    if (!token) {
      return res.status(400).json({
        message: "No se encontró el token de registro o ha expirado. Por favor intenta registrarte de nuevo.",
      });
    }

    let decoced;
    try {
      decoced = jsonwebtoken.verify(token, config.JWT.secret);
    } catch (jwtErr) {
      return res.status(401).json({
        message: "El código de verificación ha expirado. Por favor solicita uno nuevo.",
      });
    }

    const {
      randomNumber: storedCode,
      name,
      lastName,
      email,
      password,
      isVerified,
    } = decoced;

    //Comparar lo que el usuario escribio con el codigo esta en el token
    if(!verificationCodeRequest || verificationCodeRequest.trim() !== storedCode?.trim()){
      return res.status(400).json({message: "Código de verificación incorrecto"})
    }

    //Si todo esta bien y el usuario escribe el codigo lo registramos en la base de datos
    const NewAdmin = new adminModel({
      name,
      lastName,
      email,
      password,
      isVerified: true,
    });

    await NewAdmin.save();

    res.clearCookie("RegistrarionAdminCookie", cookieOptions)

    return res.status(200).json({message: "Admin register"})

  } catch (error) {
    console.log("error"+error)
    return res.status(500).json({message: "Internal server error"});
  }
};

export default registerAdminController;