import apiClient from './auth.api';

/**
 * Servicio API para manejo de monedas soportadas
 */

/**
 * Obtener todas las monedas soportadas por el sistema
 * @returns {Promise<Object>} Lista de monedas soportadas
 */
export const obtenerMonedasSoportadasAPI = async () => {
  try {
    console.log('📊 Obteniendo monedas soportadas...');
    
    const response = await apiClient.get('/api/currencies');
    
    if (response.data.success) {
      console.log(`✅ ${response.data.data.length} monedas soportadas obtenidas`);
      return response.data;
    } else {
      throw new Error(response.data.message || 'Error al obtener monedas soportadas');
    }
  } catch (error) {
    console.error('❌ Error obteniendo monedas soportadas:', error);
    throw error;
  }
};

/**
 * Obtener una moneda específica por código
 * @param {string} code - Código de la moneda
 * @returns {Promise<Object>} Información de la moneda
 */
export const obtenerMonedaPorCodigoAPI = async (code) => {
  try {
    console.log(`📊 Obteniendo moneda: ${code}`);
    
    const response = await apiClient.get(`/api/currencies/${code}`);
    
    if (response.data.success) {
      console.log(`✅ Moneda ${code} obtenida`);
      return response.data;
    } else {
      throw new Error(response.data.message || 'Error al obtener moneda');
    }
  } catch (error) {
    console.error(`❌ Error obteniendo moneda ${code}:`, error);
    throw error;
  }
};

/**
 * Obtener las tasas de cambio del usuario usando el nuevo sistema
 * @returns {Promise<Object>} Lista de tasas de cambio del usuario
 */
export const obtenerTasasUsuarioAPI = async () => {
  try {
    console.log('📊 Obteniendo tasas de cambio del usuario...');
    
    const response = await apiClient.get('/api/currencies/user/rates');
    
    if (response.data.success) {
      console.log(`✅ ${response.data.data.length} tasas de cambio obtenidas`);
      return response.data;
    } else {
      throw new Error(response.data.message || 'Error al obtener tasas de cambio');
    }
  } catch (error) {
    console.error('❌ Error obteniendo tasas de cambio:', error);
    throw error;
  }
};

/**
 * Formatear monedas para uso en selectores
 * @param {Array} currencies - Lista de monedas
 * @returns {Array} Monedas formateadas para selectores
 */
export const formatearMonedasParaSelector = (currencies) => {
  return currencies.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name}`,
    symbol: currency.symbol
  }));
};

/**
 * Obtener opciones de monedas para selectores
 * @returns {Promise<Array>} Opciones de monedas formateadas
 */
export const obtenerOpcionesMonedas = async () => {
  try {
    const response = await obtenerMonedasSoportadasAPI();
    return formatearMonedasParaSelector(response.data);
  } catch (error) {
    console.error('❌ Error obteniendo opciones de monedas:', error);
    // Fallback a monedas básicas
    return [
      { value: 'USD', label: 'USD - Dólar Estadounidense', symbol: '$' },
      { value: 'NIO', label: 'NIO - Córdoba Nicaragüense', symbol: 'C$' }
    ];
  }
};
