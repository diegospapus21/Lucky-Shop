//Controlador para la gestión del carrito de compras
const carritoController = {};
//importo la colección que voy a utilizar
import carritoModel from "../models/carrito.js";


//GET - Obtener todos los carritos de la base de datos
carritoController.getCarrito = async (req, res) => {
    try {
        const carrito = await carritoModel.find().select("-__v").lean()
        return res.status(200).json(carrito)
    } catch (error) {
        console.log("error"+error)
        return res.status(500).json({message: "Internal Server Error"})
    }
}

//GET - Obtener un carrito por su ID
carritoController.getCarritoById = async (req, res) => {
    try {
        const carrito = await carritoModel.findById(req.params.id).select("-__v").lean()

        if (!carrito) {
            return res.status(404).json({ message: "Carrito not found" })
        }

        return res.status(200).json(carrito)
    } catch (error) {
        console.log("error"+error)
        return res.status(500).json({message: "Internal Server Error"})
    }
}

//POST - Insertar un nuevo carrito de compras
carritoController.insertCarrito = async (req, res) => {
    try {
        const { idCliente, productos, total, estado } = req.body;

        // El carrito siempre queda a nombre del cliente que inició sesión
        // (así nadie puede crear carritos a nombre de otra persona)
        const newCarrito = new carritoModel({
            idCliente: req.user?.id || idCliente,
            productos,
            total,
            estado,
        })

        await newCarrito.save()

        return res.status(200).json(newCarrito) // 👈 ahora devuelve el carrito completo, con su _id
    } catch (error) {
        console.log("error"+error)
        return res.status(500).json({message: "Internal Server Error"})
    }
}

//PUT - Actualizar un carrito existente por su ID
carritoController.updateCarrito = async (req, res) => {
    try {
        const { idCliente, productos, total, estado } = req.body;

        const carritoActualizado = await carritoModel.findByIdAndUpdate(
            req.params.id,
            { idCliente, productos, total, estado },
            { new: true }
        )

        if (!carritoActualizado) {
            return res.status(404).json({ message: "Carrito not found" })
        }

        return res.status(200).json(carritoActualizado)
    } catch (error) {
        console.log("error"+error)
        return res.status(500).json({message: "Internal Server Error"})
    }
}

//DELETE - Eliminar un carrito por su ID
carritoController.deleteCarrito = async (req, res) => {
    try {
    const carritoDeleted = await carritoModel.findByIdAndDelete(req.params.id)

        if(!carritoDeleted){
            return res.status(404).json({message: "Carrito not found"})
        }

        return res.status(200).json({message: "Carrito deleted"})

    } catch (error) {
        console.log("error"+error)
        return res.status(500).json({message: "Internal Server Error"})
    }
}

//Exportamos el controlador para usarlo en las rutas
export default carritoController;
