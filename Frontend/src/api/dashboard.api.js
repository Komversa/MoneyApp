import apiClient from './auth.api'

/**
 * Servicio API para el Dashboard
 * Conecta con los endpoints del backend para obtener resumen financiero
 */

// ==========================================
// DASHBOARD
// ==========================================

/**
 * Obtener resumen completo del dashboard
 * @returns {Promise<Object>} - Resumen financiero completo
 */
export const obtenerResumenDashboardAPI = async () => {
  try {
    console.log('🎯 Frontend: Llamando al endpoint correcto del dashboard')
    const response = await apiClient.get('/api/dashboard')
    console.log('✅ Frontend: Respuesta del dashboard recibida:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Frontend: Error en obtenerResumenDashboardAPI:', error)
    throw error
  }
}

/**
 * Obtener últimas transacciones para el dashboard
 * @param {number} limit - Número de transacciones a obtener (default: 7)
 * @returns {Promise<Array>} - Lista de últimas transacciones
 */
export const obtenerUltimasTransaccionesAPI = async (limit = 7) => {
  try {
    const response = await apiClient.get(`/api/transacciones?limit=${limit}&offset=0`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Obtener estadísticas del mes actual
 * @returns {Promise<Object>} - Estadísticas mensuales
 */
export const obtenerEstadisticasMensualesAPI = async () => {
  try {
    const response = await apiClient.get('/api/transacciones/estadisticas?period=month')
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Obtener datos para gráfico de gastos por categoría
 * @param {string} period - Período ('month', 'year')
 * @returns {Promise<Object>} - Datos del gráfico
 */
export const obtenerDatosGraficoGastosAPI = async (period = 'month') => {
  try {
    // Ahora usamos el endpoint del backend que ya tiene la lógica de conversión
    const response = await apiClient.get('/api/dashboard/grafico-gastos')
    
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data
      }
    }
    
    throw new Error(response.data.message || 'Error al obtener datos del gráfico')
  } catch (error) {
    throw error
  }
}

/**
 * Función helper para obtener todos los datos del dashboard en una sola llamada
 * SIMPLIFICADA: Usa el endpoint unificado del backend que ya incluye todo
 */
export const obtenerDashboardCompletoAPI = async () => {
  try {
    console.log('🎯 Frontend: Obteniendo datos completos del dashboard')
    
    // 🚨 CORRECCIÓN CRÍTICA: Usar el endpoint unificado del dashboard
    // que ya incluye todas las estadísticas y conversiones
    const dashboardResponse = await obtenerResumenDashboardAPI()
    
    if (dashboardResponse.success) {
      console.log('✅ Frontend: Datos completos del dashboard recibidos:', dashboardResponse.data)
      
      // El backend ya devuelve la estructura completa
      return {
        success: true,
        data: dashboardResponse.data
      }
    } else {
      throw new Error(dashboardResponse.message || 'Error al obtener datos del dashboard')
    }
  } catch (error) {
    console.error('❌ Frontend: Error en obtenerDashboardCompletoAPI:', error)
    throw error
  }
}

/**
 * Procesar datos del dashboard (los datos ya vienen convertidos del backend)
 * @param {Object} data - Datos del backend ya procesados
 * @returns {Object} - Datos listos para mostrar en el UI
 */
export const procesarDatosDashboard = (data) => {
  if (!data) return null

  // Los datos ya vienen convertidos a la moneda principal desde el backend
  return {
    resumen: data.resumen || {},
    ultimasTransacciones: data.ultimasTransacciones || [],
    estadisticasMensuales: data.estadisticasMensuales || {},
    graficoGastos: data.graficoGastos || []
  }
}