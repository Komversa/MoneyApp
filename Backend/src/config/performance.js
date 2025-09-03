/**
 * Configuración de rendimiento para el backend
 * Optimizaciones para mejorar tiempos de respuesta y evitar timeouts
 */

module.exports = {
  // Timeouts de base de datos
  database: {
    queryTimeout: 30000,        // 30 segundos para queries
    connectionTimeout: 60000,   // 60 segundos para conexiones
    poolTimeout: 30000,         // 30 segundos para pool
  },

  // Timeouts de API
  api: {
    requestTimeout: 30000,      // 30 segundos para requests
    responseTimeout: 30000,     // 30 segundos para responses
    uploadTimeout: 60000,       // 60 segundos para uploads
  },

  // Configuración de caché
  cache: {
    ttl: 300,                   // 5 minutos de TTL
    maxSize: 100,               // Máximo 100 items en caché
    checkPeriod: 600,           // Revisar cada 10 minutos
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 100,                   // Máximo 100 requests por ventana
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos'
  },

  // Compresión
  compression: {
    level: 6,                   // Nivel de compresión (0-9)
    threshold: 1024,            // Comprimir solo archivos > 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  },

  // Logging de rendimiento
  performanceLogging: {
    enabled: process.env.NODE_ENV === 'production',
    slowQueryThreshold: 1000,   // Log queries que tomen > 1 segundo
    slowRequestThreshold: 2000, // Log requests que tomen > 2 segundos
  }
};
