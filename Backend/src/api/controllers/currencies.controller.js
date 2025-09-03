const { db } = require('../../config/db');

/**
 * Controlador para manejar las monedas soportadas por el sistema
 */
class CurrenciesController {
  
  /**
   * Obtener todas las monedas soportadas
   * GET /api/currencies
   */
  async obtenerMonedasSoportadas(req, res) {
    try {
      console.log('📊 Obteniendo monedas soportadas...');
      
      const currencies = await db('supported_currencies')
        .select(['code', 'name', 'symbol'])
        .orderBy('code', 'asc');
      
      console.log(`✅ ${currencies.length} monedas soportadas obtenidas`);
      
      res.json({
        success: true,
        data: currencies
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo monedas soportadas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener monedas soportadas'
      });
    }
  }

  /**
   * Obtener una moneda específica por código
   * GET /api/currencies/:code
   */
  async obtenerMonedaPorCodigo(req, res) {
    try {
      const { code } = req.params;
      
      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'El código de moneda es requerido'
        });
      }
      
      console.log(`📊 Obteniendo moneda: ${code}`);
      
      const currency = await db('supported_currencies')
        .select(['code', 'name', 'symbol'])
        .where('code', code.toUpperCase())
        .first();
      
      if (!currency) {
        return res.status(404).json({
          success: false,
          message: 'Moneda no encontrada'
        });
      }
      
      console.log(`✅ Moneda ${code} obtenida`);
      
      res.json({
        success: true,
        data: currency
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo moneda:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener moneda'
      });
    }
  }

  /**
   * Obtener las tasas de cambio de un usuario usando el nuevo servicio
   * GET /api/currencies/user/rates
   */
  async obtenerTasasUsuario(req, res) {
    try {
      const userId = req.user.id;
      
      console.log(`📊 Obteniendo tasas de cambio para usuario ${userId}`);
      
      // Importar el servicio dinámicamente para evitar dependencias circulares
      const CurrencyConversionService = require('../services/CurrencyConversionService');
      
      const rates = await CurrencyConversionService.getUserExchangeRates(userId);
      
      console.log(`✅ ${rates.length} tasas de cambio obtenidas`);
      
      res.json({
        success: true,
        data: rates
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo tasas de usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener tasas de cambio'
      });
    }
  }

  /**
   * Convertir una cantidad de una moneda a otra
   * POST /api/currencies/convert
   */
  async convertirMoneda(req, res) {
    try {
      const userId = req.user.id;
      const { amount, fromCurrency, toCurrency } = req.body;

      // Validar datos de entrada
      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({
          success: false,
          message: 'amount, fromCurrency y toCurrency son requeridos'
        });
      }

      if (fromCurrency === toCurrency) {
        return res.json({
          success: true,
          data: {
            originalAmount: parseFloat(amount),
            convertedAmount: parseFloat(amount),
            fromCurrency,
            toCurrency,
            rate: 1
          }
        });
      }

      console.log(`🔄 Convirtiendo ${amount} ${fromCurrency} a ${toCurrency} para usuario ${userId}`);

      // Importar el servicio dinámicamente
      const CurrencyConversionService = require('../services/CurrencyConversionService');
      
      const result = await CurrencyConversionService.convert({
        amount: parseFloat(amount),
        fromCurrency,
        toCurrency,
        userId
      });

      console.log(`✅ Conversión exitosa: ${amount} ${fromCurrency} = ${result.convertedAmount} ${toCurrency}`);

      res.json({
        success: true,
        data: {
          originalAmount: parseFloat(amount),
          convertedAmount: result.convertedAmount,
          fromCurrency,
          toCurrency,
          rate: result.rate
        }
      });

    } catch (error) {
      console.error('❌ Error en conversión de moneda:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al convertir moneda'
      });
    }
  }
}

module.exports = new CurrenciesController();
