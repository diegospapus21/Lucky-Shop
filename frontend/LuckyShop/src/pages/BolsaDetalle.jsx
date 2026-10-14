//// BolsaDetalle.jsx — detalle de una bolsa de la suerte con agregar al carrito
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// URL base de la API del backend
const BASE_URL = import.meta.env.VITE_API_URL + ''

const BolsaDetalle = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()

  const [bolsa, setBolsa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgActiva, setImgActiva] = useState(0) // índice de la imagen mostrada
  const [cantidad, setCantidad] = useState(1)
  const [toast, setToast] = useState(false)
  const [favorito, setFavorito] = useState(false)

  // Trae la bolsa por su id desde /api/bolsas/:id
  useEffect(() => {
    const fetchBolsa = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${BASE_URL}/bolsas/${id}`, { credentials: 'include' })
        if (!res.ok) throw new Error('No encontrada')
        const data = await res.json()
        setBolsa(data)
      } catch (err) {
        // Si no existe la bolsa, regresa al listado de bolsas
        navigate('/bolsas-suerte')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchBolsa()
  }, [id, navigate])

  // Al cambiar de bolsa (nuevo id), reinicia imagen y cantidad
  useEffect(() => {
    setImgActiva(0)
    setCantidad(1)
  }, [id])

  // Agrega la bolsa al carrito. Si no hay sesión, manda a login.
  const handleAgregar = () => {
    if (!bolsa) return
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
    addItem({ ...bolsa, imagenPresentacion: imagenes[imgActiva] }, cantidad)
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  // Mientras carga, muestra un spinner
  if (loading) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    </div>
  )

  if (!bolsa) return null

  // Lista de imágenes a mostrar: las del array "imagenes", o la de presentación
  const imagenes = bolsa.imagenes?.length > 0
    ? bolsa.imagenes
    : [bolsa.imagenPresentacion].filter(Boolean)

  const precio = Number(bolsa.precio || 0)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Aviso flotante de "agregado al carrito" */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-pink-500 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium animate-bounce">
          ✓ Agregado al carrito
        </div>
      )}

      {/* Flecha para regresar a Bolsas de la suerte */}
      <div className="max-w-4xl mx-auto px-6 pt-6 pb-2 w-full">
        <button
          type="button"
          onClick={() => {
            if (location.state?.from) {
              navigate(location.state.from)
            } else {
              navigate('/bolsas-suerte')
            }
          }}
          className="inline-flex items-center gap-2 text-gray-900 hover:text-pink-500 font-bold text-lg transition-colors cursor-pointer"
          id="btn-volver-bolsa"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Bolsas de la suerte
        </button>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row gap-10 max-w-4xl mx-auto">

          {/* Columna de imágenes: imagen grande + miniaturas */}
          <div className="flex-1">
            <div className="bg-gray-50 rounded-3xl overflow-hidden aspect-square flex items-center justify-center p-8 mb-3">
              {imagenes[imgActiva] ? (
                <img
                  src={imagenes[imgActiva]}
                  alt={bolsa.nombre}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-6xl"></span>
              )}
            </div>

            {/* Miniaturas: solo si hay más de una imagen */}
            {imagenes.length > 1 && (
              <div className="flex gap-2 justify-center">
                {imagenes.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgActiva(i)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      imgActiva === i ? 'border-pink-500' : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Columna de información */}
          <div className="flex-1 flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{bolsa.nombre}</h1>

            {/* Badge de bolsa de la suerte */}
            <span className="self-start bg-pink-100 text-pink-600 text-xs font-bold px-3 py-1 rounded-full">
              Bolsa de la suerte
            </span>

            {/* Precio */}
            <p className="text-3xl font-black text-gray-900">${precio.toFixed(2)}</p>

            {/* Descripción */}
            {bolsa.descripcion && (
              <p className="text-sm text-gray-600 leading-relaxed">{bolsa.descripcion}</p>
            )}

            {/* Aviso de sin stock */}
            {bolsa.stock <= 0 && (
              <p className="text-sm text-red-500 font-medium">Sin stock disponible</p>
            )}

            {/* Selector de cantidad */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                className="w-9 h-9 rounded-lg bg-gray-900 text-white text-lg flex items-center justify-center"
              >
                -
              </button>
              <span className="w-10 text-center font-bold">{cantidad}</span>
              <button
                onClick={() => setCantidad((c) => c + 1)}
                className="w-9 h-9 rounded-lg bg-gray-900 text-white text-lg flex items-center justify-center"
              >
                +
              </button>
            </div>

            {/* Botón agregar al carrito + favorito */}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={handleAgregar}
                disabled={bolsa.stock <= 0}
                className="flex-1 bg-gray-900 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Añadir al carrito
              </button>
              <button
                onClick={() => setFavorito((f) => !f)}
                className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-xl transition ${
                  favorito
                    ? 'border-pink-500 text-pink-500'
                    : 'border-gray-200 text-gray-300 hover:border-pink-400 hover:text-pink-500'
                }`}
              >
                {favorito ? '♥' : '♡'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default BolsaDetalle;