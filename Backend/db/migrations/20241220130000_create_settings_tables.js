/**
 * Migración para crear las tablas de configuración: account_types y categories
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Crear tabla account_types (tipos de cuenta)
    .createTable('account_types', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('name', 100).notNullable();
      table.timestamps(true, true); // created_at y updated_at
      
      // Clave foránea hacia users
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      
      // Índice para consultas por usuario
      table.index('user_id');
      
      // Constraint único: un usuario no puede tener tipos de cuenta duplicados
      table.unique(['user_id', 'name']);
    })
    // Crear tabla categories (categorías de transacciones)
    .createTable('categories', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('name', 100).notNullable();
      table.enum('type', ['income', 'expense']).notNullable();
      table.timestamps(true, true); // created_at y updated_at
      
      // Clave foránea hacia users
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      
      // Índices para consultas optimizadas
      table.index('user_id');
      table.index(['user_id', 'type']);
      
      // Constraint único: un usuario no puede tener categorías duplicadas del mismo tipo
      table.unique(['user_id', 'name', 'type']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('categories')
    .dropTableIfExists('account_types');
};