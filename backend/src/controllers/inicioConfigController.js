import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import InicioConfig from "../models/inicioConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "../data/inicioConfig.json");

const inicioConfigController = {};

// Helper para leer del archivo JSON local de respaldo
async function leerArchivoRespaldo() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {
      banner: {
        linea1: "Joyas que hablan de ti",
        linea2: "sin decir una palabra",
        imagenUrl: "",
        imagenPublicId: "",
        colorTexto: "#4B1010",
        colorFondo: "#fbc2d4",
      },
      bienvenida: {
        titulo: "Bienvenido a tu lugar de confianza",
        contenidoHtml:
          "<p>A un espacio donde cada pieza cuenta una historia: la tuya.</p><p>No son simples accesorios; diseñamos pequeños fragmentos de luz hechos para perdurar, celebrar tus logros y acompañarte en cada paso. Desde el minimalismo que te eleva en el día a día hasta la sofisticación de tus noches más especiales.</p><p>Descubre una colección pensada para reflejar tu fuerza, tu elegancia y tu esencia única. Encuentra hoy esa pieza que se convertirá en parte de ti.</p>",
      },
    };
  }
}

// Helper para escribir en el archivo JSON local de respaldo
async function guardarArchivoRespaldo(data) {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error al guardar archivo local de respaldo:", err);
  }
}

// Helper con timeout para operaciones de Mongoose
function conTimeout(promesa, ms = 4000) {
  return Promise.race([
    promesa,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Tiempo de espera agotado")), ms)
    ),
  ]);
}

// GET - Obtener la configuración actual del inicio
inicioConfigController.getInicioConfig = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        let config = await conTimeout(InicioConfig.findOne(), 4000);
        if (!config) {
          const respaldo = await leerArchivoRespaldo();
          config = await conTimeout(InicioConfig.create(respaldo), 4000);
        }
        if (config) {
          return res.status(200).json({
            banner: config.banner,
            bienvenida: config.bienvenida,
          });
        }
      } catch (dbErr) {
        console.warn("MongoDB lento o error, usando respaldo local:", dbErr.message);
      }
    }

    const localData = await leerArchivoRespaldo();
    return res.status(200).json(localData);
  } catch (error) {
    console.error("getInicioConfig error:", error);
    const localData = await leerArchivoRespaldo();
    return res.status(200).json(localData);
  }
};

// PUT - Actualizar la configuración del inicio
inicioConfigController.updateInicioConfig = async (req, res) => {
  try {
    const {
      linea1,
      linea2,
      colorTexto,
      colorFondo,
      tituloBienvenida,
      contenidoHtml,
      eliminarImagen,
    } = req.body;

    // Obtener estado base (desde Mongo si está listo, o respaldo local)
    let datosActuales = null;
    let mongoDoc = null;

    if (mongoose.connection.readyState === 1) {
      try {
        mongoDoc = await conTimeout(InicioConfig.findOne(), 4000);
        if (mongoDoc) {
          datosActuales = {
            banner: {
              linea1: mongoDoc.banner?.linea1,
              linea2: mongoDoc.banner?.linea2,
              imagenUrl: mongoDoc.banner?.imagenUrl || "",
              imagenPublicId: mongoDoc.banner?.imagenPublicId || "",
              colorTexto: mongoDoc.banner?.colorTexto,
              colorFondo: mongoDoc.banner?.colorFondo,
            },
            bienvenida: {
              titulo: mongoDoc.bienvenida?.titulo,
              contenidoHtml: mongoDoc.bienvenida?.contenidoHtml,
            },
          };
        }
      } catch (e) {
        console.warn("No se pudo leer Mongo para base:", e.message);
      }
    }

    if (!datosActuales) {
      datosActuales = await leerArchivoRespaldo();
    }

    if (linea1 !== undefined) datosActuales.banner.linea1 = linea1;
    if (linea2 !== undefined) datosActuales.banner.linea2 = linea2;
    if (colorTexto !== undefined) datosActuales.banner.colorTexto = colorTexto;
    if (colorFondo !== undefined) datosActuales.banner.colorFondo = colorFondo;

    if (tituloBienvenida !== undefined) {
      datosActuales.bienvenida.titulo = tituloBienvenida;
    }
    if (contenidoHtml !== undefined) {
      datosActuales.bienvenida.contenidoHtml = contenidoHtml;
    }

    if (req.file) {
      datosActuales.banner.imagenUrl = req.file.path;
      datosActuales.banner.imagenPublicId = req.file.filename || "";
    } else if (eliminarImagen === "true" || eliminarImagen === true) {
      datosActuales.banner.imagenUrl = "";
      datosActuales.banner.imagenPublicId = "";
    }

    // 1. Guardar de forma inmediata en el archivo local persistente
    await guardarArchivoRespaldo(datosActuales);

    // 2. Guardar en MongoDB esperando confirmación (si está conectado)
    if (mongoose.connection.readyState === 1) {
      try {
        if (!mongoDoc) {
          mongoDoc = await conTimeout(InicioConfig.findOne(), 4000);
        }
        if (!mongoDoc) {
          await conTimeout(InicioConfig.create(datosActuales), 5000);
        } else {
          mongoDoc.banner = { ...mongoDoc.banner, ...datosActuales.banner };
          mongoDoc.bienvenida = { ...mongoDoc.bienvenida, ...datosActuales.bienvenida };
          mongoDoc.markModified("banner");
          mongoDoc.markModified("bienvenida");
          await conTimeout(mongoDoc.save(), 5000);
        }
      } catch (mongoErr) {
        console.warn("Error al guardar en MongoDB (respaldo local guardado OK):", mongoErr.message);
      }
    }

    return res.status(200).json({
      message: "Configuración de inicio actualizada con éxito",
      config: datosActuales,
    });
  } catch (error) {
    console.error("updateInicioConfig error:", error);
    return res.status(500).json({ message: "Error al actualizar la configuración de inicio" });
  }
};

export default inicioConfigController;
