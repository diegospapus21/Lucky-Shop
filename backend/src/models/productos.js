//importamos Schema y model de mongoose
import { Schema, model } from "mongoose";

//Esquema para los Productos del catálogo
const productSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true }, //Nombre del producto
    precio: { type: Number, required: true, min: 0 }, //Precio unitario
    stock: { type: Number, required: true, min: 0, default: 0 }, //Cantidad disponible en inventario
    descripcion: { type: String, trim: true }, //Descripción detallada
    imagenes: { type: [String], default: [] }, //Arreglo de URLs de imágenes
    imagenPresentacion: { type: String, default: "" }, //URL de la imagen principal
    favoritos: { type: [String], default: [] }, //Lista de clientes que lo marcaron como favorito
    idCategoria: { type: String, trim: true }, //ID de la categoría a la que pertenece
    subCategoria: { type: String, trim: true }, //Subcategoría
    estado: { //Estado del producto (activo, inactivo, agotado)
      type: String,
      enum: ["activo", "inactivo", "agotado"],
      default: "activo",
    },
  },
  {
    timestamps: true, //Agrega createdAt y updatedAt automáticamente
    strict: false, //Permite guardar campos que no estén definidos en el esquema
  }
);

// Middleware pre('save'): si el stock llega a 0 o menos y el estado es activo, cambia automáticamente a agotado
productSchema.pre("save", function () {
  if (this.stock <= 0 && this.estado === "activo") {
    this.estado = "agotado";
  } else if (this.stock > 0 && this.estado === "agotado") {
    this.estado = "activo";
  }
});

// Middleware pre('findOneAndUpdate', 'updateOne'): verifica actualizaciones por query
productSchema.pre(["findOneAndUpdate", "updateOne"], function () {
  const update = this.getUpdate();
  if (!update) return;

  let stockVal;
  if (update.stock !== undefined) {
    stockVal = Number(update.stock);
  } else if (update.$set && update.$set.stock !== undefined) {
    stockVal = Number(update.$set.stock);
  }

  if (stockVal !== undefined) {
    if (stockVal <= 0) {
      const estadoActual = update.estado || (update.$set && update.$set.estado);
      if (estadoActual === "activo" || !estadoActual) {
        if (update.$set) {
          update.$set.estado = "agotado";
        } else {
          update.estado = "agotado";
        }
      }
    } else if (stockVal > 0) {
      const estadoActual = update.estado || (update.$set && update.$set.estado);
      if (estadoActual === "agotado") {
        if (update.$set) {
          update.$set.estado = "activo";
        } else {
          update.estado = "activo";
        }
      }
    }
  }
});

//Exportamos el modelo con el nombre de la colección "products"
export default model("products", productSchema);

