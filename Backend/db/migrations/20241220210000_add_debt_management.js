/**
 * Migración para integrar el módulo de gestión de deudas
 * Añade soporte para diferenciar entre activos y pasivos
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // 1. Modificar tabla accounts para añadir categoría
    .alterTable('accounts', (table) => {
      // Añadir columna account_category con valor por defecto 'asset'
      table.text('account_category').notNullable().defaultTo('asset');
      
      // Añadir CHECK constraint para validar valores permitidos
      table.check(
        "account_category IN ('asset', 'liability')", 
        [],
        'chk_accounts_category_valid'
      );
      
      // Índice para consultas filtradas por categoría
      table.index(['user_id', 'account_category']);
    })
    
    // 2. Crear tabla debt_details para información específica de deudas
    .createTable('debt_details', (table) => {
      table.increments('id').primary();
      table.integer('account_id').unsigned().notNullable().unique();
      table.decimal('interest_rate', 5, 2).nullable().defaultTo(0);
      table.date('due_date').nullable();
      table.decimal('original_amount', 18, 2).notNullable();
      table.timestamps(true, true); // created_at y updated_at
      
      // Clave foránea con CASCADE para integridad referencial
      table.foreign('account_id')
        .references('id')
        .inTable('accounts')
        .onDelete('CASCADE');
      
      // Constraint para validar que el monto original sea positivo
      table.check('original_amount > 0', [], 'chk_debt_original_amount_positive');
      
      // Constraint para validar que la tasa de interés sea no negativa
      table.check('interest_rate >= 0', [], 'chk_debt_interest_rate_non_negative');
      
      // Índice para consultas por cuenta
      table.index('account_id');
    });
};

/**
 * Reversión de la migración
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    // Eliminar tabla debt_details primero (por la clave foránea)
    .dropTableIfExists('debt_details')
    
    // Remover la columna account_category de accounts
    .alterTable('accounts', (table) => {
      table.dropIndex(['user_id', 'account_category']);
      table.dropColumn('account_category');
    });
};
