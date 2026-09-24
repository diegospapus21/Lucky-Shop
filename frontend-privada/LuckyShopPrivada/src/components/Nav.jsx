import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import "./Nav.css";
import { useNotificaciones } from "../hooks/useNotificaciones";

// URL base de la API backend
const BASE_URL = import.meta.env.VITE_API_URL + '';

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
  const navigate = useNavigate();
  const { notificaciones } = useNotificaciones(true);
  // Estado para guardar el nombre del administrador logueado
  const [nombreAdmin, setNombreAdmin] = useState("");

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
        }
      })
      .catch(() => {});
    return () => { activo = false };
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

        {/* Avatar interactivo con las iniciales que redirige al perfil del admin */}
        <div
          className="profile-image profile-image-iniciales"
          onClick={() => navigate("/perfilAdmin")}
          title={nombreAdmin || "Administrador"}
        >
          {iniciales(nombreAdmin)}
        </div>
      </div>
    </nav>
  );
}