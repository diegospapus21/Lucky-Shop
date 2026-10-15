// 1. Importamos Mailjet y el archivo config
import Mailjet from "node-mailjet";
import { config } from "../../config.js";

// 2. Conectamos con la API de Mailjet usando las claves del .env
const mailjet = Mailjet.apiConnect(
  config.mailjet.apiKey,
  config.mailjet.secretKey
);

/**
 * Función reutilizable para enviar correos con Mailjet
 * @param {string} to - Email del destinatario
 * @param {string} subject - Asunto del correo
 * @param {string} html - Contenido HTML del correo
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const result = await mailjet
      .post("send", { version: "v3.1" })
      .request({
        Messages: [
          {
            From: {
              Email: config.mailjet.fromEmail,
              Name:  config.mailjet.fromName
            },
            To: [{ Email: to }],
            Subject: subject,
            HTMLPart: html
          }
        ]
      });

    console.log(`Correo enviado a ${to}`);
    return result.body;

  } catch (error) {
    console.log("Error enviando correo con Mailjet:", error.response?.body || error.message);
    throw error; // que el controlador que llamó decida qué responder
  }
};