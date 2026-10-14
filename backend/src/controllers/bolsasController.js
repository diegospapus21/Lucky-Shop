//importamos el modelo de bolsas y cloudinary para manejar imágenes en la nube
import bolsasModel from "../models/bolsas.js";
import { v2 as cloudinary } from "cloudinary";

//array de funciones
const bolsasController = {};

//GET - Obtener todas las bolsas con filtros opcionales por estado y nombre
bolsasController.getBolsas = async (req, res) => {
  try {
    const { estado, search } = req.query;
    const filter = {};

    if (estado) filter.estado = estado;
    if (search) filter.nombre = { $regex: search, $options: "i" };

    const bolsas = await bolsasModel.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(bolsas);
  } catch (error) {
    console.error("getBolsas error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//GET - Obtener una bolsa por su ID
bolsasController.getBolsaById = async (req, res) => {
  try {
    const bolsa = await bolsasModel.findById(req.params.id);
    if (!bolsa) {
      return res.status(404).json({ message: "Bolsa no encontrada" });
    }
    return res.status(200).json(bolsa);
  } catch (error) {
    console.error("getBolsaById error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//POST - Insertar una nueva bolsa con sus imágenes
bolsasController.insertBolsas = async (req, res) => {
  try {
    let { nombre, precio, stock, descripcion, categoria, cantidadUnidades, estado, productos, productosSeleccionados } = req.body;

    nombre = nombre?.trim();
    if (!nombre || precio === undefined || stock === undefined) {
      return res
        .status(400)
        .json({ message: "Nombre, precio y stock son requeridos" });
    }

    if (isNaN(precio) || precio < 0) {
      return res.status(400).json({ message: "Precio inválido" });
    }

    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({ message: "Stock inválido" });
    }

    if (cantidadUnidades && cantidadUnidades !== '' && (isNaN(Number(cantidadUnidades)) || Number(cantidadUnidades) < 1)) {
      return res.status(400).json({ message: "Cantidad de unidades inválida (debe ser al menos 1)" });
    }

    // Procesar imágenes subidas con multer + cloudinary
    const imagenes = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        imagenes.push(file.path);
      });
    }

    const imagenPresentacion = imagenes[0] || "";

    // Parsear productos si viene como JSON string
    let productosParsed = [];
    try {
      if (productos) productosParsed = JSON.parse(productos);
      else if (productosSeleccionados) productosParsed = JSON.parse(productosSeleccionados);
    } catch (e) { /* no es JSON válido, ignorar */ }

    const newBolsa = new bolsasModel({
      nombre,
      precio: Number(precio),
      stock: Number(stock),
      descripcion,
      categoria,
      cantidadUnidades: cantidadUnidades !== undefined ? Number(cantidadUnidades) : 6,
      imagenes,
      imagenPresentacion,
      estado: estado || "activo",
      productos: productosParsed,
    });

    await newBolsa.save();
    return res
      .status(201)
      .json({ message: "Bolsa guardada exitosamente", bolsa: newBolsa });
  } catch (error) {
    console.error("insertBolsas error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//PUT - Actualizar una bolsa por su ID, manteniendo imágenes existentes y agregando nuevas
bolsasController.updateBolsas = async (req, res) => {
  try {
    let {
      nombre,
      precio,
      stock,
      descripcion,
      categoria,
      cantidadUnidades,
      estado,
      imagenesExistentes, // URLs que ya existen y el usuario quiere conservar
      productos,
      productosSeleccionados,
    } = req.body;

    nombre = nombre?.trim();

    if (!nombre || precio === undefined || stock === undefined) {
      return res
        .status(400)
        .json({ message: "Nombre, precio y stock son requeridos" });
    }

    if (isNaN(precio) || precio < 0) {
      return res.status(400).json({ message: "Precio inválido" });
    }

    if (cantidadUnidades && cantidadUnidades !== '' && (isNaN(Number(cantidadUnidades)) || Number(cantidadUnidades) < 1)) {
      return res.status(400).json({ message: "Cantidad de unidades inválida (debe ser al menos 1)" });
    }

    // Combinar imágenes existentes conservadas + nuevas subidas
    let imagenes = [];
    if (imagenesExistentes) {
      imagenes = Array.isArray(imagenesExistentes)
        ? imagenesExistentes
        : [imagenesExistentes];
    }

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        imagenes.push(file.path);
      });
    }

    const updateData = {
      nombre,
      precio: Number(precio),
      stock: Number(stock),
      descripcion,
      categoria,
      estado,
    };

    // Parsear productos si viene como JSON string
    try {
      if (productos) updateData.productos = JSON.parse(productos);
      else if (productosSeleccionados) updateData.productos = JSON.parse(productosSeleccionados);
    } catch (e) { /* no es JSON válido, ignorar */ }

    if (cantidadUnidades !== undefined) {
      updateData.cantidadUnidades = Number(cantidadUnidades);
    }

    if (imagenes.length > 0) {
      updateData.imagenes = imagenes;
      updateData.imagenPresentacion = imagenes[0];
    }

    const bolsaActualizada = await bolsasModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!bolsaActualizada) {
      return res.status(404).json({ message: "Bolsa no encontrada" });
    }

    return res.status(200).json({
      message: "Bolsa actualizada exitosamente",
      bolsa: bolsaActualizada,
    });
  } catch (error) {
    console.error("updateBolsas error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//DELETE - Eliminar una bolsa y sus imágenes de Cloudinary
bolsasController.deleteBolsas = async (req, res) => {
  try {
    const bolsa = await bolsasModel.findById(req.params.id);

    if (!bolsa) {
      return res.status(404).json({ message: "Bolsa no encontrada" });
    }

    // Eliminar imágenes de Cloudinary
    if (bolsa.imagenes && bolsa.imagenes.length > 0) {
      const deletePromises = bolsa.imagenes.map((url) => {
        const parts = url.split("/");
        const filename = parts[parts.length - 1];
        const publicId = `LuckyShop/${filename.split(".")[0]}`;
        return cloudinary.uploader.destroy(publicId).catch(() => {}); // No fallar si la imagen ya no existe
      });
      await Promise.all(deletePromises);
    }

    await bolsasModel.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Bolsa eliminada exitosamente" });
  } catch (error) {
    console.error("deleteBolsas error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//Exportamos el controlador para usarlo en las rutas
export default bolsasController;
