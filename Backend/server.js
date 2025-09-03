// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Importar configuración de base de datos
const { testConnection } = require('./src/config/db');

// Importar el servicio de transacciones programadas
const scheduledTransactionsService = require('./src/api/services/scheduled-transactions.service');

// Importar rutas
const authRoutes = require('./src/api/routes/auth.routes');
const settingsRoutes = require('./src/api/routes/settings.routes');
const accountsRoutes = require('./src/api/routes/accounts.routes');
const transactionsRoutes = require('./src/api/routes/transactions.routes');
const dashboardRoutes = require('./src/api/routes/dashboard.routes');
const currenciesRoutes = require('./src/api/routes/currencies.routes');
const scheduledTransactionsRoutes = require('./src/api/routes/scheduled-transactions.routes');

// Importar configuración de rate limiting inteligente
const { getRateLimitConfig } = require('./src/config/rate-limit');

// Crear aplicación Express
const app = express();

// Puerto del servidor
const PORT = process.env.PORT || 3001;

/**
 * MIDDLEWARES GLOBALES
 */

// Helmet para seguridad HTTP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS - Configuración para desarrollo y producción
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parser de JSON con límites optimizados
app.use(express.json({ limit: '5mb' }));

// Parser de URL encoded con límites optimizados
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Middleware de timeout para todas las rutas
app.use((req, res, next) => {
  // Establecer timeout de 30 segundos para todas las operaciones
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// Middleware de compresión (si está disponible)
if (process.env.NODE_ENV === 'production') {
  try {
    const compression = require('compression');
    app.use(compression());
  } catch (error) {
    console.log('⚠️ Compression middleware no disponible');
  }
}

// Middleware de rate limiting inteligente
app.use((req, res, next) => {
  // Obtener configuración de rate limit para esta ruta
  const rateLimitConfig = getRateLimitConfig(req.path, req.method);
  
  // Si no hay configuración, continuar sin rate limiting
  if (!rateLimitConfig) {
    return next();
  }
  
  // Implementar rate limiting inteligente por IP
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!req.app.locals.rateLimit) {
    req.app.locals.rateLimit = new Map();
  }
  
  const clientData = req.app.locals.rateLimit.get(clientIP) || { 
    count: 0, 
    resetTime: now + rateLimitConfig.windowMs,
    lastRequest: now
  };
  
  // Resetear contador si ha pasado la ventana de tiempo
  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + rateLimitConfig.windowMs;
    clientData.lastRequest = now;
  } else {
    // Solo incrementar si han pasado al menos 100ms desde la última request
    if (now - clientData.lastRequest > 100) {
      clientData.count++;
      clientData.lastRequest = now;
    }
  }
  
  // Verificar límite
  if (clientData.count > rateLimitConfig.limit) {
    return res.status(429).json({ 
      success: false, 
      message: rateLimitConfig.message,
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      limit: rateLimitConfig.limit,
      windowMs: rateLimitConfig.windowMs
    });
  }
  
  req.app.locals.rateLimit.set(clientIP, clientData);
  next();
});

/**
 * RUTAS DE LA API
 */

// Ruta de salud del servidor
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor MoneyApp funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de configuración
app.use('/api/configuracion', settingsRoutes);

// Rutas de cuentas
app.use('/api/cuentas', accountsRoutes);

// Rutas de transacciones
app.use('/api/transacciones', transactionsRoutes);

// Rutas del dashboard
app.use('/api/dashboard', dashboardRoutes);

// 🚨 NUEVO: Rutas de monedas soportadas
app.use('/api/currencies', currenciesRoutes);

// 🚨 NUEVO: Rutas de transacciones programadas
app.use('/api/transacciones-programadas', scheduledTransactionsRoutes);

// Ruta para endpoints no encontrados
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

/**
 * MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
 */
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

/**
 * INICIAR SERVIDOR
 */
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    console.log('🔗 Probando conexión a la base de datos...');
    await testConnection();
    
    // Inicializar el scheduler de transacciones programadas
    console.log('⏰ Inicializando scheduler de transacciones programadas...');
    scheduledTransactionsService.initializeScheduler();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ================================');
      console.log('   MONEYAPP BACKEND INICIADO');
      console.log('🚀 ================================');
      console.log(`📡 Servidor corriendo en puerto: ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📅 Fecha: ${new Date().toLocaleString('es-ES')}`);
      console.log('');
      console.log('📋 Endpoints disponibles:');
      console.log('   GET  /health');
      console.log('   POST /api/auth/registro');
      console.log('   POST /api/auth/login');
      console.log('   GET  /api/auth/perfil');
      console.log('   GET  /api/configuracion/tipos-cuenta');
      console.log('   POST /api/configuracion/tipos-cuenta');
      console.log('   GET  /api/configuracion/categorias');
      console.log('   POST /api/configuracion/categorias');
      console.log('   GET  /api/cuentas');
      console.log('   POST /api/cuentas');
      console.log('   GET  /api/cuentas/resumen');
      console.log('   GET  /api/transacciones');
      console.log('   POST /api/transacciones');
      console.log('   GET  /api/transacciones/estadisticas');
      console.log('');
      console.log('🔗 URL del servidor:');
      console.log(`   http://localhost:${PORT}`);
      console.log('🚀 ================================');
    });
    
  } catch (error) {
    console.error('❌ Error fatal al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

// Manejar cierre graceful del servidor
process.on('SIGTERM', () => {
  console.log('📴 Cerrando servidor gracefully...');
  scheduledTransactionsService.stopScheduler();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Cerrando servidor gracefully...');
  scheduledTransactionsService.stopScheduler();
  process.exit(0);
});

// Iniciar el servidor
startServer();
