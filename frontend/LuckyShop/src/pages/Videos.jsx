// Videos.jsx — página pública donde el cliente ve sus "videos combo" y decide aceptar/denegar
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const BASE_URL = import.meta.env.VITE_API_URL + '/videosCombo'

const IconoCerrar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const IconoPlay = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M8 5v14l11-7z" />
  </svg>
)

const formatFecha = (fecha) => {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}

const Videos = () => {
  const { cliente } = useAuth()

  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [videoAbierto, setVideoAbierto] = useState(null) // combo cuyo video se está reproduciendo
  const [procesando, setProcesando] = useState(null) // id del combo en el que se está actuando
  const [modalConfirmacion, setModalConfirmacion] = useState({
    isOpen: false,
    comboId: null,
    status: null,
    title: '',
    message: '',
    confirmText: '',
    type: 'accept',
  })
  const [modalAyudaAbierto, setModalAyudaAbierto] = useState(false)

  // Carga los videos combo del cliente autenticado
  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${BASE_URL}/mios`, { credentials: 'include' })
        if (!res.ok) throw new Error('Error al obtener tus videos')
        const data = await res.json()
        setVideos(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'No se pudieron cargar tus videos')
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [])

  // Abre el modal para confirmar la acción de aceptar o negar
  const solicitarConfirmacion = (combo, status) => {
    // Si ya fue respondido, no permite volver a responder
    if (combo.status !== null && combo.status !== undefined) return

    if (status === true) {
      setModalConfirmacion({
        isOpen: true,
        comboId: combo._id,
        status: true,
        title: '¿Aceptar este video combo?',
        message: '¿Estás de acuerdo con el video recibido y deseas confirmar la aceptación de este combo? Ten en cuenta que una vez aceptado no podrás cambiar tu opción.',
        confirmText: 'Sí, aceptar',
        type: 'accept',
      })
    } else {
      setModalConfirmacion({
        isOpen: true,
        comboId: combo._id,
        status: false,
        title: '¿Negar este video combo?',
        message: '¿Estás seguro de que deseas negar este video combo? Ten en cuenta que una vez negado no podrás cambiar tu opción.',
        confirmText: 'Sí, negar',
        type: 'danger',
      })
    }
  }

  // Marca un combo como aceptado o denegado
  const handleResponder = async (id, status) => {
    setProcesando(id)
    try {
      const res = await fetch(`${BASE_URL}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'No se pudo actualizar tu respuesta')
      setVideos((prev) => prev.map((v) => (v._id === id ? data : v)))
      setModalConfirmacion((prev) => ({ ...prev, isOpen: false }))
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setProcesando(null)
    }
  }

  const handleConfirmarAccion = async () => {
    if (!modalConfirmacion.comboId || modalConfirmacion.status === null) return
    await handleResponder(modalConfirmacion.comboId, modalConfirmacion.status)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Flecha para regresar al inicio con el título y botón "!" en la esquina superior derecha */}
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-4 w-full flex items-center justify-between">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-gray-900 hover:text-pink-500 font-bold text-2xl sm:text-3xl transition-colors"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Videos
        </Link>

        {/* Icono "!" encerrado en un círculo en la esquina superior derecha */}
        <button
          type="button"
          onClick={() => setModalAyudaAbierto(true)}
          className="w-10 h-10 rounded-full border-2 border-gray-400 hover:border-pink-500 text-gray-700 hover:text-pink-600 bg-white hover:bg-pink-50 transition-all flex items-center justify-center font-bold text-xl cursor-pointer shadow-sm group"
          title="¿Opción marcada incorrecta? Más información"
          aria-label="Ayuda e información de contacto"
        >
          <span className="leading-none group-hover:scale-110 transition-transform">!</span>
        </button>
      </div>

      <div className="max-w-5xl w-full mx-auto px-6 py-8 flex-1 space-y-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-center text-red-500 py-16">{error}</p>
        ) : videos.length === 0 ? (
          <p className="text-center text-gray-400 py-16">
            Todavía no tienes videos de combos. Cuando la tienda te envíe uno, aparecerá aquí.
          </p>
        ) : (
          videos.map((combo) => {
            const yaRespondio = combo.status === true || combo.status === false
            return (
              <div key={combo._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b border-gray-100 pb-8">
                {/* Miniatura del video, hace clic para reproducirlo */}
                <button
                  onClick={() => setVideoAbierto(combo)}
                  className="relative w-40 h-52 rounded-2xl overflow-hidden bg-gray-900 flex-shrink-0 group"
                >
                  {combo.urlVideo ? (
                    <video src={combo.urlVideo} className="w-full h-full object-cover" muted preload="metadata" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Sin video
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center text-white group-hover:bg-black/40 transition-colors">
                    <IconoPlay />
                  </div>
                </button>

                {/* Mensaje personalizado, fecha y estado de envío */}
                <div className="flex-1">
                  <p className="text-lg text-gray-800 leading-snug">
                    {combo.mensaje || `${cliente?.name || 'Hola'} tú combo está listo, puedes ver que suerte te tocó hoy`}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">{formatFecha(combo.createdAt)}</p>

                  {/* Aviso de proceso de envío abajo de la fecha (solo si fue aceptado) */}
                  {combo.status === true && combo.enProcesoEnvio && (
                    <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold">
                      <span>Su pedido ya se está enviando</span>
                    </div>
                  )}
                </div>

                {/* Botones: Aceptar / Negar / Ver video */}
                <div className="flex flex-col gap-2 w-full sm:w-40">
                  <button
                    onClick={() => {
                      if (!yaRespondio) solicitarConfirmacion(combo, true)
                    }}
                    disabled={procesando === combo._id || yaRespondio}
                    className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                      combo.status === true
                        ? 'bg-green-700 text-white cursor-default'
                        : combo.status === false
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                        : 'bg-green-800 text-white hover:bg-green-900 cursor-pointer'
                    }`}
                  >
                    {combo.status === true ? '✓ Aceptado' : 'Aceptar'}
                  </button>
                  <button
                    onClick={() => {
                      if (!yaRespondio) solicitarConfirmacion(combo, false)
                    }}
                    disabled={procesando === combo._id || yaRespondio}
                    className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                      combo.status === false
                        ? 'bg-red-700 text-white cursor-default'
                        : combo.status === true
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                        : 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                    }`}
                  >
                    {combo.status === false ? '✕ Negado' : 'Negar'}
                  </button>
                  <button
                    onClick={() => setVideoAbierto(combo)}
                    className="py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Ver video
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de confirmación para aceptar o negar combo */}
      <ConfirmModal
        isOpen={modalConfirmacion.isOpen}
        title={modalConfirmacion.title}
        message={modalConfirmacion.message}
        confirmText={modalConfirmacion.confirmText}
        cancelText="Cancelar"
        type={modalConfirmacion.type}
        isLoading={procesando === modalConfirmacion.comboId}
        onConfirm={handleConfirmarAccion}
        onCancel={() => {
          if (!procesando) {
            setModalConfirmacion((prev) => ({ ...prev, isOpen: false }))
          }
        }}
      />

      {/* Modal de ayuda: Opción marcada incorrecta */}
      {modalAyudaAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setModalAyudaAbierto(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => setModalAyudaAbierto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors"
              aria-label="Cerrar modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icono "!" en círculo */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-pink-600 font-extrabold text-2xl border-2 border-pink-200 shadow-sm">
              !
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ¿Marcaste una opción incorrecta?
            </h3>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Si la opción marcada es incorrecta, por favor contáctanos a través de nuestra página de contactos para que podamos ayudarte a corregirla.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setModalAyudaAbierto(false)}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              <Link
                to="/contactanos"
                onClick={() => setModalAyudaAbierto(false)}
                className="flex-1 rounded-xl bg-pink-500 hover:bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors text-center flex items-center justify-center shadow-sm"
              >
                Página de contactos
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal de reproducción del video */}
      {videoAbierto && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-5" onClick={() => setVideoAbierto(null)}>
          <div className="bg-black rounded-2xl overflow-hidden max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setVideoAbierto(null)}
              className="absolute top-3 right-3 z-10 text-white bg-black/40 rounded-full p-1.5 hover:bg-black/60"
            >
              <IconoCerrar />
            </button>
            {videoAbierto.urlVideo ? (
              <video src={videoAbierto.urlVideo} controls autoPlay className="w-full max-h-[70vh]" />
            ) : (
              <p className="text-white text-center py-16">Sin video disponible</p>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default Videos;