/**
 * Migración para crear las tablas del núcleo funcional: accounts y transactions
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Crear tabla accounts (cuentas)
    .createTable('accounts', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('name', 100).notNullable();
      table.integer('account_type_id').unsigned().notNullable();
      table.decimal('initial_balance', 15, 2).notNullable().defaultTo(0);
      table.decimal('current_balance', 15, 2).notNullable().defaultTo(0);
      table.string('currency', 10).notNullable().defaultTo('NIO');
      table.timestamps(true, true); // created_at y updated_at
      
      // Claves foráneas
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('account_type_id').references('id').inTable('account_types').onDelete('RESTRICT');
      
      // Índices para optimización
      table.index('user_id');
      table.index(['user_id', 'currency']);
      
      // Constraint único: un usuario no puede tener cuentas con el mismo nombre
      table.unique(['user_id', 'name']);
    })
    // Crear tabla transactions (transacciones)
    .createTable('transactions', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.enum('type', ['income', 'expense', 'transfer']).notNullable();
      table.decimal('amount', 15, 2).notNullable();
      table.date('transaction_date').notNullable();
      table.integer('category_id').unsigned().nullable();
      table.integer('from_account_id').unsigned().nullable();
      table.integer('to_account_id').unsigned().nullable();
      table.text('description').nullable();
      table.timestamps(true, true); // created_at y updated_at
      
      // Claves foráneas
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('category_id').references('id').inTable('categories').onDelete('SET NULL');
      table.foreign('from_account_id').references('id').inTable('accounts').onDelete('CASCADE');
      table.foreign('to_account_id').references('id').inTable('accounts').onDelete('CASCADE');
      
      // Índices para consultas optimizadas
      table.index('user_id');
      table.index(['user_id', 'type']);
      table.index(['user_id', 'transaction_date']);
      table.index(['user_id', 'category_id']);
      table.index('from_account_id');
      table.index('to_account_id');
      
      // Constraints de validación
      table.check('amount > 0', [], 'chk_transactions_amount_positive');
    })
    // Agregar constraints adicionales después de crear las tablas
    .then(() => {
      return knex.raw(`
        ALTER TABLE transactions ADD CONSTRAINT chk_transactions_accounts 
        CHECK (
          (type = 'expense' AND from_account_id IS NOT NULL AND to_account_id IS NULL) OR
          (type = 'income' AND from_account_id IS NULL AND to_account_id IS NOT NULL) OR
          (type = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND from_account_id != to_account_id)
        )
      `);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('transactions')
    .dropTableIfExists('accounts');
};