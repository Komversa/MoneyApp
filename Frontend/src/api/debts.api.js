import apiClient from './auth.api'

/**
 * API para gestión de deudas (accounts con categoría 'liability')
 */

/**
 * Obtener todas las deudas del usuario
 * @returns {Promise<Array>} Lista de cuentas de tipo pasivo
 */
export const getDebts = async () => {
  try {
    const response = await apiClient.get('/api/cuentas?category=liability')
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Obtener resumen de deudas
 * @returns {Promise<Object>} Resumen financiero de deudas
 */
export const getDebtSummary = async () => {
  try {
    const response = await apiClient.get('/api/debts/summary')
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Crear una nueva deuda (cuenta de tipo pasivo)
 * @param {Object} debtData - Datos de la deuda
 * @param {string} debtData.name - Nombre de la deuda
 * @param {number} debtData.accountTypeId - ID del tipo de cuenta
 * @param {number} debtData.initialBalance - Saldo inicial (monto actual de la deuda)
 * @param {string} debtData.currency - Código de moneda
 * @param {number} debtData.originalAmount - Monto original de la deuda
 * @param {number} debtData.interestRate - Tasa de interés (opcional)
 * @param {string} debtData.dueDate - Fecha de vencimiento (opcional)
 * @returns {Promise<Object>} Deuda creada
 */
export const createDebt = async (debtData) => {
  const payload = {
    ...debtData,
    accountCategory: 'liability'
  }

  try {
    const response = await apiClient.post('/api/cuentas', payload)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Actualizar una deuda existente
 * @param {number} debtId - ID de la deuda
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Deuda actualizada
 */
export const updateDebt = async (debtId, updateData) => {
  try {
    const response = await apiClient.put(`/api/cuentas/${debtId}`, updateData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Eliminar una deuda
 * @param {number} debtId - ID de la deuda
 * @returns {Promise<void>}
 */
export const deleteDebt = async (debtId) => {
  try {
    const response = await apiClient.delete(`/api/cuentas/${debtId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Realizar un pago a una deuda (transferencia desde activo a pasivo)
 * @param {Object} paymentData - Datos del pago
 * @param {number} paymentData.fromAccountId - Cuenta de origen (activo)
 * @param {number} paymentData.toAccountId - Cuenta de destino (pasivo/deuda)
 * @param {number} paymentData.amount - Monto del pago
 * @param {string} paymentData.description - Descripción del pago
 * @returns {Promise<Object>} Transacción de pago creada
 */
export const makeDebtPayment = async (paymentData) => {
  const payload = {
    type: 'transfer',
    fromAccountId: paymentData.fromAccountId,
    toAccountId: paymentData.toAccountId,
    amount: paymentData.amount,
    transactionDate: new Date().toISOString().split('T')[0],
    description: paymentData.description || 'Pago de deuda'
  }

  try {
    const response = await apiClient.post('/api/transacciones', payload)
    return response.data
  } catch (error) {
    throw error
  }
}
