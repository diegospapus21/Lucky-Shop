// AuthContext.jsx — estado de sesión del cliente (Lucky Shop)
// Se apoya en la cookie httpOnly "authCookie" que ya emite el backend
// en /api/loginClientes, y en el endpoint /api/loginClientes/checkSession
// para saber si hay una sesión activa al cargar la app o al refrescar.
//
// Seguridad: la sesión solo dura mientras la ventana esté abierta. Si el cliente
// cierra la ventana y vuelve a abrir el sitio, la sesión anterior se cierra
// en el servidor (ver utils/sesionVentana.js).
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  marcarSesionActiva,
  limpiarMarcaSesion,
  sesionPermitida,
  responderOtrasVentanas,
} from '../utils/sesionVentana.js'

const BASE_URL = import.meta.env.VITE_API_URL + ''

// Contexto de autenticación del cliente, compartido en toda la app
const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [cliente, setCliente] = useState(null) // { email, name } | null
  const [loading, setLoading] = useState(true) // true mientras se valida la sesión inicial

  // Consulta al backend si la cookie de sesión sigue siendo válida,
  // y actualiza el estado del cliente según la respuesta.
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/loginClientes/checkSession`, {
        credentials: 'include',
      })
      if (!res.ok) {
        setCliente(null)
        return null
      }
      const data = await res.json()
      setCliente(data.cliente || null)
      return data.cliente || null
    } catch {
      // Si falla la petición (ej. sin conexión), se asume que no hay sesión
      setCliente(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Al montar la app:
  //  - esta ventana contesta a otras ventanas nuevas que pregunten si hay sesión abierta
  //  - si es una ventana NUEVA sin sesión propia (el cliente cerró la ventana y volvió a abrir
  //    el sitio), se cierra en el servidor la sesión que haya quedado abierta
  //  - si no, se pregunta al backend si la cookie sigue siendo válida
  useEffect(() => {
    const dejarDeResponder = responderOtrasVentanas()
    let activo = true

    const iniciar = async () => {
      const permitida = await sesionPermitida()
      if (!activo) return

      if (!permitida) {
        try {
          await fetch(`${BASE_URL}/logout`, { method: 'POST', credentials: 'include' })
        } catch {
          // Sin conexión: no hay sesión que cerrar desde aquí
        }
        if (!activo) return
        setCliente(null)
        setLoading(false)
        return
      }

      await checkSession()
    }

    iniciar()
    return () => {
      activo = false
      dejarDeResponder()
    }
  }, [checkSession])

  // Se llama justo después de un login exitoso (la cookie ya fue seteada por el backend).
  // Marcamos esta ventana como "con sesión" y consultamos checkSession para obtener los datos reales.
  const login = useCallback(async () => {
    marcarSesionActiva()
    return checkSession()
  }, [checkSession])

  // Cierra la sesión: el backend invalida el token y borra la cookie; aquí se limpia el estado local
  const logout = useCallback(async () => {
    try {
      await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // Aunque falle la petición, limpiamos el estado local igualmente
    } finally {
      limpiarMarcaSesion()
      setCliente(null)
    }
  }, [])

  // Valores y funciones expuestas a través del contexto
  const value = {
    cliente,
    isAuthenticated: !!cliente,
    loading,
    login,
    logout,
    checkSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook para consumir el contexto de autenticación desde cualquier componente
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de un <AuthProvider>')
  return ctx
}