/**
 * Estructura de la venta:
 * idCarrito
 * direcion
 * referencia
 * Método de pago
 * estdo de pago
 * telefono
 * estado
 * fecha
 */
//importamos mongoose, Schema y model
import mongoose, { Schema, model } from "mongoose";

//Esquema para el registro de Ventas finalizadas
const ventasSchema = new Schema(
  {
    IdCarrito: { //Referencia al carrito de compras asociado a la venta
        type: mongoose.Schema.Types.ObjectId,
        ref: "Carrito",
    },
    direcion: { //Dirección de envío
        type: String 
    },
    referencia : { //Punto de referencia o indicaciones para la entrega
        type: String 
    },
    metodoPago: { //Método utilizado (efectivo, tarjeta, wompi, etc)
        type: String 
    },
    statusPago: { //Si el pago fue completado exitosamente
        type: Boolean 
    },
    phone: { //Teléfono de contacto para la entrega
        type: String 
    },
    fecha: { //Fecha en la que se realizó la venta
        type: Date 
    },
    status: { //Estado general de la venta (activa, cancelada)
        type: Boolean 
    },
    estadoPedido: { //Decisión del administrador sobre el pedido (una vez tomada ya no se puede cambiar)
        type: String,
        enum: ["pendiente", "aceptado", "rechazado"],
        default: "pendiente"
    },
    fechaDecision: { //Fecha en que se aceptó o rechazó el pedido
        type: Date
    },
    enviado: { //Si el pedido ya fue enviado al cliente (un pedido enviado no se puede rechazar)
        type: Boolean,
        default: false
    },
    fechaEnvio: { //Fecha en que se marcó como enviado
        type: Date
    }
  },
  {
    timestamps: true, //Agrega createdAt y updatedAt automáticamente
    strict: false, //Permite guardar campos que no estén definidos en el esquema
  },
);

//Exportamos el modelo con el nombre de la colección "Ventas"
export default model("Ventas", ventasSchema);