// PromocionesAdmin.jsx — gestión de promociones (admin)
import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/SideBar'
import Nav from '../components/Nav'
import NotificacionesModal from '../components/NotificationsModal'
import '../SideBar.css'
import '../productosPage.css'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const POR_PAGINA = 10

// Da formato corto a una fecha (ej: "15 jul. 2026")
const formatoFecha = (f) => (f ? new Date(f).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

// Helpers de producto (nombre, precio e imagen)
const obtenerNombreProducto = (p) =>
  p?.nombre || p?.name || p?.productName || p?.nombreProducto || 'Producto sin nombre'

const obtenerPrecioProducto = (p) =>
  Number(p?.precio ?? p?.price ?? p?.productPrice ?? 0).toFixed(2)

const esTextoValido = (v) => typeof v === 'string' && v.trim() !== ''

const obtenerImagenProducto = (p) => {
  if (!p) return null

  for (const campo of ['imagen', 'image', 'imageUrl', 'imagenUrl', 'url', 'foto']) {
    if (esTextoValido(p[campo])) return p[campo]
  }

  for (const campo of ['image', 'imagen', 'photo', 'picture']) {
    const v = p[campo]
    if (v && typeof v === 'object') {
      if (esTextoValido(v.secure_url)) return v.secure_url
      if (esTextoValido(v.url)) return v.url
    }
  }

  return null
}

// Quita tildes y pasa a minúsculas para buscar mejor
const normalizar = (t) =>
  String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

//Modal para crear / editar promoción 
const PromocionModal = ({ promocion, onClose, onGuardado }) => {
  const esEditar = !!promocion
  const [productos, setProductos] = useState([])  // Lista de productos activos para elegir cuál promocionar
  const [productoSel, setProductoSel] = useState(promocion?.idProducto || null)  // Producto elegido
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const buscadorRef = useRef(null)
  const [form, setForm] = useState({
    descuento: promocion?.descuento || '',
    fechaInicio: promocion?.fechaInicio ? new Date(promocion.fechaInicio).toISOString().slice(0, 10) : '',
    fechaFin: promocion?.fechaFin ? new Date(promocion.fechaFin).toISOString().slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Carga los productos activos disponibles para asignarles una promoción
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await fetch(`${BASE_URL}/productos?estado=activo`, { credentials: 'include' })
        const data = await res.json()
        if (Array.isArray(data)) setProductos(data)
        else if (Array.isArray(data.productos)) setProductos(data.productos)
        else if (Array.isArray(data.data)) setProductos(data.data)
        else setProductos([])
      } catch {
        setProductos([])
      }
    }
    fetchProductos()
  }, [])

  // Cierra las sugerencias al hacer clic fuera del buscador
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target)) {
        setMostrarSugerencias(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Sugerencias que coinciden con lo escrito
  const sugerencias = busquedaProducto.trim()
    ? productos
        .filter((p) => normalizar(obtenerNombreProducto(p)).includes(normalizar(busquedaProducto)))
        .slice(0, 8)
    : []

  const elegirProducto = (producto) => {
    setProductoSel(producto)
    setBusquedaProducto('')
    setMostrarSugerencias(false)
  }

  const handleBuscadorKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (sugerencias[0]) elegirProducto(sugerencias[0])
    }
    if (e.key === 'Escape') setMostrarSugerencias(false)
  }

  // Valida el formulario y crea o actualiza la promoción según corresponda
  const handleSubmit = async () => {
    setError('')
    if (!productoSel?._id || !form.descuento || !form.fechaInicio || !form.fechaFin) {
      setError('Completa todos los campos.')
      return
    }
    if (Number(form.descuento) < 1 || Number(form.descuento) > 99) {
      setError('El descuento debe estar entre 1 y 99.')
      return
    }
    if (new Date(form.fechaFin) < new Date(form.fechaInicio)) {
      setError('La fecha fin no puede ser anterior a la de inicio.')
      return
    }

    setSaving(true)
    try {
      const url = esEditar ? `${BASE_URL}/promociones/${promocion._id}` : `${BASE_URL}/promociones`
      const method = esEditar ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          idProducto: productoSel._id,
          descuento: Number(form.descuento),
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'No se pudo guardar la promoción')
      onGuardado()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div
        className="pm-modal pm-form-modal"
        style={{ overflow: 'visible' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pm-form-header">
          <span className="pm-detalles-bar"></span>
          <h2>{esEditar ? 'Editar promoción' : 'Nueva promoción'}</h2>
        </div>

        <div className="pm-form-fields">
          {/* PRODUCTO (BUSCADOR) */}
          <div className="pm-field-group">
            <label>Producto</label>

            {productoSel ? (
              <div className="pm-producto-elegido">
                <div className="pm-sugerencia-img">
                  {obtenerImagenProducto(productoSel) ? (
                    <img
                      src={obtenerImagenProducto(productoSel)}
                      alt={obtenerNombreProducto(productoSel)}
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <span>Sin imagen</span>
                  )}
                </div>

                <div className="pm-sugerencia-info">
                  <strong>{obtenerNombreProducto(productoSel)}</strong>
                  {productoSel.precio !== undefined && (
                    <span>${obtenerPrecioProducto(productoSel)}</span>
                  )}
                </div>

                <button
                  type="button"
                  className="pm-producto-quitar"
                  title="Cambiar producto"
                  onClick={() => setProductoSel(null)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="pm-buscador" ref={buscadorRef}>
                <input
                  type="text"
                  className="pm-input"
                  placeholder="Escribe el nombre del producto..."
                  value={busquedaProducto}
                  onChange={(e) => {
                    setBusquedaProducto(e.target.value)
                    setMostrarSugerencias(true)
                  }}
                  onFocus={() => setMostrarSugerencias(true)}
                  onKeyDown={handleBuscadorKeyDown}
                  autoComplete="off"
                />

                {mostrarSugerencias && busquedaProducto.trim() && (
                  <div className="pm-sugerencias">
                    {sugerencias.length === 0 ? (
                      <div className="pm-sugerencia-vacia">No se encontraron productos</div>
                    ) : (
                      sugerencias.map((producto) => {
                        const imagen = obtenerImagenProducto(producto)

                        return (
                          <button
                            key={producto._id}
                            type="button"
                            className="pm-sugerencia"
                            onClick={() => elegirProducto(producto)}
                          >
                            <div className="pm-sugerencia-img">
                              {imagen ? (
                                <img
                                  src={imagen}
                                  alt={obtenerNombreProducto(producto)}
                                  onError={(e) => { e.currentTarget.style.display = 'none' }}
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
            )}
          </div>

          <div className="pm-field-group">
            <label>Descuento (%)</label>
            <input
              type="number" name="descuento" min="1" max="99"
              value={form.descuento} onChange={handleChange}
              className="pm-input" placeholder="Ej. 20"
            />
          </div>

          <div className="pm-field-row">
            <div className="pm-field-group">
              <label>Fecha inicio</label>
              <input type="date" name="fechaInicio" value={form.fechaInicio} onChange={handleChange} className="pm-input" />
            </div>
            <div className="pm-field-group">
              <label>Fecha fin</label>
              <input type="date" name="fechaFin" value={form.fechaFin} onChange={handleChange} className="pm-input" />
            </div>
          </div>

          {error && <p style={{ color: '#991b1b', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
        </div>

        <div className="pm-form-actions">
          <button className="pm-btn pm-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="pm-btn pm-btn-dark" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : (esEditar ? 'Guardar cambios' : 'Crear promoción')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* Modal de confirmación de eliminación */
const ConfirmEliminarModal = ({ promocion, onClose, onConfirm }) => (
  <div className="pm-overlay" onClick={onClose}>
    <div className="pm-modal pm-confirm-modal" onClick={e => e.stopPropagation()}>
      <div className="pm-confirm-icon"><span>!</span></div>
      <h2 className="pm-confirm-title">Confirmación</h2>
      <p className="pm-confirm-msg">
        ¿Estás segura que deseas eliminar la promoción de <strong>{promocion.idProducto?.nombre || 'este producto'}</strong>?
      </p>
      <div className="pm-confirm-btns">
        <button className="pm-btn pm-btn-confirm" onClick={onConfirm}>Sí, estoy segura</button>
        <button className="pm-btn pm-btn-cancel" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  </div>
)


const PromocionesAdmin = () => {
  const [promociones, setPromociones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notifAbierta, setNotifAbierta] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)

  const [modalPromo, setModalPromo] = useState(null)      // null = cerrado, {} = crear, objeto = editar
  const [modalEliminar, setModalEliminar] = useState(null)

  // Carga todas las promociones registradas
  const fetchPromociones = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BASE_URL}/promociones`, { credentials: 'include' })
      const data = await res.json()
      setPromociones(Array.isArray(data) ? data : [])
    } catch {
      setError('No se pudieron cargar las promociones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromociones()
  }, [])

  // Elimina la promoción seleccionada tras confirmar
  const handleEliminar = async () => {
    try {
      await fetch(`${BASE_URL}/promociones/${modalEliminar._id}`, { method: 'DELETE', credentials: 'include' })
      setModalEliminar(null)
      fetchPromociones()
    } catch {
      alert('Error al eliminar')
    }
  }

  // Determina si una promoción está vigente hoy: activa y dentro del rango de fechas
  const estaVigente = (p) => {
    const hoy = new Date()
    return p.estado === 'activa' && new Date(p.fechaInicio) <= hoy && new Date(p.fechaFin) >= hoy
  }

  // Paginación de la tabla de promociones
  const totalPaginas = Math.max(1, Math.ceil(promociones.length / POR_PAGINA))
  const inicio = (paginaActual - 1) * POR_PAGINA
  const promocionesPagina = promociones.slice(inicio, inicio + POR_PAGINA)

  return (
    <div className="pm-page">
      <Sidebar />

      <main className="pm-main">
        <Nav openNotifications={() => setNotifAbierta(true)} />

        {/* ENCABEZADO */}
        <div className="pm-header">
          <div className="pm-title-wrap">
            <h1 className="pm-title">Promociones</h1>
            <div className="pm-title-underline"></div>
            <p className="pm-subtitle">Gestiona los descuentos y su vigencia.</p>
          </div>
          <div className="pm-header-actions">
            <button className="pm-btn pm-btn-dark pm-btn-nuevo" onClick={() => setModalPromo({})}>
              <span>＋</span> Agregar promoción
            </button>
          </div>
        </div>

        {error && (
          <div className="pm-error">
            <span>⚠ {error}</span>
            <button onClick={fetchPromociones}>Reintentar</button>
          </div>
        )}

        {loading ? (
          <div className="pm-loading">
            <div className="pm-spinner"></div>
            <span>Cargando promociones...</span>
          </div>
        ) : !error && (
          <>
            {/* Tabla de promociones registradas */}
            <div className="vt-table-wrap">
              <table className="vt-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Descuento</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {promociones.length === 0 ? (
                    <tr><td colSpan={6} className="empty-cell">No hay promociones registradas</td></tr>
                  ) : (
                    promocionesPagina.map((p) => (
                      <tr key={p._id}>
                        <td>{p.idProducto?.nombre || 'Producto eliminado'}</td>
                        <td>-{p.descuento}%</td>
                        <td>{formatoFecha(p.fechaInicio)}</td>
                        <td>{formatoFecha(p.fechaFin)}</td>
                        <td>
                          <span className={`vt-badge ${estaVigente(p) ? 'completado' : 'cancelado'}`}>
                            {estaVigente(p) ? 'Vigente' : 'No vigente'}
                          </span>
                        </td>
                        <td>
                          <div className="vt-acciones">
                            <button className="vt-icon-btn editar" title="Editar" onClick={() => setModalPromo(p)}>
                              ✏
                            </button>
                            <button className="vt-icon-btn eliminar" title="Eliminar" onClick={() => setModalEliminar(p)}>
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

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
          </>
        )}
      </main>

      {/* modalPromo !== null: {} para crear, objeto de promoción para editar */}
      {modalPromo !== null && (
        <PromocionModal
          promocion={modalPromo._id ? modalPromo : null}
          onClose={() => setModalPromo(null)}
          onGuardado={fetchPromociones}
        />
      )}

      {modalEliminar && (
        <ConfirmEliminarModal
          promocion={modalEliminar}
          onClose={() => setModalEliminar(null)}
          onConfirm={handleEliminar}
        />
      )}

      <NotificacionesModal abierto={notifAbierta} onCerrar={() => setNotifAbierta(false)} />
    </div>
  )
}

export default PromocionesAdmin;