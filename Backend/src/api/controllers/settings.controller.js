const settingsService = require('../services/settings.service');

/**
 * Controlador de configuraciones - Maneja las peticiones HTTP
 * y delega la lógica de negocio al servicio
 */
class SettingsController {

  /**
   * ===========================================
   * TIPOS DE CUENTA (ACCOUNT TYPES)
   * ===========================================
   */

  /**
   * Obtener todos los tipos de cuenta del usuario autenticado
   * GET /api/configuracion/tipos-cuenta
   */
  async obtenerTiposCuenta(req, res) {
    try {
      const userId = req.user.id;

      const accountTypes = await settingsService.obtenerTiposCuentaPorUsuario(userId);

      res.status(200).json({
        success: true,
        message: 'Tipos de cuenta obtenidos exitosamente',
        data: { accountTypes }
      });

    } catch (error) {
      console.error('Error al obtener tipos de cuenta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Crear un nuevo tipo de cuenta
   * POST /api/configuracion/tipos-cuenta
   */
  async crearTipoCuenta(req, res) {
    try {
      const userId = req.user.id;
      const { name } = req.body;

      // Validaciones básicas
      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'El nombre del tipo de cuenta es requerido'
        });
      }

      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El nombre debe tener al menos 2 caracteres'
        });
      }

      if (name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: 'El nombre no puede exceder los 100 caracteres'
        });
      }

      const newAccountType = await settingsService.crearTipoCuentaParaUsuario(userId, { name });

      res.status(201).json({
        success: true,
        message: 'Tipo de cuenta creado exitosamente',
        data: { accountType: newAccountType }
      });

    } catch (error) {
      if (error.message === 'Ya existe un tipo de cuenta con ese nombre') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al crear tipo de cuenta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualizar un tipo de cuenta
   * PUT /api/configuracion/tipos-cuenta/:id
   */
  async actualizarTipoCuenta(req, res) {
    try {
      const userId = req.user.id;
      const accountTypeId = parseInt(req.params.id);
      const { name } = req.body;

      // Validar ID
      if (!accountTypeId || isNaN(accountTypeId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de tipo de cuenta inválido'
        });
      }

      // Validaciones del nombre si se proporciona
      if (name !== undefined) {
        if (!name || typeof name !== 'string') {
          return res.status(400).json({
            success: false,
            message: 'El nombre del tipo de cuenta es requerido'
          });
        }

        if (name.trim().length < 2) {
          return res.status(400).json({
            success: false,
            message: 'El nombre debe tener al menos 2 caracteres'
          });
        }

        if (name.trim().length > 100) {
          return res.status(400).json({
            success: false,
            message: 'El nombre no puede exceder los 100 caracteres'
          });
        }
      }

      const updatedAccountType = await settingsService.actualizarTipoCuenta(userId, accountTypeId, { name });

      res.status(200).json({
        success: true,
        message: 'Tipo de cuenta actualizado exitosamente',
        data: { accountType: updatedAccountType }
      });

    } catch (error) {
      if (error.message === 'Tipo de cuenta no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message === 'Ya existe un tipo de cuenta con ese nombre') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al actualizar tipo de cuenta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Eliminar un tipo de cuenta
   * DELETE /api/configuracion/tipos-cuenta/:id
   */
  async eliminarTipoCuenta(req, res) {
    try {
      const userId = req.user.id;
      const accountTypeId = parseInt(req.params.id);

      // Validar ID
      if (!accountTypeId || isNaN(accountTypeId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de tipo de cuenta inválido'
        });
      }

      await settingsService.eliminarTipoCuenta(userId, accountTypeId);

      res.status(200).json({
        success: true,
        message: 'Tipo de cuenta eliminado exitosamente'
      });

    } catch (error) {
      if (error.message === 'Tipo de cuenta no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al eliminar tipo de cuenta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * ===========================================
   * CATEGORÍAS (CATEGORIES)
   * ===========================================
   */

  /**
   * Obtener todas las categorías del usuario autenticado
   * GET /api/configuracion/categorias
   * Query params: ?type=income|expense (opcional)
   */
  async obtenerCategorias(req, res) {
    try {
      const userId = req.user.id;
      const { type } = req.query;

      // Validar el tipo si se proporciona
      if (type && !['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de categoría inválido. Debe ser "income" o "expense"'
        });
      }

      const categories = await settingsService.obtenerCategoriasPorUsuario(userId, type);

      res.status(200).json({
        success: true,
        message: 'Categorías obtenidas exitosamente',
        data: { categories }
      });

    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Crear una nueva categoría
   * POST /api/configuracion/categorias
   */
  async crearCategoria(req, res) {
    try {
      const userId = req.user.id;
      const { name, type } = req.body;

      // Validaciones básicas
      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la categoría es requerido'
        });
      }

      if (!type || !['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de categoría es requerido y debe ser "income" o "expense"'
        });
      }

      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El nombre debe tener al menos 2 caracteres'
        });
      }

      if (name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: 'El nombre no puede exceder los 100 caracteres'
        });
      }

      const newCategory = await settingsService.crearCategoriaParaUsuario(userId, { name, type });

      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: { category: newCategory }
      });

    } catch (error) {
      if (['Tipo de categoría inválido', 'Ya existe una categoría con ese nombre y tipo'].includes(error.message)) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al crear categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualizar una categoría
   * PUT /api/configuracion/categorias/:id
   */
  async actualizarCategoria(req, res) {
    try {
      const userId = req.user.id;
      const categoryId = parseInt(req.params.id);
      const { name, type } = req.body;

      // Validar ID
      if (!categoryId || isNaN(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de categoría inválido'
        });
      }

      // Validaciones del nombre si se proporciona
      if (name !== undefined) {
        if (!name || typeof name !== 'string') {
          return res.status(400).json({
            success: false,
            message: 'El nombre de la categoría es requerido'
          });
        }

        if (name.trim().length < 2) {
          return res.status(400).json({
            success: false,
            message: 'El nombre debe tener al menos 2 caracteres'
          });
        }

        if (name.trim().length > 100) {
          return res.status(400).json({
            success: false,
            message: 'El nombre no puede exceder los 100 caracteres'
          });
        }
      }

      // Validar el tipo si se proporciona
      if (type !== undefined && !['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de categoría debe ser "income" o "expense"'
        });
      }

      const updatedCategory = await settingsService.actualizarCategoria(userId, categoryId, { name, type });

      res.status(200).json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: { category: updatedCategory }
      });

    } catch (error) {
      if (error.message === 'Categoría no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (['Tipo de categoría inválido', 'Ya existe una categoría con ese nombre y tipo'].includes(error.message)) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al actualizar categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Eliminar una categoría
   * DELETE /api/configuracion/categorias/:id
   */
  async eliminarCategoria(req, res) {
    try {
      const userId = req.user.id;
      const categoryId = parseInt(req.params.id);

      // Validar ID
      if (!categoryId || isNaN(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de categoría inválido'
        });
      }

      await settingsService.eliminarCategoria(userId, categoryId);

      res.status(200).json({
        success: true,
        message: 'Categoría eliminada exitosamente'
      });

    } catch (error) {
      if (error.message === 'Categoría no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al eliminar categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * =========================================
   * CONFIGURACIÓN DE USUARIO
   * =========================================
   */

  /**
   * Actualizar configuración del usuario
   * PUT /api/configuracion/usuario
   */
  async actualizarConfiguracionUsuario(req, res) {
    try {
      const userId = req.user.id;
      const { theme, primary_currency } = req.body;

      // Validaciones
      if (theme && !['light', 'dark'].includes(theme)) {
        return res.status(400).json({
          success: false,
          message: 'El tema debe ser "light" o "dark"'
        });
      }

      if (primary_currency && !['USD', 'NIO'].includes(primary_currency)) {  // 🚨 CAMBIO: USD primero
        return res.status(400).json({
          success: false,
          message: 'La moneda principal debe ser "USD" o "NIO"'
        });
      }

      // Actualizar configuración
      const result = await settingsService.actualizarConfiguracionUsuario(userId, {
        theme,
        primary_currency
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Configuración actualizada exitosamente',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Error al actualizar configuración'
        });
      }

    } catch (error) {
      console.error('Error al actualizar configuración de usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualizar moneda principal con transición atómica
   * PUT /api/configuracion/moneda-principal
   */
  async actualizarMonedaPrincipal(req, res) {
    try {
      const userId = req.user.id;
      const { primary_currency } = req.body;

      // Validaciones
      if (!primary_currency) {
        return res.status(400).json({
          success: false,
          message: 'La moneda principal es requerida'
        });
      }

      // Validar que la moneda esté soportada (solo USD y NIO por ahora)
      const supportedCurrencies = ['USD', 'NIO'];  // 🚨 CAMBIO: Solo USD y NIO, USD primero
      if (!supportedCurrencies.includes(primary_currency)) {
        return res.status(400).json({
          success: false,
          message: 'La moneda principal debe ser "USD" o "NIO"'  // 🚨 CAMBIO: Mensaje actualizado
        });
      }

      // Actualizar moneda principal con transición atómica
      const result = await settingsService.updatePrimaryCurrency(userId, primary_currency);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            newPrimaryCurrency: result.newPrimaryCurrency,
            updatedRates: result.updatedRates
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Error al actualizar moneda principal'
        });
      }

    } catch (error) {
      console.error('Error al actualizar moneda principal:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * ===========================================
   * TASAS DE CAMBIO (EXCHANGE RATES)
   * ===========================================
   */

  /**
   * Obtener todas las tasas de cambio del usuario autenticado
   * GET /api/configuracion/tasas-cambio
   */
  async obtenerTasasCambio(req, res) {
    try {
      const userId = req.user.id;

      const tasasCambio = await settingsService.obtenerTasasCambioPorUsuario(userId);

      res.status(200).json({
        success: true,
        message: 'Tasas de cambio obtenidas exitosamente',
        data: { tasasCambio }
      });

    } catch (error) {
      console.error('Error al obtener tasas de cambio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Crear una nueva tasa de cambio
   * POST /api/configuracion/tasas-cambio
   */
  async crearTasaCambio(req, res) {
    try {
      const userId = req.user.id;
      const { currencyCode, rate } = req.body;

      // Validaciones básicas
      if (!currencyCode || typeof currencyCode !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'El código de moneda es requerido'
        });
      }

      if (!rate || isNaN(parseFloat(rate))) {
        return res.status(400).json({
          success: false,
          message: 'La tasa de cambio debe ser un número válido'
        });
      }

      if (parseFloat(rate) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La tasa de cambio debe ser un número positivo'
        });
      }

      if (currencyCode.trim().length < 2 || currencyCode.trim().length > 10) {
        return res.status(400).json({
          success: false,
          message: 'El código de moneda debe tener entre 2 y 10 caracteres'
        });
      }

      const newRate = await settingsService.crearTasaCambioParaUsuario(userId, {
        currencyCode: currencyCode.trim(),
        rate: parseFloat(rate)
      });

      res.status(201).json({
        success: true,
        message: 'Tasa de cambio creada exitosamente',
        data: { tasaCambio: newRate }
      });

    } catch (error) {
      if ([
        'La tasa de cambio debe ser un número positivo',
        'El código de moneda es requerido',
        'Ya existe una tasa de cambio para esta moneda',
        'No se puede crear una tasa de cambio para la moneda principal'
      ].includes(error.message)) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al crear tasa de cambio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualizar una tasa de cambio existente
   * PUT /api/configuracion/tasas-cambio/:currency_code
   */
  async actualizarTasaCambio(req, res) {
    try {
      const userId = req.user.id;
      const { currency_code } = req.params;
      const { rate } = req.body;

      // Validar parámetros
      if (!currency_code || typeof currency_code !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Código de moneda inválido'
        });
      }

      if (!rate || isNaN(parseFloat(rate))) {
        return res.status(400).json({
          success: false,
          message: 'La tasa de cambio debe ser un número válido'
        });
      }

      if (parseFloat(rate) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La tasa de cambio debe ser un número positivo'
        });
      }

      const updatedRate = await settingsService.actualizarTasaCambio(userId, currency_code, {
        rate: parseFloat(rate)
      });

      res.status(200).json({
        success: true,
        message: 'Tasa de cambio actualizada exitosamente',
        data: { tasaCambio: updatedRate }
      });

    } catch (error) {
      if (error.message === 'Tasa de cambio no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message === 'La tasa de cambio debe ser un número positivo') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al actualizar tasa de cambio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Eliminar una tasa de cambio
   * DELETE /api/configuracion/tasas-cambio/:currency_code
   */
  async eliminarTasaCambio(req, res) {
    try {
      const userId = req.user.id;
      const { currency_code } = req.params;

      // Validar parámetros
      if (!currency_code || typeof currency_code !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Código de moneda inválido'
        });
      }

      await settingsService.eliminarTasaCambio(userId, currency_code);

      res.status(200).json({
        success: true,
        message: 'Tasa de cambio eliminada exitosamente'
      });

    } catch (error) {
      if (error.message === 'Tasa de cambio no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message === 'No se puede eliminar la tasa de cambio porque hay cuentas que usan esta moneda') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al eliminar tasa de cambio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new SettingsController();