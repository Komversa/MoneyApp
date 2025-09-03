const { verifyAccessToken } = require('../../utils/jwt.utils');

/**
 * Middleware de autenticación para proteger rutas
 * Verifica el token JWT y adjunta los datos del usuario al request
 */
const protegerRuta = (req, res, next) => {
  try {
    // Obtener el header de autorización
    const authHeader = req.headers.authorization;

    // Verificar que el header existe y tiene el formato correcto
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Extraer el token (remover "Bearer " del inicio)
    const token = authHeader.substring(7);

    // Verificar el token JWT
    const decodedToken = verifyAccessToken(token);

    // Adjuntar los datos del usuario al request
    req.user = {
      id: decodedToken.id,
      email: decodedToken.email
    };

    // Continuar con el siguiente middleware/controlador
    next();

  } catch (error) {
    // Manejar diferentes tipos de errores de token
    let message = 'Token de acceso inválido';
    
    if (error.message === 'Token de acceso expirado') {
      message = 'Token de acceso expirado';
    } else if (error.message === 'Token de acceso inválido') {
      message = 'Token de acceso inválido';
    }

    return res.status(401).json({
      success: false,
      message
    });
  }
};

/**
 * Middleware opcional para rutas que pueden o no requerir autenticación
 * Si hay token, lo verifica y adjunta el usuario; si no hay, continúa sin usuario
 */
const autenticacionOpcional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No hay token, continuar sin usuario
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decodedToken = verifyAccessToken(token);

    req.user = {
      id: decodedToken.id,
      email: decodedToken.email
    };

    next();

  } catch (error) {
    // Si hay error en el token, continuar sin usuario
    req.user = null;
    next();
  }
};

module.exports = {
  protegerRuta,
  autenticacionOpcional
};