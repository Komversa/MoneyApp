const authService = require('../services/auth.service');

/**
 * Controlador de autenticación - Capa delgada que maneja req/res
 */
class AuthController {
  /**
   * Registrar nuevo usuario
   * POST /api/auth/registro
   */
  async register(req, res) {
    try {
      // Extraer y validar datos del body
      const { email, password } = req.body;

      // Validaciones básicas
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }

      // Validar longitud de contraseña
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // Llamar al servicio
      const result = await authService.register({
        email: email.toLowerCase().trim(),
        password
      });

      // Respuesta exitosa
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result
      });

    } catch (error) {
      // Manejar errores conocidos
      if (error.message === 'El usuario ya existe') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      // Error interno del servidor
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Iniciar sesión
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      // Extraer y validar datos del body
      const { email, password } = req.body;

      // Validaciones básicas
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      // Llamar al servicio
      const result = await authService.login({
        email: email.toLowerCase().trim(),
        password
      });

      // Respuesta exitosa
      res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: result
      });

    } catch (error) {
      // Manejar errores conocidos
      if (error.message === 'Credenciales inválidas') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      // Error interno del servidor
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   * GET /api/auth/perfil
   */
  async getProfile(req, res) {
    try {
      // El usuario ya está autenticado por el middleware
      const userId = req.user.id;

      // Obtener información completa del usuario
      const userData = await authService.getUserById(userId);

      res.status(200).json({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: userData
      });

    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Renovar token de acceso usando refresh token
   * POST /api/auth/refresh
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token es requerido'
        });
      }

      // Llamar al servicio para renovar el token
      const result = await authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token renovado exitosamente',
        data: result
      });

    } catch (error) {
      console.error('Error al renovar token:', error);
      
      if (error.message === 'Refresh token expirado' || 
          error.message === 'Refresh token inválido') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new AuthController();