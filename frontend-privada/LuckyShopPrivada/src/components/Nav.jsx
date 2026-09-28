import React, { useState, useEffect, useRef } from "react";
import { FaBell } from "react-icons/fa";
import "./Nav.css";
import { useNotificaciones } from "../hooks/useNotificaciones";

// URL base de la API backend
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Función auxiliar para obtener hasta dos iniciales en mayúsculas a partir del nombre completo
function iniciales(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'
}

export default function Nav({ openNotifications }) {
  // Datos del administrador logueado
  const { notificaciones } = useNotificaciones(true);
  // Estado para guardar el nombre del administrador logueado
  const [nombreAdmin, setNombreAdmin] = useState("");
  const [correoAdmin, setCorreoAdmin] = useState("");

  // Controla si la ventana emergente del perfil está abierta
  const [menuAbierto, setMenuAbierto] = useState(false);
  // Referencia al contenedor del perfil, para cerrar el menú al hacer clic fuera
  const perfilRef = useRef(null);

  const tieneNotificaciones = notificaciones.some((n) => n.id !== "exito-total");

  // Petición al backend para verificar la sesión activa y obtener los datos del admin
  useEffect(() => {
    let activo = true;
    fetch(`${BASE_URL}/loginAdmin/checkSession`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!activo) return;
        const admin = data.admin;
        if (admin) {
          setNombreAdmin(`${admin.name || ""} ${admin.lastName || ""}`.trim());
          setCorreoAdmin(admin.email || "");
        }
      })
      .catch(() => {});
    return () => { activo = false };
  }, []);

  // Cierra la ventana emergente cuando se hace clic fuera de ella
  useEffect(() => {
    const manejarClicFuera = (e) => {
      if (perfilRef.current && !perfilRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", manejarClicFuera);
    return () => document.removeEventListener("mousedown", manejarClicFuera);
  }, []);

  return (
    <nav className="navbar">
      {/* Espacio para empujar los botones hacia la derecha */}
      <div></div>

      <div className="navbar-actions">
        {/* Botón para abrir el panel de notificaciones */}
        <button
          className="notification-button"
          onClick={openNotifications}
        >
          <FaBell />
          {/* Indicador visual de notificaciones pendientes */}
          {tieneNotificaciones && <span className="notification-dot"></span>}
        </button>

        {/* Perfil: avatar con iniciales que abre la ventana emergente con la info */}
        <div className="profile-wrap" ref={perfilRef}>
          <div
            className="profile-image profile-image-iniciales"
            onClick={() => setMenuAbierto((v) => !v)}
            title={nombreAdmin || "Administrador"}
          >
            {iniciales(nombreAdmin)}
          </div>

          {/* Ventana emergente del perfil */}
          {menuAbierto && (
            <div className="perfil-menu">
              <div className="perfil-menu-header">
                <div className="perfil-menu-avatar">{iniciales(nombreAdmin)}</div>
                <div className="perfil-menu-datos">
                  <p className="perfil-menu-nombre">{nombreAdmin || "Administrador"}</p>
                  {correoAdmin ? <p className="perfil-menu-correo">{correoAdmin}</p> : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}