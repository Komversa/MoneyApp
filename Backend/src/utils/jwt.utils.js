const jwt = require('jsonwebtoken');

/**
 * Configuración de expiración para los tokens
 */
const TOKEN_EXPIRATION = {
  ACCESS: '15m',   // Token de acceso: 15 minutos
  REFRESH: '7d'    // Token de refresco: 7 días
};

/**
 * Generar un par de tokens (access y refresh) para un usuario
 * @param {Object} payload - Datos del usuario (id, email)
 * @returns {Object} - Objeto con accessToken y refreshToken
 */
const generateTokenPair = (payload) => {
  try {
    const accessToken = jwt.sign(
      payload, 
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: TOKEN_EXPIRATION.ACCESS }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: TOKEN_EXPIRATION.REFRESH }
    );

    return {
      accessToken,
      refreshToken
    };
  } catch (error) {
    throw new Error('Error al generar los tokens JWT');
  }
};

/**
 * Verificar y decodificar un token de acceso
 * @param {string} token - Token a verificar
 * @returns {Object} - Payload decodificado
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token de acceso expirado');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token de acceso inválido');
    }
    throw new Error('Error al verificar el token de acceso');
  }
};

/**
 * Verificar y decodificar un token de refresco
 * @param {string} token - Token de refresco a verificar
 * @returns {Object} - Payload decodificado
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token de refresco expirado');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token de refresco inválido');
    }
    throw new Error('Error al verificar el token de refresco');
  }
};

module.exports = {
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken
};