const bcrypt = require('bcrypt');

/**
 * Número de rondas para el salt de bcrypt
 * Valor más alto = más seguro pero más lento
 */
const SALT_ROUNDS = 12;

/**
 * Hashear una contraseña usando bcrypt
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} - Contraseña hasheada
 */
const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new Error('Error al hashear la contraseña');
  }
};

/**
 * Verificar una contraseña contra su hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado en la base de datos
 * @returns {Promise<boolean>} - true si la contraseña es válida
 */
const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error('Error al verificar la contraseña');
  }
};

module.exports = {
  hashPassword,
  verifyPassword
};