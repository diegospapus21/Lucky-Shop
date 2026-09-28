// Login.jsx — login del panel de administración de Lucky Shop
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AdminLogo from '../components/AdminLogo.jsx'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const CLOVER_BG = 'https://images.unsplash.com/photo-1748357663177-f93b0d158eda?fm=jpg&q=80&w=1200&auto=format&fit=crop'

const Login = () => {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('luckyshop_token') || sessionStorage.getItem('luckyshop_token')
    if (token) navigate('/home')
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Por favor completa email y contraseña.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${BASE_URL}/loginAdmin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Email o contraseña incorrectos.')
      }

      const storage = rememberMe ? localStorage : sessionStorage
      storage.setItem('luckyshop_token', 'session-active')
      storage.setItem('luckyshop_user', email.trim())

      navigate('/home')
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      <div
        className="relative w-full md:w-1/2 min-h-[260px] md:min-h-screen bg-cover bg-center flex items-end p-8 md:p-12"
        style={{ backgroundImage: `url(${CLOVER_BG})` }}
      >
        <div className="bg-black/35 rounded-2xl px-6 py-5 max-w-sm">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white leading-tight">
            La suerte<br />de la<br />elegancia
          </h2>
        </div>
      </div>

      <div className="w-full md:w-1/2 min-h-screen flex flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-4xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-8 text-center">
            Bienvenido de nuevo
          </h2>

          <div className="border border-gray-200 rounded-2xl shadow-sm px-7 py-8">
            <AdminLogo size="md" className="mb-6" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@luckyshop.com"
                  required
                  className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-green-500 focus:bg-white transition-colors"
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
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-1.5 text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  Recordarme la contraseña
                </label>
                <Link to="/recovery-password" className="text-green-700 font-medium hover:underline whitespace-nowrap">
                  ¿Olvidaste la contraseña?
                </Link>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-green-800 py-3 text-sm font-semibold text-white hover:bg-green-900 transition-colors disabled:cursor-not-allowed disabled:opacity-60 mt-2"
              >
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login;