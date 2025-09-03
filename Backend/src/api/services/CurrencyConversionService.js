/**
 * CurrencyConversionService
 * 
 * Servicio de conversión de monedas que actúa como la única fuente de verdad
 * para todas las conversiones de moneda en el sistema.
 * 
 * Utiliza exclusivamente la nueva tabla user_exchange_rates_pivot
 * y implementa conversiones en dos pasos (A -> USD -> B).
 */

const { db } = require('../../config/db');

class CurrencyConversionService {
  /**
   * Convierte un monto de una moneda a otra
   * 
   * @param {Object} params - Parámetros de conversión
   * @param {number} params.amount - Monto a convertir
   * @param {string} params.fromCurrency - Moneda de origen (código ISO)
   * @param {string} params.toCurrency - Moneda de destino (código ISO)
   * @param {number} params.userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la conversión
   */
  async convert({ amount, fromCurrency, toCurrency, userId }) {
    try {
      console.log(`🔄 === CONVERSIÓN DE MONEDA ===`);
      console.log(`💰 Monto: ${amount} ${fromCurrency}`);
      console.log(`🎯 Destino: ${toCurrency}`);
      console.log(`👤 Usuario: ${userId}`);

      // Validaciones básicas
      if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error('El monto debe ser un número positivo');
      }

      if (!fromCurrency || !toCurrency) {
        throw new Error('Las monedas de origen y destino son requeridas');
      }

      if (!userId) {
        throw new Error('El ID del usuario es requerido');
      }

      // Normalizar códigos de moneda
      const normalizedFromCurrency = fromCurrency.toUpperCase();
      const normalizedToCurrency = toCurrency.toUpperCase();

      // Si las monedas son iguales, no hay conversión
      if (normalizedFromCurrency === normalizedToCurrency) {
        console.log(`✅ Mismas monedas. Sin conversión necesaria.`);
        return {
          originalAmount: amount,
          convertedAmount: amount,
          fromCurrency: normalizedFromCurrency,
          toCurrency: normalizedToCurrency,
          conversionRate: 1,
          isConverted: false,
          success: true
        };
      }

      // Obtener las tasas de cambio en una sola consulta
      const rates = await this._getExchangeRates(userId, [normalizedFromCurrency, normalizedToCurrency]);
      
      if (!rates) {
        throw new Error('No se pudieron obtener las tasas de cambio');
      }

      // Realizar la conversión
      const result = this._performConversion(amount, normalizedFromCurrency, normalizedToCurrency, rates);
      
      console.log(`✅ Conversión completada: ${result.originalAmount} ${result.fromCurrency} = ${result.convertedAmount} ${result.toCurrency}`);
      
      return result;

    } catch (error) {
      console.error(`❌ Error en conversión de moneda:`, error.message);
      throw error;
    }
  }

  /**
   * Obtiene las tasas de cambio para las monedas especificadas
   * 
   * @param {number} userId - ID del usuario
   * @param {string[]} currencies - Array de códigos de moneda
   * @returns {Promise<Object|null>} Objeto con las tasas de cambio
   */
  async _getExchangeRates(userId, currencies) {
    try {
      console.log(`📊 Obteniendo tasas para: ${currencies.join(', ')}`);

      const rates = await db('user_exchange_rates_pivot')
        .select('currency_code', 'rate_to_usd')
        .where('user_id', userId)
        .whereIn('currency_code', currencies);

      if (rates.length === 0) {
        console.log(`⚠️  No se encontraron tasas para el usuario ${userId}`);
        return null;
      }

      // Crear un mapa de tasas para acceso rápido
      const ratesMap = {};
      rates.forEach(rate => {
        ratesMap[rate.currency_code] = parseFloat(rate.rate_to_usd);
      });

      console.log(`📊 Tasas obtenidas:`, ratesMap);
      return ratesMap;

    } catch (error) {
      console.error(`❌ Error obteniendo tasas de cambio:`, error.message);
      throw error;
    }
  }

  /**
   * Realiza la conversión usando las tasas obtenidas
   * 
   * @param {number} amount - Monto a convertir
   * @param {string} fromCurrency - Moneda de origen
   * @param {string} toCurrency - Moneda de destino
   * @param {Object} rates - Mapa de tasas de cambio
   * @returns {Object} Resultado de la conversión
   */
  _performConversion(amount, fromCurrency, toCurrency, rates) {
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (!fromRate || !toRate) {
      const missingCurrency = !fromRate ? fromCurrency : toCurrency;
      throw new Error(`No se encontró la tasa de cambio para ${missingCurrency}`);
    }

    // Conversión en dos pasos: A -> USD -> B
    // 1. Convertir de moneda origen a USD
    const amountInUsd = amount * fromRate;
    
    // 2. Convertir de USD a moneda destino
    const convertedAmount = amountInUsd / toRate;
    
    // Calcular la tasa de conversión directa
    const conversionRate = fromRate / toRate;

    console.log(`📈 Conversión detallada:`);
    console.log(`   ${amount} ${fromCurrency} × ${fromRate} = ${amountInUsd} USD`);
    console.log(`   ${amountInUsd} USD ÷ ${toRate} = ${convertedAmount} ${toCurrency}`);
    console.log(`   Tasa directa: ${conversionRate}`);

    return {
      originalAmount: amount,
      convertedAmount: parseFloat(convertedAmount.toFixed(6)),
      fromCurrency,
      toCurrency,
      conversionRate: parseFloat(conversionRate.toFixed(6)),
      isConverted: true,
      success: true
    };
  }

  /**
   * Obtiene todas las tasas de cambio de un usuario
   * 
   * @param {number} userId - ID del usuario
   * @returns {Promise<Array>} Array de tasas de cambio
   */
  async getUserExchangeRates(userId) {
    try {
      console.log(`📊 Obteniendo todas las tasas para usuario ${userId}`);

      const rates = await db('user_exchange_rates_pivot')
        .select('currency_code', 'rate_to_usd', 'updated_at')
        .where('user_id', userId)
        .orderBy('currency_code', 'asc');

      console.log(`✅ Obtenidas ${rates.length} tasas de cambio`);
      return rates;

    } catch (error) {
      console.error(`❌ Error obteniendo tasas de usuario:`, error.message);
      throw error;
    }
  }

  /**
   * Actualiza o crea una tasa de cambio para un usuario
   * 
   * @param {number} userId - ID del usuario
   * @param {string} currencyCode - Código de la moneda
   * @param {number} rateToUsd - Tasa de cambio respecto al USD
   * @returns {Promise<Object>} Resultado de la operación
   */
  async updateExchangeRate(userId, currencyCode, rateToUsd) {
    try {
      console.log(`🔄 Actualizando tasa: ${currencyCode} = ${rateToUsd} USD para usuario ${userId}`);

      // Validar que la moneda existe en supported_currencies
      const currencyExists = await db('supported_currencies')
        .where('code', currencyCode)
        .first();

      if (!currencyExists) {
        throw new Error(`La moneda ${currencyCode} no está soportada`);
      }

      // Validar que la tasa sea positiva
      if (rateToUsd <= 0) {
        throw new Error('La tasa de cambio debe ser un número positivo');
      }

      // Usar upsert para insertar o actualizar
      const result = await db('user_exchange_rates_pivot')
        .insert({
          user_id: userId,
          currency_code: currencyCode,
          rate_to_usd: rateToUsd,
          updated_at: db.fn.now()
        })
        .onConflict(['user_id', 'currency_code'])
        .merge(['rate_to_usd', 'updated_at']);

      console.log(`✅ Tasa de cambio actualizada exitosamente`);
      return { success: true, message: 'Tasa de cambio actualizada' };

    } catch (error) {
      console.error(`❌ Error actualizando tasa de cambio:`, error.message);
      throw error;
    }
  }

  /**
   * Elimina una tasa de cambio para un usuario
   * 
   * @param {number} userId - ID del usuario
   * @param {string} currencyCode - Código de la moneda
   * @returns {Promise<Object>} Resultado de la operación
   */
  async deleteExchangeRate(userId, currencyCode) {
    try {
      console.log(`🗑️  Eliminando tasa: ${currencyCode} para usuario ${userId}`);

      // No permitir eliminar USD
      if (currencyCode === 'USD') {
        throw new Error('No se puede eliminar la tasa de USD');
      }

      const result = await db('user_exchange_rates_pivot')
        .where({
          user_id: userId,
          currency_code: currencyCode
        })
        .del();

      if (result === 0) {
        throw new Error(`No se encontró la tasa de cambio para ${currencyCode}`);
      }

      console.log(`✅ Tasa de cambio eliminada exitosamente`);
      return { success: true, message: 'Tasa de cambio eliminada' };

    } catch (error) {
      console.error(`❌ Error eliminando tasa de cambio:`, error.message);
      throw error;
    }
  }

  /**
   * Convierte múltiples montos en una sola operación
   * 
   * @param {Array} conversions - Array de conversiones a realizar
   * @returns {Promise<Array>} Array de resultados de conversión
   */
  async convertMultiple(conversions) {
    try {
      console.log(`🔄 === CONVERSIÓN MÚLTIPLE ===`);
      console.log(`📊 ${conversions.length} conversiones solicitadas`);

      const results = [];
      
      for (const conversion of conversions) {
        try {
          const result = await this.convert(conversion);
          results.push(result);
        } catch (error) {
          console.error(`❌ Error en conversión individual:`, error.message);
          results.push({
            ...conversion,
            error: error.message,
            success: false
          });
        }
      }

      console.log(`✅ Conversiones múltiples completadas: ${results.filter(r => r.success).length}/${conversions.length}`);
      return results;

    } catch (error) {
      console.error(`❌ Error en conversión múltiple:`, error.message);
      throw error;
    }
  }
}

// Exportar una instancia singleton
module.exports = new CurrencyConversionService();
