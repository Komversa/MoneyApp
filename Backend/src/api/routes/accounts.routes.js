const express = require('express');
const accountsController = require('../controllers/accounts.controller');
const { protegerRuta } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Rutas de cuentas
 * Base: /api/cuentas
 * TODAS las rutas requieren autenticación
 */

// Aplicar middleware de autenticación a todas las rutas
router.use(protegerRuta);

/**
 * ===========================================
 * RUTAS CRUD PARA CUENTAS
 * ===========================================
 */

// GET /api/cuentas/resumen - Obtener resumen financiero del usuario
// Debe ir antes de /:id para evitar conflictos
router.get('/resumen', accountsController.obtenerResumenFinanciero);

// GET /api/cuentas/panel-patrimonio - Obtener panel de estructura de patrimonio
router.get('/panel-patrimonio', accountsController.obtenerPanelPatrimonio);

// GET /api/cuentas - Obtener todas las cuentas del usuario
router.get('/', accountsController.obtenerCuentas);

// GET /api/cuentas/:id - Obtener una cuenta específica
router.get('/:id', accountsController.obtenerCuentaPorId);

// POST /api/cuentas - Crear nueva cuenta
router.post('/', accountsController.crearCuenta);

// PUT /api/cuentas/:id - Actualizar cuenta existente
router.put('/:id', accountsController.actualizarCuenta);

// DELETE /api/cuentas/:id - Eliminar cuenta
router.delete('/:id', accountsController.eliminarCuenta);

module.exports = router;