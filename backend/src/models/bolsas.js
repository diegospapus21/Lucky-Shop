//importamos Schema y model de mongoose
import { Schema, model } from "mongoose";

//Esquema para las Bolsas sorpresa de la tienda
const bolsasSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true }, //Nombre de la bolsa
    precio: { type: Number, required: true, min: 0 }, //Precio de la bolsa
    stock: { type: Number, required: true, min: 0, default: 0 }, //Cantidad disponible en inventario
    descripcion: { type: String, trim: true }, //Descripción detallada
    categoria: { type: String, trim: true, default: "" }, //Categoría a la que pertenece
    cantidadUnidades: { type: Number, min: 1, default: 6 }, //Cantidad de productos que incluye
    imagenes: { type: [String], default: [] }, //Arreglo con URLs de las imágenes
    imagenPresentacion: { type: String, default: "" }, //URL de la imagen principal
    estado: {
      type: String, //Estado de la bolsa (activo, inactivo, agotado)
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
bolsasSchema.pre("save", function () {
  if (this.stock <= 0 && this.estado === "activo") {
    this.estado = "agotado";
  } else if (this.stock > 0 && this.estado === "agotado") {
    this.estado = "activo";
  }
});

// Middleware pre('findOneAndUpdate', 'updateOne'): verifica actualizaciones por query
bolsasSchema.pre(["findOneAndUpdate", "updateOne"], function () {
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

//Exportamos el modelo con el nombre de la colección "bolsas"
export default model("bolsas", bolsasSchema);

