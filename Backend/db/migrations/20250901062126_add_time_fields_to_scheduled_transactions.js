/**
 * Migración: Agregar campos de tiempo específico a transacciones programadas
 * 
 * Esta migración permite a los usuarios seleccionar hora exacta de ejecución
 * en lugar de usar una hora fija (12:00 PM)
 */

exports.up = function(knex) {
  return knex.schema.alterTable('scheduled_transactions', function(table) {
    // Agregar campos para manejo de tiempo específico
    table.time('start_time').defaultTo('09:00').comment('Hora de inicio para la primera ejecución (HH:MM)');
    table.time('end_time').nullable().comment('Hora de finalización opcional (HH:MM)');
    
    // Agregar índice para mejorar performance en consultas por horario
    table.index(['start_time'], 'idx_scheduled_transactions_start_time');
    
    console.log('✅ Campos de tiempo agregados a scheduled_transactions');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('scheduled_transactions', function(table) {
    // Eliminar índice primero
    table.dropIndex(['start_time'], 'idx_scheduled_transactions_start_time');
    
    // Eliminar campos de tiempo
    table.dropColumn('start_time');
    table.dropColumn('end_time');
    
    console.log('✅ Campos de tiempo eliminados de scheduled_transactions');
  });
};