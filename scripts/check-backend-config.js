#!/usr/bin/env node

/**
 * Script para verificar la configuración del backend en Render
 * Uso: node scripts/check-backend-config.js
 */

const axios = require('axios');

console.log('🔍 Verificando configuración del backend...\n');

const BACKEND_URL = 'https://moneyapp-n5tg.onrender.com';

async function checkBackend() {
  try {
    // 1. Verificar health endpoint
    console.log('1. Verificando health endpoint...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Health endpoint OK:', healthResponse.data);
    
    // 2. Verificar si las migraciones están ejecutadas
    console.log('\n2. Verificando base de datos...');
    try {
      const dbResponse = await axios.get(`${BACKEND_URL}/api/auth/test-db`);
      console.log('✅ Base de datos OK:', dbResponse.data);
    } catch (error) {
      console.log('⚠️  No se puede verificar la base de datos directamente');
    }
    
    // 3. Probar endpoint de login con datos de prueba
    console.log('\n3. Probando endpoint de login...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, loginData);
      console.log('✅ Login endpoint OK:', loginResponse.data);
    } catch (error) {
      console.log('❌ Error en login endpoint:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message || error.message);
      console.log('   Details:', error.response?.data);
    }
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

checkBackend();
