import apiClient from './auth.api';

/**
 * API para manejo de transacciones programadas usando el cliente autenticado
 */

/**
 * Obtener todas las transacciones programadas del usuario
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Object>} - Respuesta con las transacciones programadas
 */
export const obtenerTransaccionesProgramadas = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.is_active !== undefined) {
      params.append('is_active', filters.is_active);
    }
    if (filters.transaction_type) {
      params.append('transaction_type', filters.transaction_type);
    }
    
    const queryString = params.toString();
    const url = `/api/transacciones-programadas${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    return response.data;

  } catch (error) {
    console.error('Error en obtenerTransaccionesProgramadas:', error);
    throw error;
  }
};

/**
 * Obtener una transacción programada específica
 * @param {number} id - ID de la transacción programada
 * @returns {Promise<Object>} - Respuesta con la transacción programada
 */
export const obtenerTransaccionProgramada = async (id) => {
  try {
    const response = await apiClient.get(`/api/transacciones-programadas/${id}`);
    return response.data;

  } catch (error) {
    console.error('Error en obtenerTransaccionProgramada:', error);
    throw error;
  }
};

/**
 * Crear una nueva transacción programada
 * @param {Object} transactionData - Datos de la transacción programada
 * @returns {Promise<Object>} - Respuesta con la transacción creada
 */
export const crearTransaccionProgramada = async (transactionData) => {
  try {
    const response = await apiClient.post('/api/transacciones-programadas', transactionData);
    return response.data;

  } catch (error) {
    console.error('Error en crearTransaccionProgramada:', error);
    throw error;
  }
};

/**
 * Actualizar una transacción programada existente
 * @param {number} id - ID de la transacción programada
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} - Respuesta con la transacción actualizada
 */
export const actualizarTransaccionProgramada = async (id, updateData) => {
  try {
    const response = await apiClient.put(`/api/transacciones-programadas/${id}`, updateData);
    return response.data;

  } catch (error) {
    console.error('Error en actualizarTransaccionProgramada:', error);
    throw error;
  }
};

/**
 * Pausar/reanudar una transacción programada
 * @param {number} id - ID de la transacción programada
 * @returns {Promise<Object>} - Respuesta con la transacción actualizada
 */
export const toggleTransaccionProgramada = async (id) => {
  try {
    const response = await apiClient.patch(`/api/transacciones-programadas/${id}/toggle`);
    return response.data;

  } catch (error) {
    console.error('Error en toggleTransaccionProgramada:', error);
    throw error;
  }
};

/**
 * Eliminar una transacción programada
 * @param {number} id - ID de la transacción programada
 * @returns {Promise<Object>} - Respuesta de confirmación
 */
export const eliminarTransaccionProgramada = async (id) => {
  try {
    const response = await apiClient.delete(`/api/transacciones-programadas/${id}`);
    return response.data;

  } catch (error) {
    console.error('Error en eliminarTransaccionProgramada:', error);
    throw error;
  }
};

/**
 * Obtener estado del scheduler
 * @returns {Promise<Object>} - Estado del scheduler
 */
export const obtenerEstadoScheduler = async () => {
  try {
    const response = await apiClient.get('/api/transacciones-programadas/scheduler/status');
    return response.data;

  } catch (error) {
    console.error('Error en obtenerEstadoScheduler:', error);
    throw error;
  }
};

/**
 * Ejecutar scheduler manualmente (para desarrollo/testing)
 * @returns {Promise<Object>} - Respuesta de confirmación
 */
export const ejecutarSchedulerManual = async () => {
  try {
    const response = await apiClient.post('/api/transacciones-programadas/scheduler/run');
    return response.data;

  } catch (error) {
    console.error('Error en ejecutarSchedulerManual:', error);
    throw error;
  }
};