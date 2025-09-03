/**
 * Seeder para crear usuario de prueba
 * Crea el usuario admin@example.com para facilitar las pruebas
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const { hashPassword } = require('../../src/utils/bcrypt.utils');

exports.seed = async function(knex) {
  // Solo ejecutar en entorno de desarrollo
  if (process.env.NODE_ENV === 'production') {
    console.log('🚫 Seeder de usuario de prueba omitido: No se ejecuta en producción');
    return;
  }

  try {
    console.log('👤 Creando usuario de prueba...');

    // Verificar si el usuario ya existe
    const existingUser = await knex('users')
      .where({ email: 'admin@example.com' })
      .first();

    if (existingUser) {
      console.log('⚠️  Usuario admin@example.com ya existe. Saltando creación.');
      return;
    }

    // Hashear la contraseña del usuario de prueba
    const passwordHash = await hashPassword('123456');

    // Usar transacción para garantizar atomicidad
    const result = await knex.transaction(async (trx) => {
      // Crear el usuario
      const [newUser] = await trx('users')
        .insert({
          email: 'admin@example.com',
          password_hash: passwordHash
        })
        .returning(['id', 'email', 'created_at']);

      // Crear configuración por defecto del usuario
      await trx('user_settings')
        .insert({
          user_id: newUser.id,
          theme: 'light',
          primary_currency: 'USD'  // Solo moneda principal, sin secondary_currency ni exchange_rate
        });

      // Crear tasas de cambio iniciales en la nueva tabla pivot
      await trx('user_exchange_rates_pivot')
        .insert([
          {
            user_id: newUser.id,
            currency_code: 'USD',
            rate_to_usd: 1.0
          },
          {
            user_id: newUser.id,
            currency_code: 'NIO',
            rate_to_usd: 0.0274  // 1 NIO = 0.0274 USD (equivalente a 1 USD = 36.5 NIO)
          }
        ]);

      return newUser;
    });

    console.log('');
    console.log('🎉 ================================');
    console.log('   USUARIO DE PRUEBA CREADO');
    console.log('🎉 ================================');
    console.log(`📧 Email: ${result.email}`);
    console.log(`🔑 Contraseña: 123456`);
    console.log(`🆔 ID: ${result.id}`);
    console.log(`⚙️  Configuración inicial: USD (con tasas USD/NIO)`);
    console.log('🎉 ================================');
    console.log('');

  } catch (error) {
    console.error('❌ Error creando usuario de prueba:', error.message);
    throw error;
  }
};