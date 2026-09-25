import rateLimit from "express-rate-limit"

// Configuración del middleware de límite de peticiones (Rate Limiting)
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // Tiempo de espera: 5 minutos
    max: 2000, // Mayor margen para evitar bloqueos en frontend
    skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1" || req.hostname === "localhost",
    message: {
        status: 429,
        error: "Too many Request"
    }
})

// Exportamos el middleware para usarlo globalmente o en rutas específicas
export default limiter