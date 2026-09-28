import { Link, useNavigate } from 'react'
import './SideBarPerfil.css'

// URL base de la API backend para solicitudes de autenticación
const BASE_URL = import.meta.env.VITE_API_URL + ''

// Componente de barra lateral simplificado para la pantalla de Perfil.
// Incluye navegación directa al Panel Principal y cierre seguro de sesión.
const SideBarPerfil = () => {
  const navigate = useNavigate()

  // Realiza la petición de cierre de sesión al servidor y limpia el almacenamiento local
  const cerrarSesion = async () => {
    try {
      await fetch(`${BASE_URL}/logout`, { method: 'POST', credentials: 'include' })
    } catch {
      // Si la petición falla por red o servidor, continúa con la limpieza local
    } finally {
      localStorage.removeItem('luckyshop_token')
      localStorage.removeItem('luckyshop_user')
      sessionStorage.removeItem('luckyshop_token')
      sessionStorage.removeItem('luckyshop_user')
      navigate('/', { replace: true })
    }
  }

  return (
    <nav className="luckyshop-nav-container">
      <aside className="sidebar-perfil">
        {/* Espacio superior para empujar las opciones hacia la base */}
        <div className="sidebar-perfil-espacio" />

        {/* Sección inferior con enlace a Inicio y botón de Salir */}
        <div className="sidebar-perfil-footer">
          <div className="sidebar-perfil-divider"></div>

          {/* Enlace de regreso al dashboard principal */}
          <Link to="/home" className="sidebar-perfil-link">
            <IconoCasa />
            <span>Inicio</span>
          </Link>

          {/* Botón de acción para destruición de sesión */}
          <button onClick={cerrarSesion} className="sidebar-perfil-link sidebar-perfil-boton">
            <IconoSalir />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </nav>
  )
}

// Icono vectorial SVG para la acción "Inicio"
function IconoCasa() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  )
}

// Icono vectorial SVG para la acción "Cerrar sesión"
function IconoSalir() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

export default SideBarPerfil;