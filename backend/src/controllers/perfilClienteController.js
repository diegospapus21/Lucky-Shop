//Controlador para gestionar el perfil del cliente
import clientsModel from "../models/clientes.js";
import { v2 as cloudinary } from "cloudinary";

const perfilClienteController = {};

//GET - Obtener los datos del cliente autenticado
perfilClienteController.getMyProfile = async (req, res) => {
  try {
    const cliente = await clientsModel.findById(req.user.id).select("-password");

    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    return res.status(200).json(cliente);
  } catch (error) {
    console.error("getMyProfile error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//PUT - Actualizar los datos del cliente autenticado
perfilClienteController.updateMyProfile = async (req, res) => {
  try {
    let { name, lastName, gender, phone, birthdate, email } = req.body;

    // Validaciones básicas del lado del servidor
    name = name?.trim();
    email = email?.trim().toLowerCase();
    phone = typeof phone === "string" ? phone.trim() : phone;

    if (!name) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({ message: "Correo inválido" });
    }

    // El teléfono es opcional, pero si viene debe tener solo números (8 a 15 dígitos)
    if (phone && !/^\d{8,15}$/.test(String(phone))) {
      return res.status(400).json({ message: "El teléfono debe contener solo números (8 a 15 dígitos)" });
    }

    if (birthdate && (new Date(birthdate) > new Date() || new Date(birthdate) < new Date("1901-01-01"))) {
      return res.status(400).json({ message: "Fecha de nacimiento inválida" });
    }

    // Si mandaron un email distinto, verificar que no esté en uso por otro cliente
    if (email) {
      const existente = await clientsModel.findOne({ email, _id: { $ne: req.user.id } });
      if (existente) {
        return res.status(400).json({ message: "Ese correo ya está en uso" });
      }
    }

    const cliente = await clientsModel.findById(req.user.id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const updateData = { name, lastName, gender, phone, birthdate, email };

    // Si subieron una nueva foto, la reemplazamos y borramos la anterior en Cloudinary
    if (req.file) {
      if (cliente.profileImagePublicId) {
        try {
          await cloudinary.uploader.destroy(cliente.profileImagePublicId);
        } catch (err) {
          console.error("No se pudo borrar la foto anterior:", err);
        }
      }
      updateData.profileImage = req.file.path;
      updateData.profileImagePublicId = req.file.filename;
    }

    const clienteActualizado = await clientsModel
      .findByIdAndUpdate(req.user.id, updateData, { new: true })
      .select("-password");

    return res.status(200).json({ message: "Perfil actualizado", cliente: clienteActualizado });
  } catch (error) {
    console.error("updateMyProfile error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//GET - Obtener la lista de productos favoritos del cliente
perfilClienteController.getFavoritos = async (req, res) => {
  try {
    const cliente = await clientsModel.findById(req.user.id).populate("favoritos");
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    return res.status(200).json(cliente.favoritos || []);
  } catch (error) {
    console.error("getFavoritos error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//POST - Agregar o quitar un producto de favoritos
perfilClienteController.toggleFavorito = async (req, res) => {
  try {
    const { productoId } = req.params;
    const cliente = await clientsModel.findById(req.user.id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const yaEsFavorito = cliente.favoritos.some((id) => id.toString() === productoId);

    if (yaEsFavorito) {
      cliente.favoritos = cliente.favoritos.filter((id) => id.toString() !== productoId);
    } else {
      cliente.favoritos.push(productoId);
    }

    await cliente.save();
    return res.status(200).json({ message: "Favoritos actualizado", esFavorito: !yaEsFavorito });
  } catch (error) {
    console.error("toggleFavorito error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//Exportamos el controlador para usarlo en las rutas
export default perfilClienteController;
