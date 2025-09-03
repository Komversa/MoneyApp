import apiClient from './auth.api'

/**
 * Servicio API para configuraciones del usuario
 * Conecta con los endpoints del backend de configuración
 */

// ==========================================
// TIPOS DE CUENTA
// ==========================================

/**
 * Obtener todos los tipos de cuenta del usuario
 * @returns {Promise<Array>} - Lista de tipos de cuenta
 */
export const obtenerTiposCuentaAPI = async () => {
  try {
    const response = await apiClient.get('/api/configuracion/tipos-cuenta')
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Crear un nuevo tipo de cuenta
 * @param {Object} tipoCuentaData - Datos del tipo de cuenta {name}
 * @returns {Promise<Object>} - Tipo de cuenta creado
 */
export const crearTipoCuentaAPI = async (tipoCuentaData) => {
  try {
    const response = await apiClient.post('/api/configuracion/tipos-cuenta', tipoCuentaData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Actualizar un tipo de cuenta existente
 * @param {number} id - ID del tipo de cuenta
 * @param {Object} updateData - Datos a actualizar {name}
 * @returns {Promise<Object>} - Tipo de cuenta actualizado
 */
export const actualizarTipoCuentaAPI = async (id, updateData) => {
  try {
    const response = await apiClient.put(`/api/configuracion/tipos-cuenta/${id}`, updateData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Eliminar un tipo de cuenta
 * @param {number} id - ID del tipo de cuenta
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const eliminarTipoCuentaAPI = async (id) => {
  try {
    const response = await apiClient.delete(`/api/configuracion/tipos-cuenta/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// ==========================================
// CATEGORÍAS
// ==========================================

/**
 * Obtener todas las categorías del usuario
 * @param {string} type - Filtro por tipo ('income', 'expense', o null para todas)
 * @returns {Promise<Array>} - Lista de categorías
 */
export const obtenerCategoriasAPI = async (type = null) => {
  try {
    const url = type 
      ? `/api/configuracion/categorias?type=${type}` 
      : '/api/configuracion/categorias'
    
    const response = await apiClient.get(url)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Crear una nueva categoría
 * @param {Object} categoriaData - Datos de la categoría {name, type}
 * @returns {Promise<Object>} - Categoría creada
 */
export const crearCategoriaAPI = async (categoriaData) => {
  try {
    const response = await apiClient.post('/api/configuracion/categorias', categoriaData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Actualizar una categoría existente
 * @param {number} id - ID de la categoría
 * @param {Object} updateData - Datos a actualizar {name, type}
 * @returns {Promise<Object>} - Categoría actualizada
 */
export const actualizarCategoriaAPI = async (id, updateData) => {
  try {
    const response = await apiClient.put(`/api/configuracion/categorias/${id}`, updateData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Eliminar una categoría
 * @param {number} id - ID de la categoría
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const eliminarCategoriaAPI = async (id) => {
  try {
    const response = await apiClient.delete(`/api/configuracion/categorias/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// ==========================================
// TASAS DE CAMBIO
// ==========================================

/**
 * Obtener todas las tasas de cambio del usuario
 * @returns {Promise<Array>} - Lista de tasas de cambio
 */
export const obtenerTasasDeCambioAPI = async () => {
  try {
    const response = await apiClient.get('/api/configuracion/tasas-cambio')
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Crear una nueva tasa de cambio
 * @param {Object} tasaData - Datos de la tasa {currencyCode, rate}
 * @returns {Promise<Object>} - Tasa de cambio creada
 */
export const crearTasaDeCambioAPI = async (tasaData) => {
  try {
    const response = await apiClient.post('/api/configuracion/tasas-cambio', tasaData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Actualizar una tasa de cambio existente
 * @param {string} currencyCode - Código de moneda
 * @param {Object} tasaData - Datos a actualizar {rate}
 * @returns {Promise<Object>} - Tasa de cambio actualizada
 */
export const actualizarTasaDeCambioAPI = async (currencyCode, tasaData) => {
  try {
    const response = await apiClient.put(`/api/configuracion/tasas-cambio/${currencyCode}`, tasaData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Eliminar una tasa de cambio
 * @param {string} currencyCode - Código de moneda
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const eliminarTasaDeCambioAPI = async (currencyCode) => {
  try {
    const response = await apiClient.delete(`/api/configuracion/tasas-cambio/${currencyCode}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// ==========================================
// CONFIGURACIÓN DEL USUARIO
// ==========================================

/**
 * Obtener configuraciones generales del usuario
 * @returns {Promise<Object>} - Configuraciones del usuario
 */
export const obtenerConfiguracionUsuarioAPI = async () => {
  try {
    const response = await apiClient.get('/api/auth/perfil')
    return response.data
  } catch (error) {
    throw error
  }
}



// ==========================================
// FUNCIONES DE VALIDACIÓN
// ==========================================

/**
 * Validar datos de tipo de cuenta
 * @param {Object} data - Datos a validar
 * @returns {Object} - Objeto con errores si los hay
 */
export const validarTipoCuenta = (data) => {
  const errors = {}

  if (!data.name || typeof data.name !== 'string') {
    errors.name = 'El nombre es requerido'
  } else if (data.name.trim().length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres'
  } else if (data.name.trim().length > 100) {
    errors.name = 'El nombre no puede exceder los 100 caracteres'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validar datos de categoría
 * @param {Object} data - Datos a validar
 * @returns {Object} - Objeto con errores si los hay
 */
export const validarCategoria = (data) => {
  const errors = {}

  if (!data.name || typeof data.name !== 'string') {
    errors.name = 'El nombre es requerido'
  } else if (data.name.trim().length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres'
  } else if (data.name.trim().length > 100) {
    errors.name = 'El nombre no puede exceder los 100 caracteres'
  }

  if (!data.type || !['income', 'expense'].includes(data.type)) {
    errors.type = 'El tipo debe ser "income" o "expense"'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validar configuración de usuario
 * @param {Object} data - Datos a validar
 * @returns {Object} - Objeto con errores si los hay
 */
export const validarConfiguracionUsuario = (data) => {
  const errors = {}

  if (data.theme && !['light', 'dark'].includes(data.theme)) {
    errors.theme = 'El tema debe ser "light" o "dark"'
  }

  if (data.primary_currency && !['USD', 'NIO'].includes(data.primary_currency)) {
    errors.primary_currency = 'La moneda principal debe ser "USD" o "NIO"'
  }



  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Actualizar configuración del usuario (monedas, tema, etc.)
 * @param {Object} configuracion - Nueva configuración del usuario
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const actualizarConfiguracionUsuarioAPI = async (configuracion) => {
  try {
    const response = await apiClient.put('/api/configuracion/usuario', configuracion)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Actualizar moneda principal con transición atómica
 * @param {string} primaryCurrency - Nueva moneda principal
 * @returns {Promise<Object>} - Respuesta del servidor con datos actualizados
 */
export const actualizarMonedaPrincipalAPI = async (primaryCurrency) => {
  try {
    const response = await apiClient.put('/api/configuracion/moneda-principal', {
      primary_currency: primaryCurrency
    })
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Validar datos de tasa de cambio
 * @param {Object} data - Datos a validar
 * @returns {Object} - Objeto con errores si los hay
 */
export const validarTasaDeCambio = (data) => {
  const errors = {}

  if (!data.currencyCode || typeof data.currencyCode !== 'string') {
    errors.currencyCode = 'El código de moneda es requerido'
  } else if (data.currencyCode.trim().length < 2 || data.currencyCode.trim().length > 10) {
    errors.currencyCode = 'El código de moneda debe tener entre 2 y 10 caracteres'
  }

  if (!data.rate || isNaN(parseFloat(data.rate))) {
    errors.rate = 'La tasa de cambio debe ser un número válido'
  } else if (parseFloat(data.rate) <= 0) {
    errors.rate = 'La tasa de cambio debe ser un número positivo'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Lista de monedas disponibles para configurar tasas de cambio
 * 🚨 REFACTORIZACIÓN: Solo NIO y USD
 */
export const MONEDAS_DISPONIBLES = [
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
  { code: 'NIO', name: 'Córdoba Nicaragüense', symbol: 'C$' }
]