#!/usr/bin/env node

/**
 * Script para cambiar entre configuración de base de datos local y Neon
 * Uso: node scripts/switch-db-config.js [local|neon]
 */

const fs = require('fs');
const path = require('path');

const configType = process.argv[2] || 'neon'; // Por defecto usa Neon

console.log(`🔄 Cambiando configuración a: ${configType.toUpperCase()}\n`);

const backendEnvPath = path.join(__dirname, '../Backend/.env');

// Configuraciones predefinidas
const configs = {
  local: `# Configuración de desarrollo - POSTGRESQL LOCAL
NODE_ENV=development
PORT=3001

# Base de datos local (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=moneyapp_db

# Base de datos PostgreSQL (Neon) - DESHABILITADO
#DATABASE_URL=postgresql://neondb_owner:npg_cGjw2u0kWAta@ep-wild-butterfly-ad3x5q4u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Secret
JWT_SECRET=9b9870e1cbd79382a39091c8a08adf7634f6491af95d158779eb2fe5319e0a4d9686a360bd30cb96cfbeda1d2af190f4be1b36db921bff9ce0b96569c880049d

# Frontend URL (desarrollo)
FRONTEND_URL=http://localhost:5173

# Configuración de CORS
CORS_ORIGIN=http://localhost:5173
`,

  neon: `# Configuración de desarrollo - NEON (CLOUD)
NODE_ENV=development
PORT=3001

# Base de datos local (PostgreSQL) - DESHABILITADO
#DB_HOST=localhost
#DB_PORT=5432
#DB_USER=postgres
#DB_PASSWORD=password
#DB_NAME=moneyapp_db

# Base de datos PostgreSQL (Neon)
DATABASE_URL=postgresql://neondb_owner:npg_cGjw2u0kWAta@ep-wild-butterfly-ad3x5q4u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Secret
JWT_SECRET=9b9870e1cbd79382a39091c8a08adf7634f6491af95d158779eb2fe5319e0a4d9686a360bd30cb96cfbeda1d2af190f4be1b36db921bff9ce0b96569c880049d

# Frontend URL (desarrollo)
FRONTEND_URL=http://localhost:5173

# Configuración de CORS
CORS_ORIGIN=http://localhost:5173
`
};

if (!configs[configType]) {
  console.error('❌ Configuración no válida. Usa: local o neon');
  console.log('\n📋 Uso:');
  console.log('  node scripts/switch-db-config.js local  # Para PostgreSQL local');
  console.log('  node scripts/switch-db-config.js neon   # Para Neon (recomendado)');
  process.exit(1);
}

// Escribir la configuración seleccionada
fs.writeFileSync(backendEnvPath, configs[configType]);

console.log(`✅ Configuración cambiada a: ${configType.toUpperCase()}`);
console.log(`📁 Archivo actualizado: ${backendEnvPath}`);

if (configType === 'local') {
  console.log('\n📋 Para PostgreSQL local necesitas:');
  console.log('1. Instalar PostgreSQL: https://www.postgresql.org/download/windows/');
  console.log('2. Crear la base de datos: CREATE DATABASE moneyapp_db;');
  console.log('3. Configurar la contraseña del usuario postgres');
} else {
  console.log('\n✅ Neon está listo para usar - no necesitas configuración adicional');
}

console.log('\n🚀 Próximos pasos:');
console.log('1. cd Backend');
console.log('2. npm run migrate');
console.log('3. npm run seed');
console.log('4. npm run dev');
