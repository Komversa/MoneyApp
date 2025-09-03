#!/usr/bin/env node

/**
 * Script de configuración automática para despliegue
 * Ejecutar: node scripts/deploy-setup.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Configurando MoneyApp para despliegue...\n');

// Generar JWT secret aleatorio
const jwtSecret = crypto.randomBytes(64).toString('hex');

// Crear archivo .env para desarrollo
const envContent = `# Configuración de desarrollo
NODE_ENV=development
PORT=3001

# Base de datos local (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=moneyapp_db

# JWT Secret (generado automáticamente)
JWT_SECRET=${jwtSecret}

# Frontend URL (desarrollo)
FRONTEND_URL=http://localhost:5173

# Configuración de CORS
CORS_ORIGIN=http://localhost:5173
`;

// Crear archivo .env en el backend
const backendEnvPath = path.join(__dirname, '../Backend/.env');
fs.writeFileSync(backendEnvPath, envContent);
console.log('✅ Archivo .env creado en Backend/');

// Crear archivo .env para frontend
const frontendEnvContent = `# Configuración del frontend
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=MoneyApp
VITE_APP_VERSION=1.0.0
`;

const frontendEnvPath = path.join(__dirname, '../Frontend/.env');
fs.writeFileSync(frontendEnvPath, frontendEnvContent);
console.log('✅ Archivo .env creado en Frontend/');

// Crear .gitignore si no existe
const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
`;

const gitignorePath = path.join(__dirname, '../.gitignore');
if (!fs.existsSync(gitignorePath)) {
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('✅ Archivo .gitignore creado');
} else {
  console.log('ℹ️  Archivo .gitignore ya existe');
}

console.log('\n🎉 Configuración completada!');
console.log('\n📋 Próximos pasos:');
console.log('1. Configura PostgreSQL localmente');
console.log('2. Ejecuta: cd Backend && npm install && npm run migrate');
console.log('3. Ejecuta: cd Frontend && npm install');
console.log('4. Sigue la guía en DEPLOYMENT_GUIDE.md para el despliegue');
console.log('\n🔑 JWT Secret generado:', jwtSecret);
console.log('⚠️  Guarda este JWT Secret de forma segura para producción');
