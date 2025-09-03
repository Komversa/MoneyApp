const accountsService = require('../services/accounts.service');

/**
 * Controlador de cuentas - Maneja las peticiones HTTP
 * y delega la lógica de negocio al servicio
 */
class AccountsController {

  /**
   * Obtener todas las cuentas del usuario autenticado
   * GET /api/cuentas?category=asset|liability
   */
  async obtenerCuentas(req, res) {
    try {
      const userId = req.user.id;
      const { category } = req.query;

      // Validar categoría si se especifica
      if (category && !['asset', 'liability'].includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'La categoría debe ser "asset" o "liability"'
        });
      }

      const accounts = await accountsService.obtenerCuentasPorUsuario(userId, category);

      res.status(200).json({
        success: true,
        message: 'Cuentas obtenidas exitosamente',
        data: { accounts }
      });

    } catch (error) {
      console.error('Error al obtener cuentas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener una cuenta específica
   * GET /api/cuentas/:id
   */
  async obtenerCuentaPorId(req, res) {
    try {
      const userId = req.user.id;
      const accountId = parseInt(req.params.id);

      // Validar ID
      if (!accountId || isNaN(accountId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta inválido'
        });
      }

      const account = await accountsService.obtenerCuentaPorId(userId, accountId);

      res.status(200).json({
        success: true,
        message: 'Cuenta obtenida exitosamente',
        data: { account }
      });

    } catch (error) {
      if (error.message === 'Cuenta no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al obtener cuenta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Crear una nueva cuenta
   * POST /api/cuentas
   */
  async crearCuenta(req, res) {
    try {
      const userId = req.user.id;
      const { 
        name, 
        accountTypeId, 
        initialBalance, 
        currency,
        accountCategory = 'asset',
        // Campos específicos para deudas
        interestRate,
        dueDate,
        originalAmount
      } = req.body;

      // Validaciones básicas
      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la cuenta es requerido'
        });
      }

      if (!accountTypeId || isNaN(parseInt(accountTypeId))) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de cuenta es requerido y debe ser válido'
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

      // Validar saldo inicial si se proporciona
      if (initialBalance !== undefined) {
        if (isNaN(parseFloat(initialBalance))) {
          return res.status(400).json({
            success: false,
            message: 'El saldo inicial debe ser un número válido'
          });
        }
      }

      // Validar moneda si se proporciona
      if (currency !== undefined) {
        if (typeof currency !== 'string' || currency.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: 'La moneda debe ser una cadena válida'
          });
        }
      }

      // Validaciones específicas para categoría
      if (!['asset', 'liability'].includes(accountCategory)) {
        return res.status(400).json({
          success: false,
          message: 'La categoría de cuenta debe ser "asset" o "liability"'
        });
      }

      // Validaciones específicas para pasivos
      if (accountCategory === 'liability') {
        if (!originalAmount || isNaN(parseFloat(originalAmount)) || parseFloat(originalAmount) <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Para cuentas de pasivo se requiere el monto original de la deuda'
          });
        }

        if (interestRate !== undefined && (isNaN(parseFloat(interestRate)) || parseFloat(interestRate) < 0)) {
          return res.status(400).json({
            success: false,
            message: 'La tasa de interés debe ser un número no negativo'
          });
        }

        if (dueDate && !Date.parse(dueDate)) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de vencimiento debe ser una fecha válida'
          });
        }
      }

      const newAccount = await accountsService.crearCuentaParaUsuario(userId, {
        name,
        accountTypeId: parseInt(accountTypeId),
        initialBalance: initialBalance ? parseFloat(initialBalance) : 0,
        currency: currency || 'NIO',
        accountCategory,
        interestRate: interestRate ? parseFloat(interestRate) : null,
        dueDate: dueDate || null,
        originalAmount: originalAmount ? parseFloat(originalAmount) : null
      });

      res.status(201).json({
        success: true,
        message: 'Cuenta creada exitosamente',
        data: { account: newAccount }
      });

    } catch (error) {
      const knownErrors = [
        'Tipo de cuenta no válido',
        'Ya existe una cuenta con ese nombre',
        'Configuración de usuario no encontrada',
        'La categoría de cuenta debe ser "asset" o "liability"',
        'Para cuentas de tipo pasivo se requiere el monto original de la deuda'
      ];

      if (knownErrors.includes(error.message) || error.message.includes('Moneda no permitida')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al crear cuenta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualizar una cuenta
   * PUT /api/cuentas/:id
   */
  async actualizarCuenta(req, res) {
    try {
      const userId = req.user.id;
      const accountId = parseInt(req.params.id);
      const { name, accountTypeId, currency } = req.body;

      // Validar ID
      if (!accountId || isNaN(accountId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta inválido'
        });
      }

      // Validaciones del nombre si se proporciona
      if (name !== undefined) {
        if (!name || typeof name !== 'string') {
          return res.status(400).json({
            success: false,
            message: 'El nombre de la cuenta es requerido'
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

      // Validar tipo de cuenta si se proporciona
      if (accountTypeId !== undefined && (isNaN(parseInt(accountTypeId)) || parseInt(accountTypeId) <= 0)) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de cuenta debe ser un ID válido'
        });
      }

      // Validar moneda si se proporciona
      if (currency !== undefined) {
        if (typeof currency !== 'string' || currency.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: 'La moneda debe ser una cadena válida'
          });
        }
      }

      const updatedAccount = await accountsService.actualizarCuenta(userId, accountId, {
        name,
        accountTypeId: accountTypeId ? parseInt(accountTypeId) : undefined,
        currency
      });

      res.status(200).json({
        success: true,
        message: 'Cuenta actualizada exitosamente',
        data: { account: updatedAccount }
      });

    } catch (error) {
      if (error.message === 'Cuenta no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if ([
        'Tipo de cuenta no válido',
        'Ya existe una cuenta con ese nombre',
        'Moneda no permitida. Use la moneda principal o secundaria configurada'
      ].includes(error.message)) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al actualizar cuenta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Eliminar una cuenta
   * DELETE /api/cuentas/:id
   */
  async eliminarCuenta(req, res) {
    try {
      const userId = req.user.id;
      const accountId = parseInt(req.params.id);

      // Validar ID
      if (!accountId || isNaN(accountId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta inválido'
        });
      }

      await accountsService.eliminarCuenta(userId, accountId);

      res.status(200).json({
        success: true,
        message: 'Cuenta eliminada exitosamente'
      });

    } catch (error) {
      if (error.message === 'Cuenta no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message === 'No se puede eliminar una cuenta que tiene transacciones asociadas') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al eliminar cuenta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener resumen financiero del usuario
   * GET /api/cuentas/resumen
   */
  async obtenerResumenFinanciero(req, res) {
    try {
      const userId = req.user.id;

      const resumen = await accountsService.obtenerResumenFinanciero(userId);

      res.status(200).json({
        success: true,
        message: 'Resumen financiero obtenido exitosamente',
        data: { resumen }
      });

    } catch (error) {
      if (error.message === 'Configuración de usuario no encontrada') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al obtener resumen financiero:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener panel de estructura de patrimonio avanzado
   * GET /api/cuentas/panel-patrimonio
   */
  async obtenerPanelPatrimonio(req, res) {
    try {
      const userId = req.user.id;

      const panelPatrimonio = await accountsService.obtenerPanelPatrimonio(userId);

      res.status(200).json({
        success: true,
        message: 'Panel de patrimonio obtenido exitosamente',
        data: { patrimonio: panelPatrimonio }
      });

    } catch (error) {
      if (error.message === 'Configuración de usuario no encontrada') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al obtener panel de patrimonio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new AccountsController();