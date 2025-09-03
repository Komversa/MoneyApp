#!/usr/bin/env node

/**
 * Script para instalar dependencias de rendimiento
 * Ejecutar: node install-performance-deps.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Instalando dependencias de rendimiento...');

try {
  // Instalar compression
  console.log('📦 Instalando compression...');
  execSync('npm install compression@^1.7.4', { stdio: 'inherit' });
  
  console.log('✅ Dependencias de rendimiento instaladas correctamente');
  console.log('\n📋 Resumen de optimizaciones implementadas:');
  console.log('   • Pool de conexiones optimizado');
  console.log('   • Timeouts aumentados (30s para API, 60s para DB)');
  console.log('   • Middleware de compresión habilitado');
  console.log('   • Rate limiting implementado');
  console.log('   • Timeouts del frontend aumentados a 30s');
  console.log('   • Eliminación de delays innecesarios en UI');
  
  console.log('\n🔄 Reinicia el servidor para aplicar los cambios');
  
} catch (error) {
  console.error('❌ Error instalando dependencias:', error.message);
  process.exit(1);
}
