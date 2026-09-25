// Home.jsx — página de inicio pública
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import ProductCard from '../components/ProductCard.jsx'
import portadaJoyas from '../assets/portadaJoyas.jpg'

const BASE_URL = import.meta.env.VITE_API_URL + ''

const HomeCliente = () => {
  const [destacados, setDestacados] = useState([])  // Productos mostrados en "Lo más destacado"
  const [loading,    setLoading]    = useState(true)
  const [inicioConfig, setInicioConfig] = useState(null) // Configuración dinámica del banner y bienvenida

  // Carga los primeros 4 productos activos y la configuración del inicio
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resProductos, resConfig] = await Promise.allSettled([
          fetch(`${BASE_URL}/productos?estado=activo`, { credentials: 'include' }),
          fetch(`${BASE_URL}/inicioConfig`, { credentials: 'include' }),
        ])

        if (resProductos.status === 'fulfilled' && resProductos.value.ok) {
          const data = await resProductos.value.json()
          setDestacados(Array.isArray(data) ? data.slice(0, 4) : [])
        }

        if (resConfig.status === 'fulfilled' && resConfig.value.ok) {
          const configData = await resConfig.value.json()
          setInicioConfig(configData)
        }
      } catch {
        // backend no disponible, mantiene defaults
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const bannerImg = inicioConfig?.banner?.imagenUrl || portadaJoyas
  const bannerColorBg = inicioConfig?.banner?.colorFondo || '#fbc2d4'
  const bannerColorText = inicioConfig?.banner?.colorTexto || '#4B1010'
  const bannerLinea1 = inicioConfig?.banner?.linea1 || 'Joyas que hablan de ti'
  const bannerLinea2 = inicioConfig?.banner?.linea2 || 'sin decir una palabra'

  const bienvenidaTitulo = inicioConfig?.bienvenida?.titulo || 'Bienvenido a tu lugar de confianza'
  const bienvenidaHtml = inicioConfig?.bienvenida?.contenidoHtml

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero: imagen de portada con frase principal encima */}
      <section className="relative overflow-hidden">
        <div
          className="relative flex items-center min-h-[280px] sm:min-h-[340px]"
          style={{
            backgroundImage:
              `linear-gradient(90deg, rgba(251,194,212,0.35) 0%, rgba(251,194,212,0.05) 45%, rgba(255,255,255,0) 70%), url(${bannerImg})`,
            backgroundColor: bannerColorBg,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="max-w-7xl mx-auto px-8 w-full">
            <h1
              className="text-3xl sm:text-5xl leading-snug"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 700, color: bannerColorText }}
            >
              <span className="block">{bannerLinea1}</span>
              <span className="block ml-16 sm:ml-32">{bannerLinea2}</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Texto de bienvenida y presentación de la marca */}
      <section className="max-w-7xl mx-auto px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {bienvenidaTitulo}
        </h2>
        {bienvenidaHtml ? (
          <div
            className="space-y-4 text-gray-600 text-sm sm:text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: bienvenidaHtml }}
          />
        ) : (
          <div className="space-y-4 text-gray-600 text-sm sm:text-base leading-relaxed">
            <p>
              A un espacio donde cada pieza cuenta una historia: la tuya.
            </p>
            <p>
              No son simples accesorios; diseñamos pequeños fragmentos de luz hechos
              para perdurar, celebrar tus logros y acompañarte en cada paso. Desde el
              minimalismo que te eleva en el día a día hasta la sofisticación de tus
              noches más especiales.
            </p>
            <p>
              Descubre una colección pensada para reflejar tu fuerza, tu elegancia y
              tu esencia única. Encuentra hoy esa pieza que se convertirá en parte de ti.
            </p>
          </div>
        )}
      </section>

      {/* Sección "Lo más destacado" con la grilla de productos */}
      <section className="max-w-7xl mx-auto px-8 pb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Lo más destacado
        </h2>
        {loading ? (
          // Estado de carga
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
          </div>
        ) : destacados.length === 0 ? (
          // Sin productos disponibles
          <div className="flex flex-col items-center py-16 text-gray-400">
            <p className="text-sm font-medium">No hay productos disponibles</p>
          </div>
        ) : (
          // Grilla de productos destacados (2 columnas en móvil, 4 en escritorio)
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {destacados.map((p) => (
              <ProductCard key={p._id} producto={p} />
            ))}
          </div>
        )}
      </section>

      {/* Bloques promocionales: enlaces a la guía de regalo y a promociones */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Bloque: Guía de regalo */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Guía de regalo</h3>
            <p className="text-gray-600 text-base leading-relaxed mb-4">
              Dilo con joyas. El regalo que no pasa de moda y se guarda para siempre.
              Encuentra el detalle ideal según su estilo.
            </p>
            <Link
              to="/guia-regalo"
              className="text-base text-pink-500 hover:text-pink-600 font-medium hover:underline transition-colors"
            >
              Ver guía →
            </Link>
          </div>

          {/* Bloque: Promociones */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Promociones</h3>
            <p className="text-gray-600 text-base leading-relaxed mb-4">
              Una joya es buena, dos son mejor. Explora nuestros descuentos especiales.
            </p>
            <Link
              to="/promociones"
              className="text-base text-pink-500 hover:text-pink-600 font-medium hover:underline transition-colors"
            >
              Ver promos →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default HomeCliente;