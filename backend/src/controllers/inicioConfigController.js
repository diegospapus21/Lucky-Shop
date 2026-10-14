import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import InicioConfig from "../models/inicioConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "../data/inicioConfig.json");

const DEFAULT_CONFIG = {
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

// Helper para leer del archivo JSON local de respaldo
async function leerArchivoRespaldo() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return DEFAULT_CONFIG;
  }
}

// Helper para escribir en el archivo JSON local de respaldo (silencioso en entornos read-only)
async function guardarArchivoRespaldo(data) {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Si el entorno es read-only (como Vercel o contenedor efímero), no bloquea la ejecución
  }
}

const inicioConfigController = {};

// GET - Obtener la configuración actual del inicio
inicioConfigController.getInicioConfig = async (req, res) => {
  try {
    let config = await InicioConfig.findOne().lean();
    if (!config) {
      const respaldo = await leerArchivoRespaldo();
      config = await InicioConfig.create(respaldo);
    }
    return res.status(200).json({
      banner: config.banner || DEFAULT_CONFIG.banner,
      bienvenida: config.bienvenida || DEFAULT_CONFIG.bienvenida,
    });
  } catch (error) {
    console.error("getInicioConfig error, usando respaldo:", error);
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

    // Obtener o inicializar configuración en MongoDB
    let configActual = await InicioConfig.findOne();
    if (!configActual) {
      configActual = await InicioConfig.create(DEFAULT_CONFIG);
    }

    const bannerUpdates = {};
    if (linea1 !== undefined) bannerUpdates["banner.linea1"] = linea1;
    if (linea2 !== undefined) bannerUpdates["banner.linea2"] = linea2;
    if (colorTexto !== undefined) bannerUpdates["banner.colorTexto"] = colorTexto;
    if (colorFondo !== undefined) bannerUpdates["banner.colorFondo"] = colorFondo;

    const bienvenidaUpdates = {};
    if (tituloBienvenida !== undefined) bienvenidaUpdates["bienvenida.titulo"] = tituloBienvenida;
    if (contenidoHtml !== undefined) bienvenidaUpdates["bienvenida.contenidoHtml"] = contenidoHtml;

    // Manejo de imagen en Cloudinary
    if (req.file) {
      // Eliminar imagen anterior de Cloudinary si existía
      if (configActual.banner?.imagenPublicId) {
        try {
          await cloudinary.uploader.destroy(configActual.banner.imagenPublicId);
        } catch (e) {
          console.warn("No se pudo eliminar la imagen previa en Cloudinary:", e);
        }
      }
      bannerUpdates["banner.imagenUrl"] = req.file.path;
      bannerUpdates["banner.imagenPublicId"] = req.file.filename || "";
    } else if (eliminarImagen === "true" || eliminarImagen === true) {
      if (configActual.banner?.imagenPublicId) {
        try {
          await cloudinary.uploader.destroy(configActual.banner.imagenPublicId);
        } catch (e) {
          console.warn("No se pudo eliminar la imagen en Cloudinary:", e);
        }
      }
      bannerUpdates["banner.imagenUrl"] = "";
      bannerUpdates["banner.imagenPublicId"] = "";
    }

    const updateFields = {
      ...bannerUpdates,
      ...bienvenidaUpdates,
    };

    const docActualizado = await InicioConfig.findByIdAndUpdate(
      configActual._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    const respuestaConfig = {
      banner: docActualizado.banner,
      bienvenida: docActualizado.bienvenida,
    };

    // Actualizar respaldo local en segundo plano
    guardarArchivoRespaldo(respuestaConfig).catch(() => {});

    return res.status(200).json({
      message: "Configuración de inicio actualizada con éxito",
      config: respuestaConfig,
    });
  } catch (error) {
    console.error("updateInicioConfig error:", error);
    return res.status(500).json({
      message: "Error al actualizar la configuración de inicio: " + error.message,
    });
  }
};

export default inicioConfigController;
