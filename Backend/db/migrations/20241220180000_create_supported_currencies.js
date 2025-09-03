/**
 * Migración: Crear tabla supported_currencies
 * Fecha: 2024-12-20 18:00:00
 * Descripción: Crea la tabla de monedas soportadas y la puebla con monedas importantes
 */

exports.up = async function(knex) {
  console.log('🔄 Ejecutando migración: Crear tabla supported_currencies');
  
  try {
    // Crear la tabla supported_currencies
    await knex.schema.createTable('supported_currencies', (table) => {
      table.string('code', 3).primary().comment('Código ISO de la moneda (ej: USD, EUR)');
      table.string('name', 50).notNullable().comment('Nombre completo de la moneda');
      table.string('symbol', 5).notNullable().comment('Símbolo de la moneda (ej: $, €)');
      table.timestamps(true, true);
      
      // Índices para optimización
      table.index(['code']);
    });
    
    console.log('✅ Tabla supported_currencies creada exitosamente');
    
    // Insertar monedas importantes
    console.log('🔄 Insertando monedas soportadas...');
    
    const currencies = [
      {
        code: 'USD',
        name: 'Dólar Estadounidense',
        symbol: '$',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        code: 'NIO',
        name: 'Córdoba Nicaragüense',
        symbol: 'C$',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        code: 'JPY',
        name: 'Yen Japonés',
        symbol: '¥',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        code: 'GBP',
        name: 'Libra Esterlina',
        symbol: '£',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        code: 'MXN',
        name: 'Peso Mexicano',
        symbol: '$',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        code: 'CAD',
        name: 'Dólar Canadiense',
        symbol: 'C$',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        code: 'AUD',
        name: 'Dólar Australiano',
        symbol: 'A$',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        code: 'CHF',
        name: 'Franco Suizo',
        symbol: 'CHF',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        code: 'CNY',
        name: 'Yuan Chino',
        symbol: '¥',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        code: 'BRL',
        name: 'Real Brasileño',
        symbol: 'R$',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        code: 'ARS',
        name: 'Peso Argentino',
        symbol: '$',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        code: 'CLP',
        name: 'Peso Chileno',
        symbol: '$',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        code: 'COP',
        name: 'Peso Colombiano',
        symbol: '$',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        code: 'PEN',
        name: 'Sol Peruano',
        symbol: 'S/',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      }
    ];
    
    await knex('supported_currencies').insert(currencies);
    
    console.log(`✅ Insertadas ${currencies.length} monedas soportadas`);
    console.log('🎉 Migración completada: Tabla supported_currencies creada y poblada');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  console.log('🔄 Revertiendo migración: Eliminar tabla supported_currencies');
  
  try {
    await knex.schema.dropTableIfExists('supported_currencies');
    console.log('✅ Tabla supported_currencies eliminada');
  } catch (error) {
    console.error('❌ Error al revertir migración:', error);
    throw error;
  }
};
