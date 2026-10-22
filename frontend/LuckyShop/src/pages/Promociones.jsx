// Promociones.jsx — página PÚBLICA: muestra los productos que traen promoción vigente.
// (La gestión de promociones —crear, editar, eliminar— vive en el panel privado.)

import { useState, useEffect, useMemo } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import BotonVolver from '../components/BotonVolver.jsx'
import ProductCard from '../components/ProductCard.jsx'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const dinero = (n) => `$${Number(n || 0).toFixed(2)}`

const Promociones = () => {
  const [promociones, setPromociones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Carga las promociones vigentes desde el backend (misma ruta pública que usa la app móvil)
  const cargarPromociones = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BASE_URL}/promociones/activas`)
      if (!res.ok) throw new Error('No se pudieron cargar las promociones')
      const data = await res.json()
      setPromociones(Array.isArray(data) ? data : [])
    } catch {
      setError('No se pudieron cargar las promociones. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPromociones()
  }, [])

  // El backend ya devuelve solo las vigentes; aquí se descartan las que perdieron su producto
  // y se ordena con la de mayor descuento primero
  const lista = useMemo(
    () =>
      promociones
        .filter((p) => p.idProducto)
        .sort((a, b) => Number(b.descuento) - Number(a.descuento)),
    [promociones]
  )

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="max-w-7xl w-full mx-auto px-6 flex-1">
        {/* Flecha para regresar al inicio + título pequeño, juntos en una línea (sin subrayado) */}
        <div className="flex items-center gap-3 pt-6">
          <BotonVolver />
          <h1 className="text-2xl font-extrabold text-black m-0">Promociones</h1>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Una joya es buena, dos son mejor. Explora nuestros descuentos especiales.
        </p>

        <div className="py-8">
          {loading ? (
            // Estado de carga
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
              <p className="text-sm font-medium">Cargando promociones...</p>
            </div>
          ) : error ? (
            // Estado de error con botón para reintentar
            <div className="rounded-2xl bg-red-50 border border-red-200 px-6 py-8 text-center text-red-700 text-sm">
              <p className="font-semibold mb-3">{error}</p>
              <button
                type="button"
                onClick={cargarPromociones}
                className="rounded-full bg-pink-100 px-6 py-2 font-semibold text-pink-600 hover:bg-pink-200 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : lista.length === 0 ? (
            // Sin promociones vigentes
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-sm font-medium">No hay promociones vigentes por ahora.</p>
            </div>
          ) : (
            // Mismas tarjetas de producto que el resto del sitio, con el precio ya rebajado
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 sm:gap-6">
              {lista.map((promo) => {
                const original = Number(promo.idProducto.precio || 0)
                const final = Math.round(original * (1 - Number(promo.descuento) / 100) * 100) / 100

                return (
                  <div key={promo._id} className="relative">
                    {/* Etiqueta con el % de descuento, arriba a la izquierda de la imagen */}
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-pink-500 px-3 py-1 text-xs font-extrabold text-white">
                      -{promo.descuento}%
                    </span>

                    <ProductCard producto={{ ...promo.idProducto, precio: final }} />

                    {/* Precio original tachado */}
                    <p className="mt-2 text-center text-xs text-gray-500">
                      Antes <span className="line-through">{dinero(original)}</span>
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Promociones;