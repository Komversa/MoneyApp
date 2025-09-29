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
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
})

/**
 * Interceptor de peticiones para agregar el token de autorización
 * Se ejecuta antes de cada petición HTTP
{{ ... }}
      if (!currentPath.includes('/login') && !currentPath.includes('/registro')) {
        window.location.href = '/login'
      }
    }
    
    // Log del error solo en desarrollo
    if (import.meta.env.DEV) {
      console.group('🚨 Error de API interceptado')
      console.error('Error completo:', error)
      console.error('Metadatos:', error.metadata)
      if (error.response?.data) {
        console.error('Respuesta del servidor:', error.response.data)
      }
      console.groupEnd()
    }
    
    return Promise.reject(error)
  }

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