//Carrito.jsx - Pagina de carrito donde estaran los productos que ordenara el cliente
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Eliminar from '../assets/icons8-basura-50.png'
import { MENSAJE_ENTREGA } from '../utils/envio.js'

const BASE_URL = import.meta.env.VITE_API_URL + ''

const Carrito = () => {
  const navigate = useNavigate()
  // Productos en el carrito y funciones para modificarlo (viene del contexto global)
  const { items, removeItem, updateCantidad, total, clearCart } = useCart()
  const { cliente } = useAuth()

  const [loading, setLoading]  = useState(false)
  const [error,   setError]    = useState('')
  const [success, setSuccess]  = useState(false) // true cuando el pago se completó (pantalla de éxito)

  // Costo de envío fijo, solo se cobra si hay productos en el carrito
  const COSTO_ENVIO = items.length > 0 ? 4.00 : 0
  const totalFinal  = total + COSTO_ENVIO

  // El flujo de compra se ha trasladado a la página dedicada de Pago (/pago)

  // Pantalla de confirmación tras un pago exitoso
  if (success) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-6 py-20 text-center">
        <div className="text-6xl mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pago exitoso!</h2>
        <p className="text-gray-500 mb-6">Tu pedido ha sido registrado correctamente.</p>
        <div className="flex gap-4 justify-center">
          <Link to="/home" className="bg-pink-500 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-pink-600 transition-colors">
            Volver al inicio
          </Link>
          <Link to="/historial" className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full font-semibold hover:bg-gray-50 transition-colors">
            Ver mis pedidos
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="container mx-auto px-6 py-8 flex-1">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate('/home')
              }
            }}
            className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-pink-600 transition-colors cursor-pointer"
            id="btn-volver-carrito"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span>Carrito de compras</span>
          </button>
        </div>

        {items.length === 0 ? (
          // Carrito vacío: invita a explorar productos
          <div className="text-center py-20">
           
            <p className="text-gray-400 mb-6">Tu carrito está vacío</p>
            <Link to="/home" className="bg-pink-500 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-pink-600 transition-colors">
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Lista de productos en el carrito */}
            <div className="flex-1">
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                {/* Encabezado de la tabla de productos */}
                <div className="grid grid-cols-4 bg-pink-100 px-5 py-3 text-sm font-semibold text-gray-700">
                  <span className="col-span-2">Productos</span>
                  <span className="text-center">Cantidad</span>
                  <span className="text-center">Acción</span>
                </div>

                {/* Una fila por cada producto en el carrito */}
                {items.map((item) => (
                  <div key={item._id} className="grid grid-cols-4 items-center px-5 py-4 border-b border-gray-50 last:border-0">
                    {/* Imagen, nombre y precio del producto */}
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                        {item.imagenPresentacion ? (
                          <img src={item.imagenPresentacion} alt={item.nombre} className="w-full h-full object-contain p-2" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">💍</div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-tight mb-1">{item.nombre}</p>
                        <p className="text-sm font-bold text-gray-900">${Number(item.precio).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Control de cantidad: restar, mostrar cantidad, sumar */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCantidad(item._id, item.imagenPresentacion, item.cantidad - 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-pink-400 hover:text-pink-500 transition-colors font-bold cursor-pointer"
                        title="Disminuir cantidad"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.cantidad}</span>
                      {/* El botón de sumar se deshabilita si ya se alcanzó el stock disponible */}
                      <button
                        onClick={() => updateCantidad(item._id, item.imagenPresentacion, item.cantidad + 1)}
                        disabled={item.cantidad >= item.stock}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold transition-colors ${
                          item.cantidad >= item.stock 
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' 
                          : 'border-gray-300 text-gray-600 hover:border-pink-400 hover:text-pink-500'
                        }`}
                        title={item.cantidad >= item.stock ? "Stock máximo alcanzado" : "Aumentar cantidad"}
                      >
                        +
                      </button>
                    </div>

                    {/* Botón para quitar el producto del carrito */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => removeItem(item._id, item.imagenPresentacion)}
                        className="text-gray-400 hover:text-red-500 transition-colors text-xl"
                        title="Eliminar"
                      >
                        <img src={Eliminar} alt="" className='w-7'/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen del pedido: subtotal, envío, total y botón de pago */}
            <div className="lg:w-72">
              <div className="rounded-2xl border border-gray-100 p-5 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4">Resumen de pedido</h3>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Costo de envío</span>
                    <span className="font-medium text-gray-900">${COSTO_ENVIO.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 mb-4">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span>${totalFinal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">El impuesto y costo de envío se calcula en el pago</p>
                </div>

                {/* Tiempo estipulado de entrega */}
                <div className="flex items-start gap-2 rounded-xl bg-pink-50 px-3 py-2.5 mb-4 text-xs text-gray-600">
                  <svg className="w-4 h-4 text-pink-500 shrink-0 mt-px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  <span>{MENSAJE_ENTREGA}</span>
                </div>

                {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

                {/* Lleva a la página de pago dedicada, donde se completa la compra */}
                <Link
                  to="/pago"
                  className="block w-full text-center bg-[#1e293b] hover:bg-[#0f172a] text-white py-3 rounded-2xl font-semibold text-sm transition-all hover:shadow-lg active:scale-98"
                >
                  Proceder al pago
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default Carrito;