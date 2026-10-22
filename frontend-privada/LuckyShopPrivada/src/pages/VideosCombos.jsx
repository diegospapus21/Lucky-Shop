import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/SideBar'
import Nav from '../components/Nav'
import NotificacionesModal from '../components/NotificationsModal'
import { useVideosCombos } from '../hooks/useVideosCombos'
import '../SideBar.css'
import '../productosPage.css'
import '../videosCombosPage.css'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

/* ── Helpers ── */
const formatFecha = (fecha) => {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const getNombreCliente = (idCliente) => {
  if (!idCliente) return 'Sin cliente'
  if (typeof idCliente === 'string') return idCliente
  return `${idCliente.name || ''} ${idCliente.lastName || ''}`.trim() || idCliente.email || 'Sin nombre'
}

// Nombre del video tal como se muestra en la tarjeta
const getNombreVideo = (combo) => combo.idProducto?.nombre || 'Combo suerte'

// Quita tildes y pasa a minúsculas para buscar mejor
const normalizar = (t) =>
  String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Iniciales para el avatar del cliente
const getInitials = (name = '', lastName = '') => {
  const n = name.trim()[0]?.toUpperCase() || ''
  const l = lastName.trim()[0]?.toUpperCase() || ''
  return (n + l) || '?'
}

// Mensaje que se le envía al cliente junto con su video
const mensajeParaCliente = (cliente) => {
  const nombre = (cliente?.name || '').trim() || 'Hola'
  return `${nombre}, tu combo está listo, puedes ver qué suerte te tocó hoy`
}

const getStatusInfo = (status) => {
  if (status === true)  return { label: 'Aceptada',  clase: 'aceptada' }
  if (status === false) return { label: 'Denegada',  clase: 'denegada' }
  return                   { label: 'Pendiente', clase: 'pendiente' }
}

/* ── Iconos ── */
const IconoPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
)

const IconoBasura = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
)

const IconoCerrar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const IconoVideoVacio = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="15" height="13" rx="2" />
    <path d="M17 10l5-2v8l-5-2V10z" />
    <line x1="7" y1="12" x2="11" y2="12" />
  </svg>
)

/* ── Modal: reproducción de video ── */
const VideoModal = ({ combo, onClose }) => {
  if (!combo) return null
  return (
    <div className="vc-modal-overlay" onClick={onClose}>
      <div className="vc-modal-box" onClick={e => e.stopPropagation()}>
        <div className="vc-modal-header">
          <h3>{getNombreCliente(combo.idCliente)}</h3>
          <button className="vc-modal-close" onClick={onClose}><IconoCerrar /></button>
        </div>
        {combo.urlVideo ? (
          <video controls autoPlay src={combo.urlVideo} />
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            Sin video disponible
          </div>
        )}
      </div>
    </div>
  )
}

/* Modal: detalles del combo (solo lectura; el cliente es quien acepta o rechaza el video) */
const DetalleModal = ({ combo, onClose }) => {
  if (!combo) return null
  const { label, clase } = getStatusInfo(combo.status)

  return (
    <div className="vc-modal-overlay" onClick={onClose}>
      <div className="vc-detalle-modal" onClick={e => e.stopPropagation()}>
        <span className="vc-detalle-bar" />
        <h2>Detalles del combo</h2>

        <div className="vc-detalle-row">
          <div className="vc-detalle-label">Cliente</div>
          <div className="vc-detalle-val">{getNombreCliente(combo.idCliente)}</div>
        </div>
        <div className="vc-detalle-row">
          <div className="vc-detalle-label">Fecha</div>
          <div className="vc-detalle-val">{formatFecha(combo.createdAt)}</div>
        </div>
        <div className="vc-detalle-row">
          <div className="vc-detalle-label">Estado actual</div>
          <div className="vc-detalle-val">
            <span className={`vc-badge ${clase}`}>
              <span className="vc-badge-dot" />
              {label}
            </span>
          </div>
        </div>

        <div className="vc-detalle-actions">
          <button className="vc-btn-cerrar" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

/* Modal: confirmación de eliminación  */
const ConfirmEliminarModal = ({ combo, onClose, onConfirm }) => (
  <div className="vc-modal-overlay" onClick={onClose}>
    <div className="vc-confirm-modal" onClick={e => e.stopPropagation()}>
      <div className="vc-confirm-icon">!</div>
      <h2>Confirmación</h2>
      <p>
        ¿Estás segura que deseas eliminar el combo de{' '}
        <strong>{getNombreCliente(combo.idCliente)}</strong>?
      </p>
      <div className="vc-confirm-btns">
        <button className="pm-btn pm-btn-confirm" onClick={onConfirm}>
          Sí, eliminar
        </button>
        <button className="pm-btn pm-btn-cancel" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  </div>
)

/* Modal: agregar nuevo video combo */
const NuevoComboModal = ({ onClose, onCrear }) => {
  const [clientes, setClientes] = useState([])
  const [bolsas, setBolsas] = useState([])

  // Cliente elegido y buscador de clientes
  const [clienteSel, setClienteSel] = useState(null)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const buscadorRef = useRef(null)

  const [form, setForm] = useState({
    idProducto: '',
    mensaje: '',
    direccion: '',
  })
  // Si el usuario escribió el mensaje a mano, ya no se sobrescribe al cambiar de cliente
  const [mensajeEditado, setMensajeEditado] = useState(false)

  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  // Carga la lista de clientes y de bolsas de la suerte.
  // Las bolsas vienen de su propio endpoint /api/bolsas (no de /productos).
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resClientes, resBolsas] = await Promise.all([
          fetch(`${BASE_URL}/clientes`, { credentials: 'include' }),
          fetch(`${BASE_URL}/bolsas`, { credentials: 'include' }),
        ])
        const dataClientes = await resClientes.json()
        const dataBolsas = await resBolsas.json()
        setClientes(Array.isArray(dataClientes) ? dataClientes : [])
        setBolsas(Array.isArray(dataBolsas) ? dataBolsas : [])
      } catch {
        setClientes([])
        setBolsas([])
      }
    }
    cargarDatos()
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

  // El mensaje se marca como editado a mano (salvo que lo dejen vacío)
  const handleMensajeChange = (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, mensaje: value }))
    setMensajeEditado(value.trim() !== '')
  }

  // Sugerencias de clientes: coinciden por nombre, apellido o correo
  const sugerencias = busquedaCliente.trim()
    ? clientes
        .filter((c) =>
          normalizar(`${c.name || ''} ${c.lastName || ''} ${c.email || ''}`).includes(
            normalizar(busquedaCliente.trim())
          )
        )
        .slice(0, 8)
    : []

  const elegirCliente = (cliente) => {
    setClienteSel(cliente)
    setBusquedaCliente('')
    setMostrarSugerencias(false)
    // Genera el mensaje con el nombre del cliente (si no lo escribieron a mano)
    if (!mensajeEditado) {
      setForm((prev) => ({ ...prev, mensaje: mensajeParaCliente(cliente) }))
    }
  }

  const quitarCliente = () => {
    setClienteSel(null)
    if (!mensajeEditado) {
      setForm((prev) => ({ ...prev, mensaje: '' }))
    }
  }

  const handleBuscadorKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (sugerencias[0]) elegirCliente(sugerencias[0])
    }
    if (e.key === 'Escape') setMostrarSugerencias(false)
  }

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    setError('')
    if (!clienteSel?._id) {
      setError('Selecciona un cliente.')
      return
    }
    if (!videoFile) {
      setError('Selecciona un video.')
      return
    }

    setGuardando(true)
    try {
      await onCrear({ ...form, idCliente: clienteSel._id, videoFile })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  // Estilo de las iniciales del cliente (avatar)
  const estiloAvatar = {
    fontSize: 14,
    fontWeight: 700,
    color: '#194b2d',
    background: '#c8ecd3',
  }

  return (
    <div className="vc-modal-overlay" onClick={onClose}>
      <div
        className="vc-detalle-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <span className="vc-detalle-bar" />
        <h2>Nuevo video combo</h2>

        {/* Selector/preview del video */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed #c4d4c8',
            borderRadius: 12,
            background: '#f4f7f5',
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          {videoPreview ? (
            <video src={videoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
          ) : (
            <span style={{ color: '#9cad9d', fontSize: '0.9rem' }}>Toca para elegir un video</span>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={handleVideoChange}
        />

        {/* CLIENTE (BUSCADOR CON SUGERENCIAS) */}
        <div className="vc-detalle-row">
          <div className="vc-detalle-label">Cliente</div>

          {clienteSel ? (
            <div className="pm-producto-elegido">
              <div className="pm-sugerencia-img" style={estiloAvatar}>
                {getInitials(clienteSel.name, clienteSel.lastName)}
              </div>

              <div className="pm-sugerencia-info">
                <strong>{getNombreCliente(clienteSel)}</strong>
                {clienteSel.email && <span style={{ fontWeight: 400, color: '#6b7d74' }}>{clienteSel.email}</span>}
              </div>

              <button
                type="button"
                className="pm-producto-quitar"
                title="Cambiar cliente"
                onClick={quitarCliente}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="pm-buscador" ref={buscadorRef}>
              <input
                type="text"
                className="pm-input"
                placeholder="Escribe el nombre del cliente..."
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value)
                  setMostrarSugerencias(true)
                }}
                onFocus={() => setMostrarSugerencias(true)}
                onKeyDown={handleBuscadorKeyDown}
                autoComplete="off"
              />

              {mostrarSugerencias && busquedaCliente.trim() && (
                <div className="pm-sugerencias">
                  {sugerencias.length === 0 ? (
                    <div className="pm-sugerencia-vacia">No se encontraron clientes</div>
                  ) : (
                    sugerencias.map((cliente) => (
                      <button
                        key={cliente._id}
                        type="button"
                        className="pm-sugerencia"
                        onClick={() => elegirCliente(cliente)}
                      >
                        <div className="pm-sugerencia-img" style={estiloAvatar}>
                          {getInitials(cliente.name, cliente.lastName)}
                        </div>

                        <div className="pm-sugerencia-info">
                          <strong>{getNombreCliente(cliente)}</strong>
                          {cliente.email && (
                            <span style={{ fontWeight: 400, color: '#6b7d74' }}>{cliente.email}</span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="vc-detalle-row">
          <div className="vc-detalle-label">Bolsa de la suerte</div>
          <select name="idProducto" value={form.idProducto} onChange={handleChange} className="pm-input">
            <option value="">Selecciona una bolsa</option>
            {bolsas.map((b) => (
              <option key={b._id} value={b._id}>{b.nombre}</option>
            ))}
          </select>
        </div>

        <div className="vc-detalle-row">
          <div className="vc-detalle-label">Mensaje para el cliente</div>
          <textarea
            name="mensaje"
            value={form.mensaje}
            onChange={handleMensajeChange}
            className="pm-input pm-textarea"
            placeholder="Selecciona un cliente y el mensaje se generará automáticamente"
          />
        </div>

        {error && <p style={{ color: '#991b1b', fontSize: '0.85rem' }}>{error}</p>}

        <div className="vc-detalle-actions">
          <button className="vc-btn-cerrar" onClick={onClose}>Cancelar</button>
          <button className="vc-btn-aceptar" onClick={handleSubmit} disabled={guardando}>
            {guardando ? 'Subiendo...' : 'Subir video'}
          </button>
        </div>
      </div>
    </div>
  )
}


const VideosCombos = () => {
  const {
    combos,
    loading,
    error,
    busqueda,
    setBusqueda,
    filtroStatus,
    setFiltroStatus,
    fetchCombos,
    crearCombo,
    eliminarCombo,
  } = useVideosCombos()

  const [notifAbierta, setNotifAbierta] = useState(false)
  const [modalVideo, setModalVideo]     = useState(null)
  const [modalDetalle, setModalDetalle] = useState(null)
  const [modalEliminar, setModalEliminar] = useState(null)
  const [modalNuevo, setModalNuevo] = useState(false)

  /* Acciones CRUD */
  const handleEliminar = async () => {
    try {
      await eliminarCombo(modalEliminar._id)
      setModalEliminar(null)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleCrear = async (datos) => {
    await crearCombo(datos)
  }

  const FILTROS = ['Todos', 'Aceptada', 'Denegada', 'Pendiente']

  return (
    <div className="pm-page">
      <Sidebar />

      <main className="pm-main">
        <Nav openNotifications={() => setNotifAbierta(true)} />

        {/*  Encabezado */}
        <div className="pm-header">
          <div className="pm-title-wrap">
            <h1 className="pm-title">Videos combos</h1>
            <div className="pm-title-underline" />
          </div>
          <div className="pm-header-actions">
            <button className="pm-btn pm-btn-dark pm-btn-nuevo" onClick={() => setModalNuevo(true)}>
              <span>＋</span> Nuevo video
            </button>
          </div>
        </div>

        {/* Toolbar: filtros + búsqueda*/}
        <div className="vc-toolbar">
          <div className="vc-filter-group">
            {FILTROS.map((f) => (
              <button
                key={f}
                className={`vc-filter-btn ${filtroStatus === f ? 'activo' : ''}`}
                onClick={() => setFiltroStatus(f)}
              >
                {f}
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
              placeholder="Buscar por cliente o video"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ width: 280 }}
            />
          </div>
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="pm-error">
            <span>⚠ {error}</span>
            <button onClick={fetchCombos}>Reintentar</button>
          </div>
        )}

        {/*Lista */}
        {!error && (
          <div className="vc-list">

            {loading && (
              <div className="vc-empty">
                <p>Cargando videos combos…</p>
              </div>
            )}

            {!loading && combos.length === 0 && (
              <div className="vc-empty">
                <IconoVideoVacio />
                <p>
                  {busqueda.trim()
                    ? `No se encontraron resultados para "${busqueda.trim()}".`
                    : 'No se encontraron videos combos.'}
                </p>
              </div>
            )}

            {!loading && combos.map((combo) => {
              const { label, clase } = getStatusInfo(combo.status)
              const nombreCliente = getNombreCliente(combo.idCliente)

              return (
                <div className="vc-card" key={combo._id}>

                  {/* Miniatura del video */}
                  <div
                    className="vc-video-thumb"
                    onClick={() => setModalVideo(combo)}
                    title="Ver video"
                  >
                    {combo.urlVideo ? (
                      <>
                        <video src={combo.urlVideo} muted preload="metadata" />
                        <div className="vc-play-overlay">
                          <IconoPlay />
                        </div>
                      </>
                    ) : (
                      <div className="vc-video-no-url">Sin video</div>
                    )}
                  </div>

                  {/* Info del combo */}
                  <div className="vc-info">
                    <p className="vc-combo-nombre">{getNombreVideo(combo)}</p>
                    <div className="vc-meta">
                      <span><strong>Cliente:</strong> {nombreCliente}</span>
                      <span><strong>Fecha:</strong> {formatFecha(combo.createdAt)}</span>
                    </div>
                  </div>

                  {/* Badge de status */}
                  <div className="vc-badge-wrap">
                    <span className={`vc-badge ${clase}`}>
                      <span className="vc-badge-dot" />
                      {label}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="vc-acciones">
                    <button
                      className="vc-btn-detalle"
                      onClick={() => setModalDetalle(combo)}
                    >
                      Ver detalles &gt;
                    </button>
                    <button
                      className="vc-icon-btn"
                      title="Eliminar"
                      onClick={() => setModalEliminar(combo)}
                    >
                      <IconoBasura />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/*Modales */}
      {modalVideo && (
        <VideoModal combo={modalVideo} onClose={() => setModalVideo(null)} />
      )}

      {modalDetalle && (
        <DetalleModal
          combo={modalDetalle}
          onClose={() => setModalDetalle(null)}
        />
      )}

      {modalEliminar && (
        <ConfirmEliminarModal
          combo={modalEliminar}
          onClose={() => setModalEliminar(null)}
          onConfirm={handleEliminar}
        />
      )}

      {modalNuevo && (
        <NuevoComboModal
          onClose={() => setModalNuevo(false)}
          onCrear={handleCrear}
        />
      )}

      <NotificacionesModal abierto={notifAbierta} onCerrar={() => setNotifAbierta(false)} />
    </div>
  )
}

export default VideosCombos;