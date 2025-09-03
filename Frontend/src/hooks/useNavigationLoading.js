import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Hook para manejar loading durante navegación entre módulos
 * Previene el parpadeo al cambiar de página con un spinner global
 */
const useNavigationLoading = () => {
  const [isNavigating, setIsNavigating] = useState(false)
  const previousPath = useRef('')
  const location = useLocation()
  const timeoutRef = useRef(null)

  useEffect(() => {
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Solo mostrar loading si estamos cambiando de ruta principal
    const currentPath = location.pathname
    const isRouteChange = previousPath.current && previousPath.current !== currentPath

    if (isRouteChange) {
      // Rutas principales que necesitan loading
      const mainRoutes = ['/', '/dashboard', '/cuentas', '/transacciones', '/deudas', '/automatizaciones', '/configuracion']
      const isMainRoute = mainRoutes.some(route => 
        currentPath === route || currentPath.startsWith(route + '/')
      )

      if (isMainRoute) {
        setIsNavigating(true)
        
        // Timing optimizado: mínimo 300ms, máximo 600ms
        timeoutRef.current = setTimeout(() => {
          setIsNavigating(false)
        }, 450)
      }
    }
    
    previousPath.current = currentPath

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [location.pathname])

  return {
    isNavigating,
    currentPath: location.pathname
  }
}

export default useNavigationLoading
