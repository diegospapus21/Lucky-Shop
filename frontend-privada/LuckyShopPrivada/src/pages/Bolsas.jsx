import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/SideBar'
import Nav from '../components/Nav'
import NotificacionesModal from '../components/NotificationsModal'
import { useBolsas } from '../hooks/useBolsas'

import '../SideBar.css'
import '../productosPage.css'

// ============================================================
// CONFIGURACIÓN
// ============================================================

const RAW_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://lucky-shop-3.onrender.com/api'
    : 'http://localhost:4000/api');
const BASE_URL = RAW_URL.replace(/\/+$/, '');

const ESTADOS = ['activo', 'inactivo', 'agotado']

// ============================================================
// HELPERS DE PRODUCTO
// ============================================================

const obtenerNombreProducto = (producto) => {
  return (
    producto?.nombre ||
    producto?.name ||
    producto?.productName ||
    producto?.nombreProducto ||
    'Producto sin nombre'
  )
}

const obtenerPrecioProducto = (producto) => {
  const precio =
    producto?.precio ??
    producto?.price ??
    producto?.productPrice ??
    0

  return Number(precio || 0).toFixed(2)
}

const esTextoValido = (valor) =>
  typeof valor === 'string' && valor.trim() !== ''

// Imagen del producto según el esquema:
// 1. imagenPresentacion (imagen principal)
// 2. imagenes[0] (primera del arreglo)
const obtenerImagenProducto = (producto) => {
  if (!producto) return null

  if (esTextoValido(producto.imagenPresentacion)) {
    return producto.imagenPresentacion
  }

  if (Array.isArray(producto.imagenes)) {
    const primera = producto.imagenes.find(esTextoValido)
    if (primera) return primera
  }

  return null
}

// ============================================================
// ICONOS
// ============================================================

const IconoLapiz = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const IconoBasura = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
)

const IconoBolsaVacia = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8h12l1 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L6 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
)

// ============================================================
// MODAL CONFIRMACIÓN
// ============================================================

const ConfirmModal = ({ mensaje, onConfirm, onCancel }) => {
  return (
    <div className="pm-overlay" onClick={onCancel}>
      <div
        className="pm-modal pm-confirm-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="pm-confirm-icon">
          <span>!</span>
        </div>

        <h2 className="pm-confirm-title">Confirmación</h2>

        <p className="pm-confirm-msg">{mensaje}</p>

        <div className="pm-confirm-btns">
          <button className="pm-btn pm-btn-confirm" onClick={onConfirm}>
            Sí, estoy segura
          </button>

          <button className="pm-btn pm-btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MODAL ÉXITO
// ============================================================

const SuccessModal = ({ mensaje, onClose }) => {
  return (
    <div className="pm-overlay" onClick={onClose}>
      <div
        className="pm-modal pm-success-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="pm-success-icon">
          <svg viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="25" stroke="#22c55e" strokeWidth="2" />
            <path
              d="M14 26l9 9 15-18"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="pm-success-title">¡Completado!</h2>

        <p className="pm-success-msg">{mensaje}</p>

        <button className="pm-btn pm-btn-success-close" onClick={onClose}>
          Aceptar
        </button>
      </div>
    </div>
  )
}

// ============================================================
// MODAL DETALLES
// ============================================================

const DetallesModal = ({ bolsa, onClose }) => {
  if (!bolsa) return null

  const cantidad = bolsa.cantidadUnidades || 0

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div
        className="pm-modal pm-form-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="pm-form-header">
          <span className="pm-detalles-bar"></span>
          <h2>Detalles de bolsa</h2>
        </div>

        <div className="pm-form-body">
          <div className="pm-detalle-col-izq">
            <div className="pm-form-img-box pm-form-img-box-static">
              {bolsa.imagenPresentacion ? (
                <img src={bolsa.imagenPresentacion} alt={bolsa.nombre} />
              ) : (
                <span className="pm-no-img">Sin imagen</span>
              )}
            </div>

            <div className="pm-field-group">
              <label>Descripción</label>
              <p className="pm-info-val">{bolsa.descripcion || '—'}</p>
            </div>
          </div>

          <div className="pm-form-fields">
            <div className="pm-field-group">
              <label>Nombre de bolsa</label>
              <p className="pm-info-val">{bolsa.nombre || 'Sin nombre'}</p>
            </div>

            <div className="pm-field-group">
              <label>Categoría</label>
              <p className="pm-info-val">Bolsa de la Suerte</p>
            </div>

            <div className="pm-field-group">
              <label>Cantidad</label>
              <p className="pm-info-val">{cantidad} productos</p>
            </div>
          </div>
        </div>

        <div className="pm-form-actions">
          <button className="pm-btn pm-btn-dark" onClick={onClose}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// FORMULARIO
// ============================================================

const FormModal = ({
  modo,
  bolsa,
  productos,
  onClose,
  onConfirmRequest
}) => {
  const cantidadInicial = bolsa?.cantidadUnidades || 6

  const productosIniciales = Array.isArray(bolsa?.productos)
    ? bolsa.productos
    : []

  const stockInicial = bolsa?.stock !== undefined ? bolsa.stock : 1
  const estadoInicial = bolsa?.estado || (Number(stockInicial) <= 0 ? 'agotado' : 'activo')

  const [form, setForm] = useState({
    nombre: bolsa?.nombre || '',
    precio: bolsa?.precio || '',
    stock: stockInicial,
    descripcion: bolsa?.descripcion || '',
    categoria: 'Bolsa de la Suerte',
    cantidadUnidades: cantidadInicial,
    estado: estadoInicial,
    productosSeleccionados: productosIniciales
  })

  const [imagenPreview, setImagenPreview] = useState(
    bolsa?.imagenPresentacion || null
  )

  const [imageFile, setImageFile] = useState(null)

  const fileRef = useRef(null)

  // ----- BUSCADOR DE PRODUCTOS -----
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const buscadorRef = useRef(null)

  // Quita tildes y pasa a minúsculas para buscar mejor
  const normalizar = texto =>
    String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

  // Cierra las sugerencias al hacer clic fuera del buscador
  useEffect(() => {
    const handleClickFuera = e => {
      if (
        buscadorRef.current &&
        !buscadorRef.current.contains(e.target)
      ) {
        setMostrarSugerencias(false)
      }
    }

    document.addEventListener('mousedown', handleClickFuera)

    return () =>
      document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  // Al editar, los productos pueden venir como objeto o solo como id
  const resolverProducto = item => {
    if (item && typeof item === 'object') return item

    return (
      productos.find(p => String(p._id) === String(item)) ||
      { _id: item }
    )
  }

  // ==========================================================
  // CAMBIAR INPUT
  // ==========================================================

  const handleChange = e => {
    const { name, value } = e.target

    setForm(prev => {
      const next = {
        ...prev,
        [name]: value
      }
      if (name === 'stock') {
        const numVal = Number(value)
        if (value !== '' && !isNaN(numVal) && numVal <= 0) {
          if (prev.estado === 'activo') {
            next.estado = 'agotado'
          }
        } else if (numVal > 0 && prev.estado === 'agotado') {
          next.estado = 'activo'
        }
      }
      return next
    })
  }

  // ==========================================================
  // CAMBIAR CANTIDAD DE PRODUCTOS
  // ==========================================================

  const handleCantidadUnidades = e => {
    const value = e.target.value
    setForm(prev => ({
      ...prev,
      cantidadUnidades: value
    }))
  }

  // ==========================================================
  // SELECCIONAR / QUITAR PRODUCTO
  // ==========================================================

  const handleProductoSeleccionado = producto => {
    const idProducto = String(producto._id)
    const actuales = form.productosSeleccionados
    const existe = actuales.some(
      item => String(item?._id || item) === idProducto
    )

    // Quitar
    if (existe) {
      setForm(prev => ({
        ...prev,
        productosSeleccionados: prev.productosSeleccionados.filter(
          item => String(item?._id || item) !== idProducto
        )
      }))
      return
    }

    // Agregar solo si no at limit
    const limite = Number(form.cantidadUnidades) || 0;
    if (limite > 0 && actuales.length >= limite) {
      return; // Ya tiene la cantidad máxima
    }

    setForm(prev => ({
      ...prev,
      productosSeleccionados: [...prev.productosSeleccionados, producto]
    }))
  }

  // ==========================================================
  // VERIFICAR SELECCIONADO
  // ==========================================================

  const productoSeleccionado = id => {
    return form.productosSeleccionados.some(
      producto => String(producto?._id || producto) === String(id)
    )
  }

  // ==========================================================
  // SUGERENCIAS DEL BUSCADOR
  // ==========================================================

  const sugerencias = busquedaProducto.trim()
    ? productos
        .filter(
          p =>
            !productoSeleccionado(p._id) &&
            normalizar(obtenerNombreProducto(p)).includes(
              normalizar(busquedaProducto)
            )
        )
        .slice(0, 8)
    : []

  const agregarDesdeBuscador = producto => {
    handleProductoSeleccionado(producto)
    setBusquedaProducto('')
    setMostrarSugerencias(false)
  }

  const handleBuscadorKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (sugerencias[0]) agregarDesdeBuscador(sugerencias[0])
    }

    if (e.key === 'Escape') {
      setMostrarSugerencias(false)
    }
  }

  // ==========================================================
  // CAMBIAR IMAGEN
  // ==========================================================

  const handleImageChange = e => {
    const file = e.target.files?.[0]

    if (!file) return

    setImageFile(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  // ==========================================================
  // GUARDAR
  // ==========================================================

  const handleSubmit = () => {
    if (!form.nombre.trim()) {
      alert('Debes ingresar el nombre de la bolsa.')
      return
    }

    if (!form.precio) {
      alert('Debes ingresar el precio.')
      return
    }

    const cantidad = Number(form.cantidadUnidades) || 0
    const seleccionados = form.productosSeleccionados.length

    if (cantidad < 1) {
      alert('Debes ingresar una cantidad unitaria de al menos 1.')
      return
    }

    if (seleccionados !== cantidad) {
      alert(`Debes seleccionar exactamente ${cantidad} producto(s). Actualmente tienes ${seleccionados}.`)
      return
    }

    const formFinal = {
      ...form,
      categoria: 'Bolsa de la Suerte',
      cantidadUnidades: cantidad,
      productos: form.productosSeleccionados
    }
    if (Number(formFinal.stock) <= 0 && formFinal.estado === 'activo') {
      formFinal.estado = 'agotado'
    }

    onConfirmRequest({
      form: formFinal,
      imageFile,
      bolsaId: bolsa?._id
    })
  }

  // ==========================================================
  // RENDER FORMULARIO
  // ==========================================================

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div
        className="pm-modal pm-form-modal pm-form-modal-combo"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}

        <div className="pm-form-header">
          <span className="pm-detalles-bar"></span>

          <h2>{modo === 'agregar' ? 'Nueva bolsa' : 'Editar bolsa'}</h2>
        </div>

        {/* CUERPO */}

        <div className="pm-form-body pm-form-body-combo">
          {/* IMAGEN DE BOLSA */}

          <div className="pm-form-img-col">
            <div
              className="pm-form-img-box"
              onClick={() => fileRef.current?.click()}
            >
              {imagenPreview ? (
                <img src={imagenPreview} alt="Vista previa" />
              ) : (
                <span className="pm-img-plus">＋</span>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />

            <p className="pm-form-img-label">Agregar foto</p>
          </div>

          {/* CAMPOS */}

          <div className="pm-form-fields pm-form-fields-combo">
            {/* NOMBRE */}

            <div className="pm-field-group">
              <label>Nombre de bolsa</label>

              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Nombre..."
                className="pm-input"
              />
            </div>

            {/* CATEGORÍA Y ESTADO */}

            <div className="pm-field-row">
              <div className="pm-field-group">
                <label>Categoría</label>

                <input
                  type="text"
                  value="Bolsa de la Suerte"
                  readOnly
                  disabled
                  className="pm-input"
                />
              </div>

              <div className="pm-field-group">
                <label>Estado</label>

                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="pm-input"
                >
                  {ESTADOS.map(estado => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* CANTIDAD UNITARIA */}

            <div className="pm-field-group">
              <label>Cantidad unitaria</label>

              <input
                type="number"
                name="cantidadUnidades"
                min="1"
                value={form.cantidadUnidades}
                onChange={e => {
                  const val = e.target.value;
                  const num = Number(val);
                  setForm(prev => {
                    let nuevosProductos = prev.productosSeleccionados;
                    // Si se reduce la cantidad, recortar los productos seleccionados
                    if (num > 0 && nuevosProductos.length > num) {
                      nuevosProductos = nuevosProductos.slice(0, num);
                    }
                    return {
                      ...prev,
                      cantidadUnidades: val,
                      productosSeleccionados: nuevosProductos
                    };
                  });
                }}
                className="pm-input"
                placeholder="Ej. 5"
              />
            </div>

            {/* CONTADOR */}

            <div className="pm-product-counter" style={{
              background: (() => {
                const limite = Number(form.cantidadUnidades) || 0;
                const actual = form.productosSeleccionados.length;
                if (limite < 1) return '#f2f3f4';
                if (actual === limite) return '#dcfce7';
                return '#fef3c7';
              })()
            }}>
              <span>Productos seleccionados:</span>

              <strong style={{ color: (() => {
                const limite = Number(form.cantidadUnidades) || 0;
                const actual = form.productosSeleccionados.length;
                if (limite < 1) return '#111';
                if (actual === limite) return '#16a34a';
                return '#d97706';
              })() }}>
                {form.productosSeleccionados.length} / {Number(form.cantidadUnidades) || '?'}
              </strong>
            </div>

            {/* PRODUCTOS (BUSCADOR) */}

            <div className="pm-field-group">
              <label>Agregar productos</label>

              <div className="pm-buscador" ref={buscadorRef}>
                <input
                  type="text"
                  className="pm-input"
                  placeholder={(() => {
                    const limite = Number(form.cantidadUnidades) || 0;
                    const actual = form.productosSeleccionados.length;
                    if (limite < 1) return 'Primero define la cantidad unitaria';
                    if (actual >= limite) return `Ya seleccionaste ${limite} producto(s)`;
                    return 'Escribe el nombre del producto...';
                  })()}
                  value={busquedaProducto}
                  onChange={e => {
                    setBusquedaProducto(e.target.value)
                    setMostrarSugerencias(true)
                  }}
                  onFocus={() => setMostrarSugerencias(true)}
                  onKeyDown={handleBuscadorKeyDown}
                  autoComplete="off"
                  disabled={(() => {
                    const limite = Number(form.cantidadUnidades) || 0;
                    return limite < 1 || form.productosSeleccionados.length >= limite;
                  })()}
                />

                {mostrarSugerencias && busquedaProducto.trim() && (
                  <div className="pm-sugerencias">
                    {sugerencias.length === 0 ? (
                      <div className="pm-sugerencia-vacia">
                        No se encontraron productos
                      </div>
                    ) : (
                      sugerencias.map(producto => {
                        const imagen = obtenerImagenProducto(producto)

                        return (
                          <button
                            key={producto._id}
                            type="button"
                            className="pm-sugerencia"
                            onClick={() => agregarDesdeBuscador(producto)}
                          >
                            <div className="pm-sugerencia-img">
                              {imagen ? (
                                <img
                                  src={imagen}
                                  alt={obtenerNombreProducto(producto)}
                                  onError={e => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <span>Sin imagen</span>
                              )}
                            </div>

                            <div className="pm-sugerencia-info">
                              <strong>{obtenerNombreProducto(producto)}</strong>

                              <span>${obtenerPrecioProducto(producto)}</span>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              {/* PRODUCTOS SELECCIONADOS */}

              <div className="pm-chips">
                {form.productosSeleccionados.length === 0 ? (
                  <span className="pm-chips-vacio">
                    Aún no has agregado productos.
                  </span>
                ) : (
                  form.productosSeleccionados.map(item => {
                    const producto = resolverProducto(item)

                    return (
                      <span key={producto._id} className="pm-chip">
                        {obtenerNombreProducto(producto)}

                        <button
                          type="button"
                          title="Quitar"
                          onClick={() =>
                            handleProductoSeleccionado(producto)
                          }
                        >
                          ✕
                        </button>
                      </span>
                    )
                  })
                )}
              </div>
            </div>

            {/* STOCK */}

            <div className="pm-field-group">
              <label>Cantidad en stock</label>

              <input
                type="number"
                name="stock"
                min="0"
                value={form.stock}
                onChange={handleChange}
                className="pm-input"
              />
            </div>

            {/* DESCRIPCIÓN */}

            <div className="pm-field-group">
              <label>Descripción</label>

              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                className="pm-input pm-textarea"
                placeholder="Descripción de la bolsa..."
              />
            </div>

            {/* PRECIO */}

            <div className="pm-field-group">
              <label>Precio</label>

              <div className="pm-price-input">
                <span>$</span>

                <input
                  type="number"
                  name="precio"
                  min="0"
                  step="0.01"
                  value={form.precio}
                  onChange={handleChange}
                  className="pm-input"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BOTONES */}

        <div className="pm-form-actions pm-form-actions-combo">
          <button
            type="button"
            className="pm-btn pm-btn-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="pm-btn pm-btn-dark"
            onClick={handleSubmit}
          >
            {modo === 'agregar' ? 'Aceptar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const Bolsas = () => {
  const {
    bolsas: bolsasPagina,
    loading,
    error,
    busqueda,
    setBusqueda,
    paginaActual,
    setPaginaActual,
    totalPaginas,
    fetchBolsas,
    guardarBolsa,
    eliminarBolsa
  } = useBolsas()

  // ==========================================================
  // PRODUCTOS
  // ==========================================================

  const [productos, setProductos] = useState([])

  // ==========================================================
  // MODALES
  // ==========================================================

  const [notifAbierta, setNotifAbierta] = useState(false)
  const [modalDetalles, setModalDetalles] = useState(null)
  const [modalForm, setModalForm] = useState(null)
  const [modalConfirm, setModalConfirm] = useState(null)
  const [modalSuccess, setModalSuccess] = useState(null)

  // ==========================================================
  // CARGAR PRODUCTOS
  // ==========================================================

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await fetch(`${BASE_URL}/productos`)

        if (!response.ok) {
          throw new Error('No se pudieron obtener los productos')
        }

        const data = await response.json()

        // Soportar diferentes respuestas del backend
        if (Array.isArray(data)) {
          setProductos(data)
        } else if (Array.isArray(data.productos)) {
          setProductos(data.productos)
        } else if (Array.isArray(data.data)) {
          setProductos(data.data)
        } else if (Array.isArray(data.products)) {
          setProductos(data.products)
        } else {
          console.warn('No se encontró un arreglo de productos:', data)
          setProductos([])
        }
      } catch (err) {
        console.error('Error cargando productos:', err)
        setProductos([])
      }
    }

    cargarProductos()
  }, [])

  // ==========================================================
  // CONFIRMACIÓN
  // ==========================================================

  const pedirConfirmacion = (mensaje, onConfirm) => {
    setModalConfirm({ mensaje, onConfirm })
  }

  // ==========================================================
  // NUEVA BOLSA
  // ==========================================================

  const handleNuevaBolsa = () => {
    setModalForm({ modo: 'agregar', bolsa: null })
  }

  // ==========================================================
  // GUARDAR
  // ==========================================================

  const handleFormConfirmRequest = ({ form, imageFile, bolsaId }) => {
    const esEditar = !!bolsaId

    pedirConfirmacion(
      esEditar
        ? '¿Estás segura que deseas guardar los cambios?'
        : '¿Estás segura que deseas agregar esta bolsa?',

      async () => {
        setModalConfirm(null)
        setModalForm(null)

        try {
          await guardarBolsa({ form, imageFile, bolsaId })

          setModalSuccess(
            esEditar
              ? '¡Bolsa actualizada con éxito!'
              : '¡Bolsa agregada con éxito!'
          )
        } catch (err) {
          alert('Error: ' + err.message)
        }
      }
    )
  }

  // ==========================================================
  // EDITAR
  // ==========================================================

  const handleEditar = bolsa => {
    setModalForm({ modo: 'editar', bolsa })
  }

  // ==========================================================
  // ELIMINAR
  // ==========================================================

  const handleEliminar = bolsa => {
    pedirConfirmacion(
      '¿Estás segura que deseas eliminar esta bolsa?',

      async () => {
        setModalConfirm(null)

        try {
          await eliminarBolsa(bolsa._id)

          setModalSuccess('¡Bolsa eliminada con éxito!')
        } catch (err) {
          alert('Error: ' + err.message)
        }
      }
    )
  }

  // ==========================================================
  // BADGE ESTADO
  // ==========================================================

  const estadoBadge = estado => {
    const nombres = {
      activo: 'Disponible',
      inactivo: 'Inactivo',
      agotado: 'Agotado'
    }

    const clases = {
      activo: 'badge-activo',
      inactivo: 'badge-inactivo',
      agotado: 'badge-agotado'
    }

    return (
      <span className={`pm-badge ${clases[estado] || ''}`}>
        {nombres[estado] || estado}
      </span>
    )
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="pm-page">
      <Sidebar />

      <main className="pm-main">
        <Nav openNotifications={() => setNotifAbierta(true)} />

        {/* ==================================================
            ESTILOS
        ================================================== */}

        <style>{`

          /* MODAL */

          .pm-form-modal-combo {
            width: min(950px, 94vw) !important;
            max-width: 950px !important;
            max-height: 92vh !important;
            overflow: hidden !important;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }

          /* CUERPO */

          .pm-form-body-combo {
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
            overflow-x: hidden;
            overflow-y: auto;
            flex: 1;
          }

          /* CAMPOS */

          .pm-form-fields-combo {
            min-width: 0;
            width: 100%;
            box-sizing: border-box;
          }

          /* CONTADOR */

          .pm-product-counter {
            width: 100%;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 14px;
            margin: 8px 0 18px;
            border-radius: 9px;
            background: #f2f3f4;
          }

          /* BOTONES */

          .pm-form-actions-combo {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            width: 100%;
            box-sizing: border-box;
            flex-shrink: 0;
          }

          .pm-form-actions-combo .pm-btn {
            min-width: 105px;
          }

          /* RESPONSIVE */

          @media (max-width: 800px) {
            .pm-form-modal-combo {
              width: 94vw !important;
            }

            .pm-form-img-col {
              display: none;
            }
          }

          @media (max-width: 550px) {
            .pm-form-modal-combo {
              width: 96vw !important;
              max-width: 96vw !important;
            }

            .pm-form-actions-combo {
              justify-content: stretch;
            }

            .pm-form-actions-combo .pm-btn {
              flex: 1;
            }
          }

        `}</style>

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="pm-header">
          <div className="pm-title-wrap">
            <h1 className="pm-title">Bolsas</h1>

            <div className="pm-title-underline"></div>

            <p className="pm-subtitle">Lista de bolsas registradas</p>
          </div>

          <div className="pm-header-actions">
            <div className="pm-search-wrap">
              <svg
                className="pm-search-icon"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M20 20l-3-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              <input
                className="pm-search-input"
                placeholder="Buscar"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>

            <button
              className="pm-btn pm-btn-dark pm-btn-nuevo"
              onClick={handleNuevaBolsa}
            >
              <span>＋</span>
              Agregar bolsa
            </button>
          </div>
        </div>

        {/* CARGANDO */}

        {loading && (
          <div className="pm-loading">
            <div className="pm-spinner"></div>
            <span>Cargando bolsas...</span>
          </div>
        )}

        {/* ERROR */}

        {error && !loading && (
          <div className="pm-error">
            <span>⚠ {error}</span>

            <button onClick={fetchBolsas}>Reintentar</button>
          </div>
        )}

        {/* SIN BOLSAS */}

        {!loading && !error && bolsasPagina.length === 0 && (
          <div className="pm-empty">
            <div className="pm-empty-icon">
              <IconoBolsaVacia />
            </div>

            <p>No se encontraron bolsas</p>
          </div>
        )}

        {/* BOLSAS */}

        {!loading && !error && bolsasPagina.length > 0 && (
          <div className="pm-grid">
            {bolsasPagina.map(bolsa => (
              <div key={bolsa._id} className="pm-card">
                <div className="pm-card-img-wrap">
                  {bolsa.imagenPresentacion ? (
                    <img
                      src={bolsa.imagenPresentacion}
                      alt={bolsa.nombre}
                      className="pm-card-img"
                    />
                  ) : (
                    <div className="pm-card-no-img">Sin imagen</div>
                  )}

                  {estadoBadge(bolsa.estado)}
                </div>

                <div className="pm-card-info">
                  <p className="pm-card-nombre">
                    {bolsa.nombre || 'Sin nombre'}
                  </p>

                  <p className="pm-card-precio">
                    ${Number(bolsa.precio || 0).toFixed(2)}
                  </p>
                </div>

                <div className="pm-card-actions">
                  <div className="pm-card-icons">
                    <button
                      className="pm-icon-btn pm-edit-btn"
                      title="Editar"
                      onClick={() => handleEditar(bolsa)}
                    >
                      <IconoLapiz />
                    </button>

                    <button
                      className="pm-icon-btn pm-delete-btn"
                      title="Eliminar"
                      onClick={() => handleEliminar(bolsa)}
                    >
                      <IconoBasura />
                    </button>
                  </div>

                  <button
                    className="pm-ver-detalles"
                    onClick={() => setModalDetalles(bolsa)}
                  >
                    Ver detalles ›
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINACIÓN */}

        {totalPaginas > 1 && (
          <div className="pm-pagination">
            <button
              className="pm-page-btn"
              disabled={paginaActual === 1}
              onClick={() => setPaginaActual(p => p - 1)}
            >
              ‹
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={`pm-page-btn ${paginaActual === n ? 'active' : ''}`}
                onClick={() => setPaginaActual(n)}
              >
                {n}
              </button>
            ))}

            <button
              className="pm-page-btn"
              disabled={paginaActual === totalPaginas}
              onClick={() => setPaginaActual(p => p + 1)}
            >
              ›
            </button>
          </div>
        )}
      </main>

      {/* DETALLES */}

      {modalDetalles && (
        <DetallesModal
          bolsa={modalDetalles}
          onClose={() => setModalDetalles(null)}
        />
      )}

      {/* FORMULARIO */}

      {modalForm && (
        <FormModal
          modo={modalForm.modo}
          bolsa={modalForm.bolsa}
          productos={productos}
          onClose={() => setModalForm(null)}
          onConfirmRequest={handleFormConfirmRequest}
        />
      )}

      {/* CONFIRMACIÓN */}

      {modalConfirm && (
        <ConfirmModal
          mensaje={modalConfirm.mensaje}
          onConfirm={modalConfirm.onConfirm}
          onCancel={() => setModalConfirm(null)}
        />
      )}

      {/* ÉXITO */}

      {modalSuccess && (
        <SuccessModal
          mensaje={modalSuccess}
          onClose={() => setModalSuccess(null)}
        />
      )}

      {/* NOTIFICACIONES */}

      <NotificacionesModal
        abierto={notifAbierta}
        onCerrar={() => setNotifAbierta(false)}
      />
    </div>
  )
}

export default Bolsas;