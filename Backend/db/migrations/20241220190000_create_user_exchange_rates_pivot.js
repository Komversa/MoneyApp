/**
 * Migración: Crear tabla user_exchange_rates_pivot
 * Fecha: 2024-12-20 19:00:00
 * Descripción: Crea la tabla pivot para las tasas de cambio de usuarios con referencia a USD
 */

exports.up = async function(knex) {
  console.log('🔄 Ejecutando migración: Crear tabla user_exchange_rates_pivot');
  
  try {
    // Crear la tabla user_exchange_rates_pivot
    await knex.schema.createTable('user_exchange_rates_pivot', (table) => {
      // Primary Key
      table.increments('id').primary().comment('ID único de la tasa de cambio');
      
      // Foreign Keys
      table.integer('user_id').unsigned().notNullable().comment('ID del usuario');
      table.string('currency_code', 3).notNullable().comment('Código de la moneda');
      
      // Datos de la tasa
      table.decimal('rate_to_usd', 15, 6).notNullable().comment('Tasa de cambio respecto al USD');
      
      // Timestamps
      table.timestamps(true, true);
      
      // Índices para optimización
      table.index(['user_id']);
      table.index(['currency_code']);
      table.index(['user_id', 'currency_code']);
      
      // Foreign Key Constraints
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('currency_code').references('code').inTable('supported_currencies').onDelete('CASCADE');
      
      // Unique constraint para evitar duplicados
      table.unique(['user_id', 'currency_code'], 'unique_user_currency_rate');
    });
    
    console.log('✅ Tabla user_exchange_rates_pivot creada exitosamente');
    
    // Insertar datos iniciales para usuarios existentes (solo USD y NIO por ahora)
    console.log('🔄 Insertando tasas iniciales para usuarios existentes...');
    
    // Obtener todos los usuarios que tienen configuraciones
    const usersWithSettings = await knex('user_settings')
      .select('user_id', 'primary_currency')
      .whereNotNull('primary_currency');
    
    if (usersWithSettings.length > 0) {
      const initialRates = [];
      
      for (const userSetting of usersWithSettings) {
        const { user_id, primary_currency } = userSetting;
        
        // Si la moneda principal es USD, no necesitamos tasa (es 1:1)
        if (primary_currency === 'USD') {
          // Solo agregar NIO si existe en supported_currencies
          const nioExists = await knex('supported_currencies').where('code', 'NIO').first();
          if (nioExists) {
            initialRates.push({
              user_id,
              currency_code: 'NIO',
              rate_to_usd: 0.0274, // Tasa por defecto NIO a USD
              created_at: knex.fn.now(),
              updated_at: knex.fn.now()
            });
          }
        } else if (primary_currency === 'NIO') {
          // Si la moneda principal es NIO, agregar USD
          const usdExists = await knex('supported_currencies').where('code', 'USD').first();
          if (usdExists) {
            initialRates.push({
              user_id,
              currency_code: 'USD',
              rate_to_usd: 1.0, // USD siempre es 1:1
              created_at: knex.fn.now(),
              updated_at: knex.fn.now()
            });
          }
        }
      }
      
      if (initialRates.length > 0) {
        await knex('user_exchange_rates_pivot').insert(initialRates);
        console.log(`✅ Insertadas ${initialRates.length} tasas iniciales para usuarios existentes`);
      } else {
        console.log('ℹ️  No se requirieron tasas iniciales');
      }
    } else {
      console.log('ℹ️  No hay usuarios con configuraciones para migrar');
    }
    
    console.log('🎉 Migración completada: Tabla user_exchange_rates_pivot creada');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  console.log('🔄 Revertiendo migración: Eliminar tabla user_exchange_rates_pivot');
  
  try {
    await knex.schema.dropTableIfExists('user_exchange_rates_pivot');
    console.log('✅ Tabla user_exchange_rates_pivot eliminada');
  } catch (error) {
    console.error('❌ Error al revertir migración:', error);
    throw error;
  }
};
