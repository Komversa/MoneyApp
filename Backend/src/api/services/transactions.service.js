const { db } = require('../../config/db');
const accountsService = require('./accounts.service');
const CurrencyConversionService = require('./CurrencyConversionService');

/**
 * Servicio de transacciones que contiene la lógica de negocio CRÍTICA
 * para el manejo de movimientos financieros y actualización de saldos
 */
class TransactionsService {

  /**
   * Obtener todas las transacciones de un usuario con conversión a moneda principal
   * 🚨 NUEVA FUNCIONALIDAD: Conversión automática a moneda principal del usuario
   * @param {number} userId - ID del usuario
   * @param {Object} filters - Filtros opcionales (fechas, tipos, cuentas)
   * @returns {Promise<Object>} - Objeto con transacciones convertidas y conteo total
   */
  async obtenerTransaccionesPorUsuario(userId, filters = {}) {
    try {
      const { 
        startDate, 
        endDate, 
        type, 
        accountId, 
        categoryId,
        limit = 50,
        offset = 0 
      } = filters;

      // Query base para aplicar filtros
      let baseQuery = db('transactions')
        .where('transactions.user_id', userId);

      // Aplicar filtros al query base
      if (startDate) {
        baseQuery = baseQuery.where('transactions.transaction_date', '>=', startDate);
      }

      if (endDate) {
        baseQuery = baseQuery.where('transactions.transaction_date', '<=', endDate);
      }

      if (type && ['income', 'expense', 'transfer', 'debt_payment'].includes(type)) {
        baseQuery = baseQuery.where('transactions.type', type);
      }

      if (accountId) {
        baseQuery = baseQuery.where(function() {
          this.where('transactions.from_account_id', accountId)
            .orWhere('transactions.to_account_id', accountId);
        });
      }

      if (categoryId) {
        baseQuery = baseQuery.where('transactions.category_id', categoryId);
      }

      // Obtener conteo total
      const totalCount = await baseQuery.clone().count('* as total').first();

      // 🚨 REFACTORIZADO: Query simplificado sin conversión en SQL
      let query = baseQuery.clone()
        .select([
          'transactions.id',
          'transactions.type',
          'transactions.amount',
          'transactions.currency_code',
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
          'from_account.account_category as from_account_category',
          'to_account.name as to_account_name',
          'to_account.currency as to_account_currency',
          'to_account.account_category as to_account_category',
          'user_settings.primary_currency'
        ])
        .leftJoin('categories', 'transactions.category_id', 'categories.id')
        .leftJoin('accounts as from_account', 'transactions.from_account_id', 'from_account.id')
        .leftJoin('accounts as to_account', 'transactions.to_account_id', 'to_account.id')
        .leftJoin('user_settings', 'transactions.user_id', 'user_settings.user_id');

      // Paginación y ordenamiento
      const transactions = await query
        .orderBy('transactions.transaction_date', 'desc')
        .orderBy('transactions.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // 🚨 REFACTORIZADO: Usar CurrencyConversionService para conversiones
      const processedTransactions = await Promise.all(transactions.map(async (transaction) => {
        const originalAmount = parseFloat(transaction.amount);
        const originalCurrency = transaction.currency_code;
        const primaryCurrency = transaction.primary_currency;

        // Usar el nuevo servicio de conversión
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
          from_account_category: transaction.from_account_category,
          to_account_name: transaction.to_account_name,
          to_account_currency: transaction.to_account_currency,
          to_account_category: transaction.to_account_category,

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

      return {
        transactions: processedTransactions,
        totalCount: parseInt(totalCount.total)
      };

    } catch (error) {
      console.error('❌ Error al obtener transacciones con conversión:', error);
      throw new Error('Error interno del servidor al obtener transacciones');
    }
  }

  /**
   * Obtener una transacción específica del usuario
   * @param {number} userId - ID del usuario
   * @param {number} transactionId - ID de la transacción
   * @returns {Promise<Object>} - Información de la transacción
   */
  async obtenerTransaccionPorId(userId, transactionId) {
    try {
      const transaction = await db('transactions')
        .select([
          'transactions.*',
          'categories.name as category_name',
          'categories.type as category_type',
          'from_account.name as from_account_name',
          'from_account.currency as from_account_currency',
          'to_account.name as to_account_name',
          'to_account.currency as to_account_currency'
        ])
        .leftJoin('categories', 'transactions.category_id', 'categories.id')
        .leftJoin('accounts as from_account', 'transactions.from_account_id', 'from_account.id')
        .leftJoin('accounts as to_account', 'transactions.to_account_id', 'to_account.id')
        .where('transactions.user_id', userId)
        .where('transactions.id', transactionId)
        .first();

      if (!transaction) {
        throw new Error('Transacción no encontrada');
      }

      return transaction;
    } catch (error) {
      if (error.message === 'Transacción no encontrada') {
        throw error;
      }
      throw new Error('Error interno del servidor al obtener transacción');
    }
  }

  /**
   * Crear una nueva transacción (FUNCIÓN CRÍTICA CON LÓGICA ATÓMICA)
   * @param {number} userId - ID del usuario
   * @param {Object} transactionData - Datos de la transacción
   * @returns {Promise<Object>} - Transacción creada
   */
  async crearTransaccionParaUsuario(userId, transactionData) {
    return await db.transaction(async (trx) => {
      try {
        const {
          type,
          amount,
          transactionDate,
          categoryId,
          fromAccountId,
          toAccountId,
          description
        } = transactionData;

        // Validar que el amount sea positivo
        if (amount <= 0) {
          throw new Error('El monto debe ser mayor a cero');
        }

        // Validar estructura según el tipo de transacción
        await this._validarEstructuraTransaccion(userId, type, fromAccountId, toAccountId, categoryId, trx);

        // Obtener saldos actuales de las cuentas involucradas
        const accountUpdates = await this._calcularActualizacionesSaldo(
          userId, type, amount, fromAccountId, toAccountId, trx
        );

        // 🚨 NUEVO: Determinar la moneda de la transacción
        let transactionCurrency = 'USD'; // Valor por defecto
        
        if (type === 'expense' && fromAccountId) {
          // Para gastos: usar la moneda de la cuenta de origen
          const fromAccount = await trx('accounts')
            .select('currency')
            .where({ id: fromAccountId, user_id: userId })
            .first();
          transactionCurrency = fromAccount?.currency || 'USD';
        } else if (type === 'income' && toAccountId) {
          // Para ingresos: usar la moneda de la cuenta de destino
          const toAccount = await trx('accounts')
            .select('currency')
            .where({ id: toAccountId, user_id: userId })
            .first();
          transactionCurrency = toAccount?.currency || 'USD';
        } else if ((type === 'transfer' || type === 'debt_payment') && fromAccountId) {
          // Para transferencias y pagos de deuda: usar la moneda de la cuenta de origen (el monto se envía desde ahí)
          const fromAccount = await trx('accounts')
            .select('currency')
            .where({ id: fromAccountId, user_id: userId })
            .first();
          transactionCurrency = fromAccount?.currency || 'USD';
        }

        // Crear la transacción
        const [newTransaction] = await trx('transactions')
          .insert({
            user_id: userId,
            type,
            amount: parseFloat(amount),
            currency_code: transactionCurrency,  // 🚨 NUEVO: Campo de moneda
            transaction_date: transactionDate,
            category_id: categoryId || null,
            from_account_id: fromAccountId || null,
            to_account_id: toAccountId || null,
            description: description || null
          })
          .returning(['id', 'type', 'amount', 'currency_code', 'transaction_date', 'description', 'created_at']);

        // Aplicar las actualizaciones de saldo
        for (const update of accountUpdates) {
          await accountsService.actualizarSaldoCuenta(
            userId, update.accountId, update.newBalance, trx
          );
        }

        // Obtener la transacción completa creada
        const completeTransaction = await this._obtenerTransaccionCompletaPorId(
          userId, newTransaction.id, trx
        );

        return completeTransaction;

      } catch (error) {
        // El rollback es automático si hay error en la transacción
        throw error;
      }
    });
  }

  /**
   * Actualizar una transacción existente (FUNCIÓN CRÍTICA CON LÓGICA ATÓMICA)
   * @param {number} userId - ID del usuario
   * @param {number} transactionId - ID de la transacción
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} - Transacción actualizada
   */
  async actualizarTransaccion(userId, transactionId, updateData) {
    return await db.transaction(async (trx) => {
      try {
        // Obtener la transacción original
        const originalTransaction = await this._obtenerTransaccionCompletaPorId(
          userId, transactionId, trx
        );

        const {
          type = originalTransaction.type,
          amount = originalTransaction.amount,
          transactionDate = originalTransaction.transaction_date,
          categoryId = originalTransaction.category_id,
          fromAccountId = originalTransaction.from_account_id,
          toAccountId = originalTransaction.to_account_id,
          description = originalTransaction.description
        } = updateData;

        // Validar que el amount sea positivo
        if (amount <= 0) {
          throw new Error('El monto debe ser mayor a cero');
        }

        // Validar estructura según el tipo de transacción
        await this._validarEstructuraTransaccion(userId, type, fromAccountId, toAccountId, categoryId, trx);

        // PASO 1: Revertir el efecto de la transacción original
        const revertUpdates = await this._calcularReversionSaldo(
          userId, originalTransaction, trx
        );

        for (const update of revertUpdates) {
          await accountsService.actualizarSaldoCuenta(
            userId, update.accountId, update.newBalance, trx
          );
        }

        // PASO 2: Aplicar el efecto de la nueva transacción
        const newUpdates = await this._calcularActualizacionesSaldo(
          userId, type, amount, fromAccountId, toAccountId, trx
        );

        for (const update of newUpdates) {
          await accountsService.actualizarSaldoCuenta(
            userId, update.accountId, update.newBalance, trx
          );
        }

        // 🚨 NUEVO: Determinar la moneda de la transacción actualizada
        let transactionCurrency = 'USD'; // Valor por defecto
        
        if (type === 'expense' && fromAccountId) {
          // Para gastos: usar la moneda de la cuenta de origen
          const fromAccount = await trx('accounts')
            .select('currency')
            .where({ id: fromAccountId, user_id: userId })
            .first();
          transactionCurrency = fromAccount?.currency || 'USD';
        } else if (type === 'income' && toAccountId) {
          // Para ingresos: usar la moneda de la cuenta de destino
          const toAccount = await trx('accounts')
            .select('currency')
            .where({ id: toAccountId, user_id: userId })
            .first();
          transactionCurrency = toAccount?.currency || 'USD';
        } else if (type === 'transfer' && fromAccountId) {
          // Para transferencias: usar la moneda de la cuenta de origen
          const fromAccount = await trx('accounts')
            .select('currency')
            .where({ id: fromAccountId, user_id: userId })
            .first();
          transactionCurrency = fromAccount?.currency || 'USD';
        }

        // PASO 3: Actualizar la transacción
        await trx('transactions')
          .where({ id: transactionId, user_id: userId })
          .update({
            type,
            amount: parseFloat(amount),
            currency_code: transactionCurrency,  // 🚨 NUEVO: Campo de moneda
            transaction_date: transactionDate,
            category_id: categoryId || null,
            from_account_id: fromAccountId || null,
            to_account_id: toAccountId || null,
            description: description || null,
            updated_at: trx.fn.now()
          });

        // Obtener la transacción actualizada
        const updatedTransaction = await this._obtenerTransaccionCompletaPorId(
          userId, transactionId, trx
        );

        return updatedTransaction;

      } catch (error) {
        throw error;
      }
    });
  }

  /**
   * Eliminar una transacción (FUNCIÓN CRÍTICA CON LÓGICA ATÓMICA)
   * @param {number} userId - ID del usuario
   * @param {number} transactionId - ID de la transacción
   * @returns {Promise<void>}
   */
  async eliminarTransaccion(userId, transactionId) {
    return await db.transaction(async (trx) => {
      try {
        // Obtener la transacción a eliminar
        const transaction = await this._obtenerTransaccionCompletaPorId(
          userId, transactionId, trx
        );

        // Revertir el efecto de la transacción en los saldos
        const revertUpdates = await this._calcularReversionSaldo(userId, transaction, trx);

        for (const update of revertUpdates) {
          await accountsService.actualizarSaldoCuenta(
            userId, update.accountId, update.newBalance, trx
          );
        }

        // Eliminar la transacción
        await trx('transactions')
          .where({ id: transactionId, user_id: userId })
          .del();

      } catch (error) {
        throw error;
      }
    });
  }

  /**
   * ===========================================
   * MÉTODOS PRIVADOS DE VALIDACIÓN Y CÁLCULO
   * ===========================================
   */

  /**
   * Validar la estructura de una transacción según su tipo
   * @private
   */
  async _validarEstructuraTransaccion(userId, type, fromAccountId, toAccountId, categoryId, trx) {
    // Validar tipo de transacción
    if (!['income', 'expense', 'transfer', 'debt_payment'].includes(type)) {
      throw new Error('Tipo de transacción inválido');
    }

    // Validar estructura según tipo
    if (type === 'expense') {
      if (!fromAccountId || toAccountId) {
        throw new Error('Los gastos requieren cuenta de origen y no cuenta de destino');
      }
    } else if (type === 'income') {
      if (fromAccountId || !toAccountId) {
        throw new Error('Los ingresos requieren cuenta de destino y no cuenta de origen');
      }
    } else if (type === 'transfer') {
      if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
        throw new Error('Las transferencias requieren cuentas de origen y destino diferentes');
      }
    } else if (type === 'debt_payment') {
      // Pago de deuda es como una transferencia: desde activo hacia pasivo
      if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
        throw new Error('Los pagos de deuda requieren cuenta de origen (activo) y cuenta de destino (pasivo) diferentes');
      }
      
      // Validar que la cuenta de destino sea una deuda (liability)
      const toAccount = await trx('accounts')
        .where({ id: toAccountId, user_id: userId })
        .first();
      
      if (!toAccount || toAccount.account_category !== 'liability') {
        throw new Error('Los pagos de deuda solo pueden realizarse hacia cuentas de tipo pasivo (deudas)');
      }
    }

    // Validar que las cuentas pertenecen al usuario
    if (fromAccountId) {
      const fromAccount = await trx('accounts')
        .where({ id: fromAccountId, user_id: userId })
        .first();
      if (!fromAccount) {
        throw new Error('Cuenta de origen no válida');
      }
    }

    if (toAccountId) {
      const toAccount = await trx('accounts')
        .where({ id: toAccountId, user_id: userId })
        .first();
      if (!toAccount) {
        throw new Error('Cuenta de destino no válida');
      }
    }

    // Validar categoría si se proporciona
    if (categoryId) {
      const category = await trx('categories')
        .where({ id: categoryId, user_id: userId })
        .first();
      if (!category) {
        throw new Error('Categoría no válida');
      }

      // Validar que el tipo de categoría coincida con el tipo de transacción
      if ((type === 'income' && category.type !== 'income') ||
          (type === 'expense' && category.type !== 'expense')) {
        throw new Error('El tipo de categoría no coincide con el tipo de transacción');
      }
    }
  }

  /**
   * Calcular las actualizaciones de saldo necesarias para una nueva transacción
   * @private
   */
  async _calcularActualizacionesSaldo(userId, type, amount, fromAccountId, toAccountId, trx) {
    const updates = [];

    if (type === 'expense') {
      // Restar del saldo de la cuenta de origen
      const fromAccount = await trx('accounts')
        .where({ id: fromAccountId, user_id: userId })
        .first();
      
      const newBalance = parseFloat(fromAccount.current_balance) - parseFloat(amount);
      updates.push({ accountId: fromAccountId, newBalance });

    } else if (type === 'income') {
      // Sumar al saldo de la cuenta de destino
      const toAccount = await trx('accounts')
        .where({ id: toAccountId, user_id: userId })
        .first();
      
      const newBalance = parseFloat(toAccount.current_balance) + parseFloat(amount);
      updates.push({ accountId: toAccountId, newBalance });

    } else if (type === 'transfer' || type === 'debt_payment') {
      // Obtener datos completos de las cuentas de origen y destino
      const [fromAccount, toAccount] = await Promise.all([
        trx('accounts').where({ id: fromAccountId, user_id: userId }).first(),
        trx('accounts').where({ id: toAccountId, user_id: userId }).first()
      ]);

      // Verificar si las monedas son diferentes
      if (fromAccount.currency === toAccount.currency) {
        // Transferencia entre cuentas de la misma moneda (lógica original)
        const fromNewBalance = parseFloat(fromAccount.current_balance) - parseFloat(amount);
        const toNewBalance = parseFloat(toAccount.current_balance) + parseFloat(amount);

        updates.push(
          { accountId: fromAccountId, newBalance: fromNewBalance },
          { accountId: toAccountId, newBalance: toNewBalance }
        );
      } else {
        // Transferencia entre cuentas de diferentes monedas (nueva lógica multi-moneda escalable)
        // Obtener configuración del usuario y todas sus tasas de cambio
        const [userSettings, exchangeRates] = await Promise.all([
          trx('user_settings').where({ user_id: userId }).first(),
          this._obtenerTasasCambioUsuario(userId, trx)
        ]);

        if (!userSettings) {
          throw new Error('Configuración de usuario no encontrada');
        }

        const primaryCurrency = userSettings.primary_currency;

        // Calcular el monto recibido usando conversión a través de moneda principal
        const montoRecibido = this._convertirEntreMonedas(
          parseFloat(amount),
          fromAccount.currency,
          toAccount.currency,
          primaryCurrency,
          exchangeRates
        );

        if (montoRecibido === null) {
          throw new Error(`No se puede convertir de ${fromAccount.currency} a ${toAccount.currency}. Verifique las tasas de cambio configuradas.`);
        }

        // Actualizar saldos con conversión
        const fromNewBalance = parseFloat(fromAccount.current_balance) - parseFloat(amount);
        const toNewBalance = parseFloat(toAccount.current_balance) + montoRecibido;

        updates.push(
          { accountId: fromAccountId, newBalance: fromNewBalance, originalAmount: parseFloat(amount) },
          { accountId: toAccountId, newBalance: toNewBalance, convertedAmount: montoRecibido }
        );
      }
    }

    return updates;
  }

  /**
   * Calcular las reversiones de saldo para una transacción eliminada/actualizada
   * @private
   */
  async _calcularReversionSaldo(userId, transaction, trx) {
    const updates = [];
    const { type, amount, from_account_id, to_account_id } = transaction;

    if (type === 'expense') {
      // Sumar de vuelta a la cuenta de origen
      const fromAccount = await trx('accounts')
        .where({ id: from_account_id, user_id: userId })
        .first();
      
      const newBalance = parseFloat(fromAccount.current_balance) + parseFloat(amount);
      updates.push({ accountId: from_account_id, newBalance });

    } else if (type === 'income') {
      // Restar de la cuenta de destino
      const toAccount = await trx('accounts')
        .where({ id: to_account_id, user_id: userId })
        .first();
      
      const newBalance = parseFloat(toAccount.current_balance) - parseFloat(amount);
      updates.push({ accountId: to_account_id, newBalance });

    } else if (type === 'transfer' || type === 'debt_payment') {
      // Obtener datos completos de las cuentas de origen y destino
      const [fromAccount, toAccount] = await Promise.all([
        trx('accounts').where({ id: from_account_id, user_id: userId }).first(),
        trx('accounts').where({ id: to_account_id, user_id: userId }).first()
      ]);

      // Verificar si las monedas son diferentes
      if (fromAccount.currency === toAccount.currency) {
        // Reversión de transferencia entre cuentas de la misma moneda (lógica original)
        const fromNewBalance = parseFloat(fromAccount.current_balance) + parseFloat(amount);
        const toNewBalance = parseFloat(toAccount.current_balance) - parseFloat(amount);

        updates.push(
          { accountId: from_account_id, newBalance: fromNewBalance },
          { accountId: to_account_id, newBalance: toNewBalance }
        );
      } else {
        // Reversión de transferencia entre cuentas de diferentes monedas (nueva lógica multi-moneda escalable)
        // Obtener configuración del usuario y todas sus tasas de cambio
        const [userSettings, exchangeRates] = await Promise.all([
          trx('user_settings').where({ user_id: userId }).first(),
          this._obtenerTasasCambioUsuario(userId, trx)
        ]);

        if (!userSettings) {
          throw new Error('Configuración de usuario no encontrada');
        }

        const primaryCurrency = userSettings.primary_currency;

        // Calcular el monto que se había recibido originalmente usando conversión a través de moneda principal
        const montoRecibidoOriginal = this._convertirEntreMonedas(
          parseFloat(amount),
          fromAccount.currency,
          toAccount.currency,
          primaryCurrency,
          exchangeRates
        );

        if (montoRecibidoOriginal === null) {
          throw new Error(`No se puede revertir la conversión de ${fromAccount.currency} a ${toAccount.currency}. Verifique las tasas de cambio configuradas.`);
        }

        // Revertir los saldos: sumar de vuelta el monto original enviado y restar el monto convertido recibido
        const fromNewBalance = parseFloat(fromAccount.current_balance) + parseFloat(amount);
        const toNewBalance = parseFloat(toAccount.current_balance) - montoRecibidoOriginal;

        updates.push(
          { accountId: from_account_id, newBalance: fromNewBalance },
          { accountId: to_account_id, newBalance: toNewBalance }
        );
      }
    }

    return updates;
  }

  /**
   * Obtener transacción completa por ID dentro de una transacción
   * @private
   */
  async _obtenerTransaccionCompletaPorId(userId, transactionId, trx) {
    const transaction = await trx('transactions')
      .select([
        'transactions.*',
        'categories.name as category_name',
        'categories.type as category_type',
        'from_account.name as from_account_name',
        'from_account.currency as from_account_currency',
        'to_account.name as to_account_name',
        'to_account.currency as to_account_currency'
      ])
      .leftJoin('categories', 'transactions.category_id', 'categories.id')
      .leftJoin('accounts as from_account', 'transactions.from_account_id', 'from_account.id')
      .leftJoin('accounts as to_account', 'transactions.to_account_id', 'to_account.id')
      .where('transactions.user_id', userId)
      .where('transactions.id', transactionId)
      .first();

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    return transaction;
  }

  /**
   * Obtener estadísticas de transacciones para el Dashboard con conversión a moneda principal
   * 🚨 CORREGIDO: Ahora convierte cada transacción a la moneda principal antes de sumar
   * @param {number} userId - ID del usuario
   * @param {string} period - Período ('month', 'year', etc.)
   * @returns {Promise<Object>} - Estadísticas de transacciones convertidas a moneda principal
   */
  async obtenerEstadisticasTransacciones(userId, period = 'month') {
    try {
      const startDate = this._getStartDateForPeriod(period);

      // Obtener la moneda principal del usuario
      const userSettings = await db('user_settings')
        .select('primary_currency')
        .where({ user_id: userId })
        .first();
      
      if (!userSettings) {
        throw new Error('Configuración de usuario no encontrada');
      }
      
      const primaryCurrency = userSettings.primary_currency;

      // Obtener todas las transacciones del período con sus monedas
      const transactions = await db('transactions')
        .select([
          'transactions.type',
          'transactions.amount',
          'transactions.currency_code'
        ])
        .where('user_id', userId)
        .where('transaction_date', '>=', startDate);

      // Inicializar totales
      let totalIngresos = 0;
      let totalGastos = 0;

      // Procesar cada transacción y convertir a moneda principal
      for (const transaction of transactions) {
        const originalAmount = parseFloat(transaction.amount);
        const originalCurrency = transaction.currency_code;

        // Convertir a moneda principal usando CurrencyConversionService
        let convertedAmount = originalAmount;
        
        if (originalCurrency && originalCurrency !== primaryCurrency) {
          try {
            const conversionResult = await CurrencyConversionService.convert({
              amount: originalAmount,
              fromCurrency: originalCurrency,
              toCurrency: primaryCurrency,
              userId: userId
            });
            
            convertedAmount = conversionResult.convertedAmount;
            console.log(`🔄 Conversión: ${originalAmount} ${originalCurrency} = ${convertedAmount} ${primaryCurrency}`);
          } catch (conversionError) {
            console.error(`❌ Error convirtiendo ${originalAmount} ${originalCurrency}:`, conversionError.message);
            // Si falla la conversión, usar el monto original
            convertedAmount = originalAmount;
          }
        }

        // Acumular en el total correspondiente
        if (transaction.type === 'income') {
          totalIngresos += convertedAmount;
        } else if (transaction.type === 'expense') {
          totalGastos += convertedAmount;
        }
        // Las transferencias no afectan el balance neto
      }

      // Redondear a 2 decimales
      totalIngresos = Math.round(totalIngresos * 100) / 100;
      totalGastos = Math.round(totalGastos * 100) / 100;
      const balance = totalIngresos - totalGastos;

      console.log(`📊 Estadísticas calculadas para período ${period}:`);
      console.log(`   Ingresos: ${totalIngresos} ${primaryCurrency}`);
      console.log(`   Gastos: ${totalGastos} ${primaryCurrency}`);
      console.log(`   Balance: ${balance} ${primaryCurrency}`);

      return {
        period,
        startDate,
        totalIngresos,
        totalGastos,
        balance,
        primaryCurrency
      };

    } catch (error) {
      console.error('❌ Error en obtenerEstadisticasTransacciones:', error);
      throw new Error('Error interno del servidor al obtener estadísticas');
    }
  }

  /**
   * Obtener resumen de transacciones para el dashboard con conversión a moneda principal
   * 🚨 CORREGIDO: Ahora convierte cada transacción a la moneda principal antes de sumar
   * @param {number} userId - ID del usuario
   * @param {Object} filters - Filtros opcionales (startDate, endDate)
   * @returns {Promise<Object>} - Resumen con totales convertidos a moneda principal
   */
  async obtenerResumenTransacciones(userId, filters = {}) {
    try {
      const { startDate, endDate, type, accountId, categoryId } = filters;
      
      // Obtener la moneda principal del usuario
      const userSettings = await db('user_settings')
        .select('primary_currency')
        .where({ user_id: userId })
        .first();
      
      if (!userSettings) {
        throw new Error('Configuración de usuario no encontrada');
      }
      
      const primaryCurrency = userSettings.primary_currency;
      console.log(`💰 [Resumen] Moneda principal: ${primaryCurrency}`);
      
      // Construir la consulta base usando currency_code de la transacción
      let query = db('transactions')
        .select([
          'transactions.type',
          'transactions.amount',
          'transactions.currency_code'  // 🚨 NUEVO: Usar currency_code de la transacción
        ])
        .where('transactions.user_id', userId);
      
      // Aplicar filtros de fecha si existen
      if (startDate) {
        query = query.where('transactions.transaction_date', '>=', startDate);
      }
      
      if (endDate) {
        query = query.where('transactions.transaction_date', '<=', endDate);
      }

      // Aplicar filtro de tipo de transacción
      if (type && ['income', 'expense', 'transfer', 'debt_payment'].includes(type)) {
        query = query.where('transactions.type', type);
      }

      // Aplicar filtro de cuenta
      if (accountId) {
        query = query.where(function() {
          this.where('transactions.from_account_id', accountId)
            .orWhere('transactions.to_account_id', accountId);
        });
      }

      // Aplicar filtro de categoría
      if (categoryId) {
        query = query.where('transactions.category_id', categoryId);
      }
      
      const transactions = await query;
      console.log(`📊 [Resumen] Transacciones encontradas: ${transactions.length}`);
      
      // Inicializar totales
      let totalIncome = 0;
      let totalExpenses = 0;
      
      // Procesar cada transacción y convertir a moneda principal
      for (const transaction of transactions) {
        const originalAmount = parseFloat(transaction.amount);
        const originalCurrency = transaction.currency_code;

        // Convertir a moneda principal usando CurrencyConversionService
        let convertedAmount = originalAmount;
        
        if (originalCurrency && originalCurrency !== primaryCurrency) {
          try {
            const conversionResult = await CurrencyConversionService.convert({
              amount: originalAmount,
              fromCurrency: originalCurrency,
              toCurrency: primaryCurrency,
              userId: userId
            });
            
            convertedAmount = conversionResult.convertedAmount;
            console.log(`🔄 [Resumen] Conversión: ${originalAmount} ${originalCurrency} = ${convertedAmount} ${primaryCurrency}`);
          } catch (conversionError) {
            console.error(`❌ [Resumen] Error convirtiendo ${originalAmount} ${originalCurrency}:`, conversionError.message);
            // Si falla la conversión, usar el monto original
            convertedAmount = originalAmount;
          }
        }

        // Acumular en el total correspondiente
        if (transaction.type === 'income') {
          totalIncome += convertedAmount;
        } else if (transaction.type === 'expense') {
          totalExpenses += convertedAmount;
        }
        // Las transferencias no afectan el balance neto
      }
      
      // Redondear a 2 decimales
      totalIncome = Math.round(totalIncome * 100) / 100;
      totalExpenses = Math.round(totalExpenses * 100) / 100;
      const balanceNeto = totalIncome - totalExpenses;
      
      console.log(`📊 [Resumen] Totales calculados:`);
      console.log(`   Ingresos: ${totalIncome} ${primaryCurrency}`);
      console.log(`   Gastos: ${totalExpenses} ${primaryCurrency}`);
      console.log(`   Balance: ${balanceNeto} ${primaryCurrency}`);
      
      const summary = {
        totalIncome,
        totalExpenses,
        balanceNeto,
        primaryCurrency: primaryCurrency
      };
      
      return {
        summary: summary
      };
      
    } catch (error) {
      console.error('❌ [Resumen] Error en obtenerResumenTransacciones:', error);
      throw new Error('Error interno del servidor al obtener resumen de transacciones');
    }
  }

  /**
   * Obtener fecha de inicio para un período
   * @private
   */
  _getStartDateForPeriod(period) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    switch (period) {
      case 'month':
        return new Date(year, month, 1);
      case 'year':
        return new Date(year, 0, 1);
      default:
        return new Date(year, month, 1);
    }
  }

  /**
   * Obtener todas las tasas de cambio de un usuario en un mapa
   * @private
   * @param {number} userId - ID del usuario
   * @param {Object} trx - Transacción de Knex (opcional)
   * @returns {Promise<Object>} - Mapa de tasas { 'USD': 1.0, 'NIO': 0.0274 }
   */
  async _obtenerTasasCambioUsuario(userId, trx = null) {
    const CurrencyConversionService = require('./CurrencyConversionService');
    const tasas = await CurrencyConversionService.getUserExchangeRates(userId);

    const tasasMap = {};
    tasas.forEach(tasa => {
      tasasMap[tasa.currency_code] = parseFloat(tasa.rate_to_usd);
    });

    return tasasMap;
  }

  /**
   * Convertir entre dos monedas usando la moneda principal como intermediaria
   * @private
   * @param {number} amount - Monto a convertir
   * @param {string} fromCurrency - Moneda origen
   * @param {string} toCurrency - Moneda destino
   * @param {string} primaryCurrency - Moneda principal del usuario
   * @param {Object} exchangeRates - Mapa de tasas de cambio
   * @returns {number|null} - Monto convertido o null si no es posible
   */
  _convertirEntreMonedas(amount, fromCurrency, toCurrency, primaryCurrency, exchangeRates) {
    // LOGGING DETALLADO PARA DEBUGGING DE CONVERSIONES NIO-USD
    // Si es la misma moneda, no hay conversión
    if (fromCurrency === toCurrency) {
      return parseFloat(amount);
    }

    // Si alguna de las monedas es la principal, conversión directa
    if (fromCurrency === primaryCurrency && exchangeRates[toCurrency]) {
      // De moneda principal a otra: dividir por la tasa
      const resultado = parseFloat(amount) / exchangeRates[toCurrency];
      return resultado;
    }

    if (toCurrency === primaryCurrency && exchangeRates[fromCurrency]) {
      // De otra moneda a principal: multiplicar por la tasa
      const resultado = parseFloat(amount) * exchangeRates[fromCurrency];
      return resultado;
    }

    // Conversión indirecta: fromCurrency -> primaryCurrency -> toCurrency
    if (exchangeRates[fromCurrency] && exchangeRates[toCurrency]) {
      // Convertir a moneda principal
      const amountInPrimary = parseFloat(amount) * exchangeRates[fromCurrency];
      // Convertir de moneda principal a destino
      const resultado = amountInPrimary / exchangeRates[toCurrency];
      return resultado;
    }

    // No se puede convertir
    return null;
  }

  /**
   * Exportar transacciones a Excel
   * @param {number} userId - ID del usuario
   * @param {Object} filters - Filtros de exportación (startDate, endDate, type)
   * @returns {Promise<Buffer>} - Buffer del archivo Excel
   */
  async exportarTransaccionesAExcel(userId, filters = {}) {
    try {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Transacciones');

      // Obtener transacciones con los filtros aplicados
      const { startDate, endDate, type } = filters;
      
      // Query base para aplicar filtros
      let query = db('transactions')
        .where('transactions.user_id', userId)
        .select([
          'transactions.id',
          'transactions.type',
          'transactions.amount',
          'transactions.currency_code',
          'transactions.transaction_date',
          'transactions.description',
          'transactions.category_id',
          'transactions.from_account_id',
          'transactions.to_account_id',
          'categories.name as category_name',
          'from_account.name as from_account_name',
          'to_account.name as to_account_name',
          'user_settings.primary_currency'
        ])
        .leftJoin('categories', 'transactions.category_id', 'categories.id')
        .leftJoin('accounts as from_account', 'transactions.from_account_id', 'from_account.id')
        .leftJoin('accounts as to_account', 'transactions.to_account_id', 'to_account.id')
        .leftJoin('user_settings', 'transactions.user_id', 'user_settings.user_id')
        .orderBy('transactions.transaction_date', 'desc')
        .orderBy('transactions.created_at', 'desc');

      // Aplicar filtros
      if (startDate) {
        query = query.where('transactions.transaction_date', '>=', startDate);
      }

      if (endDate) {
        query = query.where('transactions.transaction_date', '<=', endDate);
      }

      if (type && ['income', 'expense', 'transfer', 'debt_payment'].includes(type)) {
        query = query.where('transactions.type', type);
      }

      const transactions = await query;

      // Calcular totales del período
      let totalIncome = 0;
      let totalExpenses = 0;
      const primaryCurrency = transactions[0]?.primary_currency || 'USD';

      // Obtener tasas de cambio del usuario
      const exchangeRates = await this._obtenerTasasCambioUsuario(userId);

      // Procesar transacciones y calcular totales
      const processedTransactions = transactions.map(transaction => {
        const amount = parseFloat(transaction.amount);
        const originalCurrency = transaction.currency_code;
        
        // 🚨 CORRECCIÓN: Convertir TODAS las transacciones a USD para cálculos consistentes
        let convertedAmountUSD = amount;
        
        // Si la moneda original no es USD, convertir usando la tasa de cambio
        if (originalCurrency !== 'USD' && exchangeRates[originalCurrency]) {
          // La tasa de cambio está en "rate_to_usd", así que multiplicamos para convertir a USD
          convertedAmountUSD = amount * exchangeRates[originalCurrency];
        } else if (originalCurrency === 'USD') {
          // Si ya es USD, mantener el valor original
          convertedAmountUSD = amount;
        } else {
          // Si no hay tasa de cambio disponible, usar el valor original y loggear
          console.warn(`⚠️ No se encontró tasa de cambio para ${originalCurrency}, usando valor original`);
          convertedAmountUSD = amount;
        }

        // Acumular totales en USD
        if (transaction.type === 'income') {
          totalIncome += convertedAmountUSD;
        } else if (transaction.type === 'expense') {
          totalExpenses += convertedAmountUSD;
        }

        return {
          ...transaction,
          converted_amount_usd: convertedAmountUSD,
          original_amount: amount,
          original_currency: originalCurrency
        };
      });

      const balanceNeto = totalIncome - totalExpenses;

      // Configurar estilos del Excel
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };

      const summaryStyle = {
        font: { bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } }
      };

      const positiveStyle = {
        font: { color: { argb: '008000' } }
      };

      const negativeStyle = {
        font: { color: { argb: 'FF0000' } }
      };

      // Agregar resumen (filas 1-3) - Indicar que los valores están en USD
      worksheet.addRow(['Total Ingresos del Período (USD)', totalIncome.toFixed(2)]);
      worksheet.addRow(['Total Gastos del Período (USD)', totalExpenses.toFixed(2)]);
      worksheet.addRow(['Balance del Período (USD)', balanceNeto.toFixed(2)]);

      // Aplicar estilos al resumen
      worksheet.getRow(1).getCell(1).style = summaryStyle;
      worksheet.getRow(1).getCell(2).style = { ...summaryStyle, ...positiveStyle };
      worksheet.getRow(2).getCell(1).style = summaryStyle;
      worksheet.getRow(2).getCell(2).style = { ...summaryStyle, ...negativeStyle };
      worksheet.getRow(3).getCell(1).style = summaryStyle;
      worksheet.getRow(3).getCell(2).style = { 
        ...summaryStyle, 
        ...(balanceNeto >= 0 ? positiveStyle : negativeStyle) 
      };

      // Fila vacía
      worksheet.addRow([]);

      // Nota informativa sobre conversión de monedas
      worksheet.addRow(['Nota: Los totales mostrados están convertidos a USD usando las tasas de cambio del usuario']);
      worksheet.getRow(5).getCell(1).style = { font: { italic: true, color: { argb: '666666' } } };

      // Fila vacía
      worksheet.addRow([]);

      // Agregar cabeceras (fila 7)
      const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto Original', 'Moneda Original', 'Monto USD', 'Cuenta'];
      worksheet.addRow(headers);

      // Aplicar estilo a las cabeceras
      const headerRow = worksheet.getRow(7);
      headerRow.eachCell((cell) => {
        cell.style = headerStyle;
      });

      // Agregar datos de transacciones
      processedTransactions.forEach(transaction => {
        const row = worksheet.addRow([
          new Date(transaction.transaction_date).toLocaleDateString('es-ES'),
          transaction.description || 'Sin descripción',
          transaction.category_name || 'Sin categoría',
          this._getTransactionTypeLabel(transaction.type),
          transaction.original_amount.toFixed(2),
          transaction.original_currency,
          transaction.converted_amount_usd.toFixed(2),
          this._getAccountInfo(transaction)
        ]);

        // Aplicar color según el tipo de transacción (monto original y USD)
        const originalAmountCell = row.getCell(5);
        const usdAmountCell = row.getCell(7);
        
        if (transaction.type === 'income') {
          originalAmountCell.style = positiveStyle;
          usdAmountCell.style = positiveStyle;
        } else if (transaction.type === 'expense') {
          originalAmountCell.style = negativeStyle;
          usdAmountCell.style = negativeStyle;
        }
      });

      // Ajustar ancho de columnas
      worksheet.getColumn(1).width = 12; // Fecha
      worksheet.getColumn(2).width = 30; // Descripción
      worksheet.getColumn(3).width = 20; // Categoría
      worksheet.getColumn(4).width = 12; // Tipo
      worksheet.getColumn(5).width = 15; // Monto Original
      worksheet.getColumn(6).width = 15; // Moneda Original
      worksheet.getColumn(7).width = 15; // Monto USD
      worksheet.getColumn(8).width = 25; // Cuenta

      // Generar buffer del archivo
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;

    } catch (error) {
      console.error('❌ [Exportación] Error al exportar transacciones a Excel:', error);
      throw new Error('Error interno del servidor al exportar transacciones');
    }
  }

  /**
   * Obtener información de cuenta para la exportación
   * @private
   * @param {Object} transaction - Transacción
   * @returns {string} - Información de cuenta formateada
   */
  _getAccountInfo(transaction) {
    if (transaction.type === 'expense') {
      return transaction.from_account_name || 'Sin cuenta';
    } else if (transaction.type === 'income') {
      return transaction.to_account_name || 'Sin cuenta';
    } else if (transaction.type === 'transfer' || transaction.type === 'debt_payment') {
      return `${transaction.from_account_name || 'Sin cuenta'} → ${transaction.to_account_name || 'Sin cuenta'}`;
    }
    return 'Sin cuenta';
  }

  /**
   * Obtener label del tipo de transacción para la exportación
   * @private
   * @param {string} type - Tipo de transacción
   * @returns {string} - Label formateado
   */
  _getTransactionTypeLabel(type) {
    const typeLabels = {
      'income': 'Ingreso',
      'expense': 'Gasto',
      'transfer': 'Transferencia',
      'debt_payment': 'Pago de Deuda'
    };
    return typeLabels[type] || 'Desconocido';
  }
}

module.exports = new TransactionsService();