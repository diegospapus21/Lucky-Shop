// Perfil.jsx — página de perfil del cliente (datos personales + favoritos)
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const BASE_URL = import.meta.env.VITE_API_URL + ''

// 8 dígitos y empieza con 6 / 7 
const REGEX_TELEFONO_SV = /^[67]\d{7}$/

// Si viene con el código de país (+503) lo quita, y limita a 8 dígitos
const normalizarTelefono = (valor) => {
  let digitos = String(valor || '').replace(/\D/g, '')
  if (digitos.length > 8 && digitos.startsWith('503')) digitos = digitos.slice(3)
  return digitos.slice(0, 8)
}

const Perfil = () => {
  const navigate = useNavigate()
  const { checkSession } = useAuth() // se usa para refrescar el nombre en el Navbar tras editar el perfil
  const fileInputRef = useRef(null)   // referencia al input de archivo (oculto) para la foto de perfil

  const [perfil,        setPerfil]        = useState(null)     // Datos del cliente cargados desde el backend
  const [favoritos,     setFavoritos]     = useState([])       // Productos marcados como favoritos
  const [cargando,      setCargando]      = useState(true)
  const [guardando,     setGuardando]     = useState(false)
  const [error,         setError]         = useState('')
  const [exito,         setExito]         = useState('')
  const [avatarFile,    setAvatarFile]    = useState(null)     // Archivo de imagen elegido (aún no subido)
  const [avatarPreview, setAvatarPreview] = useState(null)     // Vista previa local de la nueva foto

  // Manejo del formulario con react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  // Teléfono (opcional): si se escribe, debe ser un número válido de El Salvador.
  // Se separa el onChange para filtrar lo escrito.
  const { onChange: phoneOnChange, ...phoneField } = register('phone', {
    pattern: {
      value: REGEX_TELEFONO_SV,
      message: 'Ingresa un teléfono válido de El Salvador: 8 dígitos que empiecen con 2, 6 o 7.',
    },
  })

  // ── Cargar datos del cliente ──
  // Trae el perfil desde el backend y precarga el formulario con esos valores
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const res = await fetch(`${BASE_URL}/perfilCliente`, { credentials: 'include' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'No se pudo cargar el perfil')
        setPerfil(data)
        reset({
          name: data.name || '',
          lastName: data.lastName || '',
          gender: data.gender || '',
          birthdate: data.birthdate ? data.birthdate.slice(0, 10) : '',
          email: data.email || '',
          phone: normalizarTelefono(data.phone), // solo números (limpia formatos viejos como +503 7000-0000)
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargarPerfil()
  }, [reset])

  // Cargar favoritos 
  useEffect(() => {
    const cargarFavoritos = async () => {
      try {
        const res = await fetch(`${BASE_URL}/perfilCliente/favoritos`, { credentials: 'include' })
        const data = await res.json()
        if (res.ok) setFavoritos(data)
      } catch {
        // si falla, simplemente no mostramos favoritos
      }
    }
    cargarFavoritos()
  }, [])

  // Guarda el archivo elegido y genera una vista previa local (sin subirlo todavía)
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  // Envía los datos del formulario (y la foto, si se cambió) al backend como FormData
  const onSubmit = async (datos) => {
    setError('')
    setExito('')
    setGuardando(true)
    try {
      const formData = new FormData()
      Object.entries(datos).forEach(([key, value]) => {
        // El teléfono siempre se envía normalizado: solo 8 dígitos, sin +503 ni guiones
        formData.append(key, key === 'phone' ? normalizarTelefono(value) : value)
      })
      if (avatarFile) formData.append('avatar', avatarFile)

      const res = await fetch(`${BASE_URL}/perfilCliente`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'No se pudo actualizar el perfil')

      setPerfil(data.cliente)
      setAvatarFile(null)
      setAvatarPreview(null)
      setExito('¡Cambios guardados correctamente!')
      await checkSession() // refresca el nombre mostrado en el Navbar
      setTimeout(() => setExito(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  // Clase de estilo reutilizable para los inputs del formulario, cambia el color del borde si hay error
  const inputClass = (hasError) =>
    `w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors ${
      hasError ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-pink-400'
    }`

  // Mientras se carga el perfil, se muestra un mensaje simple en vez del formulario
  if (cargando) {
    return (
      <div className="min-h-screen bg-pink-50">
        <Navbar />
        <p className="text-center text-gray-400 py-24">Cargando perfil…</p>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pink-50">
      <Navbar />

      {/* Banner superior con el título de la página */}
      <div
        className="relative overflow-hidden px-6 md:px-16 py-10"
        style={{ background: 'linear-gradient(120deg, #ffd6e8 0%, #ffe9f2 50%, #ffd6e8 100%)' }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate('/home')
              }
            }}
            className="inline-flex items-center gap-3 text-3xl font-bold text-gray-900 hover:text-pink-600 transition-colors cursor-pointer text-left"
            id="btn-volver-perfil"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span>Mi perfil</span>
          </button>
          <p className="text-sm text-gray-600 md:text-right max-w-sm">
            Gestiona tu información personal, revisa tus pedidos, direcciones y más.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-0 py-8 space-y-6">

        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-pink-100 p-6 md:p-8">
          {/* Encabezado con avatar, nombre, correo y acceso al historial */}
          <div className="flex items-center gap-5 pb-6 border-b border-gray-100">
            <div className="relative">
              {/* Avatar: muestra la vista previa nueva, la foto guardada, o las iniciales del nombre */}
              <div className="w-20 h-20 rounded-full overflow-hidden bg-pink-100 flex items-center justify-center">
                {avatarPreview || perfil?.profileImage ? (
                  <img src={avatarPreview || perfil.profileImage} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-pink-400">
                    {perfil?.name?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              {/* Botón para abrir el selector de archivo y cambiar la foto */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center text-xs hover:bg-pink-50"
                title="Cambiar foto"
              >
                
              </button>
              {/* Input de archivo oculto, se activa por el botón de arriba */}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{perfil?.name} {perfil?.lastName}</p>
              <p className="text-sm text-gray-500">{perfil?.email}</p>
              {perfil?.phone && <p className="text-sm text-gray-500"> {perfil.phone}</p>}
              <Link to="/historial" className="inline-block text-xs text-pink-500 hover:underline mt-1">
                Ver mi historial de pedidos →
              </Link>
            </div>
          </div>

          {/* Formulario de datos personales */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="pt-6">
            <div className="flex items-center gap-2 text-gray-700 font-medium mb-4">
              <span></span> Información personal
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  {...register('name', { required: 'El nombre es obligatorio.' })}
                  className={inputClass(errors.name)}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name.message}</p>}
              </div>

               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input {...register('lastName')} className={inputClass(errors.lastName)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                <select {...register('gender')} className={inputClass(errors.gender)}>
                  <option value="">Prefiero no decir</option>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  {...register('birthdate', {
                    validate: (value) => !value || new Date(value) <= new Date() || 'La fecha no puede ser futura.',
                  })}
                  className={inputClass(errors.birthdate)}
                />
                {errors.birthdate && <p className="text-xs text-red-500 mt-1 ml-1">{errors.birthdate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'El correo es obligatorio.',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Ingresa un correo válido.' },
                  })}
                  className={inputClass(errors.email)}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  {...phoneField}
                  // Solo permite números (máximo 8): las letras y símbolos se descartan al escribir o pegar
                  onChange={(e) => {
                    e.target.value = normalizarTelefono(e.target.value)
                    phoneOnChange(e)
                  }}
                  inputMode="numeric"
                  maxLength={15} // margen para pegar números con +503 o guiones; se recortan a 8 dígitos
                  placeholder="70001234"
                  className={inputClass(errors.phone)}
                />
                {errors.phone ? (
                  <p className="text-xs text-red-500 mt-1 ml-1">{errors.phone.message}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1 ml-1">8 dígitos, sin +503 ni guiones.</p>
                )}
              </div>

            </div>

            {/* Mensajes de error o éxito al guardar */}
            {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
            {exito && <div className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{exito}</div>}

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-full bg-pink-200 hover:bg-pink-300 text-gray-800 text-sm font-semibold px-6 py-2.5 transition-colors disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* Sección de productos favoritos del cliente */}
        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-pink-100 p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Favoritos</h2>
            <Link to="/home" className="text-sm text-pink-500 hover:underline">Ver todos →</Link>
          </div>

          {favoritos.length === 0 ? (
            // Sin favoritos guardados
            <p className="text-sm text-gray-400">
              Aún no tienes productos favoritos. Ve al catálogo y toca el ♡ en cualquier producto para guardarlo aquí.
            </p>
          ) : (
            // Grilla de productos favoritos, cada uno enlaza a su página de detalle
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {favoritos.map((producto) => (
                <Link
                  key={producto._id}
                  to={`/producto/${producto._id}`}
                  state={{ from: '/perfil' }}
                  className="rounded-2xl border border-gray-100 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="aspect-square bg-gray-50">
                    {producto.imagenPresentacion ? (
                      <img src={producto.imagenPresentacion} alt={producto.nombre} className="w-full h-full object-contain p-3" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 px-2 py-2 line-clamp-2">{producto.nombre}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Perfil;