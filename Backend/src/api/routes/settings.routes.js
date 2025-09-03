const express = require('express');
const settingsController = require('../controllers/settings.controller');
const { protegerRuta } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Rutas de configuración
 * Base: /api/configuracion
 * TODAS las rutas requieren autenticación
 */

// Aplicar middleware de autenticación a todas las rutas
router.use(protegerRuta);

/**
 * ===========================================
 * RUTAS PARA TIPOS DE CUENTA
 * ===========================================
 */

// GET /api/configuracion/tipos-cuenta - Obtener todos los tipos de cuenta
router.get('/tipos-cuenta', settingsController.obtenerTiposCuenta);

// POST /api/configuracion/tipos-cuenta - Crear nuevo tipo de cuenta
router.post('/tipos-cuenta', settingsController.crearTipoCuenta);

// PUT /api/configuracion/tipos-cuenta/:id - Actualizar tipo de cuenta
router.put('/tipos-cuenta/:id', settingsController.actualizarTipoCuenta);

// DELETE /api/configuracion/tipos-cuenta/:id - Eliminar tipo de cuenta
router.delete('/tipos-cuenta/:id', settingsController.eliminarTipoCuenta);

/**
 * ===========================================
 * RUTAS PARA CATEGORÍAS
 * ===========================================
 */

// GET /api/configuracion/categorias - Obtener todas las categorías
// Query params opcionales: ?type=income|expense
router.get('/categorias', settingsController.obtenerCategorias);

// POST /api/configuracion/categorias - Crear nueva categoría
router.post('/categorias', settingsController.crearCategoria);

// PUT /api/configuracion/categorias/:id - Actualizar categoría
router.put('/categorias/:id', settingsController.actualizarCategoria);

// DELETE /api/configuracion/categorias/:id - Eliminar categoría
router.delete('/categorias/:id', settingsController.eliminarCategoria);

/**
 * ===========================================
 * RUTAS PARA TASAS DE CAMBIO
 * ===========================================
 */

// GET /api/configuracion/tasas-cambio - Obtener todas las tasas de cambio del usuario
router.get('/tasas-cambio', settingsController.obtenerTasasCambio);

// POST /api/configuracion/tasas-cambio - Crear nueva tasa de cambio
router.post('/tasas-cambio', settingsController.crearTasaCambio);

// PUT /api/configuracion/tasas-cambio/:currency_code - Actualizar tasa de cambio existente
router.put('/tasas-cambio/:currency_code', settingsController.actualizarTasaCambio);

// DELETE /api/configuracion/tasas-cambio/:currency_code - Eliminar tasa de cambio
router.delete('/tasas-cambio/:currency_code', settingsController.eliminarTasaCambio);

/**
 * ===========================================
 * RUTAS PARA CONFIGURACIÓN DE USUARIO
 * ===========================================
 */

// PUT /api/configuracion/usuario - Actualizar configuración del usuario
router.put('/usuario', settingsController.actualizarConfiguracionUsuario);

// PUT /api/configuracion/moneda-principal - Actualizar moneda principal con transición atómica
router.put('/moneda-principal', settingsController.actualizarMonedaPrincipal);

module.exports = router;