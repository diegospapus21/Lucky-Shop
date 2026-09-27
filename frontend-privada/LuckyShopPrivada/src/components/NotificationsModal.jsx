import { useNotificaciones } from "../hooks/useNotificaciones";
import { useNavigate } from "react-router-dom";
import "../NotificationModal.css";

// Componente modal para desplegar el listado de notificaciones del sistema
export default function NotificacionesModal({ abierto, onCerrar }) {
  // Hook personalizado para obtener la lista de notificaciones y sus estados
  const { notificaciones, cargando, error, marcarLeida } = useNotificaciones(abierto);
  const navigate = useNavigate();

  // Redirige a la ruta especificada y cierra el modal si existe un enlace
  const handleClick = (enlace) => {
    if (enlace) {
      navigate(enlace);
      onCerrar();
    }
  };

  // Marca la notificación como leída guardando el conteo actual
  const handleLeida = (e, n) => {
    e.stopPropagation();
    if (n._clave && n._conteoActual !== undefined) {
      marcarLeida(n._clave, n._conteoActual);
    }
  };

  // Si el modal está cerrado, no se muestra nada
  if (!abierto) return null;

  return (
    // Fondo semitransparente que cierra el modal al hacer clic en él
    <div className="notif-fondo" onClick={onCerrar}>
      {/* Panel principal del modal; detiene la propagación del evento para evitar su cierre al dar clic dentro */}
      <div className="notif-panel" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="notif-cabecera">
          <h2 className="notif-titulo">Notificaciones</h2>
          {/* Muestra el contador total de notificaciones cuando están cargadas */}
          {!cargando && !error && notificaciones.length > 0 && (
            <span className="notif-conteo">{notificaciones.length}</span>
          )}
          {/* Botón para cerrar la ventana modal */}
          <button className="notif-cerrar" onClick={onCerrar} aria-label="Cerrar notificaciones">
            <IconoX />
          </button>
        </div>

        {/* Estados de carga / error */}
        {cargando && (
          <div className="notif-cargando">
            <span className="notif-spinner" />
            <p>Cargando notificaciones…</p>
          </div>
        )}
        {error && (
          <p className="notif-estado-error">No se pudieron cargar las notificaciones: {error}</p>
        )}

        {/* Lista de notificaciones */}
        {!cargando && !error && (
          <div className="notif-lista">
            {notificaciones.length === 0 ? (
              <p className="notif-vacio">No tienes notificaciones nuevas.</p>
            ) : (
              // Iteración sobre la lista de notificaciones para renderizar cada ítem
              notificaciones.map((n) => (
                <div 
                  key={n.id} 
                  className={`notif-item ${n.tipo} ${n.enlace ? "clickable" : ""}`}
                  onClick={() => handleClick(n.enlace)}
                  style={{ cursor: n.enlace ? "pointer" : "default" }}
                >
                  {n.icono && <span className="notif-icono">{n.icono}</span>}
                  <div className="notif-item-contenido">
                    <p className="notif-item-titulo">{n.titulo}</p>
                    <p className="notif-item-descripcion">{n.descripcion}</p>
                    <div className="notif-item-footer">
                      {/* Indicador visual si la notificación incluye enlace a otra página */}
                      {n.enlace && (
                        <span className="notif-ver-mas">
                          Ver detalles →
                        </span>
                      )}
                      {/* Botón para marcar como leída y eliminarla */}
                      <button
                        className="notif-btn-leida"
                        onClick={(e) => handleLeida(e, n)}
                        title="Marcar como leída"
                      >
                        <IconoCheck />
                        Leído
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Icono en formato SVG para la acción de cerrar
function IconoX() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// Icono de check para el botón "Leído"
function IconoCheck() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}