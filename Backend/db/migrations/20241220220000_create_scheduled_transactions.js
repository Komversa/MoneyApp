/**
 * Migración para crear el sistema de transacciones programadas
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('scheduled_transactions', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      
      // Información de la transacción
      table.enum('transaction_type', ['income', 'expense', 'transfer']).notNullable();
      table.decimal('amount', 18, 2).notNullable();
      table.string('currency_code', 3).notNullable().defaultTo('USD');
      table.text('description').notNullable();
      table.integer('category_id').unsigned().nullable();
      
      // Cuentas involucradas
      table.integer('source_account_id').unsigned().nullable(); // Cuenta de origen (gastos y transferencias)
      table.integer('destination_account_id').unsigned().nullable(); // Cuenta destino (ingresos y transferencias)
      
      // Configuración de programación
      table.enum('frequency', ['once', 'daily', 'weekly', 'monthly']).notNullable();
      table.date('start_date').notNullable();
      table.timestamp('next_run_date').notNullable();
      table.date('end_date').nullable();
      table.boolean('is_active').notNullable().defaultTo(true);
      
      // Metadatos
      table.timestamps(true, true); // created_at y updated_at
      
      // Claves foráneas
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('category_id').references('id').inTable('categories').onDelete('SET NULL');
      table.foreign('source_account_id').references('id').inTable('accounts').onDelete('CASCADE');
      table.foreign('destination_account_id').references('id').inTable('accounts').onDelete('CASCADE');
      
      // Índices para optimización
      table.index('user_id');
      table.index(['user_id', 'is_active']);
      table.index(['is_active', 'next_run_date']); // Índice crítico para el scheduler
      table.index(['user_id', 'transaction_type']);
      table.index('source_account_id');
      table.index('destination_account_id');
      
      // Constraints de validación
      table.check('amount > 0', [], 'chk_scheduled_transactions_amount_positive');
      table.check('start_date <= next_run_date', [], 'chk_scheduled_transactions_start_next_date');
    })
    // Agregar constraints adicionales después de crear la tabla
    .then(() => {
      return knex.raw(`
        ALTER TABLE scheduled_transactions ADD CONSTRAINT chk_scheduled_transactions_accounts 
        CHECK (
          (transaction_type = 'expense' AND source_account_id IS NOT NULL AND destination_account_id IS NULL) OR
          (transaction_type = 'income' AND source_account_id IS NULL AND destination_account_id IS NOT NULL) OR
          (transaction_type = 'transfer' AND source_account_id IS NOT NULL AND destination_account_id IS NOT NULL AND source_account_id != destination_account_id)
        )
      `);
    })
    .then(() => {
      return knex.raw(`
        ALTER TABLE scheduled_transactions ADD CONSTRAINT chk_scheduled_transactions_end_date 
        CHECK (end_date IS NULL OR end_date >= start_date)
      `);
    });
};

/**
 * Reversión de la migración
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('scheduled_transactions');
};
