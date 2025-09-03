const scheduledTransactionsService = require('../services/scheduled-transactions.service');

/**
 * Controlador de transacciones programadas - Maneja las peticiones HTTP
 * y delega la lógica de negocio al servicio
 */
class ScheduledTransactionsController {

  /**
   * Obtener todas las transacciones programadas del usuario autenticado
   * GET /api/transacciones-programadas
   * Query params: is_active, transaction_type
   */
  async obtenerTransaccionesProgramadas(req, res) {
    try {
      const userId = req.user.id;
      const { is_active, transaction_type } = req.query;
      
      console.log('📋 GET /api/transacciones-programadas');
      console.log('👤 Usuario ID:', userId);
      console.log('🔍 Query params:', { is_active, transaction_type });

      // Validar parámetros opcionales
      const filters = {};

      if (is_active !== undefined) {
        if (is_active !== 'true' && is_active !== 'false') {
          return res.status(400).json({
            success: false,
            message: 'Parámetro is_active debe ser true o false'
          });
        }
        filters.is_active = is_active === 'true';
      }

      if (transaction_type && !['income', 'expense', 'transfer'].includes(transaction_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de transacción inválido'
        });
      }

      if (transaction_type) {
        filters.transaction_type = transaction_type;
      }

      const transacciones = await scheduledTransactionsService.obtenerTransaccionesProgramadas(userId, filters);

      console.log('✅ Enviando respuesta con', transacciones.length, 'transacciones');

      res.status(200).json({
        success: true,
        data: transacciones,
        message: 'Transacciones programadas obtenidas exitosamente'
      });

    } catch (error) {
      console.error('Error obteniendo transacciones programadas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Crear una nueva transacción programada
   * POST /api/transacciones-programadas
   */
  async crearTransaccionProgramada(req, res) {
    try {
      const userId = req.user.id;
      
      // Log para debugging
      console.log('🔍 Creando transacción programada para usuario:', userId);
      console.log('📋 Datos recibidos:', JSON.stringify(req.body, null, 2));
      
      const {
        transaction_type,
        amount,
        currency_code,
        description,
        category_id,
        source_account_id,
        destination_account_id,
        frequency,
        start_date,
        end_date
      } = req.body;

      // Validaciones básicas
      if (!transaction_type || !['income', 'expense', 'transfer'].includes(transaction_type)) {
        console.log('❌ Error de validación: transaction_type inválido:', transaction_type);
        return res.status(400).json({
          success: false,
          message: 'Tipo de transacción requerido y debe ser income, expense o transfer'
        });
      }

      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        console.log('❌ Error de validación: amount inválido:', amount);
        return res.status(400).json({
          success: false,
          message: 'Monto requerido y debe ser mayor a 0'
        });
      }

      if (!description || description.trim() === '') {
        console.log('❌ Error de validación: description inválida:', description);
        return res.status(400).json({
          success: false,
          message: 'Descripción requerida'
        });
      }

      if (!frequency || !['once', 'daily', 'weekly', 'monthly'].includes(frequency)) {
        return res.status(400).json({
          success: false,
          message: 'Frecuencia requerida y debe ser once, daily, weekly o monthly'
        });
      }

      if (!start_date || isNaN(Date.parse(start_date))) {
        return res.status(400).json({
          success: false,
          message: 'Fecha de inicio requerida y debe ser válida'
        });
      }

      if (end_date && isNaN(Date.parse(end_date))) {
        return res.status(400).json({
          success: false,
          message: 'Fecha de fin debe ser válida'
        });
      }

      if (end_date && new Date(end_date) <= new Date(start_date)) {
        return res.status(400).json({
          success: false,
          message: 'Fecha de fin debe ser posterior a la fecha de inicio'
        });
      }

      // Validaciones específicas por tipo de transacción
      if (transaction_type === 'expense' && !source_account_id) {
        return res.status(400).json({
          success: false,
          message: 'Cuenta de origen requerida para gastos'
        });
      }

      if (transaction_type === 'income' && !destination_account_id) {
        return res.status(400).json({
          success: false,
          message: 'Cuenta destino requerida para ingresos'
        });
      }

      if (transaction_type === 'transfer' && (!source_account_id || !destination_account_id)) {
        return res.status(400).json({
          success: false,
          message: 'Cuentas de origen y destino requeridas para transferencias'
        });
      }

      if (transaction_type === 'transfer' && source_account_id === destination_account_id) {
        return res.status(400).json({
          success: false,
          message: 'Las cuentas de origen y destino deben ser diferentes'
        });
      }

      const transactionData = {
        transaction_type,
        amount: parseFloat(amount),
        currency_code: currency_code || 'USD',
        description: description.trim(),
        category_id: category_id || null,
        source_account_id: source_account_id || null,
        destination_account_id: destination_account_id || null,
        frequency,
        start_date,
        end_date: end_date || null
      };

      const nuevaTransaccion = await scheduledTransactionsService.crearTransaccionProgramada(userId, transactionData);

      res.status(201).json({
        success: true,
        data: nuevaTransaccion,
        message: 'Transacción programada creada exitosamente'
      });

    } catch (error) {
      console.error('Error creando transacción programada:', error);
      
      if (error.message.includes('requerido') || error.message.includes('inválido')) {
        return res.status(400).json({
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

  /**
   * Actualizar una transacción programada existente
   * PUT /api/transacciones-programadas/:id
   */
  async actualizarTransaccionProgramada(req, res) {
    try {
      const userId = req.user.id;
      const scheduledId = parseInt(req.params.id);
      const {
        description,
        amount,
        currency_code,
        category_id,
        is_active,
        end_date,
        end_time,
        frequency,
        start_date,
        start_time
      } = req.body;

      console.log('🔄 [Actualizar] Datos recibidos:', {
        start_time,
        end_time,
        start_date,
        end_date,
        frequency,
        currency_code,
        amount,
        description
      });

      if (isNaN(scheduledId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de transacción programada inválido'
        });
      }

      // Validaciones opcionales
      if (amount !== undefined && (isNaN(amount) || parseFloat(amount) <= 0)) {
        return res.status(400).json({
          success: false,
          message: 'Monto debe ser mayor a 0'
        });
      }

      if (description !== undefined && description.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Descripción no puede estar vacía'
        });
      }

      if (frequency !== undefined && !['once', 'daily', 'weekly', 'monthly'].includes(frequency)) {
        return res.status(400).json({
          success: false,
          message: 'Frecuencia debe ser once, daily, weekly o monthly'
        });
      }

      if (start_date !== undefined && isNaN(Date.parse(start_date))) {
        return res.status(400).json({
          success: false,
          message: 'Fecha de inicio debe ser válida'
        });
      }

      if (end_date !== undefined && end_date !== null && isNaN(Date.parse(end_date))) {
        return res.status(400).json({
          success: false,
          message: 'Fecha de fin debe ser válida'
        });
      }

      const updateData = {};
      if (description !== undefined) updateData.description = description.trim();
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (currency_code !== undefined) updateData.currency_code = currency_code;
      if (category_id !== undefined) updateData.category_id = category_id;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (end_date !== undefined) updateData.end_date = end_date;
      if (end_time !== undefined) updateData.end_time = end_time;
      if (frequency !== undefined) updateData.frequency = frequency;
      if (start_date !== undefined) updateData.start_date = start_date;
      if (start_time !== undefined) updateData.start_time = start_time;

      const transaccionActualizada = await scheduledTransactionsService.actualizarTransaccionProgramada(
        userId, 
        scheduledId, 
        updateData
      );

      res.status(200).json({
        success: true,
        data: transaccionActualizada,
        message: 'Transacción programada actualizada exitosamente'
      });

    } catch (error) {
      console.error('Error actualizando transacción programada:', error);
      
      if (error.message === 'Transacción programada no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('requerido') || error.message.includes('inválido')) {
        return res.status(400).json({
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

  /**
   * Eliminar una transacción programada
   * DELETE /api/transacciones-programadas/:id
   */
  async eliminarTransaccionProgramada(req, res) {
    try {
      const userId = req.user.id;
      const scheduledId = parseInt(req.params.id);

      if (isNaN(scheduledId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de transacción programada inválido'
        });
      }

      const eliminada = await scheduledTransactionsService.eliminarTransaccionProgramada(userId, scheduledId);

      if (!eliminada) {
        return res.status(404).json({
          success: false,
          message: 'Transacción programada no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Transacción programada eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando transacción programada:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener información específica de una transacción programada
   * GET /api/transacciones-programadas/:id
   */
  async obtenerTransaccionProgramada(req, res) {
    try {
      const userId = req.user.id;
      const scheduledId = parseInt(req.params.id);

      if (isNaN(scheduledId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de transacción programada inválido'
        });
      }

      const transacciones = await scheduledTransactionsService.obtenerTransaccionesProgramadas(userId);
      const transaccion = transacciones.find(t => t.id === scheduledId);

      if (!transaccion) {
        return res.status(404).json({
          success: false,
          message: 'Transacción programada no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        data: transaccion,
        message: 'Transacción programada obtenida exitosamente'
      });

    } catch (error) {
      console.error('Error obteniendo transacción programada:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Pausar/reanudar una transacción programada
   * PATCH /api/transacciones-programadas/:id/toggle
   */
  async toggleTransaccionProgramada(req, res) {
    try {
      const userId = req.user.id;
      const scheduledId = parseInt(req.params.id);

      if (isNaN(scheduledId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de transacción programada inválido'
        });
      }

      // Obtener estado actual
      const transacciones = await scheduledTransactionsService.obtenerTransaccionesProgramadas(userId);
      const transaccion = transacciones.find(t => t.id === scheduledId);

      if (!transaccion) {
        return res.status(404).json({
          success: false,
          message: 'Transacción programada no encontrada'
        });
      }

      // Cambiar estado
      const nuevoEstado = !transaccion.is_active;
      const transaccionActualizada = await scheduledTransactionsService.actualizarTransaccionProgramada(
        userId, 
        scheduledId, 
        { is_active: nuevoEstado }
      );

      res.status(200).json({
        success: true,
        data: transaccionActualizada,
        message: `Transacción programada ${nuevoEstado ? 'activada' : 'pausada'} exitosamente`
      });

    } catch (error) {
      console.error('Error cambiando estado de transacción programada:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estado del scheduler
   * GET /api/transacciones-programadas/scheduler/status
   */
  async obtenerEstadoScheduler(req, res) {
    try {
      const estado = scheduledTransactionsService.getSchedulerStatus();
      
      res.status(200).json({
        success: true,
        data: estado,
        message: 'Estado del scheduler obtenido exitosamente'
      });

    } catch (error) {
      console.error('Error obteniendo estado del scheduler:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Ejecutar manualmente el procesamiento de transacciones programadas (solo para desarrollo/testing)
   * POST /api/transacciones-programadas/scheduler/run
   */
  async ejecutarSchedulerManual(req, res) {
    try {
      await scheduledTransactionsService.processScheduledTransactions();
      
      res.status(200).json({
        success: true,
        message: 'Scheduler ejecutado manualmente exitosamente'
      });

    } catch (error) {
      console.error('Error ejecutando scheduler manualmente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new ScheduledTransactionsController();
