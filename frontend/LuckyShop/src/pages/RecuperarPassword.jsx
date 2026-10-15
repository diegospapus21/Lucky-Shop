//RecoveryPassword.jsx --Recuperacion de contraseña de clientes(usuarios)
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import heroPng from '../assets/fondoderecoveryPassword.png'
import logoLucky from '../assets/LogoNegro-removebg-preview.png' //  logo correcto

const BASE_URL = import.meta.env.VITE_API_URL + ''

const RecuperarPassword = () => {
  const navigate = useNavigate()

  const [step,            setStep]            = useState(1)   // 1: pedir correo, 2: verificar PIN, 3: nueva contraseña
  const [email,           setEmail]           = useState('')
  const [code,            setCode]            = useState('')
  const [recoveryToken,   setRecoveryToken]   = useState(null)
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)

  // ── Paso 1: solicitar el código de verificación al correo ingresado ──
  const handleRequestCode = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/recoveryPassword/requestCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'No se pudo enviar el código')
      if (data.recoveryToken) {
        setRecoveryToken(data.recoveryToken)
      }
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Reenvía el código si el usuario no lo recibió (mismo endpoint que la solicitud inicial)
  const handleResendCode = async () => {
    setError('')
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/recoveryPassword/requestCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'No se pudo reenviar')
      if (data.recoveryToken) {
        setRecoveryToken(data.recoveryToken)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 2: verificar el código PIN ingresado ──
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/recoveryPassword/verifyCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: code.trim(), recoveryToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Código incorrecto')
      if (data.recoveryToken) {
        setRecoveryToken(data.recoveryToken)
      }
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 3: validar y guardar la nueva contraseña ──
  const handleNewPassword = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/recoveryPassword/newPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword, confirmNewPassword: confirmPassword, recoveryToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al actualizar la contraseña')
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Imagen de fondo */}
      <img
        src={heroPng}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Logo real de Lucky Shop */}
      <div className="relative z-10 mb-5 text-center">
        <img
          src={logoLucky}
          alt="Lucky Shop"
          className="mx-auto h-16 object-contain"
        />
        <div className="w-40 h-px bg-pink-500 mx-auto mt-2" />
      </div>

      {/* Tarjeta blanca con el formulario, cambia de contenido según el paso actual */}
      <div className="relative z-10 bg-white rounded-2xl shadow-lg w-full max-w-sm px-8 py-7">

        {/* ── Paso 1: solicitar código ── */}
        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Recuperación de contraseña</h2>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              Introduce tú correo electrónico. Te enviaremos un código PIN
              de verificación para que puedas restablecer tú contraseña de
              forma segura en el siguiente paso.
            </p>

            <form onSubmit={handleRequestCode} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-400 bg-white transition-colors"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex flex-col items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-pink-400 hover:bg-pink-500 text-white text-sm font-medium px-10 py-2 rounded-full transition-colors disabled:opacity-60"
                >
                  {loading ? 'Enviando...' : 'Enviar código'}
                </button>
                {/* Nota: este texto es estático (no llama a handleResendCode), a diferencia del paso 2 */}
                <p className="text-xs text-gray-400">
                  ¿No recibiste el código?{' '}
                  <span className="text-pink-400 cursor-default">Reenviar PIN</span>
                </p>
              </div>
            </form>
          </>
        )}

        {/* ── Paso 2: verificar código ── */}
        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Verificar código PIN</h2>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              Ingresa el código que enviamos a{' '}
              <span className="font-medium text-gray-700">{email}</span>.
              Válido por 15 minutos.
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Código PIN</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                  maxLength={6}
                  placeholder="abc123"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center tracking-widest outline-none focus:border-pink-400 bg-white transition-colors"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex flex-col items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-pink-400 hover:bg-pink-500 text-white text-sm font-medium px-10 py-2 rounded-full transition-colors disabled:opacity-60"
                >
                  {loading ? 'Verificando...' : 'Verificar código'}
                </button>
                {/* Este sí reenvía el código de verdad, llamando a handleResendCode */}
                <p className="text-xs text-gray-400">
                  ¿No recibiste el código?{' '}
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-pink-400 hover:underline disabled:opacity-60"
                  >
                    Reenviar PIN
                  </button>
                </p>
              </div>
            </form>
          </>
        )}

        {/* ── Paso 3: nueva contraseña ── */}
        {step === 3 && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Nueva contraseña</h2>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              Elige una contraseña segura para tu cuenta Lucky Shop.
            </p>

            <form onSubmit={handleNewPassword} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-400 bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-400 bg-white transition-colors"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex justify-center pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-pink-400 hover:bg-pink-500 text-white text-sm font-medium px-10 py-2 rounded-full transition-colors disabled:opacity-60"
                >
                  {loading ? 'Guardando...' : 'Actualizar contraseña'}
                </button>
              </div>
            </form>
          </>
        )}

      </div>

      {/* Link para volver al login */}
      <Link
        to="/login"
        className="relative z-10 mt-5 text-sm text-pink-700 hover:text-pink-900 transition-colors"
      >
        ← Regresar a inicio de sesión
      </Link>

    </div>
  )
}

export default RecuperarPassword;