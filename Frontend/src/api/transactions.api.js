import apiClient from './auth.api'

/**
 * Servicio API para gestión de transacciones
 * Conecta con los endpoints del backend de transacciones
 */

// ==========================================
// TRANSACCIONES
// ==========================================

/**
 * Obtener todas las transacciones del usuario
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>} - Lista de transacciones
 */
export const obtenerTransaccionesAPI = async (filters = {}) => {
  try {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value)
      }
    })

    const url = `/api/transacciones${params.toString() ? `?${params.toString()}` : ''}`
    const response = await apiClient.get(url)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Obtener una transacción específica por ID
 * @param {number} id - ID de la transacción
 * @returns {Promise<Object>} - Datos de la transacción
 */
export const obtenerTransaccionPorIdAPI = async (id) => {
  try {
    const response = await apiClient.get(`/api/transacciones/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Crear una nueva transacción
 * @param {Object} transaccionData - Datos de la transacción
 * @returns {Promise<Object>} - Transacción creada
 */
export const crearTransaccionAPI = async (transaccionData) => {
  try {
    const response = await apiClient.post('/api/transacciones', transaccionData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Actualizar una transacción existente
 * @param {number} id - ID de la transacción
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} - Transacción actualizada
 */
export const actualizarTransaccionAPI = async (id, updateData) => {
  try {
    const response = await apiClient.put(`/api/transacciones/${id}`, updateData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Eliminar una transacción
 * @param {number} id - ID de la transacción
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const eliminarTransaccionAPI = async (id) => {
  try {
    const response = await apiClient.delete(`/api/transacciones/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Obtener estadísticas de transacciones
 * @param {string} period - Período ('month', 'year')
 * @returns {Promise<Object>} - Estadísticas
 */
export const obtenerEstadisticasAPI = async (period = 'month') => {
  try {
    const response = await apiClient.get(`/api/transacciones/estadisticas?period=${period}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Obtener resumen de transacciones para el dashboard
 * @param {Object} filters - Filtros opcionales (startDate, endDate)
 * @returns {Promise<Object>} - Resumen con totales convertidos a moneda principal
 */
export const obtenerResumenTransaccionesAPI = async (filters = {}) => {
  try {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value)
      }
    })

    const url = `/api/transacciones/resumen${params.toString() ? `?${params.toString()}` : ''}`
    const response = await apiClient.get(url)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Exportar transacciones a Excel
 * @param {Object} filters - Filtros de exportación (startDate, endDate, type)
 * @returns {Promise<Blob>} - Archivo Excel como Blob
 */
export const exportarTransaccionesAPI = async (filters = {}) => {
  try {
    // Configurar la petición para recibir un blob
    const response = await apiClient.post('/api/transacciones/export', filters, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    return response.data
  } catch (error) {
    throw error
  }
}

// ==========================================
// FUNCIONES DE VALIDACIÓN
// ==========================================

/**
 * Validar datos de transacción
 * @param {Object} data - Datos a validar
 * @returns {Object} - Objeto con errores si los hay
 */
export const validarTransaccion = (data) => {
  const errors = {}

  // Validar tipo
  if (!data.type || !['income', 'expense', 'transfer'].includes(data.type)) {
    errors.type = 'Debe seleccionar un tipo válido'
  }

  // Validar monto
  if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
    errors.amount = 'El monto debe ser un número positivo'
  }

  // Validar fecha
  if (!data.transactionDate) {
    errors.transactionDate = 'La fecha es requerida'
  } else if (isNaN(Date.parse(data.transactionDate))) {
    errors.transactionDate = 'La fecha no es válida'
  }

  // Validaciones específicas por tipo
  if (data.type === 'expense') {
    if (!data.fromAccountId) {
      errors.fromAccountId = 'Debe seleccionar una cuenta de origen'
    }
  } else if (data.type === 'income') {
    if (!data.toAccountId) {
      errors.toAccountId = 'Debe seleccionar una cuenta de destino'
    }
  } else if (data.type === 'transfer') {
    if (!data.fromAccountId) {
      errors.fromAccountId = 'Debe seleccionar una cuenta de origen'
    }
    if (!data.toAccountId) {
      errors.toAccountId = 'Debe seleccionar una cuenta de destino'
    }
    if (data.fromAccountId && data.toAccountId && data.fromAccountId === data.toAccountId) {
      errors.toAccountId = 'Las cuentas de origen y destino deben ser diferentes'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Formatear datos de transacción para envío al servidor
 * @param {Object} data - Datos del formulario
 * @returns {Object} - Datos formateados
 */
export const formatearDatosTransaccion = (data) => {
  return {
    type: data.type,
    amount: parseFloat(data.amount),
    transactionDate: data.transactionDate,
    categoryId: data.categoryId ? parseInt(data.categoryId) : null,
    fromAccountId: data.fromAccountId ? parseInt(data.fromAccountId) : null,
    toAccountId: data.toAccountId ? parseInt(data.toAccountId) : null,
    description: data.description?.trim() || null
  }
}

/**
 * Obtener color para el tipo de transacción
 * @param {string} type - Tipo de transacción
 * @returns {string} - Clase CSS para el color
 */
export const obtenerColorTipo = (type) => {
  const colors = {
    income: 'text-success-600',
    expense: 'text-danger-600',
    transfer: 'text-blue-600'
  }
  return colors[type] || 'text-gray-600'
}

/**
 * Obtener icono para el tipo de transacción
 * @param {string} type - Tipo de transacción
 * @returns {string} - Nombre del icono
 */
export const obtenerIconoTipo = (type) => {
  const icons = {
    income: 'TrendingUp',
    expense: 'TrendingDown',
    transfer: 'ArrowLeftRight'
  }
  return icons[type] || 'Circle'
}