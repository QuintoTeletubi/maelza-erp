import { Routes, Route } from 'react-router-dom'  // ← SIN BrowserRouter
import Dashboard from '../pages/Dashboard'
import Clientes from '../pages/Clientes'
import Compras from '../pages/Compras'
import Inventario from '../pages/Inventario'
import Proveedores from '../pages/Proveedores'
import Ventas from '../pages/Ventas'
import Login from '../pages/Login'

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      
      {/* Rutas privadas (con layout) */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/compras" element={<Compras />} />
      <Route path="/inventario" element={<Inventario />} />
      <Route path="/proveedores" element={<Proveedores />} />
      <Route path="/ventas" element={<Ventas />} />
    </Routes>
  )
}

export default AppRoutes