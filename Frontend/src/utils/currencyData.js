/**
 * Fuente única de verdad para todas las monedas soportadas en la aplicación
 * REFACTORIZACIÓN: Sistema NIO-USD con USD como moneda de referencia universal
 * Preparado para futura expansión mundial multi-moneda
 */

/**
 * Objeto maestro con todas las monedas soportadas
 * 🚨 REFACTORIZACIÓN: Solo NIO y USD por ahora
 * Clave: Código ISO 4217 de la moneda
 * Valor: Objeto con información completa de la moneda
 */
export const SUPPORTED_CURRENCIES = {
  // 🚨 MONEDAS PRINCIPALES DEL SISTEMA
  USD: { 
    code: 'USD', 
    name: 'Dólar Estadounidense', 
    symbol: '$',
    isPrimary: true,  // 🚨 USD como moneda de referencia universal
    description: 'Moneda de referencia universal para cálculos'
  },
  NIO: { 
    code: 'NIO', 
    name: 'Córdoba Nicaragüense', 
    symbol: 'C$',
    isPrimary: false,
    description: 'Moneda local de Nicaragua'
  }
};

/**
 * Obtener información de una moneda por su código
 * @param {string} currencyCode - Código ISO 4217 de la moneda
 * @returns {Object|null} - Información de la moneda o null si no existe
 */
export const getCurrencyInfo = (currencyCode) => {
  return SUPPORTED_CURRENCIES[currencyCode?.toUpperCase()] || null;
};

/**
 * Obtener el símbolo de una moneda
 * @param {string} currencyCode - Código ISO 4217 de la moneda
 * @returns {string} - Símbolo de la moneda o el código si no existe
 */
export const getCurrencySymbol = (currencyCode) => {
  const currency = getCurrencyInfo(currencyCode);
  return currency?.symbol || currencyCode;
};

/**
 * Obtener el nombre de una moneda
 * @param {string} currencyCode - Código ISO 4217 de la moneda
 * @returns {string} - Nombre de la moneda o el código si no existe
 */
export const getCurrencyName = (currencyCode) => {
  const currency = getCurrencyInfo(currencyCode);
  return currency?.name || currencyCode;
};

/**
 * Verificar si una moneda está soportada
 * @param {string} currencyCode - Código ISO 4217 de la moneda
 * @returns {boolean} - true si la moneda está soportada
 */
export const isCurrencySupported = (currencyCode) => {
  return currencyCode?.toUpperCase() in SUPPORTED_CURRENCIES;
};

/**
 * Obtener la moneda de referencia universal (USD)
 * @returns {Object} - Información de USD como moneda de referencia
 */
export const getReferenceCurrency = () => {
  return SUPPORTED_CURRENCIES.USD;
};

/**
 * Obtener lista de monedas disponibles para tasas de cambio
 * 🚨 REFACTORIZACIÓN: Solo devuelve NIO si la principal es USD, o USD si la principal es NIO
 * @param {string} primaryCurrency - Moneda principal del usuario
 * @returns {Array} - Lista de monedas disponibles (excluyendo la principal)
 */
export const getAvailableCurrencies = (primaryCurrency) => {
  return Object.values(SUPPORTED_CURRENCIES).filter(
    currency => currency.code !== primaryCurrency
  );
};

/**
 * Obtener lista completa de monedas para selectores
 * 🚨 REFACTORIZACIÓN: Solo NIO y USD
 * @returns {Array} - Lista completa de monedas con formato para selectores
 */
export const getCurrencyOptions = () => {
  return Object.values(SUPPORTED_CURRENCIES).map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name}`,
    symbol: currency.symbol,
    isPrimary: currency.isPrimary
  }));
};

/**
 * Obtener monedas para selector de moneda principal
 * 🚨 REFACTORIZACIÓN: Solo NIO y USD
 * @returns {Array} - Lista de monedas para selector de moneda principal
 */
export const getPrimaryCurrencyOptions = () => {
  return Object.values(SUPPORTED_CURRENCIES).map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name}`,
    symbol: currency.symbol,
    description: currency.description
  }));
};

/**
 * Obtener monedas para selector de tasas de cambio
 * 🚨 REFACTORIZACIÓN: Solo la moneda que no sea la principal
 * @param {string} primaryCurrency - Moneda principal actual
 * @returns {Array} - Lista de monedas para tasas de cambio
 */
export const getExchangeRateCurrencyOptions = (primaryCurrency) => {
  return Object.values(SUPPORTED_CURRENCIES)
    .filter(currency => currency.code !== primaryCurrency)
    .map(currency => ({
      value: currency.code,
      label: `${currency.code} - ${currency.name}`,
      symbol: currency.symbol
    }));
};
