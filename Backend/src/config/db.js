const knex = require('knex');
const knexConfig = require('../../knexfile');

// Determinar el entorno actual
const environment = process.env.NODE_ENV || 'development';

// Inicializar Knex con la configuración apropiada
const db = knex(knexConfig[environment]);

// Función para probar la conexión
const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Conexión a la base de datos establecida correctamente');
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    process.exit(1);
  }
};

module.exports = {
  db,
  testConnection
};