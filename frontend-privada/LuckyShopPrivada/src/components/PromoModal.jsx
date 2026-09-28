// PromocionModal.jsx — modal para crear una promoción (admin, estilo pm-)
import { useState, useEffect } from 'react'

// URL base de la API backend
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

// Componente modal para el registro de nuevas promociones
const PromoModal = ({ onClose, onCreated }) => {
  // Lista de productos obtenidos de la API para el selector
  const [productos, setProductos] = useState([])
  
  // Estado local para almacenar los datos del formulario
  const [form, setForm] = useState({
    idProducto: '',
    descuento: '',
    fechaInicio: '',
    fechaFin: '',
  })
  
  // Estados para gestionar la carga al guardar y mensajes de validación/error
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Efecto para obtener la lista de productos activos al montar el componente
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await fetch(`${BASE_URL}/productos?estado=activo`, { credentials: 'include' })
        const data = await res.json()
        setProductos(Array.isArray(data) ? data : [])
      } catch {
        setProductos([])
      }
    }
    fetchProductos()
  }, [])

  // Manejador genérico para actualizar los valores de las entradas del formulario
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Valida los campos e interactúa con la API para crear la promoción
  const handleSubmit = async () => {
    setError('')
    // Validación de campos vacíos
    if (!form.idProducto || !form.descuento || !form.fechaInicio || !form.fechaFin) {
      setError('Completa todos los campos.')
      return
    }
    // Validación del rango permitido para el porcentaje
    if (Number(form.descuento) < 1 || Number(form.descuento) > 99) {
      setError('El descuento debe estar entre 1 y 99.')
      return
    }
    // Validación de coherencia de fechas
    if (new Date(form.fechaFin) < new Date(form.fechaInicio)) {
      setError('La fecha fin no puede ser anterior a la de inicio.')
      return
    }

    setSaving(true)
    try {
      // Petición HTTP POST para guardar la promoción en base de datos
      const res = await fetch(`${BASE_URL}/promociones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          idProducto: form.idProducto,
          descuento: Number(form.descuento),
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'No se pudo crear la promoción')
      
      // Notifica la creación exitosa y cierra el modal
      onCreated?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    // Fondo transparente del modal con cierre al hacer clic exterior
    <div className="pm-overlay" onClick={onClose}>
      {/* Contenedor principal del modal; detiene la propagación de eventos */}
      <div className="pm-modal pm-form-modal" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado con estilo visual */}
        <div className="pm-form-header">
          <span className="pm-detalles-bar"></span>
          <h2>Nueva promoción</h2>
        </div>

        {/* Campos de entrada del formulario */}
        <div className="pm-form-fields">
          {/* Selección de producto */}
          <div className="pm-field-group">
            <label>Producto</label>
            <select name="idProducto" value={form.idProducto} onChange={handleChange} className="pm-input">
              <option value="">Selecciona un producto</option>
              {productos.map((p) => (
                <option key={p._id} value={p._id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Porcentaje de descuento */}
          <div className="pm-field-group">
            <label>Descuento (%)</label>
            <input
              type="number" name="descuento" min="1" max="99"
              value={form.descuento} onChange={handleChange}
              className="pm-input" placeholder="Ej. 20"
            />
          </div>

          {/* Fila con las fechas de inicio y fin */}
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

          {/* Muestra mensajes de error de validación o del servidor */}
          {error && (
            <p style={{ color: '#991b1b', fontSize: '0.85rem', margin: 0 }}>{error}</p>
          )}
        </div>

        {/* Botones para cancelar o procesar el registro */}
        <div className="pm-form-actions">
          <button className="pm-btn pm-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="pm-btn pm-btn-dark" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear promoción'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PromoModal;