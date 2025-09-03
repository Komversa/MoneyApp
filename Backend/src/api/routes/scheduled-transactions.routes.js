const express = require('express');
const scheduledTransactionsController = require('../controllers/scheduled-transactions.controller');
const { protegerRuta } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Rutas de transacciones programadas
 * Base: /api/transacciones-programadas
 * TODAS las rutas requieren autenticación
 */

// Aplicar middleware de autenticación a todas las rutas
router.use(protegerRuta);

/**
 * ===========================================
 * RUTAS CRUD PARA TRANSACCIONES PROGRAMADAS
 * ===========================================
 */

// GET /api/transacciones-programadas/scheduler/status - Obtener estado del scheduler
// Debe ir antes de /:id para evitar conflictos
router.get('/scheduler/status', scheduledTransactionsController.obtenerEstadoScheduler);

// POST /api/transacciones-programadas/scheduler/run - Ejecutar scheduler manualmente (desarrollo/testing)
router.post('/scheduler/run', scheduledTransactionsController.ejecutarSchedulerManual);

// GET /api/transacciones-programadas - Obtener todas las transacciones programadas del usuario
// Query params opcionales: is_active, transaction_type
router.get('/', scheduledTransactionsController.obtenerTransaccionesProgramadas);

// GET /api/transacciones-programadas/:id - Obtener una transacción programada específica
router.get('/:id', scheduledTransactionsController.obtenerTransaccionProgramada);

// POST /api/transacciones-programadas - Crear nueva transacción programada
router.post('/', scheduledTransactionsController.crearTransaccionProgramada);

// PUT /api/transacciones-programadas/:id - Actualizar transacción programada existente
router.put('/:id', scheduledTransactionsController.actualizarTransaccionProgramada);

// PATCH /api/transacciones-programadas/:id/toggle - Pausar/reanudar transacción programada
router.patch('/:id/toggle', scheduledTransactionsController.toggleTransaccionProgramada);

// DELETE /api/transacciones-programadas/:id - Eliminar transacción programada
router.delete('/:id', scheduledTransactionsController.eliminarTransaccionProgramada);

module.exports = router;
