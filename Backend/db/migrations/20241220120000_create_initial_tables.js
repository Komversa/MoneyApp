/**
 * Migración inicial para crear las tablas users y user_settings
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Crear tabla users
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('email', 255).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.timestamps(true, true); // created_at y updated_at
    })
    // Crear tabla user_settings
    .createTable('user_settings', (table) => {
      table.integer('user_id').primary().unsigned();
      table.string('theme', 20).defaultTo('light');
      table.string('primary_currency', 10).defaultTo('NIO');
      table.string('secondary_currency', 10).defaultTo('USD');
      table.decimal('exchange_rate', 10, 4).defaultTo(36.5);
      table.timestamps(true, true);
      
      // Clave foránea hacia users
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('user_settings')
    .dropTableIfExists('users');
};