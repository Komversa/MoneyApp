#!/usr/bin/env node

/**
 * Script para verificar la configuración de zona horaria
 * Uso: node verify-timezone.js
 */

require('dotenv').config();

console.log('\n🌍 ===== VERIFICACIÓN DE ZONA HORARIA =====\n');

// 1. Verificar variable de entorno TZ
const timezone = process.env.TZ;
console.log('📋 Variable de entorno TZ:', timezone || '❌ NO CONFIGURADA (usará UTC por defecto)');

// 2. Mostrar zona horaria actual del proceso
console.log('⏰ Zona horaria del proceso Node.js:', Intl.DateTimeFormat().resolvedOptions().timeZone);

// 3. Crear una fecha y mostrarla en diferentes formatos
const now = new Date();
console.log('\n📅 Fecha y hora actual:');
console.log('   - UTC:', now.toISOString());
console.log('   - Local (toString):', now.toString());
console.log('   - Locale String:', now.toLocaleString('es-ES'));

// 4. Si TZ está configurada, mostrar en esa zona horaria
if (timezone) {
  try {
    console.log(`   - En ${timezone}:`, now.toLocaleString('es-ES', { timeZone: timezone }));
  } catch (error) {
    console.log(`   ❌ Error: Zona horaria "${timezone}" no es válida`);
    console.log('   💡 Usa formato IANA, ej: America/Managua, America/Mexico_City');
  }
}

// 5. Verificar offset de zona horaria
const offsetMinutes = now.getTimezoneOffset();
const offsetHours = -offsetMinutes / 60;
console.log(`\n🕐 Offset UTC: ${offsetHours >= 0 ? '+' : ''}${offsetHours} horas`);

// 6. Simular cómo node-cron interpretará la zona horaria
console.log('\n⏱️  Configuración del scheduler:');
console.log('   - Zona horaria para node-cron:', timezone || 'America/Managua (default)');
console.log('   - Cron ejecutará tareas según esta zona horaria');

// 7. Recomendaciones
console.log('\n💡 Recomendaciones:');
if (!timezone) {
  console.log('   ⚠️  IMPORTANTE: Configura la variable TZ en tu .env');
  console.log('   ⚠️  En producción (Render), agrégala en Environment Variables');
  console.log('   ⚠️  Ejemplo: TZ=America/Managua');
} else {
  console.log('   ✅ Variable TZ configurada correctamente');
  console.log('   ✅ El scheduler usará esta zona horaria');
}

// 8. Ejemplo de próxima ejecución del scheduler
console.log('\n📆 Ejemplo de próxima ejecución del scheduler (cada hora):');
const nextHour = new Date(now);
nextHour.setHours(now.getHours() + 1);
nextHour.setMinutes(0);
nextHour.setSeconds(0);
nextHour.setMilliseconds(0);

console.log('   - Próxima ejecución (UTC):', nextHour.toISOString());
if (timezone) {
  try {
    console.log(`   - Próxima ejecución (${timezone}):`, nextHour.toLocaleString('es-ES', { timeZone: timezone }));
  } catch (error) {
    // Ignorar error si ya se mostró arriba
  }
}

console.log('\n✅ Verificación completada\n');

// 9. Verificar si estamos en producción
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Entorno: PRODUCCIÓN');
  console.log('   - Asegúrate de que TZ esté configurada en Render');
} else {
  console.log('🔧 Entorno: DESARROLLO');
  console.log('   - Puedes configurar TZ en tu archivo .env local');
}

console.log('\n===========================================\n');
