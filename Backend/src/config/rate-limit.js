/**
 * Configuración inteligente de rate limiting
 * Permite más requests para operaciones legítimas y excluye ciertas rutas
 */

const RATE_LIMIT_CONFIG = {
  // Rutas excluidas del rate limiting
  excludedPaths: [
    '/health',
    '/api/auth/login',
    '/api/auth/register',
    '/api/configuracion/tasas-cambio',
    '/api/currencies'
  ],

  // Configuración por tipo de ruta
  routeTypes: {
    // Rutas de lectura (más permisivas)
    read: {
      limit: 500,        // 500 requests por minuto
      windowMs: 60000,   // 1 minuto
      message: 'Demasiadas solicitudes de lectura. Intenta de nuevo en un minuto.'
    },
    
    // Rutas de escritura (menos permisivas)
    write: {
      limit: 100,        // 100 requests por minuto
      windowMs: 60000,   // 1 minuto
      message: 'Demasiadas solicitudes de escritura. Intenta de nuevo en un minuto.'
    },
    
    // Rutas críticas (muy permisivas)
    critical: {
      limit: 1000,       // 1000 requests por minuto
      windowMs: 60000,   // 1 minuto
      message: 'Demasiadas solicitudes críticas. Intenta de nuevo en un minuto.'
    }
  },

  // Mapeo de rutas a tipos
  routeMapping: {
    // Rutas de lectura
    read: [
      '/api/configuracion/tasas-cambio',
      '/api/currencies',
      '/api/dashboard',
      '/api/cuentas',
      '/api/transacciones'
    ],
    
    // Rutas de escritura
    write: [
      '/api/configuracion',
      '/api/cuentas',
      '/api/transacciones',
      '/api/transacciones-programadas'
    ],
    
    // Rutas críticas
    critical: [
      '/api/auth/login',
      '/api/auth/register',
      '/health'
    ]
  }
};

/**
 * Determinar el tipo de ruta basado en la URL
 */
function getRouteType(path, method) {
  // Rutas críticas siempre tienen prioridad
  if (RATE_LIMIT_CONFIG.routeMapping.critical.some(route => path.includes(route))) {
    return 'critical';
  }
  
  // Rutas de escritura para métodos POST, PUT, DELETE, PATCH
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
    return 'write';
  }
  
  // Rutas de lectura para métodos GET
  if (method.toUpperCase() === 'GET') {
    return 'read';
  }
  
  // Por defecto, tratar como escritura
  return 'write';
}

/**
 * Obtener configuración de rate limit para una ruta específica
 */
function getRateLimitConfig(path, method) {
  // Si la ruta está excluida, no aplicar rate limiting
  if (RATE_LIMIT_CONFIG.excludedPaths.some(excludedPath => path.includes(excludedPath))) {
    return null;
  }
  
  const routeType = getRouteType(path, method);
  return RATE_LIMIT_CONFIG.routeTypes[routeType];
}

module.exports = {
  RATE_LIMIT_CONFIG,
  getRouteType,
  getRateLimitConfig
};
