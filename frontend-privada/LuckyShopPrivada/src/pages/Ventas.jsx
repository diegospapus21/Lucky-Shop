import { useState, useMemo, useEffect } from 'react'
import { useVentas } from '../hooks/useVentas'
import Sidebar from "../components/SideBar";
import Nav from "../components/Nav";
import NotificacionesModal from "../components/NotificationsModal";
import '../productosPage.css'
import '../ventasPage.css'
import '../SideBar.css'

const ESTADOS_FILTRO = ['Todos', 'Completado', 'Pendiente', 'Cancelado']

// Cantidad de ventas que se muestran por página
const POR_PAGINA = 4

// Genera las iniciales (máx 2 letras) a partir de un nombre, para el avatar circular
const iniciales = (nombre = '') =>
  nombre.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'

const formatoMoneda = (n) => `$${Number(n || 0).toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/* ── Iconos ── */
const IconoOjo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const IconoLapiz = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

/* ── Modal de detalle de venta ── */
const DetalleVentaModal = ({ venta, onClose }) => {
  if (!venta) return null
  const productos = venta.IdCarrito?.productos || []
  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal pm-detalles-modal" onClick={e => e.stopPropagation()}>
        <div className="pm-detalles-header">
          <span className="pm-detalles-bar"></span>
          <h2>Detalles de venta</h2>
        </div>
        <div className="pm-detalles-info">
          <div className="pm-info-row pm-info-2col">
            <div>
              <span className="pm-info-label">Cliente</span>
              <p className="pm-info-val">{venta.cliente}</p>
            </div>
            <div>
              <span className="pm-info-label">Estado</span>
              <p className="pm-info-val">{venta.estado}</p>
            </div>
          </div>
          <div className="pm-info-row pm-info-2col">
            <div>
              <span className="pm-info-label">Fecha</span>
              <p className="pm-info-val">{venta.fecha ? new Date(venta.fecha).toLocaleDateString('es-SV') : '—'}</p>
            </div>
            <div>
              <span className="pm-info-label">Método de pago</span>
              <p className="pm-info-val">{venta.metodoPago || '—'}</p>
            </div>
          </div>
          <div className="pm-info-row pm-info-2col">
            <div>
              <span className="pm-info-label">Referencia</span>
              <p className="pm-info-val">{venta.referencia || '—'}</p>
            </div>
            <div>
              <span className="pm-info-label">Teléfono</span>
              <p className="pm-info-val">{venta.phone || '—'}</p>
            </div>
          </div>
          <div className="pm-info-row">
            <div>
              <span className="pm-info-label">Dirección</span>
              <p className="pm-info-val">{venta.direcion || '—'}</p>
            </div>
          </div>
          {productos.length > 0 && (
            <div className="pm-info-row">
              <span className="pm-info-label">Productos</span>
              <ul className="vt-detalle-productos">
                {productos.map((p, i) => (
                  <li key={i}>
                    <span>{p.idProducto?.nombre || 'Producto'} × {p.cantidad}</span>
                    <span>{formatoMoneda(p.subtotal)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="pm-detalles-footer">
          <div></div>
          <div className="pm-detalles-price">
            <span className="pm-info-label">Monto</span>
            <p className="pm-price-big">{formatoMoneda(venta.monto)}</p>
          </div>
        </div>
        <div className="pm-detalles-actions">
          <button className="pm-btn pm-btn-dark" onClick={onClose}>Aceptar</button>
        </div>
      </div>
    </div>
  )
}

/* ── Modal de edición de venta ── */
const EditarVentaModal = ({ venta, onClose, onGuardar }) => {
  const [form, setForm] = useState({
    estado: venta.estado || 'Completado',
    metodoPago: venta.metodoPago || '',
    referencia: venta.referencia || '',
    fecha: venta.fecha ? new Date(venta.fecha).toISOString().slice(0, 10) : '',
  })

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    const estadoBooleanos = {
      Completado: { status: true, statusPago: true },
      Pendiente: { status: true, statusPago: false },
      Cancelado: { status: false, statusPago: false },
    }[form.estado]

    onGuardar(venta._id, {
      metodoPago: form.metodoPago,
      referencia: form.referencia,
      fecha: form.fecha,
      ...estadoBooleanos,
    })
  }

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal pm-form-modal" onClick={e => e.stopPropagation()}>
        <div className="pm-form-header">
          <span className="pm-detalles-bar"></span>
          <h2>Editar venta</h2>
        </div>
        <div className="pm-form-fields">
          <div className="pm-field-row">
            <div className="pm-field-group">
              <label>Estado</label>
              <select name="estado" value={form.estado} onChange={handleChange} className="pm-input">
                {ESTADOS_FILTRO.filter(e => e !== 'Todos').map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div className="pm-field-group">
              <label>Método de pago</label>
              <input name="metodoPago" value={form.metodoPago} onChange={handleChange} className="pm-input" placeholder="Transferencia, tarjeta..." />
            </div>
          </div>
          <div className="pm-field-row">
            <div className="pm-field-group">
              <label>Referencia</label>
              <input name="referencia" value={form.referencia} onChange={handleChange} className="pm-input" />
            </div>
            <div className="pm-field-group">
              <label>Fecha</label>
              <input type="date" name="fecha" value={form.fecha} onChange={handleChange} className="pm-input" />
            </div>
          </div>
        </div>
        <div className="pm-form-actions">
          <button className="pm-btn pm-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="pm-btn pm-btn-dark" onClick={handleSubmit}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────── */
const Ventas = () => {
  // Las ventas no se pueden eliminar (es un registro de transacciones), solo ver y editar
  const {
    ventas,
    loading,
    error,
    busqueda,
    setBusqueda,
    filtroEstado,
    setFiltroEstado,
    paginaActual,
    setPaginaActual,
    fetchVentas,
    actualizarVenta,
  } = useVentas()

  const [notifAbierta, setNotifAbierta] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null)
  const [modalEditar, setModalEditar] = useState(null)

  // Método de pago más usado entre todas las ventas del filtro actual (ignorando estados)
  const metodoMasUsadoFiltrado = useMemo(() => {
    if (!ventas || ventas.length === 0) return null

    const estadosInvalidos = ['pendiente', 'completado', 'cancelado', 'todos', '']
    const conteo = {}

    ventas.forEach(v => {
      const metodoStr = v.metodoPago ? v.metodoPago.trim().toLowerCase() : ''
      if (metodoStr && !estadosInvalidos.includes(metodoStr)) {
        const metodoFormateado = metodoStr.charAt(0).toUpperCase() + metodoStr.slice(1)
        conteo[metodoFormateado] = (conteo[metodoFormateado] || 0) + 1
      }
    })

    const metodosArray = Object.entries(conteo)
    if (metodosArray.length === 0) return null

    metodosArray.sort((a, b) => b[1] - a[1])
    return { metodo: metodosArray[0][0], cantidad: metodosArray[0][1] }
  }, [ventas])

  // Paginación de la tabla de ventas
  const totalPaginas = Math.max(1, Math.ceil(ventas.length / POR_PAGINA))
  const inicio = (paginaActual - 1) * POR_PAGINA
  const ventasPagina = ventas.slice(inicio, inicio + POR_PAGINA)

  // Si al filtrar queda vacía la página actual, retrocede a la última disponible
  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(totalPaginas)
  }, [totalPaginas, paginaActual, setPaginaActual])

  const handleGuardarEdicion = async (id, datos) => {
    try {
      await actualizarVenta(id, datos)
      setModalEditar(null)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const badgeClase = (estado) => ({
    Completado: 'completado',
    Pendiente: 'pendiente',
    Cancelado: 'cancelado',
  }[estado] || 'pendiente')

  return (
    <div className="pm-page">
      <Sidebar />

      <main className="pm-main">
        <Nav openNotifications={() => setNotifAbierta(true)} />
        <div className="pm-header">
          <div className="pm-title-wrap">
            <h1 className="pm-title">Ventas</h1>
            <div className="pm-title-underline"></div>
            <p className="pm-subtitle">Supervisión integral y gestión de transacciones en tiempo real.</p>
          </div>
        </div>

        {/* Tarjeta con el método de pago más usado (dinámica según la pestaña/filtro) */}
        <div className="vt-stat-card">
          <p className="vt-stat-label">Método más usado ({filtroEstado})</p>
          {metodoMasUsadoFiltrado ? (
            <>
              <p className="vt-metodo-destacado">{metodoMasUsadoFiltrado.metodo}</p>
              <p className="vt-metodo-subtexto">
                {metodoMasUsadoFiltrado.cantidad} pago{metodoMasUsadoFiltrado.cantidad !== 1 ? "s" : ""} realizado{metodoMasUsadoFiltrado.cantidad !== 1 ? "s" : ""} usando este método
              </p>
            </>
          ) : (
            <p className="vt-chart-empty">No hay registros de métodos de pago válidos en este filtro.</p>
          )}
        </div>

        {/* Filtros y buscador */}
        <div className="vt-toolbar">
          <div className="vt-filtros-wrap">
            {ESTADOS_FILTRO.map(e => (
              <button
                key={e}
                className={`vt-filtro-tab ${filtroEstado === e ? 'activo' : ''}`}
                onClick={() => setFiltroEstado(e)}
              >
                {e}
              </button>
            ))}
          </div>

          <div className="pm-search-wrap" style={{ marginLeft: 'auto' }}>
            <svg className="pm-search-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              className="pm-search-input"
              placeholder="Buscar"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {error && !loading && (
          <div className="pm-error">
            <span>⚠ {error}</span>
            <button onClick={fetchVentas}>Reintentar</button>
          </div>
        )}

        {/* Tabla principal de ventas */}
        {!error && (
          <div className="vt-table-wrap">
            <table className="vt-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="loading-cell">Cargando ventas...</td></tr>
                )}
                {!loading && ventasPagina.length === 0 && (
                  <tr><td colSpan={5} className="empty-cell">No se encontraron ventas</td></tr>
                )}
                {!loading && ventasPagina.map(venta => (
                  <tr key={venta._id}>
                    <td>
                      <div className="vt-cliente-cell">
                        <span className="vt-avatar">{iniciales(venta.cliente)}</span>
                        {venta.cliente}
                      </div>
                    </td>
                    <td className="vt-fecha">{venta.fecha ? new Date(venta.fecha).toLocaleDateString('es-SV') : '—'}</td>
                    <td className="vt-monto">{formatoMoneda(venta.monto)}</td>
                    <td><span className={`vt-badge ${badgeClase(venta.estado)}`}>{venta.estado}</span></td>
                    <td>
                      {/* Solo ver detalle y editar: no hay botón para eliminar ventas */}
                      <div className="vt-acciones">
                        <button className="vt-icon-btn" title="Ver detalle" onClick={() => setModalDetalle(venta)}>
                          <IconoOjo />
                        </button>
                        <button className="vt-icon-btn editar" title="Editar" onClick={() => setModalEditar(venta)}>
                          <IconoLapiz />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Contador de resultados */}
        {!loading && !error && ventas.length > 0 && (
          <p className="pm-contador">
            Mostrando {inicio + 1}–{Math.min(inicio + POR_PAGINA, ventas.length)} de {ventas.length} ventas
          </p>
        )}

        {/* Paginación */}
        {!loading && !error && totalPaginas > 1 && (
          <div className="pm-pagination" style={{ marginTop: 12 }}>
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

      {modalDetalle && (
        <DetalleVentaModal venta={modalDetalle} onClose={() => setModalDetalle(null)} />
      )}

      {modalEditar && (
        <EditarVentaModal
          venta={modalEditar}
          onClose={() => setModalEditar(null)}
          onGuardar={handleGuardarEdicion}
        />
      )}

      <NotificacionesModal abierto={notifAbierta} onCerrar={() => setNotifAbierta(false)} />
    </div>
  )
}

export default Ventas;