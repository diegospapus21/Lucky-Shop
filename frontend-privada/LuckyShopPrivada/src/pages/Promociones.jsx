// PromocionesAdmin.jsx — gestión de promociones (admin)
import { useState, useEffect, useMemo, useRef } from 'react'
import Sidebar from '../components/SideBar'
import Nav from '../components/Nav'
import NotificacionesModal from '../components/NotificationsModal'
import '../SideBar.css'
import '../productosPage.css'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const POR_PAGINA = 7
const FILTROS = ['Todas', 'Vigentes', 'No vigentes']

// Da formato corto a una fecha (ej: "15 jul. 2026") sin desfase de zona horaria
const formatoFecha = (f) =>
  f
    ? new Date(f).toLocaleDateString('es-SV', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : '—'

// Determina si una promoción está vigente hoy: activa y dentro del rango de fechas
// (se compara por día para evitar desfases de zona horaria)
const estaVigente = (p) => {
  const hoy = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD en hora local
  const inicio = new Date(p.fechaInicio).toISOString().slice(0, 10)
  const fin = new Date(p.fechaFin).toISOString().slice(0, 10)
  return p.estado === 'activa' && inicio <= hoy && fin >= hoy
}

// ── Helpers de producto (nombre, precio e imagen) ──
const obtenerNombreProducto = (p) =>
  p?.nombre || p?.name || p?.productName || p?.nombreProducto || 'Producto sin nombre'

const obtenerPrecioProducto = (p) =>
  Number(p?.precio ?? p?.price ?? p?.productPrice ?? 0).toFixed(2)

const esTextoValido = (v) => typeof v === 'string' && v.trim() !== ''

// Imagen del producto según el esquema:
// 1. imagenPresentacion (imagen principal)
// 2. imagenes[0] (primera del arreglo)
const obtenerImagenProducto = (p) => {
  if (!p) return null

  if (esTextoValido(p.imagenPresentacion)) return p.imagenPresentacion

  if (Array.isArray(p.imagenes)) {
    const primera = p.imagenes.find(esTextoValido)
    if (primera) return primera
  }

  return null
}

// Quita tildes y pasa a minúsculas para buscar mejor
const normalizar = (t) =>
  String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// ¿El producto está agotado? Los productos agotados no pueden llevar promoción.
// Si en tu base de datos el agotado se guarda con otro campo, cámbialo solo aquí.
const estaAgotado = (p) =>
  normalizar(p?.estado) === 'agotado' ||
  p?.agotado === true ||
  (p?.stock !== undefined && p?.stock !== null && Number(p.stock) <= 0) ||
  (p?.cantidad !== undefined && p?.cantidad !== null && Number(p.cantidad) <= 0)

// ───── Validación de fechas de promociones ─────
// Fecha de hoy (YYYY-MM-DD) en la hora local del navegador
const hoyISO = () => new Date().toLocaleDateString('en-CA')

const MAX_DIAS_PROMOCION = 365 // una promoción no puede durar más de un año

const diasEntre = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000)

// ¿Es una fecha real con formato YYYY-MM-DD? (rechaza cosas como 2026-02-31)
const fechaValida = (d) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return false
  const f = new Date(`${d}T00:00:00Z`)
  return !Number.isNaN(f.getTime()) && f.toISOString().slice(0, 10) === d
}

// Devuelve un mensaje de error o null si las fechas tienen sentido.
// "original" son las fechas que ya tenía la promoción (al editar): solo se rechazan
// fechas pasadas si el usuario las CAMBIÓ, para poder editar el descuento de una promo ya iniciada.
const validarFechasPromocion = (inicio, fin, original = null) => {
  if (!fechaValida(inicio) || !fechaValida(fin)) return 'Las fechas no son válidas.'
  const hoy = hoyISO()
  const cambioInicio = !original || original.fechaInicio !== inicio
  const cambioFin = !original || original.fechaFin !== fin
  if (cambioInicio && inicio < hoy) return 'La fecha de inicio no puede ser una fecha pasada.'
  if (cambioFin && fin < hoy) return 'La fecha fin no puede ser una fecha pasada.'
  if (fin < inicio) return 'La fecha fin no puede ser anterior a la de inicio.'
  if (diasEntre(inicio, fin) > MAX_DIAS_PROMOCION) return 'La promoción no puede durar más de un año.'
  return null
}

// ── Modal para crear / editar promoción ──
const PromocionModal = ({ promocion, onClose, onGuardado }) => {
  const esEditar = !!promocion
  const [productos, setProductos] = useState([])  // Lista de productos activos para elegir cuál promocionar
  const [productoSel, setProductoSel] = useState(promocion?.idProducto || null)  // Producto elegido
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const buscadorRef = useRef(null)
  // Fechas que ya tenía la promoción (para saber si el admin las cambió al editar)
  const fechaInicioOriginal = promocion?.fechaInicio ? new Date(promocion.fechaInicio).toISOString().slice(0, 10) : ''
  const fechaFinOriginal = promocion?.fechaFin ? new Date(promocion.fechaFin).toISOString().slice(0, 10) : ''
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

  // Productos que coinciden con lo escrito
  const coincidencias = busquedaProducto.trim()
    ? productos.filter((p) => normalizar(obtenerNombreProducto(p)).includes(normalizar(busquedaProducto)))
    : []

  // Solo se sugieren productos con existencias: los agotados no pueden tener promoción
  const sugerencias = coincidencias.filter((p) => !estaAgotado(p)).slice(0, 8)
  const soloAgotados = coincidencias.length > 0 && sugerencias.length === 0

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
    // No se puede promocionar un producto agotado (al editar solo se revisa si cambió de producto,
    // para poder seguir ajustando promociones que ya existían)
    const cambioProducto = !esEditar || productoSel._id !== promocion.idProducto?._id
    if (cambioProducto && estaAgotado(productoSel)) {
      setError('No se puede agregar una promoción a un producto agotado.')
      return
    }
    if (!Number.isInteger(Number(form.descuento)) || Number(form.descuento) < 1 || Number(form.descuento) > 99) {
      setError('El descuento debe ser un número entero entre 1 y 99.')
      return
    }
    // Fechas: no pasadas, fin posterior al inicio y duración razonable.
    // Al editar, solo se rechazan fechas pasadas si el admin las cambió.
    const errorFechas = validarFechasPromocion(
      form.fechaInicio,
      form.fechaFin,
      esEditar ? { fechaInicio: fechaInicioOriginal, fechaFin: fechaFinOriginal } : null,
    )
    if (errorFechas) {
      setError(errorFechas)
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

  const imagenSel = obtenerImagenProducto(productoSel)

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal pm-form-modal" onClick={(e) => e.stopPropagation()}>
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
                  {imagenSel ? (
                    <img
                      src={imagenSel}
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
                      <div className="pm-sugerencia-vacia">
                        {soloAgotados
                          ? 'Ese producto está agotado, no se le puede agregar una promoción'
                          : 'No se encontraron productos'}
                      </div>
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
              <input type="date" name="fechaInicio" value={form.fechaInicio} min={esEditar && fechaInicioOriginal && fechaInicioOriginal < hoyISO() ? undefined : hoyISO()} onChange={handleChange} className="pm-input" />
            </div>
            <div className="pm-field-group">
              <label>Fecha fin</label>
              <input type="date" name="fechaFin" value={form.fechaFin} min={form.fechaInicio && form.fechaInicio > hoyISO() ? form.fechaInicio : hoyISO()} onChange={handleChange} className="pm-input" />
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
  const [filtro, setFiltro] = useState('Todas') // Todas | Vigentes | No vigentes

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

  // Cantidad de promociones por pestaña
  const conteos = useMemo(() => {
    const vigentes = promociones.filter(estaVigente).length
    return {
      Todas: promociones.length,
      Vigentes: vigentes,
      'No vigentes': promociones.length - vigentes,
    }
  }, [promociones])

  // Promociones según la pestaña elegida
  const promocionesFiltradas = useMemo(() => {
    if (filtro === 'Vigentes') return promociones.filter(estaVigente)
    if (filtro === 'No vigentes') return promociones.filter((p) => !estaVigente(p))
    return promociones
  }, [promociones, filtro])

  // Al cambiar de pestaña vuelve a la primera página
  useEffect(() => {
    setPaginaActual(1)
  }, [filtro])

  // Paginación de la tabla de promociones
  const totalPaginas = Math.max(1, Math.ceil(promocionesFiltradas.length / POR_PAGINA))
  const inicio = (paginaActual - 1) * POR_PAGINA
  const promocionesPagina = promocionesFiltradas.slice(inicio, inicio + POR_PAGINA)

  // Si al eliminar queda vacía la página actual, retrocede a la última disponible
  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(totalPaginas)
  }, [totalPaginas, paginaActual])

  // Mensaje cuando no hay resultados en la pestaña elegida
  const mensajeVacio =
    promociones.length === 0
      ? 'No hay promociones registradas'
      : filtro === 'Vigentes'
      ? 'No hay promociones vigentes'
      : 'No hay promociones no vigentes'

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

        {/* PESTAÑAS: Todas / Vigentes / No vigentes */}
        {!loading && !error && (
          <div className="pm-categorias">
            {FILTROS.map((f) => (
              <button
                key={f}
                className={`pm-cat-btn ${filtro === f ? 'active' : ''}`}
                onClick={() => setFiltro(f)}
              >
                {f} ({conteos[f]})
              </button>
            ))}
          </div>
        )}

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
                  {promocionesFiltradas.length === 0 ? (
                    <tr><td colSpan={6} className="empty-cell">{mensajeVacio}</td></tr>
                  ) : (
                    promocionesPagina.map((p) => {
                      const vigente = estaVigente(p)

                      return (
                        <tr key={p._id}>
                          <td>{p.idProducto?.nombre || 'Producto eliminado'}</td>
                          <td>-{p.descuento}%</td>
                          <td>{formatoFecha(p.fechaInicio)}</td>
                          <td>{formatoFecha(p.fechaFin)}</td>
                          <td>
                            <span className={`vt-badge ${vigente ? 'completado' : 'cancelado'}`}>
                              {vigente ? 'Vigente' : 'No vigente'}
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
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* CONTADOR DE RESULTADOS */}
            {promocionesFiltradas.length > 0 && (
              <p className="pm-contador">
                Mostrando {inicio + 1}–{Math.min(inicio + POR_PAGINA, promocionesFiltradas.length)} de {promocionesFiltradas.length} promociones
              </p>
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