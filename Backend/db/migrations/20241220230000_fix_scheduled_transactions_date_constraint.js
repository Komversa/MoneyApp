/**
 * Migración para arreglar el constraint de fechas en scheduled_transactions
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    -- Eliminar el constraint problemático
    ALTER TABLE scheduled_transactions DROP CONSTRAINT IF EXISTS chk_scheduled_transactions_start_next_date;
    
    -- Agregar un constraint más flexible que maneja los tipos de fecha correctamente
    ALTER TABLE scheduled_transactions ADD CONSTRAINT chk_scheduled_transactions_start_next_date 
    CHECK (start_date::date <= next_run_date::date);
  `);
};

/**
 * Reversión de la migración
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    -- Eliminar el constraint modificado
    ALTER TABLE scheduled_transactions DROP CONSTRAINT IF EXISTS chk_scheduled_transactions_start_next_date;
    
    -- Restaurar el constraint original
    ALTER TABLE scheduled_transactions ADD CONSTRAINT chk_scheduled_transactions_start_next_date 
    CHECK (start_date <= next_run_date);
  `);
};
