#!/usr/bin/env node

/**
 * Script de despliegue para MoneyApp
 * Facilita la configuración inicial del proyecto
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 ================================');
console.log('   SCRIPT DE DESPLIEGUE - MoneyApp');
console.log('🚀 ================================');
console.log('');

// Configuraciones de entorno
const backendEnv = `# ===============================================
# ARCHIVO .env PARA EL BACKEND - MoneyApp
# ===============================================

# --- Configuración del Servidor ---
NODE_ENV=development
PORT=3000

# --- Configuración de la Base de Datos PostgreSQL ---
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456
DB_DATABASE=moneyapp_db

# --- Secretos JWT ---
JWT_ACCESS_SECRET=e4401b9dfd098646daa03048bf4b92cfe03731d87dc9fad63c815f3dc9d04426e441035f63c1cf699d9feaa56cb462c47d547a9116467c847ed1f4f86a294b75
JWT_REFRESH_SECRET=6b078aa008cea916f05b61ecbddced089994c57f1c2ccf868dce09dfb4681605b67354e3ed696145ef723fca76e7cd685cf4a20ef199c734f30518baa5b7f3f3
`;

const frontendEnv = `# Configuración del Frontend - MoneyApp

# URL base del API backend (ajustar según el puerto del backend)
VITE_API_BASE_URL=http://localhost:3000

# Entorno de desarrollo
NODE_ENV=development
`;

// Crear archivos .env si no existen
const backendEnvPath = path.join(__dirname, '../Backend/.env');
const frontendEnvPath = path.join(__dirname, '../Frontend/.env.local');

try {
  // Backend .env
  if (!fs.existsSync(backendEnvPath)) {
    fs.writeFileSync(backendEnvPath, backendEnv);
    console.log('✅ Archivo Backend/.env creado');
  } else {
    console.log('⚠️  Backend/.env ya existe');
  }

  // Frontend .env.local
  if (!fs.existsSync(frontendEnvPath)) {
    fs.writeFileSync(frontendEnvPath, frontendEnv);
    console.log('✅ Archivo Frontend/.env.local creado');
  } else {
    console.log('⚠️  Frontend/.env.local ya existe');
  }

  console.log('');
  console.log('📋 PASOS PARA DESPLEGAR:');
  console.log('');
  console.log('1️⃣  BACKEND:');
  console.log('   cd Backend');
  console.log('   npm install');
  console.log('   npx knex migrate:latest');
  console.log('   npx knex seed:run');
  console.log('   npm run dev');
  console.log('');
  console.log('2️⃣  FRONTEND (nueva terminal):');
  console.log('   cd Frontend');
  console.log('   npm install');
  console.log('   npm run dev');
  console.log('');
  console.log('🔑 USUARIO DE PRUEBA:');
  console.log('   Email: admin@example.com');
  console.log('   Contraseña: 123456');
  console.log('');
  console.log('🌐 URLs:');
  console.log('   Frontend: http://localhost:5173');
  console.log('   Backend: http://localhost:3000');
  console.log('');
  console.log('💡 NOTA: Asegúrate de que PostgreSQL esté ejecutándose');
  console.log('   y que la base de datos "moneyapp_db" exista.');
  console.log('');

} catch (error) {
  console.error('❌ Error:', error.message);
}