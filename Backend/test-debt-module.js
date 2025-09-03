/**
 * Script de prueba para validar el módulo de deudas
 * Ejecutar con: node test-debt-module.js
 */

const knex = require('knex');
const config = require('./knexfile');

async function testDebtModule() {
  const db = knex(config.development);
  
  try {
    console.log('🔍 === AUDITORÍA DEL MÓDULO DE DEUDAS ===\n');

    // 1. Verificar que las tablas existen
    console.log('1. Verificando estructura de la base de datos...');
    
    const tablesExist = await Promise.all([
      db.schema.hasTable('accounts'),
      db.schema.hasTable('debt_details'),
      db.schema.hasColumn('accounts', 'account_category')
    ]);

    if (tablesExist.every(exists => exists)) {
      console.log('✅ Tablas y columnas verificadas correctamente');
    } else {
      console.log('❌ Faltan tablas o columnas:', tablesExist);
    }

    // 2. Verificar constraints
    console.log('\n2. Verificando constraints de la base de datos...');
    
    try {
      // Intentar insertar un account_category inválido (debería fallar)
      await db('accounts').insert({
        user_id: 999,
        name: 'Test Invalid Category',
        account_type_id: 1,
        account_category: 'invalid',
        initial_balance: 0,
        current_balance: 0,
        currency: 'USD'
      });
      console.log('❌ Constraint de account_category no está funcionando');
    } catch (error) {
      if (error.message.includes('chk_accounts_category_valid') || error.message.includes('check constraint')) {
        console.log('✅ Constraint de account_category funcionando correctamente');
      } else {
        console.log('⚠️ Error inesperado:', error.message);
      }
    }

    // 3. Verificar que las cuentas existentes tienen la categoría por defecto
    console.log('\n3. Verificando cuentas existentes...');
    
    const accountsWithoutCategory = await db('accounts')
      .whereNull('account_category')
      .count('* as count')
      .first();

    if (parseInt(accountsWithoutCategory.count) === 0) {
      console.log('✅ Todas las cuentas tienen categoría asignada');
    } else {
      console.log(`⚠️ ${accountsWithoutCategory.count} cuentas sin categoría asignada`);
    }

    // 4. Verificar la distribución de categorías
    const categoryDistribution = await db('accounts')
      .select('account_category')
      .count('* as count')
      .groupBy('account_category');

    console.log('\n4. Distribución de categorías:');
    categoryDistribution.forEach(category => {
      console.log(`   ${category.account_category}: ${category.count} cuentas`);
    });

    // 5. Verificar índices
    console.log('\n5. Verificando índices...');
    
    const indexes = await db.raw(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN ('accounts', 'debt_details')
      AND indexname LIKE '%category%' OR indexname LIKE '%debt%'
    `);

    if (indexes.rows.length > 0) {
      console.log('✅ Índices encontrados:');
      indexes.rows.forEach(index => {
        console.log(`   ${index.indexname} en ${index.tablename}`);
      });
    } else {
      console.log('⚠️ No se encontraron índices específicos');
    }

    // 6. Verificar funcionamiento del CurrencyConversionService
    console.log('\n6. Verificando CurrencyConversionService...');
    
    try {
      const CurrencyConversionService = require('./src/api/services/CurrencyConversionService');
      
      // Crear usuario de prueba temporal
      const [testUser] = await db('users').insert({
        email: 'test-debt@example.com',
        password_hash: 'test'
      }).returning('id');

      // Configurar tasas de cambio para el usuario
      await db('user_exchange_rates_pivot').insert([
        { user_id: testUser.id, currency_code: 'USD', rate_to_usd: 1.0 },
        { user_id: testUser.id, currency_code: 'NIO', rate_to_usd: 0.0274 }
      ]);

      // Probar conversión
      const conversionResult = await CurrencyConversionService.convert({
        amount: 1000,
        fromCurrency: 'NIO',
        toCurrency: 'USD',
        userId: testUser.id
      });

      if (conversionResult.success && conversionResult.convertedAmount > 0) {
        console.log(`✅ Conversión exitosa: 1000 NIO = ${conversionResult.convertedAmount} USD`);
      } else {
        console.log('❌ Error en conversión de monedas');
      }

      // Limpiar datos de prueba
      await db('user_exchange_rates_pivot').where('user_id', testUser.id).del();
      await db('users').where('id', testUser.id).del();

    } catch (error) {
      console.log('❌ Error probando CurrencyConversionService:', error.message);
    }

    console.log('\n🎉 === AUDITORÍA COMPLETADA ===');

  } catch (error) {
    console.error('❌ Error durante la auditoría:', error);
  } finally {
    await db.destroy();
  }
}

// Ejecutar la auditoría
testDebtModule().catch(console.error);
