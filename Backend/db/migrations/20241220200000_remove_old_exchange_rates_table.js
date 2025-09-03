/**
 * Migración: Eliminar tabla obsoleta user_exchange_rates
 * Fecha: 2024-12-20
 * Descripción: Elimina la tabla user_exchange_rates que ha sido reemplazada por user_exchange_rates_pivot
 * como parte de la refactorización del sistema de monedas
 */

exports.up = async function(knex) {
  console.log('🔄 Ejecutando migración: Eliminar tabla obsoleta user_exchange_rates');
  
  try {
    // Verificar que la tabla existe antes de intentar eliminarla
    const tableExists = await knex.schema.hasTable('user_exchange_rates');
    
    if (tableExists) {
      console.log('🗑️  Eliminando tabla obsoleta user_exchange_rates...');
      
      // Eliminar la tabla obsoleta
      await knex.schema.dropTable('user_exchange_rates');
      
      console.log('✅ Tabla user_exchange_rates eliminada exitosamente');
    } else {
      console.log('ℹ️  Tabla user_exchange_rates no existe. Saltando eliminación.');
    }

    console.log('🎉 Migración de limpieza completada');

  } catch (error) {
    console.error('❌ Error en migración de limpieza:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  console.log('🔄 Revertiendo migración: Recrear tabla user_exchange_rates');
  
  try {
    // Recrear la tabla antigua (solo para rollback)
    await knex.schema.createTable('user_exchange_rates', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('currency_code', 3).notNullable();
      table.decimal('rate', 15, 6).notNullable();
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['currency_code']);
      table.index(['user_id', 'currency_code']);
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    });

    console.log('✅ Tabla user_exchange_rates recreada para rollback');

  } catch (error) {
    console.error('❌ Error al revertir migración:', error);
    throw error;
  }
};
