// Navbar.jsx — barra de navegación pública de Lucky Shop
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import logoLucky from '../assets/LogoNegro-removebg-preview.png'

// Lista de categorías que se muestran en el menú de navegación
const CATEGORIAS = [
  { label: 'Inicio',              path: '/home' },
  { label: 'Anillos',             path: '/categoria/anillos' },
  { label: 'Pulseras',            path: '/categoria/pulseras' },
  { label: 'Aritos',          path: '/categoria/aritos' },
  { label: 'Collares',            path: '/categoria/collares' },
  { label: 'Bolsas de la suerte', path: '/bolsas-suerte' },
  { label: 'Acerca de',           path: '/acercaDe' },
  { label: 'Otros',               path: '/categoria/otros' },
]

/* Iconos SVG inline */
// Ícono de lupa (buscar)
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"/>
  </svg>
)

// Ícono de corazón (favoritos)
const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
  </svg>
)

// Ícono de carrito de compras
const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
  </svg>
)

// Ícono de usuario (perfil / login)
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
  </svg>
)

// Ícono de menú hamburguesa (para vista móvil)
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
  </svg>
)

// Ícono de "cerrar" (X), usado para cerrar el menú móvil
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
)

/* Iconos adicionales para el menú de perfil (mismo estilo heroicons) */
// Ícono de sobre/correo (no usado directamente en el JSX actual, queda disponible)
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
  </svg>
)

// Ícono de teléfono (no usado directamente en el JSX actual, queda disponible)
const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
  </svg>
)

// Ícono de "historial" (líneas tipo lista)
const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
  </svg>
)

// Ícono de cámara de video (sección "Videos")
const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/>
  </svg>
)

// Ícono de "cerrar sesión"
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
  </svg>
)

// Ícono de flecha hacia la derecha (usado como indicador en los botones del menú de perfil)
const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
  </svg>
)

const Navbar = () => {
  // Cantidad total de artículos en el carrito (para el contador rojo)
  const { totalItems } = useCart()
  // Datos del cliente autenticado y función para cerrar sesión
  const { cliente, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Texto escrito en la barra de búsqueda
  const [busqueda, setBusqueda] = useState('')
  // Controla si el menú móvil (hamburguesa) está abierto
  const [mobileOpen, setMobileOpen] = useState(false)

  // Controla si el menú emergente del perfil está abierto.
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false)
  // Referencia al contenedor del menú para detectar clics fuera de él.
  const menuPerfilRef = useRef(null)

  // Cierra el menú emergente cuando se hace clic fuera de él.
  useEffect(() => {
    const manejarClicFuera = (e) => {
      if (menuPerfilRef.current && !menuPerfilRef.current.contains(e.target)) {
        setMenuPerfilAbierto(false)
      }
    }
    document.addEventListener('mousedown', manejarClicFuera)
    return () => document.removeEventListener('mousedown', manejarClicFuera)
  }, [])

  // Cierra sesión y redirige al login
  const handleLogout = async () => {
    setMenuPerfilAbierto(false)
    await logout()
    navigate('/login')
  }

  // Envía la búsqueda y navega a la página de resultados
  const handleBuscarSubmit = (e) => {
    e.preventDefault()
    if (!busqueda.trim()) return
    navigate(`/buscar?q=${encodeURIComponent(busqueda.trim())}`)
  }

  // Navega a una ruta y cierra el menú emergente del perfil.
  const irA = (ruta) => {
    setMenuPerfilAbierto(false)
    navigate(ruta)
  }

  // Indica si la ruta dada es la ruta actual (para resaltar el link activo)
  const isActive = (path) => location.pathname === path

  // Datos derivados del usuario para mostrar en el menú de perfil.
  const nombreCompleto = [cliente?.name, cliente?.lastName].filter(Boolean).join(' ') || 'Cliente'
  const inicial = (cliente?.name || cliente?.email || 'C').charAt(0).toUpperCase()

  return (
    <header className="bg-[#fbdce6] shadow-[0_1px_3px_rgba(0,0,0,0.05)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Barra superior: logo, buscador e íconos */}
        <div className="flex items-center justify-between py-3 gap-3 sm:gap-6">
          {/* Logo, lleva a la página de inicio */}
          <Link to="/home" className="flex-shrink-0" id="nav-logo">
            <img
              src={logoLucky}
              alt="Lucky Shop"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </Link>

          {/* Barra de búsqueda (solo visible en escritorio) */}
          <form onSubmit={handleBuscarSubmit} className="flex-1 max-w-md hidden sm:block" id="nav-search">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar"
                className="w-full pl-10 pr-4 py-2 rounded-full border border-white/60 bg-white/90 text-sm outline-none focus:border-pink-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(236,72,153,0.1)] transition-all duration-200"
              />
            </div>
          </form>

          {/* Íconos de acción: favoritos, carrito, usuario y menú móvil */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Favoritos (siempre visible) */}
            <Link
              to="/Favoritos"
              className="p-2 rounded-full text-gray-600 hover:text-pink-500 hover:bg-white/50 transition-all duration-200"
              id="nav-favorites"
              title="Favoritos"
            >
              <HeartIcon />
            </Link>

            {/* Carrito (siempre visible), con contador de items */}
            <Link
              to="/carrito"
              className="relative p-2 rounded-full text-gray-600 hover:text-pink-500 hover:bg-white/50 transition-all duration-200"
              id="nav-cart"
              title="Carrito"
            >
              <CartIcon />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-pink-500 to-pink-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Usuario: si hay sesión activa muestra el menú de perfil, si no un link a login */}
            {cliente ? (
              <div className="relative ml-1" ref={menuPerfilRef}>
                {/* Botón de perfil: ahora abre el menú emergente en lugar de ir a /perfil */}
                <button
                  onClick={() => setMenuPerfilAbierto((v) => !v)}
                  className="flex items-center gap-1.5 p-2 rounded-full text-gray-700 hover:text-pink-500 hover:bg-white/50 font-medium transition-all duration-200"
                  id="nav-profile"
                  title="Mi perfil"
                  aria-expanded={menuPerfilAbierto}
                  aria-haspopup="true"
                >
                  {cliente.profileImage ? (
                    <img
                      src={cliente.profileImage}
                      alt={nombreCompleto}
                      className="w-8 h-8 rounded-full object-cover border-2 border-pink-200"
                    />
                  ) : (
                    <UserIcon />
                  )}
                  <span className="hidden md:inline text-sm">{cliente.name || cliente.email}</span>
                </button>

                {/* Menú emergente (dropdown) con datos del usuario y accesos rápidos */}
                {menuPerfilAbierto && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-pink-100 py-3 z-50 animate-[slideDown_0.15s_ease]">
                    {/* Encabezado con avatar + datos del usuario */}
                    <div className="flex items-center gap-3 px-4 pb-3">
                      <div className="w-11 h-11 rounded-full bg-pink-100 border border-pink-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {cliente.profileImage ? (
                          <img
                            src={cliente.profileImage}
                            alt={nombreCompleto}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-pink-600 font-bold text-lg">{inicial}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 truncate">{nombreCompleto}</p>
                        <p className="text-xs text-gray-400 truncate">{cliente?.email}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 my-1" />

                    {/* Ir a la página de información del usuario */}
                    <button
                      onClick={() => irA('/perfil')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 transition-colors"
                    >
                      <span className="text-gray-400"><UserIcon /></span>
                      <span className="font-medium">Mi Información</span>
                    </button>
                   

                    {/* Accesos rápidos: historial de compras y videos */}
                    <button
                      onClick={() => irA('/historial')}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-gray-400"><HistoryIcon /></span>
                        <span className="font-medium">Historial</span>
                      </span>
                      <span className="text-gray-300"><ChevronRightIcon /></span>
                    </button>
                    <button
                      onClick={() => irA('/videos')}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-gray-400"><VideoIcon /></span>
                        <span className="font-medium">Videos</span>
                      </span>
                      <span className="text-gray-300"><ChevronRightIcon /></span>
                    </button>

                    <div className="border-t border-gray-100 my-1" />

                    {/* Cerrar sesión */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                      id="nav-logout"
                    >
                      <LogoutIcon />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Sin sesión activa: ícono de usuario que lleva al login
              <Link
                to="/login"
                className="p-2 rounded-full text-gray-600 hover:text-pink-500 hover:bg-white/50 transition-all duration-200"
                id="nav-user-icon"
                title="Iniciar sesión"
              >
                <UserIcon />
              </Link>
            )}

            {/* Botón de menú hamburguesa (solo en móvil) */}
            <button
              className="sm:hidden p-2 rounded-full text-gray-600 hover:bg-white/50 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              id="nav-mobile-toggle"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Menú de categorías (solo escritorio) */}
        <nav className="border-t border-white/50 hidden sm:block" id="nav-categories">
          <ul className="flex items-center justify-center gap-0.5 py-1 overflow-x-auto scrollbar-none">
            {CATEGORIAS.map((c) => (
              <li key={c.path} className="flex-shrink-0">
                <Link
                  to={c.path}
                  className={`nav-link-fancy px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap block rounded-md ${
                    isActive(c.path)
                      ? 'text-pink-600 bg-white/60'
                      : 'text-gray-700 hover:text-pink-500 hover:bg-white/40'
                  }`}
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Menú desplegable para móvil (buscador + categorías + login/registro) */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-white/50 bg-[#fbdce6] animate-[slideDown_0.2s_ease]">
          {/* Buscador en versión móvil */}
          <form onSubmit={handleBuscarSubmit} className="px-4 pt-3">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar"
                className="w-full pl-10 pr-4 py-2 rounded-full border border-white/60 bg-white/90 text-sm outline-none focus:border-pink-400 focus:bg-white transition-all"
              />
            </div>
          </form>

          {/* Lista de categorías en versión móvil */}
          <ul className="px-2 py-2">
            {CATEGORIAS.map((c) => (
              <li key={c.path}>
                <Link
                  to={c.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive(c.path)
                      ? 'text-pink-600 bg-white/60'
                      : 'text-gray-700 hover:text-pink-500 hover:bg-white/40'
                  }`}
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Sección de perfil en móvil (si hay sesión activa) */}
          {cliente && (
            <div className="px-4 py-3 border-b border-white/50">
              <Link
                to="/perfil"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-pink-100 border border-pink-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {cliente.profileImage ? (
                    <img
                      src={cliente.profileImage}
                      alt={nombreCompleto}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-pink-600 font-bold">{inicial}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{nombreCompleto}</p>
                  <p className="text-xs text-gray-500 truncate">{cliente.email}</p>
                </div>
              </Link>
            </div>
          )}

          {/* Botones de login/registro (solo si no hay sesión activa) */}
          {!cliente && (
            <div className="px-4 pb-3 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-sm text-gray-700 border border-white/70 px-4 py-2 rounded-full font-medium hover:border-pink-400 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-sm bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-full font-semibold hover:shadow-lg hover:shadow-pink-200 transition-all"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

export default Navbar;