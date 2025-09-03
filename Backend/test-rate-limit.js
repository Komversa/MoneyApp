#!/usr/bin/env node

/**
 * Script para probar el rate limiting
 * Ejecutar: node test-rate-limit.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_ENDPOINTS = [
  '/api/configuracion/tasas-cambio',
  '/api/currencies',
  '/api/dashboard',
  '/health'
];

async function testRateLimit() {
  console.log('🧪 Probando rate limiting...\n');
  
  for (const endpoint of TEST_ENDPOINTS) {
    console.log(`📡 Probando: ${endpoint}`);
    
    try {
      // Hacer múltiples requests rápidos
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          axios.get(`${BASE_URL}${endpoint}`)
            .then(response => ({ success: true, status: response.status }))
            .catch(error => ({ 
              success: false, 
              status: error.response?.status,
              message: error.response?.data?.message 
            }))
        );
      }
      
      const results = await Promise.all(promises);
      
      // Contar resultados
      const successful = results.filter(r => r.success).length;
      const rateLimited = results.filter(r => r.status === 429).length;
      const otherErrors = results.filter(r => !r.success && r.status !== 429).length;
      
      console.log(`   ✅ Exitosos: ${successful}`);
      console.log(`   🚨 Rate Limited: ${rateLimited}`);
      console.log(`   ❌ Otros errores: ${otherErrors}`);
      
      if (rateLimited > 0) {
        console.log(`   📊 Porcentaje de rate limiting: ${(rateLimited / results.length * 100).toFixed(1)}%`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error en test: ${error.message}`);
    }
    
    console.log('');
    
    // Esperar un poco entre endpoints
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎯 Test completado');
}

// Ejecutar test
testRateLimit().catch(console.error);
