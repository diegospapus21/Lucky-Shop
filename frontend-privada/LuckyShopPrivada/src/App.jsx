import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Ventas from './pages/Ventas.jsx'
import Productos from "./pages/Productos.jsx"
import Clientes from './pages/Clientes.jsx'
import Bolsas from './pages/Bolsas.jsx'
import RecoveryPasswordAdmin from './pages/RecoveryPasswordAdmin.jsx'
import PerfilAdmin from './pages/PerfilPriv.jsx'
import Finanzas from './pages/Finanzas.jsx'
import VideosCombos from './pages/VideosCombos.jsx'
import PromocionesAdmin from './pages/Promociones.jsx'

import ToastNotificaciones from './components/ToastNotificaciones.jsx'

function App() {
  return (
    <Router>
      <ToastNotificaciones />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/recovery-password" element={<RecoveryPasswordAdmin />} />
        <Route
          path="/perfilAdmin"
          element={
            <ProtectedRoute userType="admin">
              <PerfilAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute userType="admin">
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ventas"
          element={
            <ProtectedRoute userType="admin">
              <Ventas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/productos"
          element={
            <ProtectedRoute userType="admin">
              <Productos />
            </ProtectedRoute>
          }
        />
         <Route
          path="/promociones"
          element={
            <ProtectedRoute userType="admin">
              <PromocionesAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute userType="admin">
              <Clientes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bolsasSuerte"
          element={
            <ProtectedRoute userType="admin">
              <Bolsas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/videosCombos"
          element={
            <ProtectedRoute userType="admin">
              <VideosCombos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finanzas"
          element={
            <ProtectedRoute userType="admin">
              <Finanzas />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App;