/**
 * Constantes de la aplicación
 */

// Tipos de transacciones
export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer',
  DEBT_PAYMENT: 'debt_payment'
}

// Etiquetas de tipos de transacciones
export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPES.INCOME]: 'Ingreso',
  [TRANSACTION_TYPES.EXPENSE]: 'Gasto',
  [TRANSACTION_TYPES.TRANSFER]: 'Transferencia',
  [TRANSACTION_TYPES.DEBT_PAYMENT]: 'Pago de Deuda'
}

// Colores para tipos de transacciones
export const TRANSACTION_TYPE_COLORS = {
  [TRANSACTION_TYPES.INCOME]: 'text-success-600',
  [TRANSACTION_TYPES.EXPENSE]: 'text-danger-600',
  [TRANSACTION_TYPES.TRANSFER]: 'text-blue-600',
  [TRANSACTION_TYPES.DEBT_PAYMENT]: 'text-purple-600'
}

// Monedas soportadas
export const CURRENCIES = {
  USD: 'USD',  // 🚨 CAMBIO: USD como moneda principal
  NIO: 'NIO'   // NIO como moneda secundaria
}

// Etiquetas de monedas
export const CURRENCY_LABELS = {
  [CURRENCIES.USD]: 'Dólar Estadounidense',  // 🚨 CAMBIO: USD primero
  [CURRENCIES.NIO]: 'Córdoba Nicaragüense'
}

// Símbolos de monedas
export const CURRENCY_SYMBOLS = {
  [CURRENCIES.USD]: '$',  // 🚨 CAMBIO: USD primero
  [CURRENCIES.NIO]: 'C$'
}

// Temas de la aplicación
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
}

// Rutas de la aplicación
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/registro',
  DASHBOARD: '/',
  ACCOUNTS: '/cuentas',
  TRANSACTIONS: '/transacciones',
  SETTINGS: '/configuracion'
}

// Estados de carga
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
}

// Mensajes por defecto
export const DEFAULT_MESSAGES = {
  LOADING: 'Cargando...',
  ERROR: 'Ha ocurrido un error',
  SUCCESS: 'Operación exitosa',
  NO_DATA: 'No hay datos disponibles'
}