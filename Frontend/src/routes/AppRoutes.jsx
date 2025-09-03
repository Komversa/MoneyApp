import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import MainLayout from '../components/layout/MainLayout'

// Páginas públicas
import Login from '../pages/Login'
import Registro from '../pages/Registro'

// Páginas privadas (Dashboard)
import Dashboard from '../pages/Dashboard'
import Cuentas from '../pages/Cuentas'
import Deudas from '../pages/Deudas'
import Transacciones from '../pages/Transacciones'
import Automatizaciones from '../pages/Automatizaciones'
import Configuracion from '../pages/Configuracion'

/**
 * Configuración principal de rutas de la aplicación
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Rutas privadas - Requieren autenticación */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        {/* Rutas anidadas dentro del layout principal */}
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="cuentas" element={<Cuentas />} />
        <Route path="deudas" element={<Deudas />} />
        <Route path="transacciones" element={<Transacciones />} />
        <Route path="automatizaciones" element={<Automatizaciones />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>

      {/* Ruta de fallback - Redirigir al dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes