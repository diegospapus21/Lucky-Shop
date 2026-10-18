// Login.jsx — login de clientes Lucky Shop
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import logoLucky from '../assets/LogoNegro-removebg-preview.png' //  logo correcto

const BASE_URL = import.meta.env.VITE_API_URL + ''
const JOYAS_BG = 'https://images.unsplash.com/photo-1631982690223-8aa4be0a2497?fm=jpg&q=80&w=1200&auto=format&fit=crop'

const LoginCliente = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false) // controla si la contraseña se ve en texto plano

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  // Si veníamos redirigidos desde una ruta privada, regresamos ahí; si no, al inicio.
  const from = location.state?.from?.pathname || '/home'

  const onSubmit = async ({ email, password }) => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/loginClientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión')

      // El backend ya dejó la cookie httpOnly seteada; refrescamos el estado
      // de autenticación (nombre/email del cliente) contra checkSession.
      await login()

      // Redirige a la página principal (o a la ruta que el usuario intentaba visitar)
      // con el usuario ya iniciado.
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Panel izquierdo — foto de joyería sobre fondo rosa */}
      <div
        className="relative w-full md:w-1/2 min-h-[220px] md:min-h-screen bg-cover bg-center"
        style={{ backgroundImage: `url(${JOYAS_BG})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200/70 via-pink-100/40 to-pink-300/60" />
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full md:w-1/2 min-h-screen flex flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">

           {/* Logo de la marca */}
               <div className="relative z-10 mb-5 text-center">
                       <img
                         src={logoLucky}
                         alt="Lucky Shop"
                         className="mx-auto h-16 object-contain"
                       />
                       <div className="w-40 h-px bg-pink-500 mx-auto mt-2" />
                     </div>
                     
          <h1 className="text-3xl font-semibold text-gray-900 text-center mb-1">Inicio de sesión</h1>
          <p className="text-sm text-gray-500 text-center border-b border-gray-200 pb-4 mb-8">
            ¡Ingresa tus datos para descubrir tú suerte de hoy!
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo eléctronico</label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                {...register('email', {
                  required: 'El correo es obligatorio.',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Ingresa un correo válido.',
                  },
                })}
                className={`w-full rounded-full border bg-white px-4 py-2.5 text-sm outline-none shadow-sm transition-colors ${
                  errors.email ? 'border-red-300 focus:border-red-400' : 'border-pink-200 focus:border-pink-400'
                }`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'La contraseña es obligatoria.',
                    minLength: { value: 6, message: 'Debe tener al menos 6 caracteres.' },
                  })}
                  className={`w-full rounded-full border bg-white px-4 py-2.5 pr-10 text-sm outline-none shadow-sm transition-colors ${
                    errors.password ? 'border-red-300 focus:border-red-400' : 'border-pink-200 focus:border-pink-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-end text-xs pt-1">
              <Link to="/recuperar-password" className="text-pink-500 font-medium hover:underline whitespace-nowrap">
                ¿Olvidaste la contraseña?
              </Link>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full max-w-[220px] rounded-full bg-pink-200 py-3 text-sm font-semibold text-gray-800 hover:bg-pink-300 transition-colors disabled:opacity-60"
              >
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
              <p className="text-xs text-gray-500 mt-3">
                ¿No tienes una cuenta?{' '}
                <Link to="/register" className="text-pink-500 font-semibold hover:underline">Regístrate aquí</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginCliente;