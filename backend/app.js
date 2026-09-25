import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";


// importamos el middleware para limitar las peticiones
import limiter from "./src/middlewares/limiter.js"

// importamos las rutas de la aplicación
import loginAdminRoutes from "./src/routes/loginAdmin.js";
import loginClientesRoutes from "./src/routes/loginClientes.js";
import clientesRoutes from "./src/routes/clientes.js"
import perfilClienteRoutes from "./src/routes/perfilCliente.js"
import registerClientesRoutes from "./src/routes/registerClientes.js"
import logoutRoutes from "./src/routes/logout.js";
import gastosRoutes from "./src/routes/gastos.js"
import gananciasRoutes from "./src/routes/ganancias.js";
import productosRoutes from "./src/routes/productos.js";
import ventaRoutes from "./src/routes/venta.js";
import carritoRoutes from "./src/routes/carrito.js";
import bolsasRoutes from "./src/routes/bolsas.js";
import combosCompradosRoutes from "./src/routes/combosComprados.js";
import comboSuerteRoutes from "./src/routes/comboSuerte.js";
import recoveryPasswordRoutes from "./src/routes/recoveryPassword.js";
import recoveryPasswordAdminRoutes from "./src/routes/recoveryPasswordAdmin.js";
import registerAdminRoutes from "./src/routes/registerAdmin.js";
import wompiRoutes from "./src/routes/wompi.js"
import promocionesRoutes from "./src/routes/promociones.js"
import videosComboRoutes from "./src/routes/videosCombo.js";
import inicioConfigRoutes from "./src/routes/inicioConfig.js";

// Inicialización de la aplicación Express
const app = express();

// Activar trust proxy para Vercel / HTTPS en producción
app.set('trust proxy', 1);

// Orígenes permitidos para la app web
const webOrigins = ["http://localhost:5173", "http://localhost:5174", 'https://lucky-shop-la3y.vercel.app','https://lucky-shop-peach.vercel.app'];

// Configuración de CORS para permitir peticiones desde el frontend
app.use(cors({
  origin: (origin, callback) => {
    // Permite peticiones sin origen (como móvil o Postman) o si está en la lista
    if (!origin || webOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('No permitido por CORS'));
  },
  credentials: true,
}));

// Middlewares globales
app.use(limiter); // Aplica el límite de peticiones
app.use(cookieParser()); // Parsea las cookies de las peticiones
app.use(express.json()); // Permite recibir y enviar JSON en el cuerpo de las peticiones

// Definición de las rutas
app.use("/api/loginAdmin", loginAdminRoutes);
app.use("/api/loginClientes", loginClientesRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/perfilCliente", perfilClienteRoutes);
app.use("/api/registerClientes", registerClientesRoutes);
app.use("/api/logout", logoutRoutes);
app.use("/api/recoveryPassword", recoveryPasswordRoutes);
app.use("/api/recoveryPasswordAdmin", recoveryPasswordAdminRoutes);
app.use("/api/gastos", gastosRoutes);
app.use("/api/ganancias", gananciasRoutes);
app.use("/api/venta", ventaRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api/bolsas", bolsasRoutes);
app.use("/api/comboSuerte", comboSuerteRoutes);
app.use("/api/combosComprados", combosCompradosRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/registerAdmin", registerAdminRoutes);
app.use("/api/wompi", wompiRoutes);
app.use("/api/promociones", promocionesRoutes);
app.use("/api/videosCombo", videosComboRoutes );
app.use("/api/inicioConfig", inicioConfigRoutes);

export default app;