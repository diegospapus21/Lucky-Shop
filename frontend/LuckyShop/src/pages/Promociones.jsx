// Promociones.jsx — página pública con los productos que tienen descuento activo
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import ProductCard from '../components/ProductCard.jsx'

const BASE_URL = import.meta.env.VITE_API_URL + ''

// Un producto está disponible si tiene stock y no está marcado como agotado.
// Ajusta esta función si tu modelo usa otro campo (ej: producto.estado === 'agotado')
const estaDisponible = (producto) =>
  producto.stock > 0 && producto.agotado !== true

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
              // Ocultamos promos sin producto o con producto agotado
              .filter((promo) => promo.idProducto && estaDisponible(promo.idProducto))
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

  // ...el return queda igual
}

export default Promociones;