/**
 * Seeder para cuentas y transacciones de ejemplo
 * Crea cuentas de muestra y transacciones para facilitar las pruebas
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Solo ejecutar en entorno de desarrollo
  if (process.env.NODE_ENV === 'production') {
    console.log('🚫 Seeder de cuentas omitido: No se ejecuta en producción');
    return;
  }

  try {
    console.log('🏦 Ejecutando seeder de cuentas y transacciones...');

    // Buscar usuario de ejemplo
    const exampleUser = await knex('users')
      .where({ email: 'admin@example.com' })
      .first();

    if (!exampleUser) {
      console.log('⚠️  Usuario admin@example.com no encontrado. Saltando seeder.');
      return;
    }

    const userId = exampleUser.id;

    // Obtener tipos de cuenta y categorías existentes
    const [bankType, cashType, savingsType] = await Promise.all([
      knex('account_types').where({ user_id: userId, name: 'Banco' }).first(),
      knex('account_types').where({ user_id: userId, name: 'Efectivo' }).first(),
      knex('account_types').where({ user_id: userId, name: 'Cuenta de Ahorros' }).first()
    ]);

    if (!bankType || !cashType || !savingsType) {
      console.log('⚠️  Tipos de cuenta no encontrados. Ejecute primero el seeder 001_initial_data.js');
      return;
    }

    // Obtener algunas categorías
    const [salaryCategory, foodCategory, transportCategory] = await Promise.all([
      knex('categories').where({ user_id: userId, name: 'Salario', type: 'income' }).first(),
      knex('categories').where({ user_id: userId, name: 'Comida', type: 'expense' }).first(),
      knex('categories').where({ user_id: userId, name: 'Transporte', type: 'expense' }).first()
    ]);

    // Limpiar datos existentes
    await knex('transactions').where({ user_id: userId }).del();
    await knex('accounts').where({ user_id: userId }).del();

    /**
     * CREAR CUENTAS DE EJEMPLO
     */
    const accountsData = [
      {
        user_id: userId,
        name: 'BAC Córdobas',
        account_type_id: bankType.id,
        initial_balance: 15000.00,
        current_balance: 15000.00,
        currency: 'NIO'
      },
      {
        user_id: userId,
        name: 'Lafise Dólar',
        account_type_id: bankType.id,
        initial_balance: 500.00,
        current_balance: 500.00,
        currency: 'USD'
      },
      {
        user_id: userId,
        name: 'Efectivo Billetera',
        account_type_id: cashType.id,
        initial_balance: 2000.00,
        current_balance: 2000.00,
        currency: 'NIO'
      },
      {
        user_id: userId,
        name: 'Cuenta de Ahorros BAC',
        account_type_id: savingsType.id,
        initial_balance: 5000.00,
        current_balance: 5000.00,
        currency: 'NIO'
      }
    ];

    const createdAccounts = await knex('accounts').insert(accountsData).returning('*');
    console.log('✅ Cuentas creadas:', createdAccounts.length);

    // Obtener las cuentas creadas por nombre para referencias
    const bacCordobas = createdAccounts.find(acc => acc.name === 'BAC Córdobas');
    const lafiseDolar = createdAccounts.find(acc => acc.name === 'Lafise Dólar');
    const efectivoBilletera = createdAccounts.find(acc => acc.name === 'Efectivo Billetera');
    const cuentaAhorrosBac = createdAccounts.find(acc => acc.name === 'Cuenta de Ahorros BAC');

    /**
     * CREAR TRANSACCIONES DE EJEMPLO
     */
    const transactionsData = [
      // Ingreso de salario en cuenta BAC Córdobas
      {
        user_id: userId,
        type: 'income',
        amount: 30000.00,
        transaction_date: '2024-12-01',
        category_id: salaryCategory ? salaryCategory.id : null,
        from_account_id: null,
        to_account_id: bacCordobas.id,
        description: 'Salario mensual diciembre'
      },
      // Gasto en comida desde efectivo
      {
        user_id: userId,
        type: 'expense',
        amount: 800.00,
        transaction_date: '2024-12-05',
        category_id: foodCategory ? foodCategory.id : null,
        from_account_id: efectivoBilletera.id,
        to_account_id: null,
        description: 'Supermercado semanal'
      },
      // Gasto en transporte desde BAC
      {
        user_id: userId,
        type: 'expense',
        amount: 1500.00,
        transaction_date: '2024-12-08',
        category_id: transportCategory ? transportCategory.id : null,
        from_account_id: bacCordobas.id,
        to_account_id: null,
        description: 'Combustible y mantenimiento'
      },
      // Transferencia de BAC Córdobas a efectivo
      {
        user_id: userId,
        type: 'transfer',
        amount: 5000.00,
        transaction_date: '2024-12-10',
        category_id: null,
        from_account_id: bacCordobas.id,
        to_account_id: efectivoBilletera.id,
        description: 'Retiro de efectivo para gastos menores'
      },
      // Ingreso extra en Lafise Dólar
      {
        user_id: userId,
        type: 'income',
        amount: 200.00,
        transaction_date: '2024-12-12',
        category_id: null,
        from_account_id: null,
        to_account_id: lafiseDolar.id,
        description: 'Freelance proyecto extra'
      },
      // Gasto en comida desde efectivo
      {
        user_id: userId,
        type: 'expense',
        amount: 1200.00,
        transaction_date: '2024-12-15',
        category_id: foodCategory ? foodCategory.id : null,
        from_account_id: efectivoBilletera.id,
        to_account_id: null,
        description: 'Cena familiar restaurante'
      },
      // Transferencia de Lafise USD a BAC Córdobas (simulando cambio de moneda)
      {
        user_id: userId,
        type: 'transfer',
        amount: 100.00,
        transaction_date: '2024-12-18',
        category_id: null,
        from_account_id: lafiseDolar.id,
        to_account_id: bacCordobas.id,
        description: 'Cambio USD a NIO (aprox C$3,650)'
      }
    ];

    // Insertar transacciones y calcular saldos manualmente para el seeder
    for (const transactionData of transactionsData) {
      // Insertar la transacción
      await knex('transactions').insert(transactionData);

      // Actualizar saldos según el tipo de transacción
      if (transactionData.type === 'expense') {
        // Restar del saldo de la cuenta de origen
        await knex('accounts')
          .where({ id: transactionData.from_account_id })
          .decrement('current_balance', transactionData.amount);
      } else if (transactionData.type === 'income') {
        // Sumar al saldo de la cuenta de destino
        await knex('accounts')
          .where({ id: transactionData.to_account_id })
          .increment('current_balance', transactionData.amount);
      } else if (transactionData.type === 'transfer') {
        // Restar de cuenta origen y sumar a cuenta destino
        await knex('accounts')
          .where({ id: transactionData.from_account_id })
          .decrement('current_balance', transactionData.amount);
        await knex('accounts')
          .where({ id: transactionData.to_account_id })
          .increment('current_balance', transactionData.amount);
      }
    }

    console.log('✅ Transacciones creadas:', transactionsData.length);

    // Obtener saldos finales para mostrar en el resumen
    const finalAccounts = await knex('accounts')
      .where({ user_id: userId })
      .select(['name', 'current_balance', 'currency']);

    console.log('');
    console.log('💰 ================================');
    console.log('   SEEDER CUENTAS Y TRANSACCIONES');
    console.log('💰 ================================');
    console.log(`👤 Usuario: ${exampleUser.email}`);
    console.log(`🏦 Cuentas creadas: ${createdAccounts.length}`);
    console.log(`💸 Transacciones creadas: ${transactionsData.length}`);
    console.log('');
    console.log('📊 Saldos finales:');
    
    finalAccounts.forEach(account => {
      const balance = parseFloat(account.current_balance).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      console.log(`   ${account.name}: ${account.currency} ${balance}`);
    });
    
    console.log('💰 ================================');

  } catch (error) {
    console.error('❌ Error ejecutando seeder de cuentas:', error.message);
    throw error;
  }
};