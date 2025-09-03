# Sistema de Manejo de Errores - MoneyApp

## 🎯 Descripción General

Se ha implementado un sistema robusto y sofisticado de manejo de errores que proporciona:

- **Categorización automática de errores** por tipo y operación
- **Reintentos automáticos** con backoff exponencial
- **Mensajes de error informativos** para el usuario
- **Logging detallado** para debugging
- **Estados de error específicos** para diferentes operaciones
- **Manejo de errores de red** (timeout, conexión perdida)
- **Componentes UI informativos** para mostrar errores

## 🏗️ Arquitectura del Sistema

### 1. Core del Sistema (`Frontend/src/utils/errorHandler.js`)

#### Clase ErrorHandler
- **Singleton pattern** para manejo centralizado
- **Categorización automática** de errores
- **Sistema de reintentos** con configuración personalizable
- **Logging interno** con límite configurable
- **Backoff exponencial** con jitter para evitar thundering herd

#### Tipos de Errores Soportados
```javascript
export const ERROR_TYPES = {
  NETWORK: 'network',        // Errores de conexión
  AUTHENTICATION: 'authentication', // 401 Unauthorized
  AUTHORIZATION: 'authorization',   // 403 Forbidden
  VALIDATION: 'validation',        // 400 Bad Request
  SERVER: 'server',               // 5xx Server Errors
  TIMEOUT: 'timeout',            // Timeouts de conexión
  UNKNOWN: 'unknown'             // Errores no categorizados
}
```

#### Tipos de Operaciones
```javascript
export const OPERATION_TYPES = {
  CREATE: 'create',           // Crear recursos
  READ: 'read',              // Leer recursos
  UPDATE: 'update',          // Actualizar recursos
  DELETE: 'delete',          // Eliminar recursos
  AUTH: 'authentication',    // Operaciones de autenticación
  CONFIG: 'configuration'    // Operaciones de configuración
}
```

### 2. Hook de React (`Frontend/src/hooks/useErrorHandler.js`)

#### Funcionalidades
- **Integración con React** y estado local
- **Manejo de reintentos** con feedback visual
- **Cancelación de operaciones** en curso
- **Verificadores de tipo** de error
- **Acceso a estadísticas** y logs

#### Uso Básico
```javascript
const errorHandler = useErrorHandler()

// Ejecutar operación con reintentos
const result = await errorHandler.executeWithRetry(
  () => apiCall(),
  {
    operationType: OPERATION_TYPES.CREATE,
    entityName: 'usuario',
    maxRetries: 3
  }
)

// Verificar tipos de error
if (errorHandler.isNetworkError) {
  // Mostrar mensaje específico para errores de red
}

if (errorHandler.isAuthError) {
  // Redirigir al login
}
```

### 3. Componentes UI

#### ErrorDisplay (`Frontend/src/components/ui/ErrorDisplay.jsx`)
- **Mensajes contextuales** según el tipo de error
- **Sugerencias de acción** para el usuario
- **Botones de reintento** para errores recuperables
- **Información técnica** para debugging

#### RetryIndicator (`Frontend/src/components/ui/RetryIndicator.jsx`)
- **Indicador visual** del progreso de reintentos
- **Contador de intentos** restantes
- **Botón de cancelación** de operación
- **Animaciones suaves** para mejor UX

#### ErrorDebugPanel (`Frontend/src/components/ui/ErrorDebugPanel.jsx`)
- **Panel de debug** solo visible en desarrollo
- **Estadísticas de errores** por tipo y operación
- **Log detallado** de errores recientes
- **Exportación** de logs para análisis

## 🚀 Implementación en Hooks Existentes

### Hook useConfiguracion

Todas las operaciones CRUD ahora incluyen:

```javascript
// Antes
const response = await crearTipoCuentaAPI(data)

// Después
const response = await errorHandler.executeWithRetry(
  () => crearTipoCuentaAPI(data),
  {
    operationType: OPERATION_TYPES.CREATE,
    entityName: 'tipo de cuenta',
    maxRetries: 2,
    onRetry: (attempt, maxRetries) => {
      console.log(`Reintentando creación (${attempt}/${maxRetries})`)
    }
  }
)
```

### Manejo de Errores Mejorado

```javascript
// Antes
} catch (error) {
  const errorMessage = error.response?.data?.message || error.message
  showError(errorMessage)
}

// Después
} catch (error) {
  const errorInfo = errorHandler.handleError(error, {
    operationType: OPERATION_TYPES.CREATE,
    entityName: 'tipo de cuenta'
  })
  return { success: false, error: errorInfo.userMessage }
}
```

## 📊 Configuración del Sistema

### Configuración de Reintentos
```javascript
const retryConfig = {
  maxRetries: 3,           // Máximo número de reintentos
  baseDelay: 1000,         // Delay base en ms
  maxDelay: 10000,         // Delay máximo en ms
  backoffMultiplier: 2     // Multiplicador exponencial
}
```

### Configuración de Logging
```javascript
const maxLogSize = 100     // Máximo número de errores en log
```

## 🎨 Personalización de Mensajes

### Mensajes por Tipo de Error
```javascript
const messages = {
  [ERROR_TYPES.NETWORK]: 'No se pudo conectar con el servidor...',
  [ERROR_TYPES.TIMEOUT]: 'La operación está tardando más de lo esperado...',
  [ERROR_TYPES.AUTHENTICATION]: 'Tu sesión ha expirado...',
  // ... más mensajes personalizados
}
```

### Mensajes por Operación
```javascript
const operationMessages = {
  [OPERATION_TYPES.CREATE]: 'No se pudo crear',
  [OPERATION_TYPES.READ]: 'No se pudo cargar',
  [OPERATION_TYPES.UPDATE]: 'No se pudo actualizar',
  [OPERATION_TYPES.DELETE]: 'No se pudo eliminar'
}
```

## 🔧 Uso Avanzado

### Reintentos Condicionales
```javascript
const response = await errorHandler.executeWithRetry(
  () => apiCall(),
  {
    shouldRetry: (error) => {
      // Solo reintentar errores de red o servidor
      return errorHandler.isRecoverableError(
        errorHandler.categorizeError(error)
      )
    }
  }
)
```

### Callbacks Personalizados
```javascript
const response = await errorHandler.executeWithRetry(
  () => apiCall(),
  {
    onRetry: (attempt, maxRetries, error) => {
      // Notificar al usuario sobre reintentos
      showToast(`Reintentando... (${attempt}/${maxRetries})`)
    },
    onSuccess: (result) => {
      // Acción después del éxito
      console.log('Operación completada:', result)
    },
    onFinalError: (errorInfo) => {
      // Acción después de fallar todos los reintentos
      console.error('Error final:', errorInfo)
    }
  }
)
```

### Cancelación de Operaciones
```javascript
// En un useEffect cleanup
useEffect(() => {
  return () => {
    errorHandler.cancelOperation()
  }
}, [])

// O manualmente
const handleCancel = () => {
  errorHandler.cancelOperation()
}
```

## 📈 Monitoreo y Debugging

### Estadísticas de Errores
```javascript
const stats = errorHandler.getErrorStats()
console.log('Total de errores:', stats.total)
console.log('Por tipo:', stats.byType)
console.log('Por operación:', stats.byOperation)
console.log('Errores recientes:', stats.recent)
```

### Log de Errores
```javascript
const errorLog = errorHandler.getErrorLog()
console.log('Log completo:', errorLog)

// Limpiar log
errorHandler.clearErrorLog()
```

### Panel de Debug
El panel de debug se muestra automáticamente en modo desarrollo y proporciona:
- Vista general de errores por tipo
- Estadísticas por operación
- Log detallado con timestamps
- Exportación de logs para análisis

## 🚨 Mejores Prácticas

### 1. Categorización de Errores
- Siempre especifica `operationType` y `entityName`
- Usa los tipos predefinidos cuando sea posible
- Personaliza mensajes según el contexto

### 2. Configuración de Reintentos
- No uses demasiados reintentos para operaciones críticas
- Considera el impacto en la experiencia del usuario
- Implementa cancelación para operaciones largas

### 3. Manejo de Estados
- Limpia errores cuando sea apropiado
- Proporciona feedback visual durante reintentos
- Permite al usuario cancelar operaciones largas

### 4. Logging
- No expongas información sensible en logs
- Mantén logs con un tamaño razonable
- Implementa rotación de logs para producción

## 🔮 Futuras Mejoras

### Integración con Servicios Externos
- **Sentry** para monitoreo de errores en producción
- **LogRocket** para reproducción de sesiones
- **Rollbar** para notificaciones en tiempo real

### Métricas y Analytics
- **Dashboard de errores** en tiempo real
- **Alertas automáticas** para errores críticos
- **Análisis de tendencias** de errores

### Machine Learning
- **Detección automática** de patrones de error
- **Predicción** de fallos potenciales
- **Optimización automática** de reintentos

## 📝 Ejemplos de Uso

### Operación Simple con Reintentos
```javascript
const createUser = async (userData) => {
  try {
    const result = await errorHandler.executeWithRetry(
      () => api.createUser(userData),
      {
        operationType: OPERATION_TYPES.CREATE,
        entityName: 'usuario',
        maxRetries: 2
      }
    )
    return result
  } catch (error) {
    // El error ya fue manejado por el sistema
    throw error
  }
}
```

### Operación con Manejo Personalizado
```javascript
const updateProfile = async (profileData) => {
  try {
    const result = await errorHandler.executeWithRetry(
      () => api.updateProfile(profileData),
      {
        operationType: OPERATION_TYPES.UPDATE,
        entityName: 'perfil',
        maxRetries: 3,
        onRetry: (attempt, maxRetries) => {
          showProgress(`Actualizando perfil... (${attempt}/${maxRetries})`)
        },
        onSuccess: () => {
          showSuccess('Perfil actualizado exitosamente')
        }
      }
    )
    return result
  } catch (error) {
    // Manejo específico para esta operación
    if (errorHandler.isValidationError) {
      showValidationErrors(error.details)
    }
    throw error
  }
}
```

## 🎉 Conclusión

Este sistema de manejo de errores proporciona una base sólida para:

- **Mejor experiencia del usuario** con mensajes claros y acciones sugeridas
- **Robustez de la aplicación** con reintentos automáticos
- **Debugging eficiente** con logging detallado y herramientas de análisis
- **Mantenibilidad del código** con manejo centralizado de errores
- **Escalabilidad** para futuras mejoras y integraciones

La implementación sigue las mejores prácticas de React y proporciona una API intuitiva para los desarrolladores, mientras mantiene la simplicidad para casos de uso básicos.
