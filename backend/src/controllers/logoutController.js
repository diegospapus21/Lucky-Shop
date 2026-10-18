//Controlador para manejar el cierre de sesión
import { obtenerToken, revocarToken, cookieOptions } from "../utils/authToken.js";

const logoutController = {};

//POST - Cerrar sesión: invalida el token en el servidor y borra la cookie
logoutController.logout = async (req, res) => {
  // 1. El token queda revocado: aunque alguien lo hubiera copiado, ya no sirve
  await revocarToken(obtenerToken(req));

  // 2. Se borra la cookie con las mismas opciones con las que se creó
  res.clearCookie("authCookie", cookieOptions());

  return res.status(200).json({ message: "Sesión cerrada" });
};

//Exportamos el controlador para usarlo en las rutas
export default logoutController;
