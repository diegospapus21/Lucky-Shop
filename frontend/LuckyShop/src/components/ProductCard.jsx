import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const BASE_URL = import.meta.env.VITE_API_URL + ''

/* ── Icono SVG de corazón ── */
// Corazón sin rellenar (producto no marcado como favorito)
const HeartOutline = ({ className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
  </svg>
)

// Corazón relleno (producto marcado como favorito)
const HeartFilled = ({ className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
  </svg>
)

const ProductCard = ({ producto }) => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Si el producto actual está marcado como favorito por el usuario
  const [esFavorito, setEsFavorito] = useState(false)
  // Evita doble clic mientras se guarda/quita el favorito
  const [cargandoFav, setCargandoFav] = useState(false)
  // Controla el efecto de "skeleton" mientras carga la imagen
  const [imgLoaded, setImgLoaded] = useState(false)

  // Si el producto ya trae si es favorito (por ejemplo, listado desde /favoritos), lo respetamos
  useEffect(() => {
    if (producto.esFavorito !== undefined) setEsFavorito(producto.esFavorito)
  }, [producto])

  // Marca o quita el producto como favorito. Si no hay sesión, redirige a login.
  const handleToggleFavorito = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }

    setCargandoFav(true)
    try {
      const res = await fetch(`${BASE_URL}/perfilCliente/favoritos/${producto._id}`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) setEsFavorito(data.esFavorito)
    } catch {
      // si falla, dejamos el estado como estaba
    } finally {
      setCargandoFav(false)
    }
  }

  // ── Cálculo de precio con descuento ──
  // Si el producto trae "descuento" (porcentaje), calculamos el precio rebajado.
  const precioOriginal = Number(producto.precio)
  const descuento = Number(producto.descuento) || 0
  const tienePromo = descuento > 0
  const precioFinal = tienePromo
    ? precioOriginal * (1 - descuento / 100)
    : precioOriginal

  const estaAgotado = producto.estado === 'agotado' || (producto.stock !== undefined && Number(producto.stock) <= 0)

  return (
    <div className="card-hover bg-white rounded-2xl border border-gray-100/80 overflow-hidden group relative">
      {/* Imagen del producto */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden">
        {/* Badge de Agotado o de Descuento */}
        {estaAgotado ? (
          <span className="absolute top-3 left-3 z-10 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            Agotado
          </span>
        ) : tienePromo ? (
          <span className="absolute top-3 left-3 z-10 bg-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            -{descuento}%
          </span>
        ) : null}

        {/* Botón de favorito (corazón) */}
        <button
          onClick={handleToggleFavorito}
          disabled={cargandoFav}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            esFavorito
              ? 'text-pink-500 bg-pink-50 shadow-sm'
              : 'text-gray-300 bg-white/80 backdrop-blur-sm hover:text-pink-500 hover:bg-pink-50 hover:shadow-sm'
          } ${cargandoFav ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          id={`fav-btn-${producto._id}`}
        >
          {esFavorito ? (
            <HeartFilled className="w-4 h-4" />
          ) : (
            <HeartOutline className="w-4 h-4" />
          )}
        </button>

        {producto.imagenPresentacion ? (
          <>
            {/* Skeleton (placeholder animado) mientras carga la imagen real */}
            {!imgLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
            )}
            <img
              src={producto.imagenPresentacion}
              alt={producto.nombre}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-contain p-5 group-hover:scale-110 transition-transform duration-500 ease-out ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          // Si el producto no tiene imagen, se muestra un ícono como placeholder
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-30">💍</span>
          </div>
        )}
      </div>

      {/* Información del producto: nombre, precio y botón de ver más */}
      <div className="p-4">
        <p className="text-sm text-gray-700 font-medium leading-snug mb-1.5 line-clamp-2 min-h-[2.5rem]">
          {producto.nombre}
        </p>

        {/* Precio: muestra precio tachado + rebajado si hay descuento, o el precio normal */}
        {tienePromo ? (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold text-pink-600 tracking-tight">
              ${precioFinal.toFixed(2)}
            </span>
            <span className="text-sm text-gray-400 line-through">
              ${precioOriginal.toFixed(2)}
            </span>
          </div>
        ) : (
          <p className="text-base font-bold text-gray-900 mb-3 tracking-tight">
            ${precioOriginal.toFixed(2)}
          </p>
        )}

        {/* Botón que lleva a la página de detalle del producto */}
        <Link
          to={`/producto/${producto._id}`}
          state={{ from: location.state?.from || (location.pathname + location.search) }}
          className="btn-pink-pulse block w-full text-center bg-gradient-to-r from-pink-100 to-pink-50 hover:from-pink-200 hover:to-pink-100 text-pink-600 text-sm font-semibold py-2.5 rounded-full transition-all duration-300 border border-pink-100 hover:border-pink-200"
          id={`ver-mas-${producto._id}`}
        >
          Ver más
        </Link>
      </div>
    </div>
  )
}

export default ProductCard;