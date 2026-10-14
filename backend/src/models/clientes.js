//importamos Schema y model de mongoose
import { Schema, model } from "mongoose";

//Esquema para los Clientes
const clienteSchema = new Schema(
  {
    name: { type: String }, //Nombre del cliente
    lastName:{type:String}, //Apellido del cliente
    birthdate: { type: Date }, //Fecha de nacimiento
    email : { type: String }, //Correo electrónico
    gender: { type: String }, //Género
    phone: { type: String }, //Teléfono
    profileImage: { type: String }, //URL de la foto de perfil en Cloudinary
    profileImagePublicId: { type: String }, //ID público de la imagen en Cloudinary
    favoritos: [{ type: Schema.Types.ObjectId, ref: "products" }], //Lista de productos favoritos
    public_id:{type: String}, //ID público general
    password: { type: String }, //Contraseña encriptada
    isVerified: { type: Boolean }, //Si la cuenta está verificada
    loginAttemps: { type: Number }, //Intentos de login fallidos
    timeOut: { type: Date }, //Fecha de bloqueo temporal
    ultimoAcceso: { type: Date,
     default: null }, // Última vez que el cliente entró al sitio
  },
  {
    timestamps: true,
    strict: false,
  },
);

//Exportamos el modelo con el nombre de la colección "Clientes"
export default model("Clientes", clienteSchema);