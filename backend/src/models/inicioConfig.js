import mongoose from "mongoose";

const inicioConfigSchema = new mongoose.Schema(
  {
    banner: {
      linea1: {
        type: String,
        default: "Joyas que hablan de ti",
      },
      linea2: {
        type: String,
        default: "sin decir una palabra",
      },
      imagenUrl: {
        type: String,
        default: "",
      },
      imagenPublicId: {
        type: String,
        default: "",
      },
      colorTexto: {
        type: String,
        default: "#4B1010",
      },
      colorFondo: {
        type: String,
        default: "#fbc2d4",
      },
    },
    bienvenida: {
      titulo: {
        type: String,
        default: "Bienvenido a tu lugar de confianza",
      },
      contenidoHtml: {
        type: String,
        default: `<p>A un espacio donde cada pieza cuenta una historia: la tuya.</p><p>No son simples accesorios; diseñamos pequeños fragmentos de luz hechos para perdurar, celebrar tus logros y acompañarte en cada paso. Desde el minimalismo que te eleva en el día a día hasta la sofisticación de tus noches más especiales.</p><p>Descubre una colección pensada para reflejar tu fuerza, tu elegancia y tu esencia única. Encuentra hoy esa pieza que se convertirá en parte de ti.</p>`,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("InicioConfig", inicioConfigSchema);
