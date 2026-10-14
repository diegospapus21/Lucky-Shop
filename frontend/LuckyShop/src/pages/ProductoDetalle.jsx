//// ProductoDetalle.jsx — detalle de producto con agregar al carrito

import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useAnillo } from '../hooks/useAnillos.jsx'

const BASE_URL = import.meta.env.VITE_API_URL + ''

const ProductoDetalle = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()

  // Trae el producto por id, junto con productos relacionados de la misma categoría
  const { anillo: producto, relacionados, loading, error } = useAnillo(id)

  const [cantidad,    setCantidad]    = useState(1)
  const [imgActiva,   setImgActiva]   = useState(0)   // índice de la imagen mostrada en grande
  const [toast,       setToast]       = useState(false)
  const [descuento,   setDescuento]   = useState(0)    // porcentaje de promo activa para este producto
  const [fechaFin,    setFechaFin]    = useState(null) // hasta cuándo dura la promoción

  // Si el producto no se encuentra (error al cargar), redirige al inicio
  useEffect(() => {
    if (error) {
      navigate('/')
    }
  }, [error, navigate])

  // Al cambiar de producto (nuevo id en la URL), reinicia la imagen mostrada y la cantidad
  useEffect(() => {
    setImgActiva(0)
    setCantidad(1)
  }, [id])

  // Consultar si este producto tiene una promoción activa
  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const res  = await fetch(`${BASE_URL}/promociones/activas`, { credentials: 'include' })
        const data = await res.json()
        const promo = Array.isArray(data)
          ? data.find((p) => p.idProducto && p.idProducto._id === id)
          : null
        setDescuento(promo ? promo.descuento : 0)
        setFechaFin(promo ? promo.fechaFin : null)
      } catch {
        setDescuento(0)
        setFechaFin(null)
      }
    }
    if (id) fetchPromo()
  }, [id])

  // Precio con descuento aplicado (si hay promo)
  const precioOriginal = producto ? Number(producto.precio) : 0
  const tienePromo = descuento > 0
  const precioFinal = tienePromo
    ? Math.round(precioOriginal * (1 - descuento / 100) * 100) / 100
    : precioOriginal

  // Agrega el producto al carrito con el precio ya rebajado (si aplica promo).
  // Si no hay sesión, redirige a login primero.
  const handleAgregar = () => {
    if (!producto) return
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
    // Agregamos el producto con el precio ya rebajado, para que el carrito
    // y el total usen el precio con descuento.
    // Además, guardamos la imagen seleccionada como imagenPresentacion
    // para que en el carrito aparezca la foto que el usuario eligió.
    addItem({ ...producto, precio: precioFinal, imagenPresentacion: imagenes[imgActiva] }, cantidad)
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  // Mientras se carga el producto, se muestra un spinner
  if (loading) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    </div>
  )

  // Si no hay producto (y no está cargando), no se renderiza nada (ya se redirigió arriba si hubo error)
  if (!producto) return null

  // Lista de imágenes a mostrar: las del array "imagenes", o si no hay, la imagen de presentación
  const imagenes = producto.imagenes?.length > 0 ? producto.imagenes : [producto.imagenPresentacion].filter(Boolean)

  // Determina la ruta y etiqueta de regreso según de dónde vino el usuario o la categoría del producto
  const getVolverInfo = () => {
    const from = location.state?.from

    // Si viene de una ruta específica
    if (from) {
      if (from.includes('/categoria/anillos')) return { to: from, label: 'Anillos' }
      if (from.includes('/categoria/pulseras')) return { to: from, label: 'Pulseras' }
      if (from.includes('/categoria/aritos')) return { to: from, label: 'Aritos' }
      if (from.includes('/categoria/collares')) return { to: from, label: 'Collares' }
      if (from.includes('/categoria/otros')) return { to: from, label: 'Otros' }
      if (from.includes('/bolsas-suerte')) return { to: from, label: 'Bolsas de la suerte' }
      if (from.includes('/guia-regalo')) return { to: from, label: 'Guía de regalo' }
      if (from.includes('/promociones')) return { to: from, label: 'Promociones' }
      if (from.includes('/favoritos')) return { to: from, label: 'Favoritos' }
      if (from.includes('/buscar')) return { to: from, label: 'Búsqueda' }
      if (from.includes('/perfil')) return { to: '/perfil', label: 'Mi perfil' }
      if (from.includes('/home') || from === '/') return { to: '/home', label: 'Inicio' }
      return { to: from, label: 'Volver' }
    }

    // Si no vino state.from, deducir por la categoría del producto
    const cat = (producto?.idCategoria || producto?.categoria || '').toLowerCase()
    if (cat.includes('anillo')) return { to: '/categoria/anillos', label: 'Anillos' }
    if (cat.includes('pulsera')) return { to: '/categoria/pulseras', label: 'Pulseras' }
    if (cat.includes('arete') || cat.includes('arito')) return { to: '/categoria/aritos', label: 'Aritos' }
    if (cat.includes('collar')) return { to: '/categoria/collares', label: 'Collares' }
    if (cat.includes('bolsa')) return { to: '/bolsas-suerte', label: 'Bolsas de la suerte' }
    if (cat.includes('otro')) return { to: '/categoria/otros', label: 'Otros' }

    return { to: '/home', label: 'Inicio' }
  }

  const volverInfo = getVolverInfo()

  const handleVolver = () => {
    if (location.state?.from) {
      navigate(location.state.from)
    } else if (volverInfo.to) {
      navigate(volverInfo.to)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Aviso flotante de "agregado al carrito" */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-pink-500 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium animate-bounce">
          ✓ Agregado al carrito
        </div>
      )}

      {/* Flecha para regresar a la sección correspondiente */}
      <div className="max-w-4xl mx-auto px-6 pt-6 pb-2 w-full">
        <button
          type="button"
          onClick={handleVolver}
          className="inline-flex items-center gap-2 text-gray-900 hover:text-pink-500 font-bold text-lg transition-colors cursor-pointer"
          id="btn-volver-detalle"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {volverInfo.label}
        </button>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row gap-10 max-w-4xl mx-auto">

          {/* Columna de imágenes: imagen grande + miniaturas */}
          <div className="flex-1">
            <div className="bg-gray-50 rounded-3xl overflow-hidden aspect-square flex items-center justify-center p-8 mb-3 relative">
              {/* Badge de descuento, solo si hay promoción activa */}
              {tienePromo && (
                <span className="absolute top-4 left-4 z-10 bg-pink-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                  -{descuento}%
                </span>
              )}
              {imagenes[imgActiva] ? (
                <img
                  src={imagenes[imgActiva]}
                  alt={producto.nombre}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-6xl"></span>
              )}
            </div>
            {/* Miniaturas: solo se muestran si hay más de una imagen */}
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

          {/* Columna de información: nombre, precio, descripción y acciones */}
          <div className="flex-1 flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{producto.nombre}</h1>

            {/* Precio: con descuento (tachado + ahorro) o precio normal */}
            {tienePromo ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-black text-pink-600">${precioFinal.toFixed(2)}</p>
                  <p className="text-xl text-gray-400 line-through">${precioOriginal.toFixed(2)}</p>
                  <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    Ahorras ${(precioOriginal - precioFinal).toFixed(2)}
                  </span>
                </div>
                {/* Fecha de vigencia de la promoción */}
                {fechaFin && (
                  <p className="text-sm text-pink-600 font-medium">
                    Promoción válida hasta el {new Date(fechaFin).toLocaleDateString('es-SV', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-3xl font-black text-gray-900">${precioOriginal.toFixed(2)}</p>
            )}

            {producto.descripcion && (
              <p className="text-sm text-gray-600 leading-relaxed">{producto.descripcion}</p>
            )}

            {/* Aviso de sin stock */}
            {producto.stock <= 0 && (
              <p className="text-sm text-red-500 font-medium">Sin stock disponible</p>
            )}

            {/* Botón de agregar al carrito (deshabilitado si no hay stock) y botón de favorito */}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={handleAgregar}
                disabled={producto.stock <= 0}
                className="flex-1 bg-gray-900 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar al carrito
              </button>
              <button className="w-12 h-12 rounded-2xl border-2 border-gray-200 flex items-center justify-center text-xl hover:border-pink-400 hover:text-pink-500 transition-all">
                ♡
              </button>
            </div>
          </div>
        </div>

        {/* Productos relacionados de la misma categoría */}
        {relacionados.length > 0 && (
          <div className="mt-14 max-w-4xl mx-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-5">También te puede interesar</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relacionados.map((p) => <ProductCard key={p._id} producto={p} />)}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default ProductoDetalle;