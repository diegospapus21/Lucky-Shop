// BolsasSuerte.jsx — página de bolsas de la suerte
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import CategoryBanner from '../components/CategoryBanner.jsx'
import Footer from '../components/Footer.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// URL base de la API del backend
const BASE_URL = import.meta.env.VITE_API_URL + ''

const BolsasSuerte = () => {
  // Para redirigir al usuario (ej. a /login si no tiene sesión)
  const navigate = useNavigate()
  // Ruta actual, se guarda para volver aquí después de iniciar sesión
  const location = useLocation()
  // Función para agregar productos al carrito global
  const { addItem } = useCart()
  // Indica si el usuario tiene sesión activa
  const { isAuthenticated } = useAuth()

  const [bolsas, setBolsas] = useState([])    // Lista de bolsas de la suerte activas traídas del backend
  const [loading, setLoading] = useState(true)   // true mientras se están cargando las bolsas
  const [toast, setToast] = useState(false)  // Controla si se muestra el aviso de "agregado al carrito"

  // Al montar el componente, carga las bolsas de la suerte (categoría "bolsas") que estén activas
  useEffect(() => {
    const fetchBolsas = async () => {
      try {
        const res = await fetch(`${BASE_URL}/bolsas?estado=activo`, { credentials: 'include' })
        const data = await res.json()
        // Se asegura de guardar siempre un array, aunque la respuesta venga mal formada
        setBolsas(Array.isArray(data) ? data : [])
      } catch {
        // Si falla la petición, se deja la lista vacía en vez de romper la página
        setBolsas([])
      } finally {
        setLoading(false)
      }
    }
    fetchBolsas()
  }, []) // Solo se ejecuta una vez, al cargar la página

  // Agrega una bolsa al carrito. Si el usuario no tiene sesión, lo manda a login
  // guardando la página actual para regresarlo aquí después.
  const handleAgregar = (bolsa) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
    addItem(bolsa, 1)
    // Muestra el aviso de "agregado" y lo oculta automáticamente después de 2.5s
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Aviso flotante de "agregado al carrito", solo visible unos segundos */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-pink-500 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium">
          ✓ Agregado al carrito
        </div>
      )}

      {/* Banner superior con el título y descripción de la categoría */}
      <CategoryBanner
        titulo="Bolsas de la suerte"
        descripcion='Descubre el encanto de lo inesperado en cada bolsita de suerte...una selección exclusiva diseñada para sorprender y cautivar.'
      />

      {/* Contenedor principal con la grilla de productos */}
      <div className="container mx-auto px-6 py-8 flex-1">
        {loading ? (
          // Mientras se cargan las bolsas, se muestra un spinner centrado
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
          </div>
        ) : bolsas.length === 0 ? (
          // Si no hay bolsas activas, se muestra un mensaje de estado vacío
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3"></p>
            <p>No hay bolsas de la suerte disponibles</p>
          </div>
        ) : (
          // Grilla responsiva: 2 columnas en móvil, hasta 4 en escritorio
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {bolsas.map((bolsa) => (
              // Tarjeta individual de cada bolsa de la suerte
              <div key={bolsa._id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow overflow-hidden group">
                {/* Imagen del producto (o espacio vacío si no tiene imagen) */}
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  {/* Botón de favorito (solo visual por ahora, sin lógica conectada) */}
                  <button className="absolute top-3 right-3 z-10 text-gray-300 hover:text-pink-500 transition-colors text-xl">♡</button>
                  {bolsa.imagenPresentacion ? (
                    <img src={bolsa.imagenPresentacion} alt={bolsa.nombre} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl"></div>
                  )}
                </div>

                {/* Nombre, precio y botón de agregar al carrito */}
                <div className="p-3">
                  <p className="text-sm text-gray-800 font-medium leading-tight mb-1 line-clamp-2">{bolsa.nombre}</p>
                  <p className="text-sm font-bold text-gray-900 mb-3">${Number(bolsa.precio).toFixed(2)}</p>
                  {/* Al hacer clic, agrega la bolsa al carrito (o pide iniciar sesión primero) */}
                  <button
                    onClick={() => navigate(`/bolsa/${bolsa._id}`, { state: { from: '/bolsas-suerte' } })}
                    className="block w-full text-center bg-pink-100 hover:bg-pink-200 text-pink-600 text-sm font-medium py-2 rounded-full cursor-pointer"
                  >
                    Ver más
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default BolsasSuerte;