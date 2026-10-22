// Promociones.jsx — página pública con los productos que tienen descuento activo
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import ProductCard from '../components/ProductCard.jsx'

const BASE_URL = import.meta.env.VITE_API_URL + ''

const Promociones = () => {
  const [productos, setProductos] = useState([])  // Productos con descuento activo, ya con el % incluido
  const [loading, setLoading]     = useState(true)

  // Carga las promociones activas y arma cada producto con su porcentaje de descuento incluido,
  // para poder pasárselo directo a ProductCard
  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res  = await fetch(`${BASE_URL}/promociones/activas`, { credentials: 'include' })
        const data = await res.json()

        // Cada promo trae { idProducto: {...}, descuento, ... }.
        const conDescuento = Array.isArray(data)
          ? data
              .filter((promo) => promo.idProducto)
              .map((promo) => ({
                ...promo.idProducto,
                descuento: promo.descuento,
              }))
          : []

        // Mostramos solo los primeros 8
        setProductos(conDescuento.slice(0, 8))
      } catch {
        setProductos([])
      } finally {
        setLoading(false)
      }
    }
    fetchPromos()
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Flecha para regresar al inicio */}
      <div className="max-w-7xl mx-auto px-8 pt-6 w-full">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-gray-900 hover:text-pink-500 font-bold text-lg transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Promociones
        </Link>
      </div>

      <section className="max-w-7xl mx-auto px-8 py-8 w-full flex-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-8 text-center">
          Disfruta de nuestros descuentos en los diferentes accesorios
        </h1>

        {loading ? (
          // Estado de carga
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
          </div>
        ) : productos.length === 0 ? (
          // Sin promociones activas en este momento
          <div className="flex flex-col items-center py-16 text-gray-400">
            <p className="text-sm font-medium">No hay promociones activas en este momento</p>
          </div>
        ) : (
          // Grilla de productos en promoción (ProductCard ya sabe mostrar el precio tachado con el % de descuento)
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {productos.map((producto) => (
              <ProductCard key={producto._id} producto={producto} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}

export default Promociones;