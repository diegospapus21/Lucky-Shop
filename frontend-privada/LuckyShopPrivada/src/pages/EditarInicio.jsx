import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/SideBar";
import Nav from "../components/Nav";
import NotificationsModal from "../components/NotificationsModal";
import "../SideBar.css";
import "./EditarInicio.css";
import {
  FaUnderline,
  FaStrikethrough,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaListUl,
  FaListOl,
  FaUndo,
  FaRedo,
  FaRemoveFormat,
  FaSave,
  FaImage,
  FaEye,
  FaPalette,
  FaExternalLinkAlt,
  FaTrashAlt,
  FaQuoteRight,
} from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_API_URL + "";

const DEFAULT_BANNER = {
  linea1: "Joyas que hablan de ti",
  linea2: "sin decir una palabra",
  imagenUrl: "",
  colorTexto: "#4B1010",
  colorFondo: "#fbc2d4",
};

const DEFAULT_BIENVENIDA = {
  titulo: "Bienvenido a tu lugar de confianza",
  contenidoHtml: `<p>A un espacio donde cada pieza cuenta una historia: la tuya.</p><p>No son simples accesorios; diseñamos pequeños fragmentos de luz hechos para perdurar, celebrar tus logros y acompañarte en cada paso. Desde el minimalismo que te eleva en el día a día hasta la sofisticación de tus noches más especiales.</p><p>Descubre una colección pensada para reflejar tu fuerza, tu elegancia y tu esencia única. Encuentra hoy esa pieza que se convertirá en parte de ti.</p>`,
};

// Paleta de colores directos para texto estilo Word
const PALETA_COLORES = [
  { nombre: "Negro", color: "#111827" },
  { nombre: "Gris", color: "#4b5563" },
  { nombre: "Rosa Lucky", color: "#ff3b8f" },
  { nombre: "Verde Esmeralda", color: "#00b248" },
  { nombre: "Borgoña", color: "#4B1010" },
  { nombre: "Azul", color: "#2563eb" },
  { nombre: "Dorado", color: "#d97706" },
];

export default function EditarInicio() {
  const [notifAbierta, setNotifAbierta] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");
  const [modalRestablecerAbierto, setModalRestablecerAbierto] = useState(false);
  const [mostrarPaletaColor, setMostrarPaletaColor] = useState(false);

  // Estado del banner
  const [linea1, setLinea1] = useState(DEFAULT_BANNER.linea1);
  const [linea2, setLinea2] = useState(DEFAULT_BANNER.linea2);
  const [colorTexto, setColorTexto] = useState(DEFAULT_BANNER.colorTexto);
  const [colorFondo, setColorFondo] = useState(DEFAULT_BANNER.colorFondo);
  const [imagenUrl, setImagenUrl] = useState("");
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState("");
  const [eliminarImagen, setEliminarImagen] = useState(false);

  // Estado de la sección de bienvenida
  const [tituloBienvenida, setTituloBienvenida] = useState(DEFAULT_BIENVENIDA.titulo);
  const [pestanaActiva, setPestanaActiva] = useState("editor"); // 'editor' | 'preview'

  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const savedRangeRef = useRef(null);

  // Cargar configuración guardada al montar el componente
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/inicioConfig`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.banner) {
            setLinea1(data.banner.linea1 || DEFAULT_BANNER.linea1);
            setLinea2(data.banner.linea2 || DEFAULT_BANNER.linea2);
            setColorTexto(data.banner.colorTexto || DEFAULT_BANNER.colorTexto);
            setColorFondo(data.banner.colorFondo || DEFAULT_BANNER.colorFondo);
            setImagenUrl(data.banner.imagenUrl || "");
          }
          if (data.bienvenida) {
            setTituloBienvenida(
              data.bienvenida.titulo || DEFAULT_BIENVENIDA.titulo
            );
            if (editorRef.current) {
              editorRef.current.innerHTML =
                data.bienvenida.contenidoHtml || DEFAULT_BIENVENIDA.contenidoHtml;
            }
          }
        }
      }
    } catch (err) {
      console.error("Error al cargar configuración:", err);
      if (editorRef.current) {
        editorRef.current.innerHTML = DEFAULT_BIENVENIDA.contenidoHtml;
      }
    } finally {
      setLoading(false);
    }
  };

  // Asignar el contenido inicial al editor cuando termine la carga
  useEffect(() => {
    if (!loading && editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = DEFAULT_BIENVENIDA.contenidoHtml;
    }
  }, [loading]);

  // Guardar y restaurar rango de selección del texto
  const guardarSeleccion = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  const restaurarSeleccion = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  };

  // Formateador robusto para Negrita (bold), Cursiva (italic), Subrayado (underline), etc.
  const aplicarFormato = (tipo, valor = null) => {
    restaurarSeleccion();
    const sel = window.getSelection();

    if (tipo === "bold" || tipo === "italic") {
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const tagBuscada = tipo === "bold" ? "b, strong" : "i, em";
        const tagExistente = sel.anchorNode?.parentElement?.closest(tagBuscada);

        if (tagExistente && editorRef.current?.contains(tagExistente)) {
          // Deshacer formato si ya existe
          document.execCommand(tipo, false, null);
          const sigueExistente = sel.anchorNode?.parentElement?.closest(tagBuscada);
          if (sigueExistente && editorRef.current?.contains(sigueExistente)) {
            const parent = sigueExistente.parentNode;
            while (sigueExistente.firstChild) {
              parent.insertBefore(sigueExistente.firstChild, sigueExistente);
            }
            parent.removeChild(sigueExistente);
          }
        } else {
          // Aplicar formato con execCommand y fallback DOM físico
          const ok = document.execCommand(tipo, false, null);
          const yaFormateado = sel.anchorNode?.parentElement?.closest(tagBuscada);
          if (!ok || !yaFormateado) {
            try {
              const el = document.createElement(tipo === "bold" ? "strong" : "em");
              const fragment = range.extractContents();
              el.appendChild(fragment);
              range.insertNode(el);
              const newRange = document.createRange();
              newRange.selectNodeContents(el);
              sel.removeAllRanges();
              sel.addRange(newRange);
            } catch (err) {
              console.warn("Fallback de formato:", err);
            }
          }
        }
      } else {
        document.execCommand(tipo, false, null);
      }
    } else {
      document.execCommand(tipo, false, valor);
    }

    guardarSeleccion();
  };

  const ejecutarComando = (comando, valor = null) => {
    aplicarFormato(comando, valor);
  };

  // Atajos de teclado dentro del editor (Ctrl+B, Ctrl+I, Ctrl+U)
  const handleKeyDownEditor = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        aplicarFormato("bold");
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        aplicarFormato("italic");
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        aplicarFormato("underline");
      }
    }
  };

  const aplicarColorTexto = (color) => {
    restaurarSeleccion();
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand("foreColor", false, color);
    setMostrarPaletaColor(false);
  };

  // Manejo de cambio de imagen
  const handleSeleccionarImagen = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setMensajeError("Por favor selecciona un archivo de imagen válido.");
        return;
      }
      setArchivoImagen(file);
      setEliminarImagen(false);
      const objectUrl = URL.createObjectURL(file);
      setPreviewImagen(objectUrl);
    }
  };

  const handleQuitarImagen = () => {
    setArchivoImagen(null);
    setPreviewImagen("");
    setImagenUrl("");
    setEliminarImagen(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Confirmar restablecer desde el modal personalizado
  const confirmarRestablecer = () => {
    setLinea1(DEFAULT_BANNER.linea1);
    setLinea2(DEFAULT_BANNER.linea2);
    setColorTexto(DEFAULT_BANNER.colorTexto);
    setColorFondo(DEFAULT_BANNER.colorFondo);
    setTituloBienvenida(DEFAULT_BIENVENIDA.titulo);
    handleQuitarImagen();
    if (editorRef.current) {
      editorRef.current.innerHTML = DEFAULT_BIENVENIDA.contenidoHtml;
    }
    setModalRestablecerAbierto(false);
  };

  // Guardar configuración completa en el backend
  const handleGuardar = async () => {
    setGuardando(true);
    setMensajeExito("");
    setMensajeError("");

    try {
      const contenidoHtml = editorRef.current ? editorRef.current.innerHTML : "";

      const formData = new FormData();
      formData.append("linea1", linea1);
      formData.append("linea2", linea2);
      formData.append("colorTexto", colorTexto);
      formData.append("colorFondo", colorFondo);
      formData.append("tituloBienvenida", tituloBienvenida);
      formData.append("contenidoHtml", contenidoHtml);

      if (archivoImagen) {
        formData.append("imagen", archivoImagen);
      }
      if (eliminarImagen) {
        formData.append("eliminarImagen", "true");
      }

      const res = await fetch(`${BASE_URL}/inicioConfig`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo guardar la configuración.");
      }

      const data = await res.json();
      if (data.config?.banner?.imagenUrl) {
        setImagenUrl(data.config.banner.imagenUrl);
        setArchivoImagen(null);
        setPreviewImagen("");
      }
      setEliminarImagen(false);

      setMensajeExito("¡Configuración guardada exitosamente! Ya se puede ver en la tienda pública.");
      setTimeout(() => setMensajeExito(""), 5000);
    } catch (err) {
      console.error(err);
      setMensajeError("Hubo un error al guardar los cambios: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const bannerFondoActual = previewImagen || imagenUrl;

  return (
    <div className="pm-page editar-inicio-layout">
      <Sidebar />

      <main className="pm-main editar-inicio-main">
        <Nav openNotifications={() => setNotifAbierta(true)} />

        {/* Encabezado del módulo */}
        <header className="pm-header editar-inicio-header">
          <div className="pm-title-wrap">
            <h1 className="pm-title">Personalizar Página de Inicio</h1>
            <div className="pm-title-underline" />
            <p className="pm-subtitle">
              Edita los textos, la imagen de portada y la sección de bienvenida como en un procesador de texto tipo Word.
            </p>
          </div>

          <div className="header-button-group">
            <button
              type="button"
              className="btn-restablecer"
              onClick={() => setModalRestablecerAbierto(true)}
              disabled={guardando}
            >
              <FaUndo /> Restablecer Original
            </button>

            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="btn-ver-tienda"
              title="Abrir la tienda pública en una pestaña nueva"
            >
              <FaExternalLinkAlt /> Ver Tienda
            </a>

            <button
              type="button"
              className="btn-guardar-principal"
              onClick={handleGuardar}
              disabled={guardando}
            >
              {guardando ? (
                <>
                  <span className="spinner-mini" /> Guardando...
                </>
              ) : (
                <>
                  <FaSave /> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </header>

        {/* Notificaciones de éxito o error */}
        {mensajeExito && (
          <div className="alerta-exito">
            <span>{mensajeExito}</span>
            <button onClick={() => setMensajeExito("")}>×</button>
          </div>
        )}
        {mensajeError && (
          <div className="alerta-error">
            <span>{mensajeError}</span>
            <button onClick={() => setMensajeError("")}>×</button>
          </div>
        )}

        {/* Pestañas de modo: Editor interactivo o Vista previa completa */}
        <div className="pestanas-editor">
          <button
            className={`pestana-btn ${pestanaActiva === "editor" ? "activa" : ""}`}
            onClick={() => setPestanaActiva("editor")}
          >
            <FaPalette /> Editor Visual
          </button>
          <button
            className={`pestana-btn ${pestanaActiva === "preview" ? "activa" : ""}`}
            onClick={() => setPestanaActiva("preview")}
          >
            <FaEye /> Vista Previa en Vivo
          </button>
        </div>

        {loading ? (
          <div className="cargando-contenedor">
            <div className="spinner-grande" />
            <p>Cargando editor de inicio...</p>
          </div>
        ) : pestanaActiva === "editor" ? (
          <div className="editor-contenedor-grid">
            {/* ========================================================
                SECCIÓN 1: BANNER / PORTADA
            ======================================================== */}
            <section className="bloque-editor">
              <div className="bloque-header">
                <h2>1. Banner de Portada</h2>
                <span className="tag-info">Encabezado principal</span>
              </div>

              {/* Vista previa en vivo del banner */}
              <div
                className="banner-preview-box"
                style={{
                  backgroundColor: colorFondo,
                  backgroundImage: bannerFondoActual
                    ? `linear-gradient(90deg, rgba(251,194,212,0.35) 0%, rgba(251,194,212,0.05) 45%, rgba(255,255,255,0) 70%), url(${bannerFondoActual})`
                    : `linear-gradient(90deg, rgba(251,194,212,0.35) 0%, rgba(251,194,212,0.05) 45%, rgba(255,255,255,0) 70%), url('/src/assets/portadaJoyas.jpg')`,
                }}
              >
                <div className="banner-preview-textos">
                  <h1 style={{ color: colorTexto }}>
                    <span className="block">{linea1 || "Joyas que hablan de ti"}</span>
                    <span className="block linea-sangria">
                      {linea2 || "sin decir una palabra"}
                    </span>
                  </h1>
                </div>
              </div>

              {/* Controles del banner */}
              <div className="banner-controles">
                <div className="campo-grupo">
                  <label>Texto Superior (Línea 1):</label>
                  <input
                    type="text"
                    value={linea1}
                    onChange={(e) => setLinea1(e.target.value)}
                    placeholder="Joyas que hablan de ti"
                    className="input-estilizado"
                  />
                </div>

                <div className="campo-grupo">
                  <label>Texto Inferior (Línea 2):</label>
                  <input
                    type="text"
                    value={linea2}
                    onChange={(e) => setLinea2(e.target.value)}
                    placeholder="sin decir una palabra"
                    className="input-estilizado"
                  />
                </div>

                <div className="banner-colores-row">
                  <div className="campo-color">
                    <label>Color del Texto:</label>
                    <div className="color-picker-wrap">
                      <input
                        type="color"
                        value={colorTexto}
                        onChange={(e) => setColorTexto(e.target.value)}
                      />
                      <span>{colorTexto}</span>
                    </div>
                  </div>

                  <div className="campo-color">
                    <label>Color de Fondo (Base):</label>
                    <div className="color-picker-wrap">
                      <input
                        type="color"
                        value={colorFondo}
                        onChange={(e) => setColorFondo(e.target.value)}
                      />
                      <span>{colorFondo}</span>
                    </div>
                  </div>
                </div>

                {/* Subida de Imagen */}
                <div className="campo-imagen">
                  <label>Imagen de Fondo:</label>
                  <div className="imagen-uploader-box">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleSeleccionarImagen}
                      style={{ display: "none" }}
                      id="upload-banner-input"
                    />

                    <label
                      htmlFor="upload-banner-input"
                      className="btn-subir-imagen"
                    >
                      <FaImage /> Seleccionar Nueva Imagen
                    </label>

                    {(bannerFondoActual || archivoImagen) && (
                      <button
                        type="button"
                        className="btn-quitar-imagen"
                        onClick={handleQuitarImagen}
                      >
                        <FaTrashAlt /> Quitar Imagen Personalizada
                      </button>
                    )}

                    <span className="info-texto">
                      {archivoImagen
                        ? `Archivo listo: ${archivoImagen.name}`
                        : bannerFondoActual
                          ? "Usando imagen personalizada cargada"
                          : "Usando imagen predeterminada de la tienda"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================
                SECCIÓN 2: SECCIÓN DE BIENVENIDA (ESTILO WORD)
            ======================================================== */}
            <section className="bloque-editor">
              <div className="bloque-header">
                <h2>2. Sección de Bienvenida (Editor Estilo Word)</h2>
                <span className="tag-info">Texto enriquecido</span>
              </div>

              {/* Título de bienvenida editable */}
              <div className="campo-grupo bienvenida-titulo-grupo">
                <label>Título de la Sección:</label>
                <input
                  type="text"
                  value={tituloBienvenida}
                  onChange={(e) => setTituloBienvenida(e.target.value)}
                  placeholder="Bienvenido a tu lugar de confianza"
                  className="input-estilizado titulo-bienvenida-input"
                />
              </div>

              {/* Ventana de procesador de texto estilo Microsoft Word */}
              <div className="word-window-container">
                {/* Barra de herramientas estilo Word */}
                <div className="word-toolbar">
                  {/* Grupo Deshacer / Rehacer */}
                  <div className="toolbar-group">
                    <button
                      type="button"
                      title="Deshacer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        ejecutarComando("undo");
                      }}
                    >
                      <FaUndo />
                    </button>
                    <button
                      type="button"
                      title="Rehacer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        ejecutarComando("redo");
                      }}
                    >
                      <FaRedo />
                    </button>
                  </div>

                  <div className="toolbar-separator" />

                  {/* Grupo de Formato de Texto: Subrayado y Tachado */}
                  <div className="toolbar-group">
                    <button
                      type="button"
                      title="Subrayado"
                      className="btn-underline"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        ejecutarComando("underline");
                      }}
                    >
                      <FaUnderline />
                    </button>
                    <button
                      type="button"
                      title="Tachado"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        ejecutarComando("strikeThrough");
                      }}
                    >
                      <FaStrikethrough />
                    </button>
                  </div>

                  <div className="toolbar-separator" />

                  {/* Grupo Tamaño de Texto */}
                  <div className="toolbar-group">
                    <select
                      title="Tamaño de Texto"
                      className="toolbar-select size-select"
                      onMouseDown={guardarSeleccion}
                      onChange={(e) => {
                        restaurarSeleccion();
                        ejecutarComando("fontSize", e.target.value);
                      }}
                      defaultValue="3"
                    >
                      <option value="2">Pequeño (12pt)</option>
                      <option value="3">Normal (14pt)</option>
                      <option value="4">Destacado (16pt)</option>
                      <option value="5">Título (18pt)</option>
                      <option value="6">Encabezado (24pt)</option>
                    </select>
                  </div>

                  <div className="toolbar-separator" />

                  {/* Grupo Colores de Texto */}
                  <div className="toolbar-group color-group-wrap">
                    <button
                      type="button"
                      className="btn-abrir-color"
                      title="Color de texto"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        guardarSeleccion();
                        setMostrarPaletaColor(!mostrarPaletaColor);
                      }}
                    >
                      <span className="color-indicator-letter">A</span>
                    </button>

                    {mostrarPaletaColor && (
                      <div className="paleta-colores-popover">
                        <div className="paleta-swatches">
                          {PALETA_COLORES.map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              className="color-swatch-btn"
                              style={{ backgroundColor: c.color }}
                              title={c.nombre}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                aplicarColorTexto(c.color);
                              }}
                            />
                          ))}
                        </div>
                        <div className="paleta-custom-row">
                          <label>Personalizado:</label>
                          <input
                            type="color"
                            onChange={(e) => aplicarColorTexto(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <label
                      className="color-btn-wrap"
                      title="Resaltar Texto"
                      onMouseDown={guardarSeleccion}
                    >
                      <span className="color-indicator-highlight">ab</span>
                      <input
                        type="color"
                        defaultValue="#fff3a8"
                        onChange={(e) => {
                          restaurarSeleccion();
                          ejecutarComando("hiliteColor", e.target.value);
                        }}
                      />
                    </label>
                  </div>

                  <div className="toolbar-separator" />

                  {/* Grupo Alineación */}
                  <div className="toolbar-group">
                    <button
                      type="button"
                      title="Alinear a la izquierda"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        ejecutarComando("justifyLeft");
                      }}
                    >
                      <FaAlignLeft />
                    </button>
                    <button
                      type="button"
                      title="Centrar"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        ejecutarComando("justifyCenter");
                      }}
                    >
                      <FaAlignCenter />
                    </button>
                    <button
                      type="button"
                      title="Alinear a la derecha"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        ejecutarComando("justifyRight");
                      }}
                    >
                      <FaAlignRight />
                    </button>
                    <button
                      type="button"
                      title="Justificar"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        ejecutarComando("justifyFull");
                      }}
                    >
                      <FaAlignJustify />
                    </button>
                  </div>

                  <div className="toolbar-separator" />

                  {/* Grupo Listas (Viñetas y Numeradas) */}
                  <div className="toolbar-group">
                    <button
                      type="button"
                      title="Lista con viñetas"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        ejecutarComando("insertUnorderedList");
                      }}
                    >
                      <FaListUl />
                    </button>
                    <button
                      type="button"
                      title="Lista numerada"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        ejecutarComando("insertOrderedList");
                      }}
                    >
                      <FaListOl />
                    </button>
                    <button
                      type="button"
                      title="Cita"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        ejecutarComando("formatBlock", "blockquote");
                      }}
                    >
                      <FaQuoteRight />
                    </button>
                    <button
                      type="button"
                      title="Limpiar formato"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        ejecutarComando("removeFormat");
                      }}
                    >
                      <FaRemoveFormat />
                    </button>
                  </div>
                </div>

                {/* Hoja de papel estilo Word */}
                <div
                  className="word-paper-container"
                  onClick={() => {
                    if (mostrarPaletaColor) setMostrarPaletaColor(false);
                  }}
                >
                  <div className="word-ruler">
                    <div className="ruler-marks" />
                  </div>
                  <div
                    ref={editorRef}
                    className="word-page-sheet"
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck="true"
                    data-placeholder="Escribe el texto de bienvenida aquí..."
                    onKeyDown={handleKeyDownEditor}
                    onKeyUp={guardarSeleccion}
                    onMouseUp={guardarSeleccion}
                    onSelect={guardarSeleccion}
                    onBlur={guardarSeleccion}
                  />
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* ========================================================
              VISTA PREVIA EN VIVO (Simulador de la tienda pública)
          ======================================================== */
          <div className="vista-previa-simulador">
            <div className="simulador-banner">
              <span className="simulador-tag">Simulación de la Tienda Pública</span>
            </div>

            {/* Banner preview */}
            <div
              className="preview-banner-publico"
              style={{
                backgroundColor: colorFondo,
                backgroundImage: bannerFondoActual
                  ? `linear-gradient(90deg, rgba(251,194,212,0.35) 0%, rgba(251,194,212,0.05) 45%, rgba(255,255,255,0) 70%), url(${bannerFondoActual})`
                  : `linear-gradient(90deg, rgba(251,194,212,0.35) 0%, rgba(251,194,212,0.05) 45%, rgba(255,255,255,0) 70%), url('/src/assets/portadaJoyas.jpg')`,
              }}
            >
              <div className="preview-banner-contenido">
                <h1 style={{ color: colorTexto }}>
                  <span className="block">{linea1 || "Joyas que hablan de ti"}</span>
                  <span className="block linea-sangria">
                    {linea2 || "sin decir una palabra"}
                  </span>
                </h1>
              </div>
            </div>

            {/* Bienvenida preview */}
            <section className="preview-bienvenida-publica">
              <h2 className="preview-bienvenida-titulo">
                {tituloBienvenida || "Bienvenido a tu lugar de confianza"}
              </h2>
              <div
                className="preview-bienvenida-cuerpo"
                dangerouslySetInnerHTML={{
                  __html: editorRef.current
                    ? editorRef.current.innerHTML
                    : DEFAULT_BIENVENIDA.contenidoHtml,
                }}
              />
            </section>
          </div>
        )}

        {/* Modal de confirmación para restablecer */}
        {modalRestablecerAbierto && (
          <div
            className="modal-overlay-custom"
            onClick={() => setModalRestablecerAbierto(false)}
          >
            <div
              className="modal-card-custom"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header-custom">
                <h3>Restablecer Inicio</h3>
                <button
                  type="button"
                  className="modal-cerrar-x"
                  onClick={() => setModalRestablecerAbierto(false)}
                >
                  ×
                </button>
              </div>
              <p className="modal-cuerpo-texto">
                ¿Deseas restablecer los textos e imagen a los valores predeterminados originales de la tienda?
              </p>
              <div className="modal-acciones-custom">
                <button
                  type="button"
                  className="btn-modal-cancelar"
                  onClick={() => setModalRestablecerAbierto(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-modal-confirmar"
                  onClick={confirmarRestablecer}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}

        <NotificationsModal
          abierto={notifAbierta}
          onCerrar={() => setNotifAbierta(false)}
        />
      </main>
    </div>
  );
}
