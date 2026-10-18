// Historial.jsx — historial de compras del cliente
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const BASE_URL = import.meta.env.VITE_API_URL + ''

const Historial = () => {
  const navigate = useNavigate()
  const { cliente } = useAuth()
  const [ventas, setVentas] = useState([])           // Ventas del cliente
  const [loading, setLoading] = useState(true)
  const [selectedVenta, setSelectedVenta] = useState(null) // Venta seleccionada para ver su detalle

  const clienteId = cliente?._id

  // Carga SOLO las compras del cliente que inició sesión.
  // El backend ya las filtra (/venta/mias), así no se descargan datos de otros clientes.
  useEffect(() => {
    if (!clienteId) return

    const fetchVentas = async () => {
      try {
        const res = await fetch(`${BASE_URL}/venta/mias`, { credentials: 'include' })
        const data = await res.json()
        setVentas(res.ok && Array.isArray(data) ? data : [])
      } catch {
        setVentas([])
      } finally {
        setLoading(false)
      }
    }
    fetchVentas()
  }, [clienteId])

  // Da formato legible a una fecha (ej: "15 de julio de 2026")
  const formatFecha = (fecha) => {
    if (!fecha) return '—'
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Obtener la primera imagen de producto de una venta para mostrar en el resumen de la tabla
  const getVentaRepresentativaImage = (venta) => {
    const primerProducto = venta.IdCarrito?.productos?.[0]?.idProducto
    return primerProducto?.imagenPresentacion || ''
  }

  // Obtener nombre del primer producto (o un resumen del pedido si son varios)
  const getVentaResumenNombre = (venta) => {
    const productos = venta.IdCarrito?.productos || []
    if (productos.length === 0) return `Pedido #${venta._id?.slice(-6)}`
    const primerNombre = productos[0]?.idProducto?.nombre || 'Producto'
    if (productos.length > 1) {
      return `${primerNombre} y ${productos.length - 1} más`
    }
    return primerNombre
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Encabezado Principal: cambia el subtítulo según si hay un pedido seleccionado */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              type="button"
              onClick={() => {
                if (selectedVenta) {
                  setSelectedVenta(null)
                } else if (window.history.length > 1) {
                  navigate(-1)
                } else {
                  navigate('/home')
                }
              }}
              className="inline-flex items-center gap-2 text-3xl font-extrabold tracking-tight text-gray-900 hover:text-pink-600 transition-colors cursor-pointer text-left"
              id="btn-volver-historial"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>Historial de compras</span>
            </button>
            <p className="text-sm text-gray-500 mt-1">
              {selectedVenta
                ? `Detalles del pedido #${selectedVenta._id?.slice(-6)}`
                : 'Revisa el detalle de tus compras y pedidos realizados'}
            </p>
          </div>
          {/* Botón para volver al listado general, solo visible al ver el detalle de un pedido */}
          {selectedVenta && (
            <button
              onClick={() => setSelectedVenta(null)}
              className="flex items-center gap-2 text-sm font-semibold text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100/80 px-4 py-2 rounded-full transition-all"
            >
              <span>←</span> Volver al historial
            </button>
          )}
        </div>

        {loading ? (
          // Estado de carga
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            <p className="text-sm font-medium">Cargando tu historial...</p>
          </div>
        ) : ventas.length === 0 ? (
          // Sin compras registradas
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
        
            <p className="text-base font-semibold text-gray-700">
              No tienes compras registradas
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ¡Visita nuestra tienda para encontrar tu accesorio de la suerte!
            </p>
          </div>
        ) : !selectedVenta ? (
          /* ======================================================== */
          /* VISTA 1: LISTADO GENERAL DE COMPRAS                     */
          /* ======================================================== */
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-pink-100/60 border-b border-pink-100 text-gray-700 font-bold text-sm">
                    <th className="px-6 py-4 text-center">Producto</th>
                    <th className="px-6 py-4 text-center">Fecha</th>
                    <th className="px-6 py-4 text-center">Precio</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Una fila por cada venta del cliente */}
                  {ventas.map((venta) => {
                    const imgUrl = getVentaRepresentativaImage(venta)
                    const nombre = getVentaResumenNombre(venta)
                    return (
                      <tr
                        key={venta._id}
                        className="hover:bg-gray-50/30 transition-colors"
                      >
                        {/* Producto (Imagen + Nombre + Estado) */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-pink-50 border border-pink-100/70 p-2 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={nombre}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-2xl">💍</span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                                {nombre}
                              </p>
                              <span className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-50 text-pink-600">
                                {venta.estado || 'pendiente'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Fecha de la venta */}
                        <td className="px-6 py-5 text-center text-sm font-medium text-gray-600">
                          {formatFecha(venta.fecha || venta.createdAt)}
                        </td>

                        {/* Precio total del pedido (viene del carrito asociado a la venta) */}
                        <td className="px-6 py-5 text-center text-base font-bold text-gray-900">
                          ${Number(venta.IdCarrito?.total || 0).toFixed(2)}
                        </td>

                        {/* Botón para ver el detalle de esa venta */}
                        <td className="px-6 py-5 text-center">
                          <button
                            onClick={() => setSelectedVenta(venta)}
                            className="bg-[#1e293b] hover:bg-[#0f172a] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow active:scale-95"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* VISTA 2: DESGLOSE DE PRODUCTOS DEL PEDIDO                */
          /* ======================================================== */
          <div className="space-y-6">
            {/* Detalles rápidos de envío, teléfono, método de pago y estado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-pink-50/40 border border-pink-100/60 rounded-2xl p-5 text-sm">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Dirección de Envío
                </p>
                <p className="text-gray-800 font-medium mt-1">
                  {selectedVenta.direcion || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Teléfono
                </p>
                <p className="text-gray-800 font-medium mt-1">
                  {selectedVenta.phone || selectedVenta.telefono || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Método de Pago
                </p>
                <p className="text-gray-800 font-medium mt-1 capitalize">
                  {selectedVenta.metodoPago || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Pago / Estado
                </p>
                <p className="text-gray-800 font-semibold mt-1">
                  {selectedVenta.statusPago ? 'Pagado' : 'Pendiente'} /{' '}
                  <span className="capitalize text-pink-600">
                    {selectedVenta.estado || '—'}
                  </span>
                </p>
              </div>
            </div>

            {/* Tabla con cada producto comprado en este pedido */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-pink-100/60 border-b border-pink-100 text-gray-700 font-bold text-sm">
                      <th className="px-6 py-4 text-center">Productos</th>
                      <th className="px-6 py-4">Descripción</th>
                      <th className="px-6 py-4 text-center">Precio</th>
                      <th className="px-6 py-4 text-center">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selectedVenta.IdCarrito?.productos || []).map((item) => {
                      const prod = item.idProducto || {}
                      return (
                        <tr
                          key={item._id}
                          className="hover:bg-gray-50/20 transition-colors"
                        >
                          {/* Imagen del producto */}
                          <td className="px-6 py-5">
                            <div className="flex justify-center">
                              <div className="w-16 h-16 rounded-xl bg-pink-50 border border-pink-100/70 p-2 flex items-center justify-center overflow-hidden">
                                {prod.imagenPresentacion ? (
                                  <img
                                    src={prod.imagenPresentacion}
                                    alt={prod.nombre}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <span className="text-2xl">💍</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Nombre y descripción del producto */}
                          <td className="px-6 py-5">
                            <p className="text-sm font-semibold text-gray-800">
                              {prod.nombre || 'Producto no disponible'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2 max-w-sm">
                              {prod.descripcion || 'Sin descripción adicional.'}
                            </p>
                          </td>

                          {/* Precio unitario (o calculado a partir del subtotal si no viene directo) */}
                          <td className="px-6 py-5 text-center text-sm font-bold text-gray-900">
                            ${Number(prod.precio || item.subtotal / item.cantidad || 0).toFixed(2)}
                          </td>

                          {/* Cantidad comprada de ese producto */}
                          <td className="px-6 py-5 text-center text-sm font-semibold text-gray-700">
                            {item.cantidad || 0}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total final del pedido (viene del carrito asociado a la venta) */}
              <div className="bg-gray-50/50 px-6 py-5 flex justify-end items-center gap-4 border-t border-gray-100">
                <span className="text-sm text-gray-500 font-semibold">Total del pedido:</span>
                <span className="text-xl font-extrabold text-gray-900">
                  ${Number(selectedVenta.IdCarrito?.total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default Historial;