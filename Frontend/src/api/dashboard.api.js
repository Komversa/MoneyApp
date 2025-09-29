import apiClient from './auth.api'

export const obtenerResumenDashboardAPI = async () => {
  try {
    const response = await apiClient.get('/api/dashboard')
    return response.data
  } catch (error) {
    if (import.meta.env.DEV) console.error('❌ Error en obtenerResumenDashboardAPI:', error)
    throw error
  }
}

export const obtenerUltimasTransaccionesAPI = async (limit = 7) => {
  try {
    const response = await apiClient.get(`/api/transacciones?limit=${limit}&offset=0`)
    return response.data
  } catch (error) {
    throw error
  }
}

export const obtenerEstadisticasMensualesAPI = async () => {
  try {
    const response = await apiClient.get('/api/transacciones/estadisticas?period=month')
    return response.data
  } catch (error) {
    throw error
  }
}

export const obtenerDatosGraficoGastosAPI = async (period = 'month') => {
  try {
    const response = await apiClient.get('/api/dashboard/grafico-gastos')
    if (response.data.success) {
      return { success: true, data: response.data.data }
    }
    throw new Error(response.data.message || 'Error al obtener datos del gráfico')
  } catch (error) {
    throw error
  }
}

export const obtenerDashboardCompletoAPI = async () => {
  try {
    const dashboardResponse = await obtenerResumenDashboardAPI()
    if (dashboardResponse.success) {
      return { success: true, data: dashboardResponse.data }
    } else {
      throw new Error(dashboardResponse.message || 'Error al obtener datos del dashboard')
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error('❌ Error en obtenerDashboardCompletoAPI:', error)
    throw error
  }
}

export const procesarDatosDashboard = (data) => {
  if (!data) return null
  return {
    resumen: data.resumen || {},
    ultimasTransacciones: data.ultimasTransacciones || [],
    estadisticasMensuales: data.estadisticasMensuales || {},
    graficoGastos: data.graficoGastos || []
  }
}