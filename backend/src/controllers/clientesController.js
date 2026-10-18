//importamos el modelo de clientes y bcrypt para encriptar contraseñas
import clientsModel from "../models/clientes.js"
import bcrypt from "bcryptjs"


//array de funciones
const clientesController = {};

//GET - Obtener todos los clientes (solo los campos que usa el panel admin).
//Ya NO se envían la contraseña (hash), intentos de login, favoritos, ni IDs de Cloudinary.
clientesController.getAllClients = async (req, res) =>{
    try{
        const clients = await clientsModel
            .find()
            .select("name lastName email profileImage ultimoAcceso createdAt")
            .lean();
        return res.status(200).json(clients);
    }catch(error){
        console.log("error" + error);
        return res.status(500).json({message: "Internal sever error"})
    }
};


//PUT - Actualizar un cliente por su ID
clientesController.updateClients = async (req, res)=>{
    try{
        let{
            name,
            lastName,
            birthdate,
            email,
            password,
            isVerified,
            loginAttemps,
            timeOut,
        } = req.body

        //validaciones
        name = name?.trim()
        email = email?.trim()

        //valores requeridos (la contraseña ya no es obligatoria: si no llega, se conserva la actual)
        if(!name || !email){
            return res.status(400).json({message:"Fields required"})
        }

        //validaciones de fechas
        if(birthdate && (new Date(birthdate) > new Date() || new Date(birthdate) < new Date("1901-01-01"))){
            return res.status(400).json({message: "invalid date"})
        }

        // Solo se actualizan los campos que realmente llegaron
        const datos = { name, lastName, birthdate, email, isVerified, loginAttemps, timeOut }
        Object.keys(datos).forEach((k) => datos[k] === undefined && delete datos[k])

        // Si llega una contraseña nueva en texto plano la encriptamos.
        // Si llega vacía, se deja la que ya tenía el cliente.
        if (password) {
            const isBcryptHash = /^\$2[aby]?\$\d{2}\$/.test(password)
            datos.password = isBcryptHash ? password : await bcrypt.hash(password, 10)
        }

        const clientUpdated = await clientsModel.findByIdAndUpdate(
            req.params.id,
            datos,
            {new : true },
        );

        if(!clientUpdated){
            return res.status(400).json({message: "client not found"})
        }
            return res.status(200).json({message: "client updated"})

    }catch(error)   {
        console.log("error" + error);
        return res.status(500).json({message: "internal server error"});
    }
};

//DELETE - Eliminar un cliente por su ID
clientesController.deleteClient = async (req, res) => {
  try{
   const deleteClient = await clientsModel.findByIdAndDelete(req.params.id);

   //si no se elimina es ´porque no encontro el id
   if(!deleteClient){
    return res.status(404).json({message: "Client not found"});
   }
   return res.status(200).json({message: "Client deleted"});
  }catch(error){
     console.log("error" + error);
     return res.status(500).json({message: "Internal server error"});
  }
};

//Exportamos el controlador para usarlo en las rutas
export default clientesController;