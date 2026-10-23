import mongoose, { Schema, model } from "mongoose";

const videosComboSchema = new Schema(
  {
    idCliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clientes",
    },
    idProducto: {
      // Referencia a la bolsa de la suerte específica (colección "products")
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
    },
    urlVideo: {
      // URL del video subido a Cloudinary
      type: String,
    },
    mensaje: {
      // Texto que ve el cliente, ej: "Valentina tú combo está listo..."
      type: String,
    },
    direccion: {
      // Dirección de entrega asociada a este combo
      type: String,
    },
    status: {
      // true = Aceptada, false = Denegada, undefined/null = Pendiente
      type: Boolean,
      default: null,
    },
    enProcesoEnvio: {
      // true = pedido en proceso de envío
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export default model("VideosCombo", videosComboSchema);