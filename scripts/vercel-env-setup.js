#!/usr/bin/env node

/**
 * Script para configurar variables de entorno en Vercel
 * Uso: node scripts/vercel-env-setup.js
 */

console.log('🚀 Configuración de Variables de Entorno para Vercel\n');

console.log('📋 Variables que necesitas configurar en Vercel:');
console.log('');
console.log('🔧 VITE_API_URL=https://moneyapp-n5tg.onrender.com');
console.log('🔧 VITE_APP_NAME=MoneyApp');
console.log('🔧 VITE_APP_VERSION=1.0.0');
console.log('');

console.log('📝 Pasos para configurar en Vercel:');
console.log('');
console.log('1. Ve a tu dashboard de Vercel: https://vercel.com/dashboard');
console.log('2. Selecciona tu proyecto: money-app-ten');
console.log('3. Ve a Settings > Environment Variables');
console.log('4. Agrega las siguientes variables:');
console.log('');
console.log('   Name: VITE_API_URL');
console.log('   Value: https://moneyapp-n5tg.onrender.com');
console.log('   Environment: Production, Preview, Development');
console.log('');
console.log('   Name: VITE_APP_NAME');
console.log('   Value: MoneyApp');
console.log('   Environment: Production, Preview, Development');
console.log('');
console.log('   Name: VITE_APP_VERSION');
console.log('   Value: 1.0.0');
console.log('   Environment: Production, Preview, Development');
console.log('');
console.log('5. Haz clic en "Save"');
console.log('6. Ve a Deployments y haz un nuevo deploy');
console.log('');

console.log('🔍 Para verificar la configuración:');
console.log('1. Ve a tu app: https://money-app-ten.vercel.app');
console.log('2. Abre las herramientas de desarrollador (F12)');
console.log('3. Ve a la pestaña Console');
console.log('4. Escribe: console.log(import.meta.env.VITE_API_URL)');
console.log('5. Debería mostrar: https://moneyapp-n5tg.onrender.com');
console.log('');

console.log('⚠️  IMPORTANTE: Después de configurar las variables, necesitas hacer un nuevo deploy');
console.log('   Vercel no aplica las variables de entorno a deployments existentes');
console.log('');

console.log('🎯 URLs de tu aplicación:');
console.log('   Frontend: https://money-app-ten.vercel.app');
console.log('   Backend: https://moneyapp-n5tg.onrender.com');
console.log('   API Health: https://moneyapp-n5tg.onrender.com/health');
