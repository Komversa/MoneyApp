/**
 * Migración: Agregar campo currency_code a la tabla transactions
 * Fecha: 2024-12-20
 * Descripción: Agrega el campo currency_code para almacenar la moneda de cada transacción
 * y permite conversiones más eficientes en el historial
 */

exports.up = async function(knex) {
  console.log('🔄 Ejecutando migración: Agregar currency_code a transactions');
  
  try {
    // Agregar columna currency_code a la tabla transactions
    await knex.schema.alterTable('transactions', (table) => {
      table.string('currency_code', 10).defaultTo('USD').after('amount');
    });

    // Actualizar registros existentes basándose en las cuentas
    console.log('🔄 Actualizando currency_code para transacciones existentes...');
    
    // Para gastos: usar la moneda de la cuenta de origen
    await knex.raw(`
      UPDATE transactions t
      SET currency_code = a.currency
      FROM accounts a
      WHERE t.from_account_id = a.id 
        AND t.type = 'expense' 
        AND t.from_account_id IS NOT NULL
    `);

    // Para ingresos: usar la moneda de la cuenta de destino
    await knex.raw(`
      UPDATE transactions t
      SET currency_code = a.currency
      FROM accounts a
      WHERE t.to_account_id = a.id 
        AND t.type = 'income' 
        AND t.to_account_id IS NOT NULL
    `);

    // Para transferencias: usar la moneda de la cuenta de origen (el monto se envía desde ahí)
    await knex.raw(`
      UPDATE transactions t
      SET currency_code = a.currency
      FROM accounts a
      WHERE t.from_account_id = a.id 
        AND t.type = 'transfer' 
        AND t.from_account_id IS NOT NULL
    `);

    // Agregar índice para optimizar consultas por moneda
    await knex.schema.alterTable('transactions', (table) => {
      table.index(['user_id', 'currency_code']);
    });

    console.log('✅ Migración completada: currency_code agregado a transactions');

  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  console.log('🔄 Revertiendo migración: Remover currency_code de transactions');
  
  try {
    // Remover índice
    await knex.schema.alterTable('transactions', (table) => {
      table.dropIndex(['user_id', 'currency_code']);
    });

    // Remover columna
    await knex.schema.alterTable('transactions', (table) => {
      table.dropColumn('currency_code');
    });

    console.log('✅ Migración revertida: currency_code removido de transactions');

  } catch (error) {
    console.error('❌ Error al revertir migración:', error);
    throw error;
  }
};
