//Importamos la app y la coneccion a la base de datos
import app from "./app.js";
import "./database.js";

// Función asíncrona principal que inicializa el servidor
async function main() {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT);
  console.log(`server on port ${PORT}`);
}

// Llamada a la función principal para levantar el backend
main();