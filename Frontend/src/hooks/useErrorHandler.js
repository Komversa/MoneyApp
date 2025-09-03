import { useState, useCallback, useRef } from 'react'
import { useToast } from '../components/ui/Toaster'
import { OPERATION_TYPES } from '../utils/errorHandler'

/**
 * Hook personalizado para manejo de errores en componentes React
 * Integra el sistema de manejo de errores centralizado con la UI
 */
const useErrorHandler = () => {
  const { error: showError, warning, info } = useToast()
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState(null)
  
  // Referencia para cancelar operaciones en curso
  const abortControllerRef = useRef(null)

  /**
   * Maneja un error y muestra el mensaje apropiado al usuario
   */
  const handleError = useCallback((error, options = {}) => {
    const {
      operationType = OPERATION_TYPES.UNKNOWN,
      entityName = '',
      showToast = true,
      fallbackMessage = null
    } = options

    // Establecer el último error
    setLastError(error)

    // Generar mensaje de error básico
    let userMessage
    if (fallbackMessage) {
      userMessage = fallbackMessage
    } else if (error.metadata?.userMessage) {
      userMessage = error.metadata.userMessage
    } else {
      // Mensaje básico basado en el tipo de operación
      const entity = entityName ? ` de ${entityName}` : ''
      userMessage = `Ocurrió un error${entity}. Por favor, inténtalo de nuevo.`
    }

    // Mostrar toast de error si está habilitado
    if (showToast) {
      showError(userMessage)
    }

    // Log del error
    console.error(`Error en ${operationType}${entityName ? ` de ${entityName}` : ''}:`, error)

    return {
      error,
      userMessage,
      errorType: error.metadata?.errorType || 'unknown',
      isRecoverable: true // Por defecto, permitir reintentos
    }
  }, [showError])

  /**
   * Ejecuta una operación con manejo de errores y reintentos
   */
  const executeWithRetry = useCallback(async (operation, options = {}) => {
    const {
      operationType = OPERATION_TYPES.UNKNOWN,
      entityName = '',
      maxRetries = 3,
      showRetryToasts = true,
      onRetry = null,
      shouldRetry = null,
      onSuccess = null,
      onFinalError = null
    } = options

    // Crear nuevo AbortController para esta operación
    abortControllerRef.current = new AbortController()
    
    try {
      setIsRetrying(false)
      setRetryCount(0)
      setLastError(null)

      // Implementación básica de reintentos
      let lastError
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await operation(abortControllerRef.current.signal)
          
          // Si llegamos aquí, la operación fue exitosa
          setIsRetrying(false)
          setRetryCount(0)
          
          if (onSuccess) {
            onSuccess(result)
          }
          
          return result
        } catch (error) {
          lastError = error
          
          // Si no es el último intento, reintentar
          if (attempt < maxRetries) {
            if (onRetry) {
              onRetry(attempt, maxRetries, error)
            }
            
            if (showRetryToasts) {
              info(`Reintentando... (${attempt}/${maxRetries})`)
            }
            
            // Esperar antes del siguiente intento (backoff exponencial básico)
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }
      
      // Si llegamos aquí, todos los reintentos fallaron
      setIsRetrying(false)
      setRetryCount(0)
      
      if (onFinalError) {
        onFinalError(lastError)
      }
      
      throw lastError
    } catch (error) {
      // Manejar el error final
      setLastError(error)
      throw error
    }
  }, [info])

  /**
   * Cancela la operación en curso
   */
  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsRetrying(false)
      setRetryCount(0)
    }
  }, [])

  /**
   * Limpia el estado de errores
   */
  const clearError = useCallback(() => {
    setLastError(null)
    setRetryCount(0)
    setIsRetrying(false)
  }, [])

  /**
   * Obtiene información del último error
   */
  const getLastErrorInfo = useCallback(() => {
    if (!lastError) return null

    return {
      error: lastError,
      userMessage: lastError.metadata?.userMessage || 'Error desconocido',
      errorType: lastError.metadata?.errorType || 'unknown',
      isRecoverable: true,
      timestamp: lastError.metadata?.timestamp || new Date().toISOString(),
      retryCount: lastError.metadata?.retryCount || 0
    }
  }, [lastError])

  /**
   * Verifica si hay un error activo
   */
  const hasError = useCallback(() => {
    return lastError !== null
  }, [lastError])

  /**
   * Verifica si el error es de un tipo específico
   */
  const isErrorType = useCallback((errorType) => {
    if (!lastError) return false
    const currentErrorType = lastError.metadata?.errorType || 'unknown'
    return currentErrorType === errorType
  }, [lastError])

  /**
   * Verifica si el error es de red
   */
  const isNetworkError = useCallback(() => {
    return isErrorType('network') || isErrorType('timeout')
  }, [isErrorType])

  /**
   * Verifica si el error es de autenticación
   */
  const isAuthError = useCallback(() => {
    return isErrorType('authentication') || isErrorType('authorization')
  }, [isErrorType])

  /**
   * Verifica si el error es de validación
   */
  const isValidationError = useCallback(() => {
    return isErrorType('validation')
  }, [isErrorType])

  /**
   * Verifica si el error es del servidor
   */
  const isServerError = useCallback(() => {
    return isErrorType('server')
  }, [isErrorType])

  return {
    // Estado
    isRetrying,
    retryCount,
    lastError,
    hasError: hasError(),
    
    // Funciones principales
    handleError,
    executeWithRetry,
    cancelOperation,
    clearError,
    
    // Información del error
    getLastErrorInfo,
    
    // Verificadores de tipo de error
    isErrorType,
    isNetworkError: isNetworkError(),
    isAuthError: isAuthError(),
    isValidationError: isValidationError(),
    isServerError: isServerError(),
    
    // Utilidades básicas (implementadas localmente)
    getErrorStats: () => ({ total: 0, byType: {}, byOperation: {}, recent: [] }),
    getErrorLog: () => [],
    clearErrorLog: () => {}
  }
}

export default useErrorHandler
