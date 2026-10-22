// Categoria.jsx — listado de productos por categoría con subcategorías
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import ProductCard from '../components/ProductCard.jsx'
import CategoryBanner from '../components/CategoryBanner.jsx'
import { useCategoria } from '../hooks/useCategoria.jsx'

/* ── Iconos de línea delgada en negro (mismo estilo que la app móvil) ── */
const IconoBase = ({ children }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-7 h-7 text-black"
    aria-hidden="true"
  >
    {children}
  </svg>
)

// Charm: dije colgante con su anillo
const IconoCharm = () => (
  <IconoBase>
    <circle cx="12" cy="4.5" r="1.8" />
    <path d="M12 6.3V10" />
    <path d="M12 21c-4.5-3.2-7.5-5.9-7.5-9.1A3.9 3.9 0 0 1 12 10a3.9 3.9 0 0 1 7.5 1.9c0 3.2-3 5.9-7.5 9.1z" />
  </IconoBase>
)

// Set: gema
const IconoSet = () => (
  <IconoBase>
    <path d="M6 3h12l4 6-10 12L2 9z" />
    <path d="M2 9h20" />
    <path d="M9.5 3 8 9l4 12 4-12-1.5-6" />
  </IconoBase>
)

// Bolsas: bolsa de compras
const IconoBolsa = () => (
  <IconoBase>
    <path d="M6 8h12l1 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L6 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </IconoBase>
)

// Configuración de cada categoría: título, descripción y subcategorías (si tiene).
// La clave de cada entrada corresponde al valor de la URL (/categoria/:cat)
const CONFIG_CATEGORIAS = {
  anillos: {
    titulo: 'Anillos',
    descripcion: 'Encuentra tu anillo que "nunca me quito" en nuestra selección de anillos, anillos de compromiso, anillos formativos y más. Tu próxima colección de anillos favoritos comienza aquí.',
  },
  pulseras: {
    titulo: 'Pulseras',
    descripcion: 'No es solo una joya, es un recordatorio tangible de que la suerte no ocurre por azar, sino porque llevas contigo la energía necesaria para atraerla; deja que esta pulsera sea el amuleto que sintonice tu destino con tus deseos.',
    apiCategoria: 'Pulseras,Charms',
    subcategorias: [
      { value: 'Charms', label: 'Charms', icon: <IconoCharm /> },
    ],
  },
  aritos: {
    titulo: 'Aretes',
    descripcion: 'La distinción no es una coincidencia, es una elección. Estos pendientes han sido grabados con la firme convicción de que la elegancia es el imán definitivo de la fortuna.',
    apiCategoria: 'Aretes', // En la BD se guardan como "Aretes"
  },
  collares: {
    titulo: 'Collares',
    descripcion: 'El destino se rinde ante quienes caminan con seguridad; deja que este collar sea el destello que ilumine tu camino y atraiga hacia ti las sincronías perfectas que el universo tiene preparadas para quienes se atreven a brillar.',
    subcategorias: [
      { value: 'Set', label: 'Set', icon: <IconoSet /> },
    ],
  },
  otros: {
    titulo: 'Otros',
    descripcion: 'Accesorios únicos y especiales para completar tu look.',
    subcategorias: [
      { value: 'Bolsas', label: 'Bolsas', icon: <IconoBolsa /> },
    ],
  },
}

const Categoria = () => {
  // Categoría actual, tomada del parámetro de la URL (ej: /categoria/anillos -> "anillos")
  const { cat } = useParams()
  // Si la categoría no está en la config, se usa un fallback genérico
  const config = CONFIG_CATEGORIAS[cat] || { titulo: cat, descripcion: '', subcategorias: [] }

  // Usar el nombre de categoría de la API si existe un mapeo, sino usar el param de la URL
  const categoriaApi = config.apiCategoria || cat
  const { productos, loading, error } = useCategoria(categoriaApi)

  // Subcategoría seleccionada por el usuario (ej: "Charms", "Set"); vacío = sin filtro
  const [subcatActiva, setSubcatActiva] = useState('')

  // Reiniciar filtro de subcategoría al cambiar de categoría
  useEffect(() => {
    setSubcatActiva('')
  }, [cat])

  // Si hay una subcategoría activa, filtra los productos que coincidan con ella
  const productosFiltrados = subcatActiva
    ? productos.filter((p) => {
        const sub = subcatActiva.toLowerCase().trim()
        const pSub = (p.subCategoria || '').toLowerCase().trim()
        const pCat = (p.idCategoria || '').toLowerCase().trim()
        const pNom = (p.nombre || '').toLowerCase()

        if (sub === 'charms' || sub === 'charm') {
          return (
            pCat === 'charms' ||
            pCat === 'charm' ||
            pSub === 'charms' ||
            pSub === 'charm' ||
            pNom.includes('charm')
          )
        }
        if (sub === 'set') {
          return pCat === 'set' || pSub === 'set' || pNom.includes('set')
        }
        if (sub === 'bolsas' || sub === 'bolsa') {
          return pCat === 'bolsas' || pCat === 'bolsa' || pSub === 'bolsas' || pSub === 'bolsa' || pNom.includes('bolsa')
        }
        return pSub === sub || pCat === sub || pNom.includes(sub)
      })
    : productos

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Banner con el título, descripción y filtros de subcategoría de la categoría actual */}
      <CategoryBanner
        titulo={config.titulo}
        descripcion={config.descripcion}
        subcategorias={config.subcategorias}
        subcatActiva={subcatActiva}
        onSubcat={setSubcatActiva}
      />

      {/* Grilla de productos de la categoría (ya filtrados por subcategoría si aplica) */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          // Estado de carga
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            <p className="text-sm font-medium">Cargando productos...</p>
          </div>
        ) : error ? (
          // Estado de error al cargar productos
          <div className="rounded-2xl bg-red-50 border border-red-200 px-6 py-8 text-center text-red-700 text-sm">
            <p className="font-semibold mb-2">Hubo un problema al cargar los productos</p>
            <p className="text-xs">{error}</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          // Sin productos que coincidan con la categoría/subcategoría seleccionada
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4 opacity-40"></span>
          
            <p className="text-sm font-medium">No hay productos en esta categoría</p>
          </div>
        ) : (
          // Grilla responsiva de tarjetas de producto
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 sm:gap-6">
            {productosFiltrados.map((p) => (
              <ProductCard key={p._id} producto={p} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default Categoria;