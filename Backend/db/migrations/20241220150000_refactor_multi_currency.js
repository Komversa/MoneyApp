/**
 * Migración para refactorizar el modelo multi-moneda de rígido a escalable
 * 
 * CAMBIOS:
 * - Elimina secondary_currency y exchange_rate de user_settings
 * - Crea nueva tabla user_exchange_rates para soporte escalable de múltiples monedas
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.transaction(async (trx) => {
    // 1. Crear nueva tabla user_exchange_rates
    await trx.schema.createTable('user_exchange_rates', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('currency_code', 10).notNullable();
      table.decimal('rate', 15, 8).notNullable(); // Precisión alta para tasas de cambio
      table.timestamp('updated_at').defaultTo(trx.fn.now());
      
      // Claves foráneas y constraints
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      
      // Índices para optimización
      table.index('user_id');
      table.index(['user_id', 'currency_code']);
      
      // Constraint único: un usuario no puede tener tasas duplicadas para la misma moneda
      table.unique(['user_id', 'currency_code']);
      
      // Constraint de validación: la tasa debe ser positiva
      table.check('rate > 0', [], 'chk_user_exchange_rates_rate_positive');
    });

    // 2. Migrar datos existentes de user_settings a user_exchange_rates
    // Obtener todos los usuarios con configuración de moneda secundaria
    const existingSettings = await trx('user_settings')
      .select('user_id', 'secondary_currency', 'exchange_rate')
      .whereNotNull('secondary_currency')
      .whereNotNull('exchange_rate');

    // Insertar tasas existentes en la nueva tabla
    if (existingSettings.length > 0) {
      const exchangeRatesData = existingSettings.map(setting => ({
        user_id: setting.user_id,
        currency_code: setting.secondary_currency,
        rate: parseFloat(setting.exchange_rate),
        updated_at: trx.fn.now()
      }));

      await trx('user_exchange_rates').insert(exchangeRatesData);
    }

    // 3. Eliminar columnas obsoletas de user_settings
    await trx.schema.alterTable('user_settings', (table) => {
      table.dropColumn('secondary_currency');
      table.dropColumn('exchange_rate');
    });
  });
};

/**
 * Revertir los cambios (para rollback)
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.transaction(async (trx) => {
    // 1. Restaurar columnas en user_settings
    await trx.schema.alterTable('user_settings', (table) => {
      table.string('secondary_currency', 10).defaultTo('USD');
      table.decimal('exchange_rate', 10, 4).defaultTo(36.5);
    });

    // 2. Migrar datos de vuelta desde user_exchange_rates a user_settings
    // Obtener la primera tasa de cambio por usuario (en caso de múltiples monedas)
    const exchangeRates = await trx('user_exchange_rates')
      .select('user_id', 'currency_code', 'rate')
      .orderBy(['user_id', 'id']);

    // Agrupar por usuario y tomar la primera moneda como "secundaria"
    const userRates = {};
    exchangeRates.forEach(rate => {
      if (!userRates[rate.user_id]) {
        userRates[rate.user_id] = {
          secondary_currency: rate.currency_code,
          exchange_rate: rate.rate
        };
      }
    });

    // Actualizar user_settings con los datos migrados
    for (const [userId, rateData] of Object.entries(userRates)) {
      await trx('user_settings')
        .where('user_id', userId)
        .update({
          secondary_currency: rateData.secondary_currency,
          exchange_rate: rateData.exchange_rate
        });
    }

    // 3. Eliminar tabla user_exchange_rates
    await trx.schema.dropTableIfExists('user_exchange_rates');
  });
};
