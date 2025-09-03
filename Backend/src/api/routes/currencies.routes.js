const express = require('express');
const router = express.Router();
const currenciesController = require('../controllers/currencies.controller');
const { protegerRuta } = require('../middlewares/auth.middleware');

/**
 * Rutas para manejo de monedas soportadas
 */

// Obtener todas las monedas soportadas (público)
router.get('/', currenciesController.obtenerMonedasSoportadas);

// Obtener tasas de cambio del usuario (requiere autenticación)
router.get('/user/rates', protegerRuta, currenciesController.obtenerTasasUsuario);

// Convertir moneda (requiere autenticación)
router.post('/convert', protegerRuta, currenciesController.convertirMoneda);

// Obtener una moneda específica por código (público)
router.get('/:code', currenciesController.obtenerMonedaPorCodigo);

module.exports = router;
