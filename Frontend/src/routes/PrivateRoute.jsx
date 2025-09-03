import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

/**
 * Componente que protege rutas privadas
 * Redirige al login si el usuario no está autenticado
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const location = useLocation()

  // Verificar autenticación
  const isAuth = isAuthenticated && checkAuth()

  if (!isAuth) {
    // Redirigir al login preservando la ubicación actual
    // para poder redirigir de vuelta después del login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default PrivateRoute