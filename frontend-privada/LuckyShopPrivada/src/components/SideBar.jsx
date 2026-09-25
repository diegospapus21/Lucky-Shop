import { Link, useLocation } from 'react-router-dom'

// Importación de activos gráficos e iconos para la barra de navegación lateral
import logosite from '../assets/image-removebg-preview.png' 
import HomeIcon from '../assets/icons8-casa-24.png'
import ventaIcon from '../assets/ventas.png'
import productoIcon from '../assets/icons8-paquete-50.png'
import clienteIcon from '../assets/icons8-grupo-de-usuario-2-32.png'
import bolsasIcon from '../assets/suerte.png'
import videosIcon from '../assets/icons8-vídeo-50.png'
import FinanzasIcon from '../assets/finanza.png'

// Componente Sidebar para la navegación principal del panel administrativo
const SideBar = () => {
  const location = useLocation()

  // Evalúa si la ruta actual coincide con la del enlace para aplicar estilos activos
  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <nav className="luckyshop-nav-container">
      {/* Sidebar Principal */}
      <aside className="luckyshop-sidebar">
        
        {/* Identificador visual de la marca / Logo */}
        <div className="logo-container">
          <Link to="/home" className="logo-link">
            <img className="logo-img" src={logosite} alt="Logo de Lucky Shop" />
          </Link>
        </div>

        {/* Separador superior */}
        <div className="sidebar-divider"></div>

        {/* Menú de navegación por módulos */}
        <ul className="sidebar-menu">
          {/* Módulo: Inicio */}
          <li className={`menu-item ${isActive('/home')}`}>
            <Link to="/home" className="menu-link">
              <div className="icon-wrapper">
                <img src={HomeIcon} alt="Inicio" />
              </div>
              <span className="menu-text">Inicio</span>
            </Link>
          </li>

          {/* Módulo: Ventas */}
          <li className={`menu-item ${isActive('/ventas')}`}>
            <Link to="/ventas" className="menu-link">
              <div className="icon-wrapper">
                <img src={ventaIcon} alt="Ventas" />
              </div>
              <span className="menu-text">Ventas</span>
            </Link>
          </li>

          {/* Módulo: Productos */}
          <li className={`menu-item ${isActive('/productos')}`}>
            <Link to="/productos" className="menu-link">
              <div className="icon-wrapper">
                <img src={productoIcon} alt="Productos" />
              </div>
              <span className="menu-text">Productos</span>
            </Link>
          </li>

          {/* Módulo: Promociones */}
          <li className={`menu-item ${isActive('/promociones')}`}>
            <Link to="/promociones" className="menu-link">
              <div className="icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <span className="menu-text">Promociones</span>
            </Link>
          </li>

          {/* Módulo: Clientes */}
          <li className={`menu-item ${isActive('/clientes')}`}>
            <Link to="/clientes" className="menu-link">
              <div className="icon-wrapper">
                <img src={clienteIcon} alt="Clientes" />
              </div>
              <span className="menu-text">Clientes</span>
            </Link>
          </li>

          {/* Módulo: Bolsas de la suerte */}
          <li className={`menu-item ${isActive('/bolsasSuerte')}`}>
            <Link to="/bolsasSuerte" className="menu-link">
              <div className="icon-wrapper">
                <img src={bolsasIcon} alt="Bolsas de la suerte" />
              </div>
              <span className="menu-text">Bolsas de la suerte</span>
            </Link>
          </li>

          {/* Módulo: Videos combos */}
          <li className={`menu-item ${isActive('/videosCombos')}`}>
            <Link to="/videosCombos" className="menu-link">
              <div className="icon-wrapper">
                <img src={videosIcon} alt="Videos combos" />
              </div>
              <span className="menu-text">Videos combos</span>
            </Link>
          </li>

          {/* Separador de sección administrativa/financiera */}
          <div className="sidebar-divider"></div>

          {/* Módulo: Finanzas */}
          <li className={`menu-item ${isActive('/finanzas')}`}>
            <Link to="/finanzas" className="menu-link">
              <div className="icon-wrapper">
                <img src={FinanzasIcon} alt="Finanzas" />
              </div>
              <span className="menu-text">Finanzas</span>
            </Link>
          </li>

          {/* Módulo: Editar Inicio */}
          <li className={`menu-item ${isActive('/editarInicio')}`}>
            <Link to="/editarInicio" className="menu-link">
              <div className="icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <span className="menu-text">Editar Inicio</span>
            </Link>
          </li>
        </ul>
      </aside>
    </nav>
  )
}

export default SideBar;