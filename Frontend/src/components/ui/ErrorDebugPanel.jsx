import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bug, 
  X, 
  Trash2, 
  Download, 
  Eye, 
  EyeOff,
  AlertTriangle,
  Clock,
  Wifi,
  Shield,
  Server,
  AlertCircle
} from 'lucide-react'

/**
 * Panel de debug para desarrolladores
 * Muestra estadísticas de errores y logs del sistema
 */
const ErrorDebugPanel = ({ 
  errorStats, 
  errorLog, 
  onClearLog, 
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  if (!errorStats || errorStats.total === 0) {
    return null
  }

  const getErrorTypeIcon = (errorType) => {
    const iconMap = {
      network: Wifi,
      timeout: Clock,
      authentication: Shield,
      authorization: Shield,
      validation: AlertCircle,
      server: Server,
      unknown: AlertTriangle
    }
    return iconMap[errorType] || AlertTriangle
  }

  const getErrorTypeColor = (errorType) => {
    const colorMap = {
      network: 'text-blue-600 dark:text-blue-400',
      timeout: 'text-yellow-600 dark:text-yellow-400',
      authentication: 'text-red-600 dark:text-red-400',
      authorization: 'text-red-600 dark:text-red-400',
      validation: 'text-orange-600 dark:text-orange-400',
      server: 'text-purple-600 dark:text-purple-400',
      unknown: 'text-gray-600 dark:text-gray-400'
    }
    return colorMap[errorType] || 'text-gray-600 dark:text-gray-400'
  }

  const exportErrorLog = () => {
    const dataStr = JSON.stringify(errorLog, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `error-log-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Bug className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Debug: Errores del Sistema
          </span>
          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-0.5 rounded-full">
            {errorStats.total}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title={showDetails ? 'Ocultar detalles' : 'Mostrar detalles'}
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          
          <button
            onClick={exportErrorLog}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Exportar log de errores"
          >
            <Download className="h-4 w-4" />
          </button>
          
          <button
            onClick={onClearLog}
            className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            title="Limpiar log de errores"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title={isExpanded ? 'Contraer' : 'Expandir'}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-4 w-4" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Contenido expandible */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-4">
              {/* Estadísticas por tipo de error */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Errores por Tipo
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(errorStats.byType).map(([type, count]) => {
                    const Icon = getErrorTypeIcon(type)
                    return (
                      <div key={type} className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-700 rounded border">
                        <Icon className={`h-4 w-4 ${getErrorTypeColor(type)}`} />
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {type}
                        </span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                          {count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Estadísticas por operación */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Errores por Operación
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(errorStats.byOperation).map(([operation, count]) => (
                    <div key={operation} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {operation}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Log detallado de errores */}
              {showDetails && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Log Detallado (Últimos 10)
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {errorStats.recent.map((error, index) => (
                      <div key={index} className="p-2 bg-white dark:bg-gray-700 rounded border text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {new Date(error.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getErrorTypeColor(error.errorType)} bg-opacity-10`}>
                            {error.errorType}
                          </span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {error.message}
                        </div>
                        {error.url && (
                          <div className="text-gray-500 dark:text-gray-500 font-mono">
                            {error.method} {error.url}
                          </div>
                        )}
                        {error.status && (
                          <div className="text-gray-500 dark:text-gray-500">
                            Status: {error.status}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ErrorDebugPanel
