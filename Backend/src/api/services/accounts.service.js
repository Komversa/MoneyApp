const { db } = require('../../config/db');

/**
 * Servicio de cuentas que contiene la lógica de negocio
 * para la gestión de cuentas bancarias del usuario
 */
class AccountsService {

  /**
   * Obtener todas las cuentas de un usuario
   * @param {number} userId - ID del usuario
   * @param {string} category - Categoría de cuenta: 'asset', 'liability' o null para todas
   * @returns {Promise<Array>} - Lista de cuentas con información adicional
   */
  async obtenerCuentasPorUsuario(userId, category = null) {
    try {
      let query = db('accounts')
        .select([
          'accounts.id',
          'accounts.name',
          'accounts.account_type_id',
          'accounts.account_category',
          'accounts.initial_balance',
          'accounts.current_balance',
          'accounts.currency',
          'accounts.created_at',
          'accounts.updated_at',
          'account_types.name as account_type_name',
          // Incluir información de deuda si aplica
          'debt_details.interest_rate',
          'debt_details.due_date',
          'debt_details.original_amount'
        ])
        .leftJoin('account_types', 'accounts.account_type_id', 'account_types.id')
        .leftJoin('debt_details', 'accounts.id', 'debt_details.account_id')
        .where('accounts.user_id', userId);

      // Filtrar por categoría si se especifica
      if (category && ['asset', 'liability'].includes(category)) {
        query = query.where('accounts.account_category', category);
      }

      const accounts = await query.orderBy('accounts.name', 'asc');

      return accounts;
    } catch (error) {
      throw new Error('Error interno del servidor al obtener cuentas');
    }
  }

  /**
   * Obtener una cuenta específica del usuario
   * @param {number} userId - ID del usuario
   * @param {number} accountId - ID de la cuenta
   * @returns {Promise<Object>} - Información de la cuenta
   */
  async obtenerCuentaPorId(userId, accountId) {
    try {
      return await this._obtenerCuentaCompletaPorId(userId, accountId);
    } catch (error) {
      if (error.message === 'Cuenta no encontrada') {
        throw error;
      }
      throw new Error('Error interno del servidor al obtener cuenta');
    }
  }

  /**
   * Crear una nueva cuenta para un usuario con soporte para activos y pasivos
   * @param {number} userId - ID del usuario
   * @param {Object} accountData - Datos de la cuenta
   * @returns {Promise<Object>} - Cuenta creada
   */
  async crearCuentaParaUsuario(userId, accountData) {
    // Usar transacción de Knex para operaciones atómicas
    return await db.transaction(async (trx) => {
      try {
        const { 
          name, 
          accountTypeId, 
          initialBalance = 0, 
          currency = 'NIO',
          accountCategory = 'asset',
          // Campos específicos para deudas
          interestRate = null,
          dueDate = null,
          originalAmount = null
        } = accountData;

        // Validar categoría de cuenta
        if (!['asset', 'liability'].includes(accountCategory)) {
          throw new Error('La categoría de cuenta debe ser "asset" o "liability"');
        }

        // Verificar que el tipo de cuenta existe y pertenece al usuario
        const accountType = await trx('account_types')
          .where({ id: accountTypeId, user_id: userId })
          .first();

        if (!accountType) {
          throw new Error('Tipo de cuenta no válido');
        }

        // Verificar que no existe una cuenta con el mismo nombre para el usuario
        const existingAccount = await trx('accounts')
          .where({ user_id: userId, name })
          .first();

        if (existingAccount) {
          throw new Error('Ya existe una cuenta con ese nombre');
        }

        // Validar moneda permitida (basado en configuración del usuario y tasas de cambio)
        const [userSettings, exchangeRates] = await Promise.all([
          trx('user_settings').where({ user_id: userId }).first(),
          this._obtenerTasasCambioUsuario(userId)
        ]);

        if (!userSettings) {
          throw new Error('Configuración de usuario no encontrada');
        }

        // Construir lista de monedas permitidas: principal + todas con tasa de cambio configurada
        const allowedCurrencies = [
          userSettings.primary_currency,
          ...Object.keys(exchangeRates)
        ];

        if (!allowedCurrencies.includes(currency)) {
          throw new Error(`Moneda no permitida. Las monedas disponibles son: ${allowedCurrencies.join(', ')}`);
        }

        // Para cuentas de tipo 'liability', validar que el saldo inicial sea negativo o cero
        let processedInitialBalance = parseFloat(initialBalance);
        if (accountCategory === 'liability' && processedInitialBalance > 0) {
          // Convertir automáticamente a negativo para representar la deuda
          processedInitialBalance = -Math.abs(processedInitialBalance);
        }

        // Crear la nueva cuenta
        const [newAccount] = await trx('accounts')
          .insert({
            user_id: userId,
            name: name.trim(),
            account_type_id: accountTypeId,
            account_category: accountCategory,
            initial_balance: processedInitialBalance,
            current_balance: processedInitialBalance, // El saldo inicial = saldo actual
            currency
          })
          .returning([
            'id', 
            'name', 
            'account_type_id',
            'account_category',
            'initial_balance', 
            'current_balance', 
            'currency',
            'created_at', 
            'updated_at'
          ]);

        // Si es una cuenta de tipo 'liability', crear los detalles de la deuda
        if (accountCategory === 'liability') {
          // Validar que originalAmount se proporcionó
          if (!originalAmount || originalAmount <= 0) {
            throw new Error('Para cuentas de tipo pasivo se requiere el monto original de la deuda');
          }

          await trx('debt_details')
            .insert({
              account_id: newAccount.id,
              interest_rate: interestRate ? parseFloat(interestRate) : 0,
              due_date: dueDate || null,
              original_amount: parseFloat(originalAmount)
            });
        }

        // Obtener la información completa de la cuenta creada usando la transacción
        const completeAccount = await this._obtenerCuentaCompletaPorId(userId, newAccount.id, trx);
        
        return completeAccount;

      } catch (error) {
        // El rollback es automático si hay error en la transacción
        if ([
          'Tipo de cuenta no válido',
          'Ya existe una cuenta con ese nombre',
          'Configuración de usuario no encontrada',
          'La categoría de cuenta debe ser "asset" o "liability"',
          'Para cuentas de tipo pasivo se requiere el monto original de la deuda'
        ].includes(error.message) || error.message.includes('Moneda no permitida')) {
          throw error;
        }
        throw new Error('Error interno del servidor al crear cuenta');
      }
    });
  }

  /**
   * Actualizar una cuenta existente
   * @param {number} userId - ID del usuario
   * @param {number} accountId - ID de la cuenta
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} - Cuenta actualizada
   */
  async actualizarCuenta(userId, accountId, updateData) {
    try {
      const { name, accountTypeId, currency } = updateData;

      // Verificar que la cuenta existe y pertenece al usuario
      const existingAccount = await this.obtenerCuentaPorId(userId, accountId);

      // Verificar tipo de cuenta si se está actualizando
      if (accountTypeId && accountTypeId !== existingAccount.account_type_id) {
        const accountType = await db('account_types')
          .where({ id: accountTypeId, user_id: userId })
          .first();

        if (!accountType) {
          throw new Error('Tipo de cuenta no válido');
        }
      }

      // Verificar nombre único si se está actualizando
      if (name && name !== existingAccount.name) {
        const duplicateName = await db('accounts')
          .where({ user_id: userId, name })
          .whereNot({ id: accountId })
          .first();

        if (duplicateName) {
          throw new Error('Ya existe una cuenta con ese nombre');
        }
      }

      // Verificar moneda si se está actualizando
      if (currency && currency !== existingAccount.currency) {
        const [userSettings, exchangeRates] = await Promise.all([
          db('user_settings').where({ user_id: userId }).first(),
          this._obtenerTasasCambioUsuario(userId)
        ]);

        // Construir lista de monedas permitidas: principal + todas con tasa de cambio configurada
        const allowedCurrencies = [
          userSettings.primary_currency,
          ...Object.keys(exchangeRates)
        ];

        if (!allowedCurrencies.includes(currency)) {
          throw new Error(`Moneda no permitida. Las monedas disponibles son: ${allowedCurrencies.join(', ')}`);
        }
      }

      // Actualizar la cuenta
      await db('accounts')
        .where({ id: accountId, user_id: userId })
        .update({
          ...(name && { name: name.trim() }),
          ...(accountTypeId && { account_type_id: accountTypeId }),
          ...(currency && { currency }),
          updated_at: db.fn.now()
        });

      // Retornar la cuenta actualizada
      return await this.obtenerCuentaPorId(userId, accountId);

    } catch (error) {
      if ([
        'Cuenta no encontrada',
        'Tipo de cuenta no válido',
        'Ya existe una cuenta con ese nombre'
      ].includes(error.message) || error.message.includes('Moneda no permitida')) {
        throw error;
      }
      throw new Error('Error interno del servidor al actualizar cuenta');
    }
  }

  /**
   * Eliminar una cuenta
   * @param {number} userId - ID del usuario
   * @param {number} accountId - ID de la cuenta
   * @returns {Promise<void>}
   */
  async eliminarCuenta(userId, accountId) {
    try {
      // Verificar que la cuenta existe y pertenece al usuario
      await this.obtenerCuentaPorId(userId, accountId);

      // Verificar si la cuenta tiene transacciones asociadas
      const hasTransactions = await db('transactions')
        .where(function() {
          this.where('from_account_id', accountId)
            .orWhere('to_account_id', accountId);
        })
        .where('user_id', userId)
        .first();

      if (hasTransactions) {
        throw new Error('No se puede eliminar una cuenta que tiene transacciones asociadas');
      }

      // Eliminar la cuenta
      await db('accounts')
        .where({ id: accountId, user_id: userId })
        .del();

    } catch (error) {
      if ([
        'Cuenta no encontrada',
        'No se puede eliminar una cuenta que tiene transacciones asociadas'
      ].includes(error.message)) {
        throw error;
      }
      throw new Error('Error interno del servidor al eliminar cuenta');
    }
  }

  /**
   * Obtener resumen financiero del usuario con cálculo de patrimonio neto (activos - pasivos)
   * 🚨 REFACTORIZADO: Ahora calcula el verdadero patrimonio neto unificado
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Resumen con patrimonio neto real
   */
  async obtenerResumenFinanciero(userId) {
    try {
      console.log(`💼 [Accounts] Calculando patrimonio neto para usuario: ${userId}`);

      // Obtener configuración del usuario y tasas de cambio
      const [userSettings, exchangeRates] = await Promise.all([
        db('user_settings').where({ user_id: userId }).first(),
        this._obtenerTasasCambioUsuario(userId)
      ]);

      if (!userSettings) {
        throw new Error('Configuración de usuario no encontrada');
      }

      const { primary_currency } = userSettings;
      console.log(`💰 [Accounts] Moneda principal: ${primary_currency}`);

      // Obtener todas las cuentas del usuario (activos + pasivos)
      const accounts = await this.obtenerCuentasPorUsuario(userId);
      console.log(`🏦 [Accounts] Total de cuentas: ${accounts.length}`);

      // 🚨 CAMBIO: Calcular total de activos convertido a moneda principal
      let totalActivosConvertido = 0;
      const activosPorMoneda = {};

      for (const account of accounts) {
        const currency = account.currency;
        const balance = parseFloat(account.current_balance || 0);
        const category = account.account_category;

        // Solo procesar cuentas de activos
        if (category === 'asset') {
          // Convertir saldo a moneda principal
          const balanceConvertido = await this._convertirAMonedaPrincipal(
            balance,
            currency,
            primary_currency,
            exchangeRates,
            userId
          );

          // Acumular total convertido
          totalActivosConvertido += balanceConvertido;

          // Acumular por moneda específica para compatibilidad
          if (!activosPorMoneda[currency]) {
            activosPorMoneda[currency] = 0;
          }
          activosPorMoneda[currency] += balance;
        }
      }

      console.log(`💰 [Accounts] Total activos convertido: ${totalActivosConvertido.toFixed(2)} ${primary_currency}`);

      return {
        // Información básica
        totalAccounts: accounts.length,
        primaryCurrency: primary_currency,
        
        // 🚨 NUEVO: Total de activos en moneda principal
        totalActivos: totalActivosConvertido,
        activosPorMoneda,
        
        // Compatibilidad con código existente
        totalsByCurrency: activosPorMoneda,
        totalInPrimaryCurrency: totalActivosConvertido,
        exchangeRates: exchangeRates
      };

    } catch (error) {
      console.error(`❌ [Accounts] Error calculando patrimonio neto:`, error.message);
      if (error.message === 'Configuración de usuario no encontrada') {
        throw error;
      }
      throw new Error('Error interno del servidor al obtener resumen financiero');
    }
  }

  /**
   * Obtener panel de estructura de patrimonio avanzado (para módulo de Cuentas)
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Panel estructurado con 3 tarjetas de análisis
   */
  async obtenerPanelPatrimonio(userId) {
    try {
      console.log('💼 [Backend] Obteniendo panel de patrimonio para usuario:', userId);

      // Obtener configuración del usuario y tasas de cambio
      const [userSettings, exchangeRates] = await Promise.all([
        db('user_settings').where({ user_id: userId }).first(),
        this._obtenerTasasCambioUsuario(userId)
      ]);

      if (!userSettings) {
        throw new Error('Configuración de usuario no encontrada');
      }

      const primaryCurrency = userSettings.primary_currency;
      console.log('💰 [Backend] Moneda principal:', primaryCurrency);

      // Obtener todas las cuentas del usuario con información de tipos
      const accounts = await this.obtenerCuentasPorUsuario(userId);
      console.log('🏦 [Backend] Cuentas encontradas:', accounts.length);

      if (accounts.length === 0) {
        return {
          principalAccount: null,
          distributionByType: [],
          distributionByCurrency: [],
          consolidatedTotal: 0,
          primaryCurrency: primaryCurrency
        };
      }

      // 1. DETERMINAR CUENTA PRINCIPAL (mayor saldo convertido)
      let principalAccount = null;
      let maxConvertedBalance = -Infinity;

      for (const account of accounts) {
        const convertedBalance = await this._convertirAMonedaPrincipal(
          parseFloat(account.current_balance),
          account.currency,
          primaryCurrency,
          exchangeRates,
          userId
        );

        if (convertedBalance > maxConvertedBalance) {
          maxConvertedBalance = convertedBalance;
          principalAccount = {
            name: account.name,
            balance: parseFloat(account.current_balance),
            currency_code: account.currency,
            type: account.account_type_name
          };
        }
      }

      console.log('🏆 [Backend] Cuenta principal identificada:', principalAccount?.name);

      // 2. CALCULAR DISTRIBUCIÓN POR TIPO
      const distributionByType = {};
      
      for (const account of accounts) {
        const accountType = account.account_type_name;
        const convertedBalance = await this._convertirAMonedaPrincipal(
          parseFloat(account.current_balance),
          account.currency,
          primaryCurrency,
          exchangeRates,
          userId
        );

        if (!distributionByType[accountType]) {
          distributionByType[accountType] = 0;
        }
        distributionByType[accountType] += convertedBalance;
      }

      // Convertir a array y redondear
      const distributionByTypeArray = Object.entries(distributionByType).map(([type, total]) => ({
        type,
        totalConverted: Math.round(total * 100) / 100
      }));

      console.log('📊 [Backend] Distribución por tipo:', distributionByTypeArray.length, 'tipos');

      // 3. CALCULAR DISTRIBUCIÓN POR DIVISA
      const distributionByCurrency = {};

      for (const account of accounts) {
        const currency = account.currency;
        const convertedBalance = await this._convertirAMonedaPrincipal(
          parseFloat(account.current_balance),
          account.currency,
          primaryCurrency,
          exchangeRates,
          userId
        );

        if (!distributionByCurrency[currency]) {
          distributionByCurrency[currency] = 0;
        }
        distributionByCurrency[currency] += convertedBalance;
      }

      // Convertir a array y redondear
      const distributionByCurrencyArray = Object.entries(distributionByCurrency).map(([currency_code, total]) => ({
        currency_code,
        totalConverted: Math.round(total * 100) / 100
      }));

      console.log('💱 [Backend] Distribución por divisa:', distributionByCurrencyArray.length, 'monedas');

      // 4. CALCULAR PATRIMONIO NETO CONSOLIDADO (activos - pasivos)
      let totalActivos = 0;
      let totalPasivos = 0;

      for (const account of accounts) {
        const convertedBalance = await this._convertirAMonedaPrincipal(
          parseFloat(account.current_balance),
          account.currency,
          primaryCurrency,
          exchangeRates,
          userId
        );

        if (account.account_category === 'asset') {
          totalActivos += convertedBalance;
        } else if (account.account_category === 'liability') {
          totalPasivos += Math.abs(convertedBalance);
        }
      }

      const consolidatedTotal = Math.round((totalActivos - totalPasivos) * 100) / 100;

      console.log('💼 [Backend] Total consolidado:', consolidatedTotal, primaryCurrency);

      const resultado = {
        principalAccount,
        distributionByType: distributionByTypeArray,
        distributionByCurrency: distributionByCurrencyArray,
        consolidatedTotal,
        primaryCurrency
      };

      console.log('✅ [Backend] Panel de patrimonio calculado exitosamente');
      return resultado;

    } catch (error) {
      console.error('❌ [Backend] Error al obtener panel de patrimonio:', error);
      if (error.message === 'Configuración de usuario no encontrada') {
        throw error;
      }
      throw new Error('Error interno del servidor al obtener panel de patrimonio');
    }
  }

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
   * @returns {number} - Monto convertido a moneda principal
   */
  async _convertirAMonedaPrincipal(amount, fromCurrency, primaryCurrency, exchangeRates, userId) {
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
      if (exchangeRates && exchangeRates[fromCurrency]) {
        console.warn(`⚠️ Usando fallback para conversión de ${fromCurrency}`);
        return parseFloat(amount) * exchangeRates[fromCurrency];
      }
      
      // Si no hay tasa configurada, tratar como moneda principal
      console.warn(`⚠️ Tasa de cambio no encontrada para ${fromCurrency}. Tratando como ${primaryCurrency}.`);
      return parseFloat(amount);
    }
  }

  /**
   * Obtener información completa de una cuenta (función interna)
   * @private
   * @param {number} userId - ID del usuario
   * @param {number} accountId - ID de la cuenta
   * @param {Object} trx - Transacción de Knex (opcional)
   * @returns {Promise<Object>} - Información completa de la cuenta
   */
  async _obtenerCuentaCompletaPorId(userId, accountId, trx = null) {
    const query = trx || db;
    
    const account = await query('accounts')
      .select([
        'accounts.id',
        'accounts.name',
        'accounts.account_type_id',
        'accounts.account_category',
        'accounts.initial_balance',
        'accounts.current_balance',
        'accounts.currency',
        'accounts.created_at',
        'accounts.updated_at',
        'account_types.name as account_type_name',
        // Incluir información de deuda si aplica
        'debt_details.interest_rate',
        'debt_details.due_date',
        'debt_details.original_amount'
      ])
      .leftJoin('account_types', 'accounts.account_type_id', 'account_types.id')
      .leftJoin('debt_details', 'accounts.id', 'debt_details.account_id')
      .where('accounts.user_id', userId)
      .where('accounts.id', accountId)
      .first();

    if (!account) {
      throw new Error('Cuenta no encontrada');
    }

    return account;
  }

  /**
   * Actualizar el saldo de una cuenta (usado internamente por transacciones)
   * @param {number} userId - ID del usuario
   * @param {number} accountId - ID de la cuenta
   * @param {number} newBalance - Nuevo saldo
   * @param {Object} trx - Transacción de Knex (opcional)
   * @returns {Promise<void>}
   */
  async actualizarSaldoCuenta(userId, accountId, newBalance, trx = null) {
    try {
      const query = trx || db;
      
      const result = await query('accounts')
        .where({ id: accountId, user_id: userId })
        .update({
          current_balance: parseFloat(newBalance),
          updated_at: query.fn.now()
        });

      if (result === 0) {
        throw new Error('Cuenta no encontrada para actualizar saldo');
      }

    } catch (error) {
      if (error.message === 'Cuenta no encontrada para actualizar saldo') {
        throw error;
      }
      throw new Error('Error interno del servidor al actualizar saldo de cuenta');
    }
  }
}

module.exports = new AccountsService();