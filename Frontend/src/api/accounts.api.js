import apiClient from './auth.api'

/**
 * Servicio API para gestión de cuentas
 * Conecta con los endpoints del backend de cuentas
 */

// ==========================================
// CUENTAS
// ==========================================

/**
 * Obtener todas las cuentas del usuario
 * @param {string} category - Categoría de cuenta: 'asset', 'liability' o null para todas
 * @returns {Promise<Array>} - Lista de cuentas
 */
export const obtenerCuentasAPI = async (category = null) => {
  try {
    const url = category ? `/api/cuentas?category=${category}` : '/api/cuentas'
    const response = await apiClient.get(url)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Obtener una cuenta específica por ID
 * @param {number} id - ID de la cuenta
 * @returns {Promise<Object>} - Datos de la cuenta
 */
export const obtenerCuentaPorIdAPI = async (id) => {
  try {
    const response = await apiClient.get(`/api/cuentas/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Crear una nueva cuenta
 * @param {Object} cuentaData - Datos de la cuenta
 * @returns {Promise<Object>} - Cuenta creada
 */
export const crearCuentaAPI = async (cuentaData) => {
  try {
    const response = await apiClient.post('/api/cuentas', cuentaData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Actualizar una cuenta existente
 * @param {number} id - ID de la cuenta
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} - Cuenta actualizada
 */
export const actualizarCuentaAPI = async (id, updateData) => {
  try {
    const response = await apiClient.put(`/api/cuentas/${id}`, updateData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Eliminar una cuenta
 * @param {number} id - ID de la cuenta
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const eliminarCuentaAPI = async (id) => {
  try {
    const response = await apiClient.delete(`/api/cuentas/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Obtener resumen financiero del usuario
 * @returns {Promise<Object>} - Resumen financiero
 */
export const obtenerResumenFinancieroAPI = async () => {
  try {
    const response = await apiClient.get('/api/cuentas/resumen')
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Obtener panel de estructura de patrimonio avanzado
 * @returns {Promise<Object>} - Panel de patrimonio con análisis completo
 */
export const obtenerPanelPatrimonioAPI = async () => {
  try {
    const response = await apiClient.get('/api/cuentas/panel-patrimonio')
    return response.data
  } catch (error) {
    throw error
  }
}

// ==========================================
// FUNCIONES DE VALIDACIÓN
// ==========================================

/**
 * Validar datos de cuenta
 * @param {Object} data - Datos a validar
 * @returns {Object} - Objeto con errores si los hay
 */
export const validarCuenta = (data) => {
  const errors = {}

  // Validar nombre
  if (!data.name || typeof data.name !== 'string') {
    errors.name = 'El nombre es requerido'
  } else if (data.name.trim().length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres'
  } else if (data.name.trim().length > 100) {
    errors.name = 'El nombre no puede exceder los 100 caracteres'
  }

  // Validar tipo de cuenta
  if (!data.accountTypeId) {
    errors.accountTypeId = 'Debe seleccionar un tipo de cuenta'
  }

  // Validar saldo inicial
  if (data.initialBalance !== undefined && data.initialBalance !== null) {
    const balance = parseFloat(data.initialBalance)
    if (isNaN(balance)) {
      errors.initialBalance = 'El saldo inicial debe ser un número válido'
    }
  }

  // Validar moneda
  if (!data.currency || typeof data.currency !== 'string') {
    errors.currency = 'Debe seleccionar una moneda'
  } else if (!['NIO', 'USD'].includes(data.currency)) {
    errors.currency = 'Moneda no válida'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Formatear datos de cuenta para envío al servidor
 * @param {Object} data - Datos del formulario
 * @returns {Object} - Datos formateados
 */
export const formatearDatosCuenta = (data) => {
  return {
    name: data.name?.trim(),
    accountTypeId: parseInt(data.accountTypeId),
    initialBalance: data.initialBalance ? parseFloat(data.initialBalance) : 0,
    currency: data.currency
  }
}

// Alias para compatibilidad con hooks
export const getAccounts = obtenerCuentasAPI