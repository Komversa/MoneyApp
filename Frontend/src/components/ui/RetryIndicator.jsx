import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'

/**
 * Componente para mostrar el estado de reintentos
 * Proporciona feedback visual sobre el progreso de operaciones con reintentos
 */
const RetryIndicator = ({ 
  isRetrying, 
  retryCount, 
  maxRetries = 3, 
  onCancel,
  message = 'Reintentando operación...',
  className = ''
}) => {
  if (!isRetrying) return null

  const progress = Math.min((retryCount / maxRetries) * 100, 100)
  const remainingRetries = maxRetries - retryCount

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center space-x-3">
          {/* Icono de reintento animado */}
          <div className="flex-shrink-0">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 1, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            >
              <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </motion.div>
          </div>
          
          {/* Contenido */}
          <div className="flex-1 min-w-0">
            {/* Mensaje principal */}
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {message}
            </p>
            
            {/* Información de reintentos */}
            <div className="flex items-center space-x-4 mt-2">
              {/* Contador de reintentos */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  Intento {retryCount} de {maxRetries}
                </span>
                <span className="text-xs text-blue-500 dark:text-blue-300">
                  ({remainingRetries} restantes)
                </span>
              </div>
              
              {/* Indicador de progreso */}
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-blue-200 dark:bg-blue-700 rounded-full h-2">
                  <motion.div
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
            
            {/* Sugerencias según el progreso */}
            {remainingRetries > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                {remainingRetries === 1 
                  ? 'Último intento...'
                  : `Intentando nuevamente en unos segundos...`
                }
              </p>
            )}
          </div>
          
          {/* Botón de cancelar */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-shrink-0 p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              title="Cancelar operación"
            >
              <XCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Componente para mostrar el resultado final de una operación con reintentos
 */
export const RetryResult = ({ 
  success, 
  retryCount, 
  message,
  className = ''
}) => {
  if (success === undefined) return null

  const Icon = success ? CheckCircle : XCircle
  const colors = success 
    ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-800 dark:text-success-200'
    : 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800 text-danger-800 dark:text-danger-200'
  
  const iconColors = success 
    ? 'text-success-600 dark:text-success-400'
    : 'text-danger-600 dark:text-danger-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`rounded-lg border p-3 ${colors} ${className}`}
    >
      <div className="flex items-center space-x-2">
        <Icon className={`h-4 w-4 ${iconColors}`} />
        <span className="text-sm font-medium">
          {message || (success ? 'Operación completada exitosamente' : 'Operación falló después de todos los reintentos')}
        </span>
        {retryCount > 0 && (
          <span className="text-xs opacity-75">
            (después de {retryCount} reintentos)
          </span>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Componente para mostrar un indicador de espera simple
 */
export const LoadingIndicator = ({ 
  message = 'Cargando...',
  showSpinner = true,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 text-blue-600 dark:text-blue-400 ${className}`}>
      {showSpinner && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </motion.div>
      )}
      <span className="text-sm">{message}</span>
    </div>
  )
}

export default RetryIndicator
