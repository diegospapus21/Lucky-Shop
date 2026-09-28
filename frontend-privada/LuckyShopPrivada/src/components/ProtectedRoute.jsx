// ProtectedRoute.jsx — guard de rutas que valida sesión contra el backend
// antes de mostrar el contenido protegido.
import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const ProtectedRoute = ({ userType, children }) => {
  const [status, setStatus] = useState('checking')

  const checkEndpoint = userType === 'admin'
    ? `${BASE_URL}/loginAdmin/checkSession`
    : `${BASE_URL}/loginClientes/checkSession`

  const redirectPath = userType === 'admin' ? '/' : '/login'

  useEffect(() => {
    let isMounted = true

    const verifySession = async () => {
      try {
        const res = await fetch(checkEndpoint, {
          method: 'GET',
          credentials: 'include',
        })

        if (!isMounted) return

        if (res.ok) {
          setStatus('authorized')
        } else {
          setStatus('unauthorized')
        }
      } catch (error) {
        if (isMounted) setStatus('unauthorized')
      }
    }

    verifySession()

    return () => { isMounted = false }
  }, [checkEndpoint])

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Verificando sesión...</p>
      </div>
    )
  }

  if (status === 'unauthorized') {
    return <Navigate to={redirectPath} replace />
  }

  return children
}

export default ProtectedRoute;