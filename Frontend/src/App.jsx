import React, { useEffect } from 'react'
import AppRoutes from './routes/AppRoutes'
import { Toaster } from './components/ui/Toaster'
import { ConfirmDialogProvider } from './contexts/ConfirmDialogContext'
import useAuthStore from './store/useAuthStore'

function App() {
  const { obtenerConfiguracionUsuario, user, isAuthenticated } = useAuthStore()

  // Aplicar tema al cargar la aplicación y cuando cambien las configuraciones
  useEffect(() => {
    console.log(`\n🎨 === APLICACIÓN DE TEMA EN APP ===`)
    
    const configuracion = obtenerConfiguracionUsuario()
    const theme = configuracion.theme || 'light'
    
    console.log(`🔍 Configuración obtenida:`, configuracion)
    console.log(`🎯 Tema a aplicar: ${theme}`)
    console.log(`👤 Usuario autenticado: ${isAuthenticated ? 'Sí' : 'No'}`)
    
    // Aplicar clase al documento
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      console.log(`🌙 Tema oscuro aplicado al DOM`)
    } else {
      document.documentElement.classList.remove('dark')
      console.log(`☀️  Tema claro aplicado al DOM`)
    }
  }, [obtenerConfiguracionUsuario, user?.settings?.theme, isAuthenticated])

  return (
    <ConfirmDialogProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <AppRoutes />
        <Toaster />
      </div>
    </ConfirmDialogProvider>
  )
}

export default App