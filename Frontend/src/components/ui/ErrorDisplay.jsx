import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertCircle, 
  RefreshCw, 
  X, 
  Wifi, 
  Shield, 
  Server, 
  Clock, 
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react'

/**
 * Componente para mostrar errores de manera informativa
 * Permite al usuario entender qué pasó y qué puede hacer
 */
const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss, 
  onCancel,
  showRetryButton = true,
  showCancelButton = false,
  className = '',
  variant = 'error' // 'error', 'warning', 'info', 'success'
}) => {
  if (!error) return null

  // Iconos según el tipo de error
  const getIcon = () => {
    if (variant === 'success') return CheckCircle
    if (variant === 'warning') return AlertTriangle
    if (variant === 'info') return Info
    
    // Para errores, usar icono según el tipo
    const errorType = error.metadata?.errorType || 'unknown'
    const iconMap = {
      network: Wifi,
      timeout: Clock,
      authentication: Shield,
      authorization: Shield,
      validation: AlertCircle,
      server: Server,
      unknown: AlertCircle
    }
    return iconMap[errorType] || AlertCircle
  }

  // Colores según el tipo
  const getColors = () => {
    const colorMap = {
      success: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-800 dark:text-success-200',
      warning: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800 text-warning-800 dark:text-warning-200',
      info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
      error: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800 text-danger-800 dark:text-danger-200'
    }
    return colorMap[variant] || colorMap.error
  }

  // Colores del icono
  const getIconColors = () => {
    const iconColorMap = {
      success: 'text-success-600 dark:text-success-400',
      warning: 'text-warning-600 dark:text-warning-400',
      info: 'text-blue-600 dark:text-blue-400',
      error: 'text-danger-600 dark:text-danger-400'
    }
    return iconColorMap[variant] || iconColorMap.error
  }

  // Mensaje principal
  const getMainMessage = () => {
    if (error.metadata?.userMessage) {
      return error.metadata.userMessage
    }
    return error.message || 'Ocurrió un error inesperado'
  }

  // Mensaje secundario con detalles técnicos
  const getSecondaryMessage = () => {
    const errorType = error.metadata?.errorType || 'unknown'
    const operationType = error.metadata?.operationType || 'unknown'
    const entityName = error.metadata?.entityName || ''
    
    const details = []
    
    if (entityName) {
      details.push(`Entidad: ${entityName}`)
    }
    
    if (operationType !== 'unknown') {
      details.push(`Operación: ${operationType}`)
    }
    
    if (error.response?.status) {
      details.push(`Código: ${error.response.status}`)
    }
    
    if (error.metadata?.retryCount > 0) {
      details.push(`Reintentos: ${error.metadata.retryCount}`)
    }
    
    return details.length > 0 ? details.join(' • ') : null
  }

  // Sugerencias según el tipo de error
  const getSuggestions = () => {
    const errorType = error.metadata?.errorType || 'unknown'
    
    const suggestions = {
      network: [
        'Verifica tu conexión a internet',
        'Intenta recargar la página',
        'Si el problema persiste, contacta soporte'
      ],
      timeout: [
        'La operación está tardando más de lo esperado',
        'Intenta nuevamente en unos momentos',
        'Verifica la velocidad de tu conexión'
      ],
      authentication: [
        'Tu sesión ha expirado',
        'Inicia sesión nuevamente',
        'Si el problema persiste, contacta soporte'
      ],
      authorization: [
        'No tienes permisos para esta operación',
        'Verifica tu rol de usuario',
        'Contacta al administrador si necesitas acceso'
      ],
      validation: [
        'Revisa los datos ingresados',
        'Asegúrate de que todos los campos requeridos estén completos',
        'Verifica el formato de los datos'
      ],
      server: [
        'El servidor está experimentando problemas',
        'Intenta nuevamente en unos minutos',
        'Si el problema persiste, contacta soporte'
      ],
      unknown: [
        'Ocurrió un error inesperado',
        'Intenta nuevamente',
        'Si el problema persiste, contacta soporte'
      ]
    }
    
    return suggestions[errorType] || suggestions.unknown
  }

  // Determinar si mostrar sugerencias
  const shouldShowSuggestions = variant === 'error' && error.metadata?.errorType !== 'validation'

  const Icon = getIcon()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`rounded-lg border p-4 ${getColors()} ${className}`}
      >
        <div className="flex items-start space-x-3">
          {/* Icono */}
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${getIconColors()}`} />
          </div>
          
          {/* Contenido */}
          <div className="flex-1 min-w-0">
            {/* Mensaje principal */}
            <p className="text-sm font-medium">
              {getMainMessage()}
            </p>
            
            {/* Mensaje secundario */}
            {getSecondaryMessage() && (
              <p className="text-xs mt-1 opacity-75 font-mono">
                {getSecondaryMessage()}
              </p>
            )}
            
            {/* Sugerencias */}
            {shouldShowSuggestions && (
              <div className="mt-3">
                <p className="text-xs font-medium mb-2">Sugerencias:</p>
                <ul className="text-xs space-y-1">
                  {getSuggestions().map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-xs mt-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Botones de acción */}
            <div className="flex items-center space-x-2 mt-4">
              {showRetryButton && onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Reintentar
                </button>
              )}
              
              {showCancelButton && onCancel && (
                <button
                  onClick={onCancel}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
          
          {/* Botón de cerrar */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ErrorDisplay
