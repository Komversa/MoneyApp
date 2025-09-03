const transactionsService = require('../services/transactions.service');

/**
 * Controlador de transacciones - Maneja las peticiones HTTP
 * y delega la lógica de negocio al servicio
 */
class TransactionsController {

  /**
   * Obtener todas las transacciones del usuario autenticado
   * GET /api/transacciones
   * Query params: startDate, endDate, type, accountId, categoryId, limit, offset
   */
  async obtenerTransacciones(req, res) {
    try {
      const userId = req.user.id;
      const {
        startDate,
        endDate,
        type,
        accountId,
        categoryId,
        limit,
        offset
      } = req.query;

      // Validar parámetros opcionales
      const filters = {};

      if (startDate) {
        if (isNaN(Date.parse(startDate))) {
          return res.status(400).json({
            success: false,
            message: 'Fecha de inicio inválida'
          });
        }
        filters.startDate = startDate;
      }

      if (endDate) {
        if (isNaN(Date.parse(endDate))) {
          return res.status(400).json({
            success: false,
            message: 'Fecha de fin inválida'
          });
        }
        filters.endDate = endDate;
      }

      if (type && !['income', 'expense', 'transfer'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de transacción inválido. Debe ser "income", "expense" o "transfer"'
        });
      }
      if (type) filters.type = type;

      if (accountId) {
        const accountIdNumber = parseInt(accountId);
        if (isNaN(accountIdNumber)) {
          return res.status(400).json({
            success: false,
            message: 'ID de cuenta inválido'
          });
        }
        filters.accountId = accountIdNumber;
      }

      if (categoryId) {
        const categoryIdNumber = parseInt(categoryId);
        if (isNaN(categoryIdNumber)) {
          return res.status(400).json({
            success: false,
            message: 'ID de categoría inválido'
          });
        }
        filters.categoryId = categoryIdNumber;
      }

      if (limit) {
        const limitNumber = parseInt(limit);
        if (isNaN(limitNumber) || limitNumber <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Límite debe ser un número positivo'
          });
        }
        filters.limit = Math.min(limitNumber, 100); // Máximo 100
      }

      if (offset) {
        const offsetNumber = parseInt(offset);
        if (isNaN(offsetNumber) || offsetNumber < 0) {
          return res.status(400).json({
            success: false,
            message: 'Offset debe ser un número no negativo'
          });
        }
        filters.offset = offsetNumber;
      }

      const transactions = await transactionsService.obtenerTransaccionesPorUsuario(userId, filters);

      res.status(200).json({
        success: true,
        message: 'Transacciones obtenidas exitosamente',
        data: { 
          transactions: transactions.transactions,
          totalItems: transactions.totalCount
        }
      });

    } catch (error) {
      console.error('Error al obtener transacciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener una transacción específica
   * GET /api/transacciones/:id
   */
  async obtenerTransaccionPorId(req, res) {
    try {
      const userId = req.user.id;
      const transactionId = parseInt(req.params.id);

      // Validar ID
      if (!transactionId || isNaN(transactionId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de transacción inválido'
        });
      }

      const transaction = await transactionsService.obtenerTransaccionPorId(userId, transactionId);

      res.status(200).json({
        success: true,
        message: 'Transacción obtenida exitosamente',
        data: { transaction }
      });

    } catch (error) {
      if (error.message === 'Transacción no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al obtener transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Crear una nueva transacción
   * POST /api/transacciones
   */
  async crearTransaccion(req, res) {
    try {
      const userId = req.user.id;
      const {
        type,
        amount,
        transactionDate,
        categoryId,
        fromAccountId,
        toAccountId,
        description
      } = req.body;

      // Validaciones básicas
      if (!type || !['income', 'expense', 'transfer'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de transacción es requerido y debe ser "income", "expense" o "transfer"'
        });
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto es requerido y debe ser un número positivo'
        });
      }

      if (!transactionDate || isNaN(Date.parse(transactionDate))) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de transacción es requerida y debe ser válida'
        });
      }

      // Validaciones específicas por tipo
      if (type === 'expense') {
        if (!fromAccountId || isNaN(parseInt(fromAccountId))) {
          return res.status(400).json({
            success: false,
            message: 'Los gastos requieren una cuenta de origen válida'
          });
        }
        if (toAccountId) {
          return res.status(400).json({
            success: false,
            message: 'Los gastos no deben tener cuenta de destino'
          });
        }
      } else if (type === 'income') {
        if (!toAccountId || isNaN(parseInt(toAccountId))) {
          return res.status(400).json({
            success: false,
            message: 'Los ingresos requieren una cuenta de destino válida'
          });
        }
        if (fromAccountId) {
          return res.status(400).json({
            success: false,
            message: 'Los ingresos no deben tener cuenta de origen'
          });
        }
      } else if (type === 'transfer') {
        if (!fromAccountId || isNaN(parseInt(fromAccountId))) {
          return res.status(400).json({
            success: false,
            message: 'Las transferencias requieren una cuenta de origen válida'
          });
        }
        if (!toAccountId || isNaN(parseInt(toAccountId))) {
          return res.status(400).json({
            success: false,
            message: 'Las transferencias requieren una cuenta de destino válida'
          });
        }
        if (parseInt(fromAccountId) === parseInt(toAccountId)) {
          return res.status(400).json({
            success: false,
            message: 'Las cuentas de origen y destino deben ser diferentes'
          });
        }
      }

      // Validar categoryId si se proporciona
      if (categoryId && (isNaN(parseInt(categoryId)) || parseInt(categoryId) <= 0)) {
        return res.status(400).json({
          success: false,
          message: 'El ID de categoría debe ser un número válido'
        });
      }

      // Validar descripción si se proporciona
      if (description && (typeof description !== 'string' || description.trim().length > 500)) {
        return res.status(400).json({
          success: false,
          message: 'La descripción debe ser texto y no exceder 500 caracteres'
        });
      }

      const newTransaction = await transactionsService.crearTransaccionParaUsuario(userId, {
        type,
        amount: parseFloat(amount),
        transactionDate,
        categoryId: categoryId ? parseInt(categoryId) : null,
        fromAccountId: fromAccountId ? parseInt(fromAccountId) : null,
        toAccountId: toAccountId ? parseInt(toAccountId) : null,
        description: description ? description.trim() : null
      });

      res.status(201).json({
        success: true,
        message: 'Transacción creada exitosamente',
        data: { transaction: newTransaction }
      });

    } catch (error) {
      if ([
        'El monto debe ser mayor a cero',
        'Tipo de transacción inválido',
        'Los gastos requieren cuenta de origen y no cuenta de destino',
        'Los ingresos requieren cuenta de destino y no cuenta de origen',
        'Las transferencias requieren cuentas de origen y destino diferentes',
        'Cuenta de origen no válida',
        'Cuenta de destino no válida',
        'Categoría no válida',
        'El tipo de categoría no coincide con el tipo de transacción'
      ].includes(error.message)) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al crear transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualizar una transacción
   * PUT /api/transacciones/:id
   */
  async actualizarTransaccion(req, res) {
    try {
      const userId = req.user.id;
      const transactionId = parseInt(req.params.id);
      const updateData = req.body;

      // Validar ID
      if (!transactionId || isNaN(transactionId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de transacción inválido'
        });
      }

      // Validar campos que se están actualizando
      if (updateData.type && !['income', 'expense', 'transfer'].includes(updateData.type)) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de transacción debe ser "income", "expense" o "transfer"'
        });
      }

      if (updateData.amount !== undefined) {
        if (isNaN(parseFloat(updateData.amount)) || parseFloat(updateData.amount) <= 0) {
          return res.status(400).json({
            success: false,
            message: 'El monto debe ser un número positivo'
          });
        }
        updateData.amount = parseFloat(updateData.amount);
      }

      if (updateData.transactionDate && isNaN(Date.parse(updateData.transactionDate))) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de transacción debe ser válida'
        });
      }

      if (updateData.categoryId !== undefined && updateData.categoryId !== null) {
        if (isNaN(parseInt(updateData.categoryId)) || parseInt(updateData.categoryId) <= 0) {
          return res.status(400).json({
            success: false,
            message: 'El ID de categoría debe ser un número válido'
          });
        }
        updateData.categoryId = parseInt(updateData.categoryId);
      }

      if (updateData.fromAccountId !== undefined && updateData.fromAccountId !== null) {
        if (isNaN(parseInt(updateData.fromAccountId)) || parseInt(updateData.fromAccountId) <= 0) {
          return res.status(400).json({
            success: false,
            message: 'El ID de cuenta de origen debe ser un número válido'
          });
        }
        updateData.fromAccountId = parseInt(updateData.fromAccountId);
      }

      if (updateData.toAccountId !== undefined && updateData.toAccountId !== null) {
        if (isNaN(parseInt(updateData.toAccountId)) || parseInt(updateData.toAccountId) <= 0) {
          return res.status(400).json({
            success: false,
            message: 'El ID de cuenta de destino debe ser un número válido'
          });
        }
        updateData.toAccountId = parseInt(updateData.toAccountId);
      }

      if (updateData.description && (typeof updateData.description !== 'string' || updateData.description.trim().length > 500)) {
        return res.status(400).json({
          success: false,
          message: 'La descripción debe ser texto y no exceder 500 caracteres'
        });
      }

      const updatedTransaction = await transactionsService.actualizarTransaccion(userId, transactionId, updateData);

      res.status(200).json({
        success: true,
        message: 'Transacción actualizada exitosamente',
        data: { transaction: updatedTransaction }
      });

    } catch (error) {
      if (error.message === 'Transacción no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if ([
        'El monto debe ser mayor a cero',
        'Tipo de transacción inválido',
        'Los gastos requieren cuenta de origen y no cuenta de destino',
        'Los ingresos requieren cuenta de destino y no cuenta de origen',
        'Las transferencias requieren cuentas de origen y destino diferentes',
        'Cuenta de origen no válida',
        'Cuenta de destino no válida',
        'Categoría no válida',
        'El tipo de categoría no coincide con el tipo de transacción'
      ].includes(error.message)) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al actualizar transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Eliminar una transacción
   * DELETE /api/transacciones/:id
   */
  async eliminarTransaccion(req, res) {
    try {
      const userId = req.user.id;
      const transactionId = parseInt(req.params.id);

      // Validar ID
      if (!transactionId || isNaN(transactionId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de transacción inválido'
        });
      }

      await transactionsService.eliminarTransaccion(userId, transactionId);

      res.status(200).json({
        success: true,
        message: 'Transacción eliminada exitosamente'
      });

    } catch (error) {
      if (error.message === 'Transacción no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al eliminar transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estadísticas de transacciones
   * GET /api/transacciones/estadisticas
   * Query params: period (month, year)
   */
  async obtenerEstadisticas(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'month' } = req.query;

      if (!['month', 'year'].includes(period)) {
        return res.status(400).json({
          success: false,
          message: 'El período debe ser "month" o "year"'
        });
      }

      const estadisticas = await transactionsService.obtenerEstadisticasTransacciones(userId, period);

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: { estadisticas }
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener resumen de transacciones para el dashboard
   * GET /api/transacciones/resumen
   * Query params: startDate, endDate (opcionales)
   */
  async obtenerResumen(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      // Validar fechas si se proporcionan
      const filters = {};
      
      if (startDate) {
        if (isNaN(Date.parse(startDate))) {
          return res.status(400).json({
            success: false,
            message: 'Fecha de inicio inválida'
          });
        }
        filters.startDate = startDate;
      }

      if (endDate) {
        if (isNaN(Date.parse(endDate))) {
          return res.status(400).json({
            success: false,
            message: 'Fecha de fin inválida'
          });
        }
        filters.endDate = endDate;
      }

      const resumen = await transactionsService.obtenerResumenTransacciones(userId, filters);

      res.status(200).json({
        success: true,
        message: 'Resumen de transacciones obtenido exitosamente',
        data: resumen
      });

    } catch (error) {
      console.error('Error al obtener resumen de transacciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Exportar transacciones a Excel
   * POST /api/transacciones/export
   * Body: { startDate, endDate, type } (opcionales)
   */
  async exportarTransacciones(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate, type } = req.body;

      // Validar parámetros opcionales
      const filters = {};

      if (startDate) {
        if (isNaN(Date.parse(startDate))) {
          return res.status(400).json({
            success: false,
            message: 'Fecha de inicio inválida'
          });
        }
        filters.startDate = startDate;
      }

      if (endDate) {
        if (isNaN(Date.parse(endDate))) {
          return res.status(400).json({
            success: false,
            message: 'Fecha de fin inválida'
          });
        }
        filters.endDate = endDate;
      }

      if (type && !['income', 'expense', 'transfer'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de transacción inválido. Debe ser "income", "expense" o "transfer"'
        });
      }
      if (type) filters.type = type;

      // Generar archivo Excel
      const excelBuffer = await transactionsService.exportarTransaccionesAExcel(userId, filters);

      // Generar nombre de archivo dinámico
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      let fileName = `Transacciones_${dateStr}`;
      
      if (filters.startDate && filters.endDate) {
        const startStr = filters.startDate.split('T')[0];
        const endStr = filters.endDate.split('T')[0];
        fileName = `Transacciones_${startStr}_a_${endStr}`;
      } else if (filters.startDate) {
        const startStr = filters.startDate.split('T')[0];
        fileName = `Transacciones_desde_${startStr}`;
      } else if (filters.endDate) {
        const endStr = filters.endDate.split('T')[0];
        fileName = `Transacciones_hasta_${endStr}`;
      }

      if (filters.type) {
        const typeLabels = {
          income: 'Ingresos',
          expense: 'Gastos',
          transfer: 'Transferencias'
        };
        fileName += `_${typeLabels[filters.type]}`;
      }

      fileName += '.xlsx';

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', excelBuffer.length);

      // Enviar archivo
      res.send(excelBuffer);

    } catch (error) {
      console.error('Error al exportar transacciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al exportar transacciones'
      });
    }
  }
}

module.exports = new TransactionsController();