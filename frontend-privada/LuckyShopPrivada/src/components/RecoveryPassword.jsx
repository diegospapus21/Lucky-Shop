// RecoveryPassword.jsx — flujo de recuperación de contraseña del panel admin
import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react'
import AdminLogo from './AdminLogo.jsx'
import trebolFondo from '../assets/trebol-fondo.png'

// URL base para peticiones a la API
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

// userType se mantiene por compatibilidad, pero en este proyecto (frontend-privada)
// este componente solo se usa para userType="admin".
const RecoveryPassword = ({ userType = 'admin' }) => {
  const navigate = useNavigate()

  // Configuración de rutas según el tipo de usuario
  const isAdmin = userType === 'admin'
  const apiBase = isAdmin ? `${BASE_URL}/recoveryPasswordAdmin` : `${BASE_URL}/recoveryPassword`
  const backToLoginPath = isAdmin ? '/' : '/login'

  // Control de estado de la interfaz: 'email' | 'code' | 'newPassword' | 'success'
  const [step, setStep] = useState('email')

  // Estados de datos del formulario
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const inputsRef = useRef([])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Estados de carga y manejo de errores
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Enmascara el correo para proteger la privacidad en la vista del PIN
  const maskedEmail = email.length
    ? email.replace(/^(.).*(@.*)$/, (_, first, domain) => first + '*'.repeat(10) + domain)
    : ''

  // ── Paso 1: solicitar código de verificación ──
  const handleRequestCode = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Por favor introduce tu correo electrónico.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/requestCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message === 'user not found'
        ? 'No encontramos una cuenta con ese correo.'
        : (data.message || 'No se pudo enviar el código.'))

      setStep('code')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 2: interacción y verificación de PIN ──
  // Maneja la entrada de cada dígito y salta al siguiente campo automáticamente
  const handleCodeChange = (index, value) => {
    if (!/^[a-zA-Z0-9]?$/.test(value)) return
    const next = [...code]
    next[index] = value
    setCode(next)

    if (value && index < code.length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  // Permite retroceder el enfoque al presionar la tecla de borrado
  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  // Envía el código de 6 dígitos ingresado al servidor
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setError('')

    const fullCode = code.join('')
    if (fullCode.length < code.length) {
      setError('Introduce el PIN completo.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/verifyCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: fullCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message === 'Invalid code'
        ? 'El código ingresado no es válido.'
        : (data.message || 'No se pudo verificar el código.'))

      setStep('newPassword')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Solicita el reenvío de un nuevo PIN al correo registrado
  const handleResend = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/requestCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'No se pudo reenviar el código.')
      setCode(['', '', '', '', '', ''])
      inputsRef.current[0]?.focus()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 3: establecer nueva contraseña ──
  const handleNewPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/newPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword, confirmNewPassword: confirmPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'No se pudo actualizar la contraseña.')

      setStep('success')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Foto de fondo, desenfocada */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ backgroundImage: `url(${trebolFondo})`, filter: 'blur(6px)' }}
      />
      {/* Overlay verde oscuro para mantener el texto legible */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a3d29]/80 via-[#1f4d33]/70 to-[#0f2a1b]/85" />
      <div className="w-full max-w-md relative z-10">
        {/* Logo del panel de administración */}
        <div className="mb-6">
          <AdminLogo size="lg" />
          <div className="w-full h-px bg-white/30 mt-4" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">

          {/* ── Paso 1: pedir correo ── */}
          {step === 'email' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Recuperación de contraseña</h2>
              <div className="w-12 h-1 bg-green-500 rounded-full mb-4" />
              <p className="text-sm text-gray-500 mb-6">
                Introduce tú correo electrónico. Te enviaremos un código PIN
                de verificación para que puedas restablecer tú contraseña de
                forma segura en el siguiente paso.
              </p>

              <form onSubmit={handleRequestCode} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@luckyshop.com"
                    required
                    className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 text-sm outline-none focus:border-green-500 focus:bg-white transition-colors"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-green-200 py-3 text-sm font-semibold text-green-900 hover:bg-green-300 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Enviando...' : 'Enviar código'}
                </button>
              </form>
            </>
          )}

          {/* ── Paso 2: código de verificación ── */}
          {step === 'code' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">Código de verificación</h2>
              <div className="w-16 h-1 bg-green-500 rounded-full mb-4 mx-auto" />
              <p className="text-sm text-gray-500 mb-6 text-center">
                Código de seguridad enviado a la dirección<br />
                <span className="font-medium text-gray-700">{maskedEmail}</span>
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-3 text-center">Coloca el PIN de seguridad para continuar</p>
                  <div className="flex justify-center gap-2">
                    {code.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputsRef.current[i] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(i, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                        className="w-12 h-12 text-center text-lg font-semibold rounded-xl border border-gray-200 bg-gray-100 outline-none focus:border-green-500 focus:bg-white transition-colors"
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-green-200 py-3 text-sm font-semibold text-green-900 hover:bg-green-300 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Verificando...' : 'Enviar'}
                </button>

                <p className="text-center text-xs text-gray-500">
                  ¿No recibiste el código?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-green-700 font-semibold hover:underline"
                  >
                    Reenviar pin
                  </button>
                </p>
              </form>
            </>
          )}

          {/* ── Paso 3: nueva contraseña ── */}
          {step === 'newPassword' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Reestablecer contraseña</h2>
              <div className="w-12 h-1 bg-green-500 rounded-full mb-4" />
              <p className="text-sm text-gray-500 mb-6">
                Crea una contraseña nueva que sea fácil de recordar
                pero difícil de adivinar. Te recomendamos usar una
                combinación de letras y números.
              </p>

              <form onSubmit={handleNewPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 text-sm outline-none focus:border-green-500 focus:bg-white transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1 ml-1">*Mínimo 8 caracteres</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 text-sm outline-none focus:border-green-500 focus:bg-white transition-colors"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-green-200 py-3 text-sm font-semibold text-green-900 hover:bg-green-300 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </form>
            </>
          )}

          {/* ── Paso 4: éxito ── */}
          {step === 'success' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 ring-1 ring-green-200">
                <svg viewBox="0 0 24 24" className="w-9 h-9 text-green-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">¡Éxito!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Tú contraseña ha sido actualizada correctamente.<br />
                Ahora puedes acceder a tú panel administrativo.
              </p>
              <button
                onClick={() => navigate(backToLoginPath)}
                className="w-full rounded-full bg-green-200 py-3 text-sm font-semibold text-green-900 hover:bg-green-300 transition-colors"
              >
                Continuar
              </button>
            </div>
          )}
        </div>

        {/* Opción para regresar al login en pasos anteriores al éxito */}
        {step !== 'success' && (
          <div className="mt-4">
            <Link to={backToLoginPath} className="text-sm text-white/80 hover:text-white hover:underline">
              ‹ Regresar al inicio de sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecoveryPassword;