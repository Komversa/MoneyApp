const { db } = require('../../config/db');

/**
 * Servicio de Dashboard REFACTORIZADO para Fase 1 NIO-USD
 * 
 * ARQUITECTURA "CONVERTIR PRIMERO, AGREGAR DESPUÉS":
 * 1. Obtener configuración del usuario (moneda principal + tasas de cambio)
 * 2. Obtener TODOS los datos brutos (saldos, transacciones)
 * 3. Convertir CADA monto individual a la moneda principal
 * 4. SOLO DESPUÉS realizar agregaciones y totales
 * 5. Devolver datos ya procesados y convertidos al frontend
 */
class DashboardService {

  /**
   * Obtener resumen completo del dashboard para un usuario
   * FUNCIÓN PRINCIPAL - Centraliza todas las conversiones multi-moneda
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Datos completos del dashboard YA CONVERTIDOS
   */
  async obtenerResumenDashboard(userId) {
    try {
      console.log(`\n🏦 === DASHBOARD DEBUG ===`);
      console.log(`👤 Usuario ID: ${userId}`);

      // Verificar que el usuario existe
      const userExists = await db('users').where('id', userId).first();
      if (!userExists) {
        throw new Error(`Usuario con ID ${userId} no encontrado`);
      }
      console.log('✅ Usuario encontrado');

      // Verificar configuración del usuario
      const userSettings = await db('user_settings').where('user_id', userId).first();
      if (!userSettings) {
        throw new Error(`Configuración no encontrada para usuario ${userId}`);
      }
      console.log('✅ Configuración de usuario encontrada');

      // Ejecutar funciones una por una para identificar cuál falla
      console.log('1️⃣ Obteniendo resumen financiero...');
      const resumenFinanciero = await this.obtenerResumenFinanciero(userId);
      console.log('✅ Resumen financiero obtenido');

      console.log('2️⃣ Obteniendo últimas transacciones...');
      const ultimasTransacciones = await this.obtenerUltimasTransacciones(userId);
      console.log('✅ Últimas transacciones obtenidas');

      console.log('3️⃣ Obteniendo estadísticas mensuales...');
      const estadisticasMensuales = await this.obtenerEstadisticasMensuales(userId);
      console.log('✅ Estadísticas mensuales obtenidas');

      console.log('4️⃣ Obteniendo gráfico de gastos...');
      const graficoGastos = await this.obtenerDatosGraficoGastos(userId);
      console.log('✅ Gráfico de gastos obtenido');

      console.log(`✅ Dashboard completado para moneda: ${resumenFinanciero.monedaPrincipal}`);

      return {
        resumen: resumenFinanciero,
        ultimasTransacciones,
        estadisticasMensuales,
        graficoGastos
      };

    } catch (error) {
      console.error(`❌ Error en Dashboard Service:`, error.message);
      console.error(`❌ Stack trace:`, error.stack);
      throw new Error(`Error interno del servidor: ${error.message}`);
    }
  }

  /**
   * Obtener resumen financiero con cálculo de patrimonio neto (activos - pasivos)
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Resumen financiero con patrimonio neto
   */
  async obtenerResumenFinanciero(userId) {
    try {
      console.log(`💰 Obteniendo configuración del usuario...`);

      // 1. Obtener configuración del usuario
      const userSettings = await db('user_settings')
        .where({ user_id: userId })
        .first();

      if (!userSettings) {
        throw new Error('Configuración de usuario no encontrada');
      }

      const primaryCurrency = userSettings.primary_currency;
      console.log(`💰 Moneda principal: ${primaryCurrency}`);

      // 2. Obtener tasas de cambio
      const exchangeRates = await this._obtenerTasasCambioUsuario(userId);
      console.log(`💰 Tasas obtenidas: ${Object.keys(exchangeRates).length} monedas`);

      // 3. Obtener cuentas con categoría
      const accounts = await db('accounts')
        .select(['id', 'name', 'current_balance', 'currency', 'account_category'])
        .where('user_id', userId)
        .orderBy('name', 'asc');

      console.log(`💰 Cuentas encontradas: ${accounts.length}`);

      // 4. Calcular activos y pasivos por separado
      let totalActivos = 0;
      let totalPasivos = 0;
      const activosPorMoneda = {};
      const pasivosPorMoneda = {};

      for (const account of accounts) {
        const currency = account.currency;
        const balance = parseFloat(account.current_balance || 0);
        const category = account.account_category;

        // Convertir a moneda principal
        const convertedBalance = await this._convertirMoneda(
          balance, 
          currency, 
          primaryCurrency, 
          exchangeRates,
          userId
        );

        if (category === 'asset') {
          // Activos
          totalActivos += convertedBalance;
          if (!activosPorMoneda[currency]) {
            activosPorMoneda[currency] = 0;
          }
          activosPorMoneda[currency] += balance;
        } else if (category === 'liability') {
          // Pasivos (saldos negativos se suman como pasivos positivos)
          totalPasivos += Math.abs(convertedBalance);
          if (!pasivosPorMoneda[currency]) {
            pasivosPorMoneda[currency] = 0;
          }
          pasivosPorMoneda[currency] += Math.abs(balance);
        }
      }

      // 5. Calcular patrimonio neto
      const patrimonioNeto = totalActivos - totalPasivos;

      console.log(`💰 Activos totales: ${totalActivos.toFixed(2)} ${primaryCurrency}`);
      console.log(`💳 Pasivos totales: ${totalPasivos.toFixed(2)} ${primaryCurrency}`);
      console.log(`📊 Patrimonio neto: ${patrimonioNeto.toFixed(2)} ${primaryCurrency}`);

      return {
        // Información básica
        totalCuentas: accounts.length,
        monedaPrincipal: primaryCurrency,
        
        // Patrimonio neto (nueva funcionalidad)
        totalActivos,
        totalPasivos,
        patrimonioNeto,
        
        // Desglose por categoría
        activosPorMoneda,
        pasivosPorMoneda,
        
        // Compatibilidad con el código existente
        saldoTotal: patrimonioNeto,
        saldoTotalConvertido: patrimonioNeto,
        totalesPorMoneda: { ...activosPorMoneda }, // Mantener compatibilidad
        
        // Cuentas procesadas
        cuentas: await Promise.all(accounts.map(async account => ({
          ...account,
          saldoConvertido: await this._convertirMoneda(
            parseFloat(account.current_balance || 0),
            account.currency,
            primaryCurrency,
            exchangeRates,
            userId
          )
        })))
      };

    } catch (error) {
      console.error(`❌ Error en resumen financiero:`, error.message);
      console.error(`❌ Stack:`, error.stack);
      throw error;
    }
  }

  /**
   * Obtener últimas transacciones con conversión a moneda principal
   * 🚨 ACTUALIZADO: Usa la misma lógica de conversión que el historial
   * @param {number} userId - ID del usuario
   * @param {number} limit - Número de transacciones a obtener
   * @returns {Promise<Array>} - Lista de transacciones convertidas
   */
  async obtenerUltimasTransacciones(userId, limit = 10) {
    try {
      console.log(`📋 Obteniendo últimas transacciones con conversión...`);

      // 1. Obtener configuración del usuario y tasas de cambio
      const [userSettings, exchangeRates] = await Promise.all([
        db('user_settings').where({ user_id: userId }).first(),
        this._obtenerTasasCambioUsuario(userId)
      ]);

      if (!userSettings) {
        throw new Error('Configuración de usuario no encontrada');
      }

      const primaryCurrency = userSettings.primary_currency;
      console.log(`📋 Moneda principal: ${primaryCurrency}`);

      // 2. Query con conversión de monedas (igual que en transactions.service.js)
      const transacciones = await db('transactions')
        .select([
          'transactions.id',
          'transactions.type',
          'transactions.amount',
          'transactions.currency_code',  // 🚨 NUEVO: Campo de moneda de la transacción
          'transactions.transaction_date',
          'transactions.description',
          'transactions.created_at',
          'transactions.updated_at',
          'transactions.category_id',
          'transactions.from_account_id',
          'transactions.to_account_id',
          'categories.name as category_name',
          'categories.type as category_type',
          'from_account.name as from_account_name',
          'from_account.currency as from_account_currency',
          'to_account.name as to_account_name',
          'to_account.currency as to_account_currency',
          'user_settings.primary_currency'
        ])
        .leftJoin('categories', 'transactions.category_id', 'categories.id')
        .leftJoin('accounts as from_account', 'transactions.from_account_id', 'from_account.id')
        .leftJoin('accounts as to_account', 'transactions.to_account_id', 'to_account.id')
        .leftJoin('user_settings', 'transactions.user_id', 'user_settings.user_id')
        .where('transactions.user_id', userId)
        .orderBy('transactions.transaction_date', 'desc')
        .orderBy('transactions.created_at', 'desc')
        .limit(limit);

      console.log(`📋 Transacciones encontradas: ${transacciones.length}`);

      // 3. Procesar y formatear los datos para el frontend usando CurrencyConversionService
      const CurrencyConversionService = require('./CurrencyConversionService');
      const processedTransactions = await Promise.all(transacciones.map(async (transaction) => {
        const originalAmount = parseFloat(transaction.amount);
        const originalCurrency = transaction.currency_code;
        const primaryCurrency = transaction.primary_currency;

        // Usar CurrencyConversionService para conversiones
        let conversionResult;
        try {
          conversionResult = await CurrencyConversionService.convert({
            amount: originalAmount,
            fromCurrency: originalCurrency,
            toCurrency: primaryCurrency,
            userId: userId
          });
        } catch (error) {
          console.warn(`⚠️ Error en conversión para transacción ${transaction.id}:`, error.message);
          // Fallback: usar valores originales
          conversionResult = {
            originalAmount,
            convertedAmount: originalAmount,
            conversionRate: 1,
            isConverted: false,
            success: false
          };
        }

        return {
          // Datos originales de la transacción
          id: transaction.id,
          type: transaction.type,
          transaction_date: transaction.transaction_date,
          description: transaction.description,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
          category_id: transaction.category_id,
          from_account_id: transaction.from_account_id,
          to_account_id: transaction.to_account_id,
          category_name: transaction.category_name,
          category_type: transaction.category_type,
          from_account_name: transaction.from_account_name,
          from_account_currency: transaction.from_account_currency,
          to_account_name: transaction.to_account_name,
          to_account_currency: transaction.to_account_currency,

          // Datos de moneda original
          original_amount: conversionResult.originalAmount,
          original_currency: originalCurrency,

          // Datos convertidos a moneda principal
          converted_amount: conversionResult.convertedAmount,
          primary_currency: primaryCurrency,
          conversion_rate: conversionResult.conversionRate,

          // Indicador de si se aplicó conversión
          is_converted: conversionResult.isConverted
        };
      }));

      console.log(`📋 Transacciones procesadas con conversión: ${processedTransactions.length}`);

      return processedTransactions;

    } catch (error) {
      console.error(`❌ Error en últimas transacciones:`, error.message);
      throw error;
    }
  }

  /**
   * Obtener estadísticas mensuales con conversión multi-moneda
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Estadísticas del mes actual
   */
  async obtenerEstadisticasMensuales(userId) {
    try {
      console.log(`📊 Obteniendo estadísticas mensuales...`);

      // 1. Obtener configuración y tasas de cambio
      const [userSettings, exchangeRates] = await Promise.all([
        db('user_settings').where({ user_id: userId }).first(),
        this._obtenerTasasCambioUsuario(userId)
      ]);

      if (!userSettings) {
        throw new Error('Configuración de usuario no encontrada');
      }

      const primaryCurrency = userSettings.primary_currency;
      console.log(`📊 Moneda principal: ${primaryCurrency}`);

      // 2. Calcular fecha de inicio del mes actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      console.log(`📊 Inicio del mes: ${startOfMonth.toISOString()}`);

      // 3. Obtener transacciones del mes CON información de cuentas para conversión
      const transaccionesDelMes = await db('transactions')
        .select([
          'transactions.type',
          'transactions.amount',
          'transactions.transaction_date',
          'from_account.currency as from_currency',
          'to_account.currency as to_currency'
        ])
        .leftJoin('accounts as from_account', 'transactions.from_account_id', 'from_account.id')
        .leftJoin('accounts as to_account', 'transactions.to_account_id', 'to_account.id')
        .where('transactions.user_id', userId)
        .where('transactions.transaction_date', '>=', startOfMonth)
        .whereIn('transactions.type', ['income', 'expense']);

      console.log(`📊 Transacciones del mes: ${transaccionesDelMes.length}`);

      // 4. Calcular totales CON conversión de monedas
      let totalIngresos = 0;
      let totalGastos = 0;

      for (const transaccion of transaccionesDelMes) {
        const amount = parseFloat(transaccion.amount);
        
        // Determinar la moneda de la transacción
        const transactionCurrency = transaccion.type === 'income' 
          ? transaccion.to_currency 
          : transaccion.from_currency;
        
        // Convertir a moneda principal
        const montoConvertido = await this._convertirMoneda(
          amount,
          transactionCurrency || primaryCurrency, // Fallback a moneda principal
          primaryCurrency,
          exchangeRates,
          userId
        );
        
        if (transaccion.type === 'income') {
          totalIngresos += montoConvertido;
        } else if (transaccion.type === 'expense') {
          totalGastos += montoConvertido;
        }
      }

      const balance = totalIngresos - totalGastos;

      console.log(`📊 Ingresos convertidos: ${totalIngresos.toFixed(2)} ${primaryCurrency}`);
      console.log(`📊 Gastos convertidos: ${totalGastos.toFixed(2)} ${primaryCurrency}`);
      console.log(`📊 Balance: ${balance.toFixed(2)} ${primaryCurrency}`);
      console.log(`📊 Total de transacciones procesadas: ${transaccionesDelMes.length}`);

      return {
        periodo: 'month',
        fechaInicio: startOfMonth,
        totalIngresos,
        totalGastos,
        balance,
        totalIngresosConvertido: totalIngresos,
        totalGastosConvertido: totalGastos,
        balanceConvertido: balance,
        monedaPrincipal: primaryCurrency
      };

    } catch (error) {
      console.error(`❌ Error en estadísticas mensuales:`, error.message);
      throw error;
    }
  }

  /**
   * Obtener datos para gráfico de gastos por categoría
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Datos del gráfico convertidos
   */
  async obtenerDatosGraficoGastos(userId) {
    try {
      console.log(`📈 Obteniendo datos del gráfico...`);

      // 1. Obtener configuración y tasas de cambio
      const [userSettings, exchangeRates] = await Promise.all([
        db('user_settings').where({ user_id: userId }).first(),
        this._obtenerTasasCambioUsuario(userId)
      ]);

      if (!userSettings) {
        throw new Error('Configuración de usuario no encontrada');
      }

      const primaryCurrency = userSettings.primary_currency;
      console.log(`📈 Moneda principal: ${primaryCurrency}`);

      // 2. Calcular fecha de inicio del mes actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 3. Obtener TODOS los gastos del mes (INCLUYENDO sin categoría)
      const gastosPorCategoria = await db('transactions')
        .select([
          'categories.name as categoria',
          'transactions.amount',
          'from_account.currency'
        ])
        .leftJoin('categories', 'transactions.category_id', 'categories.id')
        .leftJoin('accounts as from_account', 'transactions.from_account_id', 'from_account.id')
        .where('transactions.user_id', userId)
        .where('transactions.type', 'expense')
        .where('transactions.transaction_date', '>=', startOfMonth);
        // ❌ ELIMINADO: .whereNotNull('categories.name') - Ahora incluye gastos sin categoría

      console.log(`📈 Gastos encontrados: ${gastosPorCategoria.length}`);

      // 4. Procesar y convertir gastos por categoría (MISMA LÓGICA que estadísticas mensuales)
      const gastosAgrupados = {};
      let totalGastos = 0;

      for (const gasto of gastosPorCategoria) {
        // 🔧 CATEGORÍA: Usar 'Sin Categoría' si no hay categoría asignada
        const categoria = gasto.categoria || 'Sin Categoría';
        const montoOriginal = parseFloat(gasto.amount);
        const monedaOriginal = gasto.currency || primaryCurrency;

        // 🔧 CONVERSIÓN: Misma lógica que obtenerEstadisticasMensuales
        const montoConvertido = await this._convertirMoneda(
          montoOriginal,
          monedaOriginal,
          primaryCurrency,
          exchangeRates,
          userId
        );

        // Agregar al total de la categoría
        if (!gastosAgrupados[categoria]) {
          gastosAgrupados[categoria] = 0;
        }
        gastosAgrupados[categoria] += montoConvertido;
        totalGastos += montoConvertido;
      }

      // 5. Preparar datos para el gráfico
      const categorias = Object.keys(gastosAgrupados);
      const valores = Object.values(gastosAgrupados);

      console.log(`📈 Categorías: ${categorias.length}, Total: ${totalGastos.toFixed(2)} ${primaryCurrency}`);
      console.log(`📈 Desglose por categoría:`, gastosAgrupados);

      if (categorias.length === 0) {
        return {
          labels: [],
          datasets: [],
          totalGastos: 0,
          monedaPrincipal: primaryCurrency
        };
      }

      // Generar colores para el gráfico
      const colores = this._generarColoresGrafico(categorias.length);

      return {
        labels: categorias,
        datasets: [{
          data: valores,
          backgroundColor: colores,
          borderWidth: 0
        }],
        totalGastos,
        monedaPrincipal: primaryCurrency
      };

    } catch (error) {
      console.error(`❌ Error en gráfico de gastos:`, error.message);
      throw error;
    }
  }

  /**
   * ===========================================
   * MÉTODOS PRIVADOS DE UTILIDAD
   * ===========================================
   */

  /**
   * Obtener todas las tasas de cambio de un usuario en un mapa
   * @private
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Mapa de tasas { 'USD': 1.0, 'NIO': 0.0274 }
   */
  async _obtenerTasasCambioUsuario(userId) {
    const CurrencyConversionService = require('./CurrencyConversionService');
    const tasas = await CurrencyConversionService.getUserExchangeRates(userId);

    const tasasMap = {};
    tasas.forEach(tasa => {
      tasasMap[tasa.currency_code] = parseFloat(tasa.rate_to_usd);
    });

    return tasasMap;
  }

  /**
   * Convertir un monto a la moneda principal del usuario usando CurrencyConversionService
   * 🚨 CORREGIDO: Ahora usa el CurrencyConversionService para conversiones precisas
   * @private
   * @param {number} amount - Monto a convertir
   * @param {string} fromCurrency - Moneda origen
   * @param {string} primaryCurrency - Moneda principal del usuario
   * @param {Object} exchangeRates - Mapa de tasas de cambio (obsoleto, mantenido para compatibilidad)
   * @param {number} userId - ID del usuario (requerido para CurrencyConversionService)
   * @returns {Promise<number>} - Monto convertido a moneda principal
   */
  async _convertirMoneda(amount, fromCurrency, primaryCurrency, exchangeRates, userId) {
    // Si ya está en moneda principal, no hay conversión
    if (fromCurrency === primaryCurrency) {
      return parseFloat(amount);
    }

    try {
      // Usar CurrencyConversionService para conversión precisa
      const CurrencyConversionService = require('./CurrencyConversionService');
      const conversionResult = await CurrencyConversionService.convert({
        amount: parseFloat(amount),
        fromCurrency: fromCurrency,
        toCurrency: primaryCurrency,
        userId: userId
      });

      return conversionResult.convertedAmount;
    } catch (conversionError) {
      console.error(`❌ Error convirtiendo ${amount} ${fromCurrency} a ${primaryCurrency}:`, conversionError.message);
      
      // Fallback: usar la lógica antigua si falla la conversión
      const fromRate = exchangeRates[fromCurrency];
      const primaryRate = exchangeRates[primaryCurrency];

      if (fromRate && primaryRate) {
        console.warn(`⚠️ Usando fallback para conversión de ${fromCurrency} → ${primaryCurrency}`);
        const amountInUSD = parseFloat(amount) * fromRate;
        const amountInPrimary = amountInUSD / primaryRate;
        return amountInPrimary;
      }

      if (fromRate && primaryCurrency === 'USD') {
        console.warn(`⚠️ Usando fallback para conversión de ${fromCurrency} → USD`);
        return parseFloat(amount) * fromRate;
      }

      // Si no hay tasas disponibles, asumir 1:1 (fallback para compatibilidad)
      console.warn(`⚠️ No se encontró tasa de cambio para ${fromCurrency} → ${primaryCurrency}, usando 1:1`);
      return parseFloat(amount);
    }
  }

  /**
   * Determinar la moneda de una transacción basada en su tipo
   * @private
   * @param {Object} transaccion - Objeto de transacción
   * @returns {string} - Código de moneda
   */
  _determinarMonedaTransaccion(transaccion) {
    switch (transaccion.type) {
      case 'expense':
        return transaccion.from_account_currency || 'NIO';
      case 'income':
        return transaccion.to_account_currency || 'NIO';
      case 'transfer':
        return transaccion.from_account_currency || 'NIO';
      default:
        return 'NIO';
    }
  }

  /**
   * Generar colores para el gráfico de gastos
   * @private
   * @param {number} count - Número de colores necesarios
   * @returns {Array} - Array de colores en formato hex
   */
  _generarColoresGrafico(count) {
    const coloresBase = [
      '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
      '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#84cc16'
    ];

    const colores = [];
    for (let i = 0; i < count; i++) {
      colores.push(coloresBase[i % coloresBase.length]);
    }

    return colores;
  }
}

module.exports = new DashboardService();
