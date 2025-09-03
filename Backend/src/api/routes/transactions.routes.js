const express = require('express');
const transactionsController = require('../controllers/transactions.controller');
const { protegerRuta } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Rutas de transacciones
 * Base: /api/transacciones
 * TODAS las rutas requieren autenticación
 */

// Aplicar middleware de autenticación a todas las rutas
router.use(protegerRuta);

/**
 * ===========================================
 * RUTAS CRUD PARA TRANSACCIONES
 * ===========================================
 */

// GET /api/transacciones/estadisticas - Obtener estadísticas de transacciones
// Debe ir antes de /:id para evitar conflictos
router.get('/estadisticas', transactionsController.obtenerEstadisticas);

// GET /api/transacciones/resumen - Obtener resumen de transacciones para dashboard
// Query params opcionales: startDate, endDate
router.get('/resumen', transactionsController.obtenerResumen);

// POST /api/transacciones/export - Exportar transacciones a Excel
// Body: { startDate, endDate, type } (opcionales)
router.post('/export', transactionsController.exportarTransacciones);

// GET /api/transacciones - Obtener todas las transacciones del usuario
// Query params opcionales: startDate, endDate, type, accountId, categoryId, limit, offset
router.get('/', transactionsController.obtenerTransacciones);

// GET /api/transacciones/:id - Obtener una transacción específica
router.get('/:id', transactionsController.obtenerTransaccionPorId);

// POST /api/transacciones - Crear nueva transacción
router.post('/', transactionsController.crearTransaccion);

// PUT /api/transacciones/:id - Actualizar transacción existente
router.put('/:id', transactionsController.actualizarTransaccion);

// DELETE /api/transacciones/:id - Eliminar transacción
router.delete('/:id', transactionsController.eliminarTransaccion);

module.exports = router;