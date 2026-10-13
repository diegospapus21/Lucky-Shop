import { useState, useEffect, useCallback } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL + '/videosCombo'

// Quita tildes y pasa a minúsculas para buscar mejor
const normalizar = (t) =>
  String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/**
 * Hook para el panel admin: trae todos los combos, permite filtrar por
 * estado y buscar por cliente o por nombre del video, además de crear,
 * actualizar y eliminar combos.
 */
export function useVideosCombos() {
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('Todos') // Todos | Aceptada | Denegada | Pendiente

  // Trae todos los combos desde el backend
  const fetchCombos = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(BASE_URL, { credentials: 'include' })
      if (!res.ok) throw new Error('Error al obtener los videos combo')
      const data = await res.json()
      setCombos(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los videos combo')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCombos()
  }, [fetchCombos])

  // Crea un combo nuevo, subiendo el video como FormData (multipart)
  const crearCombo = useCallback(async ({ idCliente, idProducto, mensaje, direccion, videoFile }) => {
    const formData = new FormData()
    formData.append('idCliente', idCliente)
    if (idProducto) formData.append('idProducto', idProducto)
    if (mensaje) formData.append('mensaje', mensaje)
    if (direccion) formData.append('direccion', direccion)
    formData.append('video', videoFile)

    const res = await fetch(BASE_URL, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'No se pudo crear el video combo')
    setCombos((prev) => [data, ...prev])
    return data
  }, [])

  // Actualiza el status desde el panel admin (aceptar/denegar/reiniciar)
  const actualizarStatus = useCallback(async (id, status) => {
    const res = await fetch(`${BASE_URL}/${id}/status-admin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'No se pudo actualizar el estado')
    setCombos((prev) => prev.map((c) => (c._id === id ? data : c)))
    return data
  }, [])

  // Elimina un combo
  const eliminarCombo = useCallback(async (id) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) throw new Error('No se pudo eliminar el video combo')
    setCombos((prev) => prev.filter((c) => c._id !== id))
  }, [])

  // Filtra por estado y por texto de búsqueda (nombre del cliente o nombre del video)
  const combosFiltrados = combos.filter((c) => {
    const estadoTexto = c.status === true ? 'Aceptada' : c.status === false ? 'Denegada' : 'Pendiente'
    const coincideEstado = filtroStatus === 'Todos' || estadoTexto === filtroStatus

    const q = normalizar(busqueda.trim())
    if (!q) return coincideEstado

    const nombreCliente = normalizar(`${c.idCliente?.name || ''} ${c.idCliente?.lastName || ''}`)
    const nombreVideo = normalizar(c.idProducto?.nombre || 'Combo suerte')
    const coincideBusqueda = nombreCliente.includes(q) || nombreVideo.includes(q)

    return coincideEstado && coincideBusqueda
  })

  return {
    combos: combosFiltrados,
    totalCombos: combos.length,
    loading,
    error,
    busqueda,
    setBusqueda,
    filtroStatus,
    setFiltroStatus,
    fetchCombos,
    crearCombo,
    actualizarStatus,
    eliminarCombo,
  }
}