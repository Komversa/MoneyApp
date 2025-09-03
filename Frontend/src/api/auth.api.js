import axios from 'axios'
import { API_CONFIG } from './config.js'

/**
 * Configuración base de axios para el API
 * Usa la configuración centralizada
 */
const API_BASE_URL = API_CONFIG.baseURL

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Interceptor de peticiones para agregar el token de autorización
 * Se ejecuta antes de cada petición HTTP
 */
apiClient.interceptors.request.use(
  (config) => {
    // Obtener el token del localStorage (donde Zustand persiste el estado)
    const persistedState = localStorage.getItem('moneyapp-auth')
    
    if (persistedState) {
      try {
        const authData = JSON.parse(persistedState)
        const accessToken = authData?.state?.accessToken
        
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`
        }
      } catch (error) {
        console.warn('Error al parsear el token del localStorage:', error)
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Interceptor de respuestas para manejar errores globales
 * Se ejecuta después de cada respuesta HTTP
 */
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    // Mejorar el error con información adicional
    if (!error.metadata) {
      error.metadata = {
        timestamp: new Date().toISOString(),
        url: error.config?.url,
        method: error.config?.method,
        retryCount: 0
      }
    }
    
    // Manejar errores de autenticación (401)
    if (error.response?.status === 401) {
      // Intentar renovar el token automáticamente
      try {
        const persistedState = localStorage.getItem('moneyapp-auth')
        
        if (persistedState) {
          const authData = JSON.parse(persistedState)
          const refreshToken = authData?.state?.refreshToken
        
          if (refreshToken) {
            console.log('🔄 Token expirado, intentando renovación automática...')
            
            // Importar la función de renovación
            const { refreshTokenAPI } = await import('./auth.api')
            const refreshResponse = await refreshTokenAPI(refreshToken)
            
            if (refreshResponse.success) {
              // Actualizar el token en localStorage
              const updatedState = {
                ...authData,
                state: {
                  ...authData.state,
                  accessToken: refreshResponse.data.accessToken
                }
              }
              localStorage.setItem('moneyapp-auth', JSON.stringify(updatedState))
              
              // Reintentar la petición original con el nuevo token
              const originalRequest = error.config
              originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`
              
              console.log('✅ Token renovado, reintentando petición original...')
              return apiClient(originalRequest)
            }
          }
        }
      } catch (refreshError) {
        console.warn('⚠️ No se pudo renovar el token:', refreshError)
      }
      
      // Si la renovación falla, limpiar el estado y redirigir al login
      console.log('❌ Renovación de token falló, redirigiendo al login...')
      localStorage.removeItem('moneyapp-auth')
      
      // Redirigir al login si no estamos ya en páginas de auth
      const currentPath = window.location.pathname
      if (!currentPath.includes('/login') && !currentPath.includes('/registro')) {
        window.location.href = '/login'
      }
    }
    
    // Log del error para debugging
    console.group('🚨 Error de API interceptado')
    console.error('Error completo:', error)
    console.error('Metadatos:', error.metadata)
    if (error.response?.data) {
      console.error('Respuesta del servidor:', error.response.data)
    }
    console.groupEnd()
    
    return Promise.reject(error)
  }
)

/**
 * Función para iniciar sesión
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const loginAPI = async (email, password) => {
  try {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password
    })
    
    return response.data
  } catch (error) {
    // Re-lanzar el error para que lo maneje el store
    throw error
  }
}

/**
 * Función para registrar un nuevo usuario
 * @param {Object} userData - Datos del usuario {email, password}
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const registerAPI = async (userData) => {
  try {
    const response = await apiClient.post('/api/auth/registro', userData)
    
    return response.data
  } catch (error) {
    // Re-lanzar el error para que lo maneje el store
    throw error
  }
}

/**
 * Función para obtener el perfil del usuario autenticado
 * @returns {Promise<Object>} - Datos del perfil del usuario
 */
export const getProfileAPI = async () => {
  try {
    const response = await apiClient.get('/api/auth/perfil')
    
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Función para renovar el token de acceso usando refresh token
 * @param {string} refreshToken - Token de refresco válido
 * @returns {Promise<Object>} - Nuevo access token
 */
export const refreshTokenAPI = async (refreshToken) => {
  try {
    const response = await apiClient.post('/api/auth/refresh', {
      refreshToken
    })
    
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Función para verificar el estado del servidor
 * @returns {Promise<Object>} - Estado del servidor
 */
export const healthCheckAPI = async () => {
  try {
    const response = await apiClient.get('/health')
    
    return response.data
  } catch (error) {
    throw error
  }
}

// Exportar la instancia de axios para uso en otros módulos
export default apiClient