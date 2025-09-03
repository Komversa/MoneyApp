/**
 * Sistema de Manejo de Errores Centralizado
 * Proporciona manejo robusto de errores con categorización, reintentos y logging
 */

// Tipos de errores
export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  SERVER: 'server',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown'
}

// Categorías de operaciones
export const OPERATION_TYPES = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  AUTH: 'authentication',
  CONFIG: 'configuration'
}

/**
 * Clase para manejar errores de manera centralizada
 */
class ErrorHandler {
  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 segundo
      maxDelay: 10000, // 10 segundos
      backoffMultiplier: 2
    }
    
    this.errorLog = []
    this.maxLogSize = 100
  }

  /**
   * Categoriza un error basado en su tipo
   */
  categorizeError(error) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return ERROR_TYPES.TIMEOUT
    }
    
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return ERROR_TYPES.NETWORK
    }
    
    if (error.response?.status === 401) {
      return ERROR_TYPES.AUTHENTICATION
    }
    
    if (error.response?.status === 403) {
      return ERROR_TYPES.AUTHORIZATION
    }
    
    if (error.response?.status === 400) {
      return ERROR_TYPES.VALIDATION
    }
    
    if (error.response?.status >= 500) {
      return ERROR_TYPES.SERVER
    }
    
    return ERROR_TYPES.UNKNOWN
  }

  /**
   * Genera un mensaje de error amigable para el usuario
   */
  generateUserMessage(error, operationType, entityName = '') {
    const errorType = this.categorizeError(error)
    const entity = entityName ? ` de ${entityName}` : ''
    
    const messages = {
      [ERROR_TYPES.TIMEOUT]: `La operación${entity} está tardando más de lo esperado. Por favor, inténtalo de nuevo.`,
      [ERROR_TYPES.NETWORK]: `No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo de nuevo.`,
      [ERROR_TYPES.AUTHENTICATION]: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      [ERROR_TYPES.AUTHORIZATION]: 'No tienes permisos para realizar esta operación.',
      [ERROR_TYPES.VALIDATION]: `Los datos proporcionados${entity} no son válidos. Por favor, verifica la información.`,
      [ERROR_TYPES.SERVER]: 'El servidor está experimentando problemas. Por favor, inténtalo más tarde.',
      [ERROR_TYPES.UNKNOWN]: `Ocurrió un error inesperado${entity}. Por favor, inténtalo de nuevo.`
    }
    
    // Personalizar mensajes según la operación
    if (operationType) {
      const operationMessages = {
        [OPERATION_TYPES.CREATE]: `No se pudo crear${entity}. `,
        [OPERATION_TYPES.READ]: `No se pudo cargar${entity}. `,
        [OPERATION_TYPES.UPDATE]: `No se pudo actualizar${entity}. `,
        [OPERATION_TYPES.DELETE]: `No se pudo eliminar${entity}. `,
        [OPERATION_TYPES.AUTH]: '',
        [OPERATION_TYPES.CONFIG]: `No se pudo configurar${entity}. `
      }
      
      return operationMessages[operationType] + messages[errorType]
    }
    
    return messages[errorType]
  }

  /**
   * Calcula el delay para reintentos usando backoff exponencial
   */
  calculateRetryDelay(attempt) {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
      this.retryConfig.maxDelay
    )
    
    // Agregar jitter para evitar thundering herd
    const jitter = Math.random() * 0.1 * delay
    return delay + jitter
  }

  /**
   * Ejecuta una operación con reintentos automáticos
   */
  async executeWithRetry(operation, options = {}) {
    const {
      maxRetries = this.retryConfig.maxRetries,
      operationType = OPERATION_TYPES.UNKNOWN,
      entityName = '',
      onRetry = null,
      shouldRetry = null
    } = options

    let lastError
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        // Log del error
        this.logError(error, operationType, entityName, attempt)
        
        // Verificar si debemos reintentar
        if (attempt === maxRetries || (shouldRetry && !shouldRetry(error))) {
          break
        }
        
        // Determinar si el error es recuperable
        const errorType = this.categorizeError(error)
        if (!this.isRecoverableError(errorType)) {
          break
        }
        
        // Notificar sobre el reintento
        if (onRetry) {
          onRetry(attempt + 1, maxRetries, error)
        }
        
        // Esperar antes del siguiente intento
        if (attempt < maxRetries) {
          const delay = this.calculateRetryDelay(attempt)
          await this.sleep(delay)
        }
      }
    }
    
    // Si llegamos aquí, todos los reintentos fallaron
    throw this.enhanceError(lastError, operationType, entityName, maxRetries)
  }

  /**
   * Determina si un error es recuperable (puede reintentarse)
   */
  isRecoverableError(errorType) {
    const recoverableErrors = [
      ERROR_TYPES.NETWORK,
      ERROR_TYPES.TIMEOUT,
      ERROR_TYPES.SERVER
    ]
    
    return recoverableErrors.includes(errorType)
  }

  /**
   * Mejora el error con información adicional
   */
  enhanceError(error, operationType, entityName, retryCount) {
    const enhancedError = new Error(error.message || 'Error desconocido')
    
    // Copiar propiedades del error original
    Object.assign(enhancedError, error)
    
    // Agregar metadatos
    enhancedError.metadata = {
      originalError: error,
      operationType,
      entityName,
      retryCount,
      errorType: this.categorizeError(error),
      timestamp: new Date().toISOString(),
      userMessage: this.generateUserMessage(error, operationType, entityName)
    }
    
    return enhancedError
  }

  /**
   * Registra un error en el log interno
   */
  logError(error, operationType, entityName, attempt) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      errorType: this.categorizeError(error),
      operationType,
      entityName,
      attempt,
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method
    }
    
    this.errorLog.push(errorLog)
    
    // Mantener el log dentro del tamaño máximo
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }
    
    // Log en consola para debugging
    console.group(`🚨 Error en ${operationType}${entityName ? ` de ${entityName}` : ''}`)
    console.error('Error completo:', error)
    console.error('Metadatos:', errorLog)
    console.groupEnd()
    
    // Aquí podrías enviar el error a un servicio de logging externo
    // this.sendToExternalLogger(errorLog)
  }

  /**
   * Obtiene el historial de errores
   */
  getErrorLog() {
    return [...this.errorLog]
  }

  /**
   * Limpia el historial de errores
   */
  clearErrorLog() {
    this.errorLog = []
  }

  /**
   * Obtiene estadísticas de errores
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      byOperation: {},
      recent: this.errorLog.slice(-10)
    }
    
    this.errorLog.forEach(error => {
      // Contar por tipo de error
      stats.byType[error.errorType] = (stats.byType[error.errorType] || 0) + 1
      
      // Contar por operación
      stats.byOperation[error.operationType] = (stats.byOperation[error.operationType] || 0) + 1
    })
    
    return stats
  }

  /**
   * Función de utilidad para esperar
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Envía errores a un servicio de logging externo (implementación futura)
   */
  async sendToExternalLogger(errorLog) {
    // Aquí podrías implementar el envío a servicios como:
    // - Sentry
    // - LogRocket
    // - Rollbar
    // - Tu propio servicio de logging
    try {
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorLog)
      // })
    } catch (error) {
      console.warn('No se pudo enviar el error al logger externo:', error)
    }
  }
}

// Instancia singleton del manejador de errores
const errorHandler = new ErrorHandler()

// Funciones de conveniencia para uso directo
export const handleError = (error, operationType, entityName) => {
  return errorHandler.executeWithRetry(() => Promise.reject(error), {
    operationType,
    entityName,
    maxRetries: 0 // No reintentar si ya es un error
  })
}

export const executeWithRetry = (operation, options) => {
  return errorHandler.executeWithRetry(operation, options)
}

export const getErrorStats = () => errorHandler.getErrorStats()
export const getErrorLog = () => errorHandler.getErrorLog()
export const clearErrorLog = () => errorHandler.clearErrorLog()

// Exportar la instancia principal
export default errorHandler
