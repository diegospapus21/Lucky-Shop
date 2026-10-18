//importamos Schema y model de mongoose
import { Schema, model } from "mongoose";

// Lista de tokens (JWT) que ya fueron cerrados (logout) y no deben volver a aceptarse.
// Guardamos solo el identificador del token (jti) y cuándo vence.
// MongoDB borra solo el registro cuando llega expiraEn (índice TTL), así la colección no crece.
const tokenRevocadoSchema = new Schema(
  {
    jti: { type: String, required: true, unique: true }, //Identificador único del token
    expiraEn: { type: Date, required: true }, //Fecha en la que el token vencería de todos modos
  },
  { versionKey: false },
);

tokenRevocadoSchema.index({ expiraEn: 1 }, { expireAfterSeconds: 0 });

//Exportamos el modelo con el nombre de la colección "tokensRevocados"
export default model("tokensRevocados", tokenRevocadoSchema);
