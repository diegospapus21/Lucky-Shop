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

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const ESTADOS = [
  'activo',
  'inactivo',
  'agotado'
]

// ============================================================
// OBTENER NOMBRE DEL PRODUCTO
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

// ============================================================
// OBTENER PRECIO DEL PRODUCTO
// ============================================================

const obtenerPrecioProducto = (producto) => {
  const precio =
    producto?.precio ??
    producto?.price ??
    producto?.productPrice ??
    0

  return Number(precio || 0).toFixed(2)
}

// ============================================================
// OBTENER IMAGEN DEL PRODUCTO
//
// Se revisan varios nombres de propiedades para evitar
// problemas dependiendo de cómo esté construido MongoDB.
// ============================================================

const obtenerImagenProducto = (producto) => {

  if (!producto) {
    return null
  }

  // ----------------------------------------------------------
  // 1. imagen como string
  // ----------------------------------------------------------

  if (
    typeof producto.imagen === 'string' &&
    producto.imagen.trim() !== ''
  ) {
    return producto.imagen
  }

  // ----------------------------------------------------------
  // 2. image como string
  // ----------------------------------------------------------

  if (
    typeof producto.image === 'string' &&
    producto.image.trim() !== ''
  ) {
    return producto.image
  }

  // ----------------------------------------------------------
  // 3. imageUrl
  // ----------------------------------------------------------

  if (
    typeof producto.imageUrl === 'string' &&
    producto.imageUrl.trim() !== ''
  ) {
    return producto.imageUrl
  }

  // ----------------------------------------------------------
  // 4. imagenUrl
  // ----------------------------------------------------------

  if (
    typeof producto.imagenUrl === 'string' &&
    producto.imagenUrl.trim() !== ''
  ) {
    return producto.imagenUrl
  }

  // ----------------------------------------------------------
  // 5. url
  // ----------------------------------------------------------

  if (
    typeof producto.url === 'string' &&
    producto.url.trim() !== ''
  ) {
    return producto.url
  }

  // ----------------------------------------------------------
  // 6. foto
  // ----------------------------------------------------------

  if (
    typeof producto.foto === 'string' &&
    producto.foto.trim() !== ''
  ) {
    return producto.foto
  }

  // ----------------------------------------------------------
  // 7. image.secure_url
  // ----------------------------------------------------------

  if (
    producto.image &&
    typeof producto.image === 'object'
  ) {

    if (
      typeof producto.image.secure_url === 'string'
    ) {
      return producto.image.secure_url
    }

    if (
      typeof producto.image.url === 'string'
    ) {
      return producto.image.url
    }
  }

  // ----------------------------------------------------------
  // 8. imagen.secure_url
  // ----------------------------------------------------------

  if (
    producto.imagen &&
    typeof producto.imagen === 'object'
  ) {

    if (
      typeof producto.imagen.secure_url === 'string'
    ) {
      return producto.imagen.secure_url
    }

    if (
      typeof producto.imagen.url === 'string'
    ) {
      return producto.imagen.url
    }
  }

  // ----------------------------------------------------------
  // 9. photo.url
  // ----------------------------------------------------------

  if (
    producto.photo &&
    typeof producto.photo === 'object'
  ) {

    if (
      typeof producto.photo.secure_url === 'string'
    ) {
      return producto.photo.secure_url
    }

    if (
      typeof producto.photo.url === 'string'
    ) {
      return producto.photo.url
    }
  }

  // ----------------------------------------------------------
  // 10. picture.url
  // ----------------------------------------------------------

  if (
    producto.picture &&
    typeof producto.picture === 'object'
  ) {

    if (
      typeof producto.picture.secure_url === 'string'
    ) {
      return producto.picture.secure_url
    }

    if (
      typeof producto.picture.url === 'string'
    ) {
      return producto.picture.url
    }
  }

  return null
}

// ============================================================
// ICONO LAPIZ
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

// ============================================================
// ICONO BASURA
// ============================================================

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

// ============================================================
// ICONO BOLSA
// ============================================================

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

const ConfirmModal = ({
  mensaje,
  onConfirm,
  onCancel
}) => {

  return (
    <div
      className="pm-overlay"
      onClick={onCancel}
    >

      <div
        className="pm-modal pm-confirm-modal"
        onClick={e => e.stopPropagation()}
      >

        <div className="pm-confirm-icon">
          <span>!</span>
        </div>

        <h2 className="pm-confirm-title">
          Confirmación
        </h2>

        <p className="pm-confirm-msg">
          {mensaje}
        </p>

        <div className="pm-confirm-btns">

          <button
            className="pm-btn pm-btn-confirm"
            onClick={onConfirm}
          >
            Sí, estoy segura
          </button>

          <button
            className="pm-btn pm-btn-cancel"
            onClick={onCancel}
          >
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

const SuccessModal = ({
  mensaje,
  onClose
}) => {

  return (
    <div
      className="pm-overlay"
      onClick={onClose}
    >

      <div
        className="pm-modal pm-success-modal"
        onClick={e => e.stopPropagation()}
      >

        <div className="pm-success-icon">

          <svg
            viewBox="0 0 52 52"
            fill="none"
          >

            <circle
              cx="26"
              cy="26"
              r="25"
              stroke="#22c55e"
              strokeWidth="2"
            />

            <path
              d="M14 26l9 9 15-18"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

          </svg>

        </div>

        <h2 className="pm-success-title">
          ¡Completado!
        </h2>

        <p className="pm-success-msg">
          {mensaje}
        </p>

        <button
          className="pm-btn pm-btn-success-close"
          onClick={onClose}
        >
          Aceptar
        </button>

      </div>

    </div>
  )
}

// ============================================================
// MODAL DETALLES
// ============================================================

const DetallesModal = ({
  bolsa,
  onClose,
  onSelectVariante
}) => {

  if (!bolsa) {
    return null
  }

  const cantidad = bolsa.cantidadUnidades || 0;

  return (

    <div
      className="pm-overlay"
      onClick={onClose}
    >

      <div
        className="pm-modal pm-form-modal"
        onClick={e => e.stopPropagation()}
      >

        <div className="pm-form-header">

          <span className="pm-detalles-bar"></span>

          <h2>
            Detalles de bolsa
          </h2>

        </div>

        <div className="pm-form-body">

          <div className="pm-detalle-col-izq">

            <div className="pm-form-img-box pm-form-img-box-static">

              {bolsa.imagenPresentacion ? (

                <img
                  src={bolsa.imagenPresentacion}
                  alt={bolsa.nombre}
                />

              ) : (

                <span className="pm-no-img">
                  Sin imagen
                </span>

              )}

            </div>

            <div className="pm-field-group">

              <label>
                Descripción
              </label>

              <p className="pm-info-val">
                {bolsa.descripcion || '—'}
              </p>

            </div>

          </div>

          <div className="pm-form-fields">

            <div className="pm-field-group">

              <label>
                Nombre de bolsa
              </label>

              <p className="pm-info-val">
                {bolsa.nombre || 'Sin nombre'}
              </p>

            </div>

            <div className="pm-field-group">

              <label>
                Categoría
              </label>

              <p className="pm-info-val">
                Bolsa de la Suerte
              </p>

            </div>

            <div className="pm-field-group">

              <label>
                Cantidad
              </label>

              <p className="pm-info-val">
                {cantidad} productos
              </p>

            </div>

            <div className="pm-detalle-variantes">
              {/* Variantes eliminadas porque la cantidad es libre */}
            </div>

          </div>

        </div>

        <div className="pm-form-actions">

          <button
            className="pm-btn pm-btn-dark"
            onClick={onClose}
          >
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

  const cantidadInicial =
    bolsa?.cantidadUnidades || 1;

  const productosIniciales =
    Array.isArray(bolsa?.productos)
      ? bolsa.productos
      : []

  const [form, setForm] = useState({

    nombre:
      bolsa?.nombre || '',

    precio:
      bolsa?.precio || '',

    stock:
      bolsa?.stock || 1,

    descripcion:
      bolsa?.descripcion || '',

    categoria:
      'Bolsa de la Suerte',

    cantidadUnidades:
      cantidadInicial,

    estado:
      bolsa?.estado || 'activo',

    productosSeleccionados:
      productosIniciales
  })

  const [imagenPreview, setImagenPreview] =
    useState(
      bolsa?.imagenPresentacion || null
    )

  const [imageFile, setImageFile] =
    useState(null)

  const fileRef = useRef(null)

  // ==========================================================
  // CAMBIAR INPUT
  // ==========================================================

  const handleChange = e => {

    const {
      name,
      value
    } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // ==========================================================
  // CAMBIAR TAMAÑO
  // ==========================================================

  const handleCantidadUnidades = e => {
    const value = e.target.value;
    if (value === '') {
      setForm(prev => ({ ...prev, cantidadUnidades: '' }));
      return;
    }
    const cantidad = Number(value);
    if (cantidad < 1) return;

    setForm(prev => {
      let seleccionados = [...prev.productosSeleccionados];
      if (seleccionados.length > cantidad) {
        seleccionados = seleccionados.slice(0, cantidad);
      }
      return {
        ...prev,
        cantidadUnidades: cantidad,
        productosSeleccionados: seleccionados
      }
    });
  }

  // ==========================================================
  // SELECCIONAR PRODUCTO
  // ==========================================================

  const handleProductoSeleccionado =
    producto => {

      setForm(prev => {

        const actuales = [
          ...prev.productosSeleccionados
        ]

        const idProducto =
          String(producto._id)

        const existe =
          actuales.some(
            item =>
              String(
                item?._id || item
              ) === idProducto
          )

        // -----------------------------------------------
        // QUITAR
        // -----------------------------------------------

        if (existe) {

          return {
            ...prev,

            productosSeleccionados:
              actuales.filter(
                item =>
                  String(
                    item?._id || item
                  ) !== idProducto
              )
          }
        }

        // -----------------------------------------------
        // NO PERMITIR SUPERAR 6 / 10
        // -----------------------------------------------

        if (
          actuales.length >=
          Number(
            prev.cantidadUnidades
          )
        ) {

          alert(
            `No puedes seleccionar más de ${prev.cantidadUnidades} productos.`
          )

          return prev
        }

        // -----------------------------------------------
        // AGREGAR
        // -----------------------------------------------

        return {
          ...prev,

          productosSeleccionados:
            [
              ...actuales,
              producto
            ]
        }
      })
    }

  // ==========================================================
  // VERIFICAR SELECCIONADO
  // ==========================================================

  const productoSeleccionado = id => {

    return form.productosSeleccionados.some(
      producto =>
        String(
          producto?._id || producto
        ) === String(id)
    )
  }

  // ==========================================================
  // CAMBIAR IMAGEN
  // ==========================================================

  const handleImageChange = e => {

    const file =
      e.target.files?.[0]

    if (!file) {
      return
    }

    setImageFile(file)

    setImagenPreview(
      URL.createObjectURL(file)
    )
  }

  // ==========================================================
  // GUARDAR
  // ==========================================================

  const handleSubmit = () => {

    if (!form.nombre.trim()) {

      alert(
        'Debes ingresar el nombre de la bolsa.'
      )

      return
    }

    if (!form.precio) {

      alert(
        'Debes ingresar el precio.'
      )

      return
    }

    const cantidad = Number(form.cantidadUnidades)

    if (!cantidad || cantidad < 1) {
      alert('Debes ingresar una cantidad válida mayor a 0.')
      return
    }

    const seleccionados =
      form.productosSeleccionados.length

    if (
      seleccionados > cantidad
    ) {

      alert(
        `No puedes tener más de ${cantidad} productos.`
      )

      return
    }

    if (
      seleccionados !== cantidad
    ) {

      alert(
        `Debes seleccionar exactamente ${cantidad} productos. Actualmente tienes ${seleccionados}.`
      )

      return
    }

    onConfirmRequest({

      form: {

        ...form,

        categoria:
          'Bolsa de la Suerte',

        cantidadUnidades:
          cantidad,

        productos:
          form.productosSeleccionados
      },

      imageFile,

      bolsaId:
        bolsa?._id
    })
  }

  // ==========================================================
  // RENDER FORMULARIO
  // ==========================================================

  return (

    <div
      className="pm-overlay"
      onClick={onClose}
    >

      <div
        className="pm-modal pm-form-modal pm-form-modal-combo"
        onClick={e =>
          e.stopPropagation()
        }
      >

        {/* HEADER */}

        <div className="pm-form-header">

          <span className="pm-detalles-bar"></span>

          <h2>
            {modo === 'agregar'
              ? 'Nueva bolsa'
              : 'Editar bolsa'}
          </h2>

        </div>

        {/* CUERPO */}

        <div className="pm-form-body pm-form-body-combo">

          {/* IMAGEN DE BOLSA */}

          <div className="pm-form-img-col">

            <div
              className="pm-form-img-box"
              onClick={() =>
                fileRef.current?.click()
              }
            >

              {imagenPreview ? (

                <img
                  src={imagenPreview}
                  alt="Vista previa"
                />

              ) : (

                <span className="pm-img-plus">
                  ＋
                </span>

              )}

            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{
                display: 'none'
              }}
              onChange={
                handleImageChange
              }
            />

            <p className="pm-form-img-label">
              Agregar foto
            </p>

          </div>

          {/* CAMPOS */}

          <div className="pm-form-fields pm-form-fields-combo">

            {/* NOMBRE */}

            <div className="pm-field-group">

              <label>
                Nombre de bolsa
              </label>

              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Nombre..."
                className="pm-input"
              />

            </div>

            {/* CATEGORIA Y ESTADO */}

            <div className="pm-field-row">

              <div className="pm-field-group">

                <label>
                  Categoría
                </label>

                <input
                  type="text"
                  value="Bolsa de la Suerte"
                  readOnly
                  disabled
                  className="pm-input"
                />

              </div>

              <div className="pm-field-group">

                <label>
                  Estado
                </label>

                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="pm-input"
                >

                  {ESTADOS.map(
                    estado => (

                      <option
                        key={estado}
                        value={estado}
                      >
                        {estado}
                      </option>

                    )
                  )}

                </select>

              </div>

            </div>

            <div className="pm-field-group">
              <label>Cantidad unitaria</label>
              <input
                type="number"
                name="cantidadUnidades"
                min="1"
                value={form.cantidadUnidades}
                onChange={handleCantidadUnidades}
                className="pm-input"
                placeholder="Ej. 10"
              />
            </div>

            {/* CONTADOR */}

            <div className="pm-product-counter">

              <span>
                Productos seleccionados
              </span>

              <strong>
                {
                  form.productosSeleccionados.length
                }
                {' / '}
                {
                  form.cantidadUnidades
                }
              </strong>

            </div>

            {/* PRODUCTOS */}

            <div className="pm-field-group">

              <label>
                Seleccionar productos
              </label>

              <div className="pm-productos-list">

                {productos.length === 0 ? (

                  <div className="pm-productos-vacios">

                    No hay productos
                    disponibles.

                  </div>

                ) : (

                  productos.map(
                    producto => {

                      const seleccionado =
                        productoSeleccionado(
                          producto._id
                        )

                      const imagen =
                        obtenerImagenProducto(
                          producto
                        )

                      const nombre =
                        obtenerNombreProducto(
                          producto
                        )

                      const precio =
                        obtenerPrecioProducto(
                          producto
                        )

                      return (

                        <button
                          key={
                            producto._id
                          }
                          type="button"
                          className={
                            `pm-producto-option ${
                              seleccionado
                                ? 'selected'
                                : ''
                            }`
                          }
                          onClick={() =>
                            handleProductoSeleccionado(
                              producto
                            )
                          }
                        >

                          {/* INFORMACIÓN */}

                          <div className="pm-producto-info" style={{ width: '100%', textAlign: 'left', padding: '10px 0' }}>
                            <strong>{nombre}</strong>
                          </div>

                          {/* CHECK */}

                          <div className="pm-producto-check">
                            {seleccionado ? '✓' : ''}
                          </div>

                        </button>

                      )
                    }
                  )

                )}

              </div>

            </div>

            {/* STOCK */}

            <div className="pm-field-group">

              <label>
                Cantidad en stock
              </label>

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

              <label>
                Descripción
              </label>

              <textarea
                name="descripcion"
                value={
                  form.descripcion
                }
                onChange={handleChange}
                className="pm-input pm-textarea"
                placeholder="Descripción de la bolsa..."
              />

            </div>

            {/* PRECIO */}

            <div className="pm-field-group">

              <label>
                Precio
              </label>

              <div className="pm-price-input">

                <span>
                  $
                </span>

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
            {modo === 'agregar'
              ? 'Aceptar'
              : 'Guardar'}
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
    eliminarBolsa,
    actualizarVariante
  } = useBolsas()

  // ==========================================================
  // PRODUCTOS
  // ==========================================================

  const [productos, setProductos] =
    useState([])

  const [loadingProductos, setLoadingProductos] =
    useState(false)

  // ==========================================================
  // MODALES
  // ==========================================================

  const [notifAbierta, setNotifAbierta] =
    useState(false)

  const [modalDetalles, setModalDetalles] =
    useState(null)

  const [modalForm, setModalForm] =
    useState(null)

  const [modalConfirm, setModalConfirm] =
    useState(null)

  const [modalSuccess, setModalSuccess] =
    useState(null)

  // ==========================================================
  // CARGAR PRODUCTOS
  // ==========================================================

  useEffect(() => {

    const cargarProductos =
      async () => {

        try {

          setLoadingProductos(true)

          const response =
            await fetch(
              `${BASE_URL}/productos`
            )

          if (!response.ok) {

            throw new Error(
              'No se pudieron obtener los productos'
            )
          }

          const data =
            await response.json()

          console.log(
            'PRODUCTOS RECIBIDOS:',
            data
          )

          // ==================================================
          // SOPORTAR DIFERENTES RESPUESTAS DEL BACKEND
          // ==================================================

          if (
            Array.isArray(data)
          ) {

            setProductos(data)

          } else if (
            Array.isArray(data.productos)
          ) {

            setProductos(
              data.productos
            )

          } else if (
            Array.isArray(data.data)
          ) {

            setProductos(
              data.data
            )

          } else if (
            Array.isArray(data.products)
          ) {

            setProductos(
              data.products
            )

          } else {

            console.warn(
              'No se encontró un arreglo de productos:',
              data
            )

            setProductos([])

          }

        } catch (error) {

          console.error(
            'Error cargando productos:',
            error
          )

          setProductos([])

        } finally {

          setLoadingProductos(false)

        }
      }

    cargarProductos()

  }, [])

  // ==========================================================
  // CONFIRMACIÓN
  // ==========================================================

  const pedirConfirmacion = (
    mensaje,
    onConfirm
  ) => {

    setModalConfirm({
      mensaje,
      onConfirm
    })
  }

  // ==========================================================
  // NUEVA BOLSA
  // ==========================================================

  const handleNuevaBolsa = () => {

    setModalForm({
      modo: 'agregar',
      bolsa: null
    })
  }

  // ==========================================================
  // GUARDAR
  // ==========================================================

  const handleFormConfirmRequest =
    ({
      form,
      imageFile,
      bolsaId
    }) => {

      const esEditar =
        !!bolsaId

      pedirConfirmacion(

        esEditar
          ? '¿Estás segura que deseas guardar los cambios?'
          : '¿Estás segura que deseas agregar esta bolsa?',

        async () => {

          setModalConfirm(null)

          setModalForm(null)

          try {

            await guardarBolsa({
              form,
              imageFile,
              bolsaId
            })

            setModalSuccess(

              esEditar
                ? '¡Bolsa actualizada con éxito!'
                : '¡Bolsa agregada con éxito!'

            )

          } catch (err) {

            alert(
              'Error: ' +
              err.message
            )

          }

        }
      )
    }

  // ==========================================================
  // EDITAR
  // ==========================================================

  const handleEditar = bolsa => {

    setModalForm({
      modo: 'editar',
      bolsa
    })
  }

  // ==========================================================
  // VARIANTE
  // ==========================================================

  const handleSelectVariante =
    async (
      bolsa,
      cantidadUnidades
    ) => {

      if (
        cantidadUnidades !== 6 &&
        cantidadUnidades !== 10
      ) {
        return
      }

      try {

        await actualizarVariante(
          bolsa,
          cantidadUnidades
        )

        setModalDetalles(
          prev => {

            if (
              prev &&
              prev._id === bolsa._id
            ) {

              return {
                ...prev,
                cantidadUnidades
              }

            }

            return prev
          }
        )

      } catch (err) {

        alert(
          'Error: ' +
          err.message
        )

      }
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

          await eliminarBolsa(
            bolsa._id
          )

          setModalSuccess(
            '¡Bolsa eliminada con éxito!'
          )

        } catch (err) {

          alert(
            'Error: ' +
            err.message
          )

        }

      }
    )
  }

  // ==========================================================
  // BADGE ESTADO
  // ==========================================================

  const estadoBadge = estado => {

    const nombres = {

      activo:
        'Disponible',

      inactivo:
        'Inactivo',

      agotado:
        'Agotado'

    }

    const clases = {

      activo:
        'badge-activo',

      inactivo:
        'badge-inactivo',

      agotado:
        'badge-agotado'

    }

    return (

      <span
        className={
          `pm-badge ${
            clases[estado] || ''
          }`
        }
      >

        {
          nombres[estado] ||
          estado
        }

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

        <Nav
          openNotifications={() =>
            setNotifAbierta(true)
          }
        />

        {/* ==================================================
            ESTILOS
        ================================================== */}

        <style>{`

          /* =================================================
             MODAL
          ================================================= */

          .pm-form-modal-combo {

            width: min(950px, 94vw) !important;

            max-width: 950px !important;

            max-height: 92vh !important;

            overflow: hidden !important;

            box-sizing: border-box;

            display: flex;

            flex-direction: column;

          }


          /* =================================================
             CUERPO
          ================================================= */

          .pm-form-body-combo {

            width: 100%;

            min-width: 0;

            box-sizing: border-box;

            overflow-x: hidden;

            overflow-y: auto;

            flex: 1;

          }


          /* =================================================
             CAMPOS
          ================================================= */

          .pm-form-fields-combo {

            min-width: 0;

            width: 100%;

            box-sizing: border-box;

          }


          /* =================================================
             COMBO 6 / 10
          ================================================= */

          .pm-combo-buttons {

            display: grid;

            grid-template-columns:
              repeat(2, minmax(0, 1fr));

            gap: 10px;

            width: 100%;

          }


          .pm-combo-size-btn {

            width: 100%;

            height: 44px;

            border: 1px solid #194b2d;

            border-radius: 10px;

            background: white;

            color: #194b2d;

            font-weight: 700;

            cursor: pointer;

            box-sizing: border-box;

          }


          .pm-combo-size-btn.active {

            background: #194b2d;

            color: white;

          }


          /* =================================================
             CONTADOR
          ================================================= */

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


          /* =================================================
             PRODUCTOS
          ================================================= */

          .pm-productos-list {

            width: 100%;

            min-width: 0;

            box-sizing: border-box;

            display: grid;

            grid-template-columns:
              repeat(2, minmax(0, 1fr));

            gap: 9px;

            max-height: 360px;

            overflow-y: auto;

            overflow-x: hidden;

            padding: 2px;

          }


          /* =================================================
             PRODUCTO
          ================================================= */

          .pm-producto-option {

            position: relative;

            display: flex;

            align-items: center;

            width: 100%;

            min-width: 0;

            height: 78px;

            padding: 7px;

            gap: 9px;

            border: 2px solid #e1e5e8;

            border-radius: 10px;

            background: white;

            cursor: pointer;

            text-align: left;

            overflow: hidden;

            box-sizing: border-box;

          }


          .pm-producto-option:hover {

            border-color: #194b2d;

          }


          .pm-producto-option.selected {

            border-color: #111;

            background: #f5f5f5;

          }


          /* =================================================
             IMAGEN PRODUCTO
          ================================================= */

          .pm-producto-imagen {

            width: 55px;

            height: 55px;

            min-width: 55px;

            flex-shrink: 0;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius: 9px;

            background: #eeeeee;

            overflow: hidden;

          }


          .pm-producto-imagen img {

            width: 100%;

            height: 100%;

            object-fit: cover;

            display: block;

          }


          .pm-producto-imagen span {

            font-size: 9px;

            color: #333;

            text-align: center;

          }


          /* =================================================
             INFORMACIÓN
          ================================================= */

          .pm-producto-info {

            min-width: 0;

            flex: 1;

            display: flex;

            flex-direction: column;

            justify-content: center;

            gap: 3px;

            overflow: hidden;

          }


          .pm-producto-info strong {

            display: -webkit-box;

            width: 100%;

            font-size: 15px;

            line-height: 19px;

            overflow: hidden;

            text-overflow: ellipsis;

            -webkit-line-clamp: 2;

            -webkit-box-orient: vertical;

            word-break: break-word;

          }


          .pm-producto-info span {

            font-size: 14px;

            white-space: nowrap;

          }


          /* =================================================
             CHECK
          ================================================= */

          .pm-producto-check {

            width: 22px;

            height: 22px;

            min-width: 22px;

            flex-shrink: 0;

            border-radius: 50%;

            display: flex;

            align-items: center;

            justify-content: center;

            background: #eeeeee;

            color: #777;

            font-size: 14px;

            font-weight: bold;

          }


          .pm-producto-option.selected
          .pm-producto-check {

            background: #111;

            color: white;

          }


          /* =================================================
             SIN PRODUCTOS
          ================================================= */

          .pm-productos-vacios {

            grid-column: 1 / -1;

            padding: 25px;

            text-align: center;

            border-radius: 10px;

            background: #f5f5f5;

            color: #666;

          }


          /* =================================================
             BOTONES
          ================================================= */

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


          /* =================================================
             IMAGEN CON ERROR
          ================================================= */

          .pm-img-error {

            font-size: 9px;

            color: #333;

            text-align: center;

          }


          /* =================================================
             RESPONSIVE
          ================================================= */

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


            .pm-productos-list {

              grid-template-columns: 1fr;

            }


            .pm-combo-buttons {

              grid-template-columns: 1fr;

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

            <h1 className="pm-title">
              Bolsas
            </h1>

            <div className="pm-title-underline"></div>

            <p className="pm-subtitle">
              Lista de bolsas registradas
            </p>

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
                onChange={e =>
                  setBusqueda(
                    e.target.value
                  )
                }
              />

            </div>

            <button
              className="pm-btn pm-btn-dark pm-btn-nuevo"
              onClick={
                handleNuevaBolsa
              }
            >

              <span>
                ＋
              </span>

              Agregar bolsa

            </button>

          </div>

        </div>

        {/* ==================================================
            CARGANDO
        ================================================== */}

        {loading && (

          <div className="pm-loading">

            <div className="pm-spinner"></div>

            <span>
              Cargando bolsas...
            </span>

          </div>

        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {error &&
          !loading && (

            <div className="pm-error">

              <span>
                ⚠ {error}
              </span>

              <button
                onClick={
                  fetchBolsas
                }
              >
                Reintentar
              </button>

            </div>

          )}

        {/* ==================================================
            SIN BOLSAS
        ================================================== */}

        {!loading &&
          !error &&
          bolsasPagina.length === 0 && (

            <div className="pm-empty">

              <div className="pm-empty-icon">

                <IconoBolsaVacia />

              </div>

              <p>
                No se encontraron
                bolsas
              </p>

            </div>

          )}

        {/* ==================================================
            BOLSAS
        ================================================== */}

        {!loading &&
          !error &&
          bolsasPagina.length > 0 && (

            <div className="pm-grid">

              {bolsasPagina.map(
                bolsa => (

                  <div
                    key={
                      bolsa._id
                    }
                    className="pm-card"
                  >

                    <div className="pm-card-img-wrap">

                      {bolsa.imagenPresentacion ? (

                        <img
                          src={
                            bolsa.imagenPresentacion
                          }
                          alt={
                            bolsa.nombre
                          }
                          className="pm-card-img"
                        />

                      ) : (

                        <div className="pm-card-no-img">
                          Sin imagen
                        </div>

                      )}

                      {estadoBadge(
                        bolsa.estado
                      )}

                    </div>

                    <div className="pm-card-info">

                      <p className="pm-card-nombre">

                        {
                          bolsa.nombre ||
                          'Sin nombre'
                        }

                      </p>

                      <p className="pm-card-precio">

                        $
                        {Number(
                          bolsa.precio ||
                          0
                        ).toFixed(2)}

                      </p>

                    </div>

                    <div className="pm-card-actions">

                      <div className="pm-card-icons">

                        <button
                          className="pm-icon-btn pm-edit-btn"
                          title="Editar"
                          onClick={() =>
                            handleEditar(
                              bolsa
                            )
                          }
                        >

                          <IconoLapiz />

                        </button>

                        <button
                          className="pm-icon-btn pm-delete-btn"
                          title="Eliminar"
                          onClick={() =>
                            handleEliminar(
                              bolsa
                            )
                          }
                        >

                          <IconoBasura />

                        </button>

                      </div>

                      <button
                        className="pm-ver-detalles"
                        onClick={() =>
                          setModalDetalles(
                            bolsa
                          )
                        }
                      >
                        Ver detalles ›
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        {/* ==================================================
            PAGINACIÓN
        ================================================== */}

        {totalPaginas > 1 && (

          <div className="pm-pagination">

            <button
              className="pm-page-btn"
              disabled={
                paginaActual === 1
              }
              onClick={() =>
                setPaginaActual(
                  p => p - 1
                )
              }
            >
              ‹
            </button>

            {Array.from(
              {
                length:
                  totalPaginas
              },
              (_, i) =>
                i + 1
            ).map(n => (

              <button
                key={n}
                className={
                  `pm-page-btn ${
                    paginaActual === n
                      ? 'active'
                      : ''
                  }`
                }
                onClick={() =>
                  setPaginaActual(n)
                }
              >
                {n}
              </button>

            ))}

            <button
              className="pm-page-btn"
              disabled={
                paginaActual ===
                totalPaginas
              }
              onClick={() =>
                setPaginaActual(
                  p => p + 1
                )
              }
            >
              ›
            </button>

          </div>

        )}

      </main>

      {/* ======================================================
          DETALLES
      ====================================================== */}

      {modalDetalles && (

        <DetallesModal

          bolsa={
            modalDetalles
          }

          onClose={() =>
            setModalDetalles(
              null
            )
          }

          onSelectVariante={
            handleSelectVariante
          }

        />

      )}

      {/* ======================================================
          FORMULARIO
      ====================================================== */}

      {modalForm && (

        <FormModal

          modo={
            modalForm.modo
          }

          bolsa={
            modalForm.bolsa
          }

          productos={
            productos
          }

          onClose={() =>
            setModalForm(null)
          }

          onConfirmRequest={
            handleFormConfirmRequest
          }

        />

      )}

      {/* ======================================================
          CONFIRMACIÓN
      ====================================================== */}

      {modalConfirm && (

        <ConfirmModal

          mensaje={
            modalConfirm.mensaje
          }

          onConfirm={
            modalConfirm.onConfirm
          }

          onCancel={() =>
            setModalConfirm(null)
          }

        />

      )}

      {/* ======================================================
          ÉXITO
      ====================================================== */}

      {modalSuccess && (

        <SuccessModal

          mensaje={
            modalSuccess
          }

          onClose={() =>
            setModalSuccess(null)
          }

        />

      )}

      {/* ======================================================
          NOTIFICACIONES
      ====================================================== */}

      <NotificacionesModal

        abierto={
          notifAbierta
        }

        onCerrar={() =>
          setNotifAbierta(false)
        }

      />

    </div>
  )
}

export default Bolsas