/**
 * Script de diagnóstico rápido para verificar importaciones de base de datos
 */

console.log('🔍 Iniciando diagnóstico de importaciones de base de datos...\n');

try {
  console.log('1. Probando importación de config/db.js...');
  const { db, testConnection } = require('./src/config/db');
  console.log('✅ db importado correctamente:', typeof db);
  console.log('✅ testConnection importado correctamente:', typeof testConnection);
  
  console.log('\n2. Probando conexión a la base de datos...');
  await testConnection();
  console.log('✅ Conexión exitosa');
  
  console.log('\n3. Probando consulta simple...');
  const result = await db.raw('SELECT 1 as test');
  console.log('✅ Consulta exitosa:', result.rows[0]);
  
  console.log('\n4. Probando importación de CurrencyConversionService...');
  const CurrencyConversionService = require('./src/api/services/CurrencyConversionService');
  console.log('✅ CurrencyConversionService importado correctamente');
  
  console.log('\n5. Probando método getUserExchangeRates...');
  const rates = await CurrencyConversionService.getUserExchangeRates(1);
  console.log('✅ getUserExchangeRates funcionando:', rates.length, 'tasas encontradas');
  
  console.log('\n🎉 ¡Todas las pruebas pasaron! El problema no está en las importaciones.');
  
} catch (error) {
  console.error('❌ Error encontrado:', error.message);
  console.error('Stack trace:', error.stack);
  
  if (error.message.includes('db is not a function')) {
    console.log('\n🔧 SOLUCIÓN: El problema está en la importación de db');
    console.log('Verifica que todos los archivos usen: const { db } = require("../../config/db");');
  }
}
