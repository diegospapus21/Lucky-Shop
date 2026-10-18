/**
 * AuthContext.jsx
 * -----------------------------------------------------------------------------
 * Contexto global de autenticación (requisito: manejo de variables globales con
 * useContext). Guarda el cliente logueado, su token JWT y expone las acciones
 * de login / logout / verificación de sesión.
 *
 * Seguridad: la sesión solo dura mientras la app esté abierta. Si el usuario cierra
 * la app y la vuelve a abrir, el token anterior se invalida en el servidor y se
 * borra del teléfono (hay que iniciar sesión de nuevo). Para que la sesión sí
 * sobreviva al cerrar la app, cambia CERRAR_SESION_AL_ABRIR a false.
 *
 * Como el backend entrega el JWT en una cookie (pensado para la web), en móvil lo
 * recibimos en el cuerpo de la respuesta y lo enviamos en el header
 * Authorization: Bearer <token>.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";

import { endpoints } from "../api/apiConfig";
import { apiFetch } from "../api/apiClient";
import {
  guardarToken,
  guardarUsuario,
  obtenerToken,
  obtenerUsuario,
  limpiarSesion,
} from "../utils/storage";

const AuthContext = createContext(null);

// true  = al abrir la app siempre se pide iniciar sesión (el token anterior se invalida)
// false = la sesión se conserva entre aperturas de la app (mientras el token no venza)
const CERRAR_SESION_AL_ABRIR = true;

export const AuthProvider = ({ children }) => {
  const [cliente, setCliente] = useState(null); // { _id, name, email } | null
  const [token, setToken] = useState(null); // JWT de la sesión
  const [cargandoSesion, setCargandoSesion] = useState(true); // true mientras se valida al abrir la app

  // ¿Hay una sesión activa? Se deriva de la existencia del cliente.
  const estaAutenticado = !!cliente;

  /**
   * verificarSesion
   * Consulta al backend si el token guardado sigue siendo válido y, de ser así,
   * obtiene los datos frescos del cliente (nombre real, correo, id).
   */
  const verificarSesion = useCallback(async () => {
    try {
      const tokenGuardado = await obtenerToken();
      if (!tokenGuardado) {
        setCliente(null);
        return null;
      }

      const res = await apiFetch(endpoints.checkSession, { method: "GET" });
      if (!res.ok) {
        await limpiarSesion();
        setCliente(null);
        setToken(null);
        return null;
      }

      const data = await res.json();
      setToken(tokenGuardado);
      setCliente(data.cliente || null);
      if (data.cliente) await guardarUsuario(data.cliente);
      return data.cliente || null;
    } catch (error) {
      console.log("Error verificando sesión:", error);
      setCliente(null);
      return null;
    } finally {
      setCargandoSesion(false);
    }
  }, []);

  // Al abrir la app:
  //  - si CERRAR_SESION_AL_ABRIR es true, se invalida en el servidor el token que haya
  //    quedado guardado y se borra del teléfono (sesión cerrada).
  //  - si no, mostramos el usuario cacheado (para no parpadear) y validamos contra el backend.
  useEffect(() => {
    (async () => {
      if (CERRAR_SESION_AL_ABRIR) {
        try {
          // apiFetch adjunta el token guardado; el backend lo revoca
          await apiFetch(endpoints.logout, { method: "POST" });
        } catch (error) {
          // Sin conexión: igual se borra la sesión local
        }
        await limpiarSesion();
        setCliente(null);
        setToken(null);
        setCargandoSesion(false);
        return;
      }

      const usuarioCache = await obtenerUsuario();
      if (usuarioCache) setCliente(usuarioCache);
      await verificarSesion();
    })();
  }, [verificarSesion]);

  /**
   * iniciarSesion(email, password)
   * Realiza el login contra el backend. Devuelve un objeto con el resultado para
   * que la pantalla pueda mostrar notificaciones/errores.
   */
  const iniciarSesion = useCallback(async (email, password) => {
    const res = await apiFetch(endpoints.login, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, message: data.message || "No se pudo iniciar sesión" };
    }

    // El backend (parcheado para móvil) devuelve token y cliente en el body.
    if (data.token) {
      await guardarToken(data.token);
      setToken(data.token);
    }
    if (data.cliente) {
      await guardarUsuario(data.cliente);
      setCliente(data.cliente);
    } else {
      // Respaldo: si no vino el cliente, lo pedimos con checkSession.
      await verificarSesion();
    }

    return { ok: true, message: "Login exitoso" };
  }, [verificarSesion]);

  /**
   * cerrarSesion
   * Notifica al backend (que invalida el token) y limpia la sesión local.
   */
  const cerrarSesion = useCallback(async () => {
    try {
      await apiFetch(endpoints.logout, { method: "POST" });
    } catch (error) {
      // Aunque falle la petición, igual limpiamos el estado local.
    } finally {
      await limpiarSesion();
      setCliente(null);
      setToken(null);
    }
  }, []);

  const value = {
    cliente,
    token,
    estaAutenticado,
    cargandoSesion,
    iniciarSesion,
    cerrarSesion,
    verificarSesion,
    setCliente,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth
 * Hook de acceso rápido al contexto de autenticación. Lanza un error claro si se
 * usa fuera del AuthProvider (ayuda a detectar bugs de configuración).
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  return ctx;
};

export default AuthContext;
