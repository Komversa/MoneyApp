const express = require('express');
const authController = require('../controllers/auth.controller');
const { protegerRuta } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Rutas de autenticación
 * Base: /api/auth
 */

// POST /api/auth/registro - Registrar nuevo usuario
router.post('/registro', authController.register);

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// POST /api/auth/refresh - Renovar token de acceso
router.post('/refresh', authController.refreshToken);

// GET /api/auth/perfil - Obtener perfil del usuario autenticado
router.get('/perfil', protegerRuta, authController.getProfile);

module.exports = router;