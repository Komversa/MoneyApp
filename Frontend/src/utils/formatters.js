/**
 * Utilidades para formatear datos en la aplicación
 */
import { getCurrencySymbol } from './currencyData'

/**
 * Formatear moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (USD, NIO, etc.)
 * @returns {string} - Cantidad formateada
 */
export const formatCurrency = (amount, currency = 'USD') => {
  const numAmount = parseFloat(amount) || 0
  const symbol = getCurrencySymbol(currency)

  return `${symbol}${numAmount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

/**
 * Determinar la moneda de una transacción basada en su tipo y cuentas involucradas
 * @param {Object} transaccion - Objeto de transacción con información de cuentas
 * @returns {string} - Código de moneda (USD, NIO, etc.)
 */
export const getTransactionCurrency = (transaccion) => {
  if (!transaccion) return 'USD'

  // Para gastos, usar la moneda de la cuenta de origen
  if (transaccion.type === 'expense' && transaccion.from_account_currency) {
    return transaccion.from_account_currency
  }

  // Para ingresos, usar la moneda de la cuenta de destino
  if (transaccion.type === 'income' && transaccion.to_account_currency) {
    return transaccion.to_account_currency
  }

  // Para transferencias, usar la moneda de la cuenta de origen (el monto se envía desde ahí)
  if (transaccion.type === 'transfer' && transaccion.from_account_currency) {
    return transaccion.from_account_currency
  }

  // Fallback a USD si no se puede determinar
  return 'USD'
}

/**
 * Formatear fecha
 * @param {string|Date} date - Fecha a formatear
 * @param {string} format - Formato deseado ('short', 'long', 'datetime')
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  
  if (isNaN(dateObj.getTime())) return ''

  const options = {
    short: { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    },
    long: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    },
    datetime: { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }
  }

  return dateObj.toLocaleDateString('es-ES', options[format] || options.short)
}

/**
 * Formatear fecha de forma relativa (ej: "hace 2 días")
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada de forma relativa
 */
export const formatDateRelative = (date) => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  const now = new Date()
  
  if (isNaN(dateObj.getTime())) return ''

  const diffTime = now - dateObj
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffTime / (1000 * 60))

  if (diffMinutes < 1) {
    return 'Ahora'
  } else if (diffMinutes < 60) {
    return `hace ${diffMinutes} min`
  } else if (diffHours < 24) {
    return `hace ${diffHours}h`
  } else if (diffDays === 1) {
    return 'Ayer'
  } else if (diffDays < 7) {
    return `hace ${diffDays} días`
  } else {
    return formatDate(date, 'short')
  }
}

/**
 * Formatear número con separadores de miles
 * @param {number} number - Número a formatear
 * @returns {string} - Número formateado
 */
export const formatNumber = (number) => {
  const num = parseFloat(number) || 0
  return num.toLocaleString('es-ES')
}

/**
 * Truncar texto
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Convertir monto entre monedas usando tasas de cambio
 * @param {number} amount - Monto a convertir
 * @param {string} fromCurrency - Moneda origen
 * @param {string} toCurrency - Moneda destino
 * @param {string} primaryCurrency - Moneda principal del usuario
 * @param {Object} exchangeRates - Objeto con tasas de cambio
 * @returns {number|null} - Monto convertido o null si no se puede convertir
 */
export const convertCurrency = (amount, fromCurrency, toCurrency, primaryCurrency, exchangeRates) => {
  if (!amount || fromCurrency === toCurrency) {
    return parseFloat(amount) || 0
  }

  // Si alguna de las monedas es la principal, conversión directa
  if (fromCurrency === primaryCurrency && exchangeRates[toCurrency]) {
    return parseFloat(amount) / exchangeRates[toCurrency]
  }

  if (toCurrency === primaryCurrency && exchangeRates[fromCurrency]) {
    return parseFloat(amount) * exchangeRates[fromCurrency]
  }

  // Conversión indirecta: fromCurrency -> primaryCurrency -> toCurrency
  if (exchangeRates[fromCurrency] && exchangeRates[toCurrency]) {
    const amountInPrimary = parseFloat(amount) * exchangeRates[fromCurrency]
    return amountInPrimary / exchangeRates[toCurrency]
  }

  // No se puede convertir
  return null
}

/**
 * Formatear monto con conversión automática a moneda principal
 * @param {number} amount - Monto original
 * @param {string} originalCurrency - Moneda original del monto
 * @param {string} primaryCurrency - Moneda principal del usuario
 * @param {Object} exchangeRates - Tasas de cambio del usuario
 * @param {boolean} showOriginal - Si mostrar el monto original también
 * @returns {string} - Monto formateado
 */
export const formatCurrencyWithConversion = (amount, originalCurrency, primaryCurrency, exchangeRates = {}, showOriginal = false) => {
  const originalAmount = parseFloat(amount) || 0
  
  if (originalCurrency === primaryCurrency || !showOriginal) {
    return formatCurrency(originalAmount, originalCurrency)
  }

  const convertedAmount = convertCurrency(originalAmount, originalCurrency, primaryCurrency, primaryCurrency, exchangeRates)
  
  if (convertedAmount === null) {
    return formatCurrency(originalAmount, originalCurrency)
  }

  const originalFormatted = formatCurrency(originalAmount, originalCurrency)
  const convertedFormatted = formatCurrency(convertedAmount, primaryCurrency)

  return `${originalFormatted} (≈ ${convertedFormatted})`
}