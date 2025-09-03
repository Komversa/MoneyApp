const { db } = require('../../config/db');
const cron = require('node-cron');
const transactionsService = require('./transactions.service');

/**
 * Servicio de transacciones programadas que maneja la creación, 
 * gestión y ejecución automática de transacciones recurrentes
 */
class ScheduledTransactionsService {
  constructor() {
    this.transactionsService = transactionsService;
    this.schedulerTask = null;
    this.isSchedulerRunning = false;
  }

  /**
   * Inicializar el scheduler de transacciones programadas
   * Se ejecuta cada hora para verificar transacciones pendientes
   */
  initializeScheduler() {
    if (this.schedulerTask) {
      console.log('⚠️ Scheduler ya está inicializado');
      return;
    }

    // Ejecutar cada hora (minuto 0)
    this.schedulerTask = cron.schedule('0 * * * *', async () => {
      console.log('🔄 Ejecutando scheduler de transacciones programadas...');
      await this.processScheduledTransactions();
    }, {
      scheduled: true,
      timezone: 'America/Managua'
    });

    this.isSchedulerRunning = true;
    console.log('✅ Scheduler de transacciones programadas iniciado');
  }

  /**
   * Detener el scheduler
   */
  stopScheduler() {
    if (this.schedulerTask) {
      this.schedulerTask.destroy();
      this.schedulerTask = null;
      this.isSchedulerRunning = false;
      console.log('🛑 Scheduler de transacciones programadas detenido');
    }
  }

  /**
   * Procesar todas las transacciones programadas que están listas para ejecutarse
   */
  async processScheduledTransactions() {
    const trx = await db.transaction();
    
    try {
      const now = new Date();
      
      // Buscar transacciones programadas que deben ejecutarse
      const scheduledTransactions = await trx('scheduled_transactions')
        .where('is_active', true)
        .where('next_run_date', '<=', now)
        .orderBy('next_run_date', 'asc');

      console.log(`📋 Encontradas ${scheduledTransactions.length} transacciones programadas para ejecutar`);

      for (const scheduled of scheduledTransactions) {
        try {
          await this.executeScheduledTransaction(scheduled, trx);
          console.log(`✅ Transacción programada ${scheduled.id} ejecutada exitosamente`);
        } catch (error) {
          console.error(`❌ Error ejecutando transacción programada ${scheduled.id}:`, error);
          // Continuar con las siguientes transacciones aunque una falle
        }
      }

      await trx.commit();
      console.log('🎉 Proceso de transacciones programadas completado');

    } catch (error) {
      await trx.rollback();
      console.error('💥 Error procesando transacciones programadas:', error);
      throw error;
    }
  }

  /**
   * Ejecutar una transacción programada específica
   * @param {Object} scheduled - Transacción programada
   * @param {Object} trx - Transacción de base de datos
   */
  async executeScheduledTransaction(scheduled, trx) {
    // 1. Crear la transacción real
    const transactionData = {
      type: scheduled.transaction_type,
      amount: scheduled.amount,
      description: scheduled.description,
      categoryId: scheduled.category_id,
      fromAccountId: scheduled.source_account_id,
      toAccountId: scheduled.destination_account_id,
      transactionDate: new Date().toISOString().split('T')[0]
    };

    await this.transactionsService.crearTransaccionParaUsuario(scheduled.user_id, transactionData);

    // 2. Calcular la próxima fecha de ejecución
    const nextRunDate = this.calculateNextRunDate(scheduled);

    // 3. Actualizar o desactivar la transacción programada
    if (nextRunDate && (!scheduled.end_date || nextRunDate <= new Date(scheduled.end_date))) {
      // Actualizar para la próxima ejecución
      await trx('scheduled_transactions')
        .where('id', scheduled.id)
        .update({
          next_run_date: nextRunDate,
          updated_at: new Date()
        });
    } else {
      // Desactivar si es una ejecución única o superó la fecha fin
      await trx('scheduled_transactions')
        .where('id', scheduled.id)
        .update({
          is_active: false,
          updated_at: new Date()
        });
    }
  }

  /**
   * Calcular la próxima fecha de ejecución basada en la frecuencia
   * @param {Object} scheduled - Transacción programada
   * @returns {Date|null} - Próxima fecha de ejecución o null si es única
   */
  calculateNextRunDate(scheduled) {
    if (scheduled.frequency === 'once') {
      return null;
    }

    const currentDate = new Date(scheduled.next_run_date);
    
    switch (scheduled.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      default:
        return null;
    }

    return currentDate;
  }

  /**
   * Crear una nueva transacción programada
   * @param {number} userId - ID del usuario
   * @param {Object} data - Datos de la transacción programada
   * @returns {Promise<Object>} - Transacción programada creada
   */
  async crearTransaccionProgramada(userId, data) {
    console.log('🔄 Iniciando creación de transacción programada en servicio');
    console.log('👤 Usuario ID:', userId);
    console.log('📊 Datos recibidos:', JSON.stringify(data, null, 2));
    
    const trx = await db.transaction();

    try {
      console.log('✅ Transacción de DB iniciada');
      
      // Validar datos requeridos
      console.log('🔍 Validando datos...');
      this.validateScheduledTransactionData(data);
      console.log('✅ Validación completada');

      // Calcular la primera fecha de ejecución
      console.log('📅 Calculando primera fecha de ejecución...');
      const firstRunDate = this.calculateFirstRunDate(data.start_date, data.start_time, data.frequency);
      console.log('📅 Primera fecha calculada:', firstRunDate);

      const scheduledTransaction = {
        user_id: userId,
        transaction_type: data.transaction_type,
        amount: data.amount,
        currency_code: data.currency_code || 'USD',
        description: data.description,
        category_id: data.category_id || null,
        source_account_id: data.source_account_id || null,
        destination_account_id: data.destination_account_id || null,
        frequency: data.frequency,
        start_date: data.start_date,
        start_time: data.start_time || '09:00',
        next_run_date: firstRunDate,
        end_date: data.end_date || null,
        end_time: data.end_time || null,
        is_active: true
      };

      console.log('💾 Insertando en base de datos:', JSON.stringify(scheduledTransaction, null, 2));
      
      const [result] = await trx('scheduled_transactions')
        .insert(scheduledTransaction)
        .returning('*');

      console.log('✅ Inserción exitosa:', result);
      
      await trx.commit();
      console.log('✅ Transacción de DB confirmada');
      
      return result;

    } catch (error) {
      console.error('❌ Error en crearTransaccionProgramada:', error.message);
      console.error('❌ Stack trace:', error.stack);
      await trx.rollback();
      console.log('🔄 Transacción de DB revertida');
      throw error;
    }
  }

  /**
   * Calcular la primera fecha de ejecución
   * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {string} startTime - Hora de inicio (HH:MM)
   * @param {string} frequency - Frecuencia
   * @returns {Date} - Primera fecha de ejecución
   */
  calculateFirstRunDate(startDate, startTime = '09:00', frequency) {
    // Combinar fecha y hora en zona horaria local (sin Z para evitar conversión UTC)
    const dateTimeString = `${startDate}T${startTime}:00`;
    const start = new Date(dateTimeString);
    
    console.log('📅 Fecha de inicio original:', startDate);
    console.log('⏰ Hora de inicio original:', startTime);
    console.log('📅 Fecha y hora procesada (local):', start);
    console.log('📅 Fecha y hora en UTC:', start.toISOString());
    console.log('📅 Frecuencia:', frequency);
    
    if (frequency === 'once') {
      return start;
    }

    // Para transacciones recurrentes, la primera ejecución es en la fecha y hora de inicio
    return start;
  }

  /**
   * Validar datos de transacción programada
   * @param {Object} data - Datos a validar
   */
  validateScheduledTransactionData(data) {
    if (!data.transaction_type || !['income', 'expense', 'transfer'].includes(data.transaction_type)) {
      throw new Error('Tipo de transacción inválido');
    }

    if (!data.amount || data.amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    if (!data.description || data.description.trim() === '') {
      throw new Error('La descripción es requerida');
    }

    if (!data.frequency || !['once', 'daily', 'weekly', 'monthly'].includes(data.frequency)) {
      throw new Error('Frecuencia inválida');
    }

    if (!data.start_date) {
      throw new Error('La fecha de inicio es requerida');
    }

    // Validar cuentas según el tipo de transacción
    if (data.transaction_type === 'expense' && !data.source_account_id) {
      throw new Error('La cuenta de origen es requerida para gastos');
    }

    if (data.transaction_type === 'income' && !data.destination_account_id) {
      throw new Error('La cuenta destino es requerida para ingresos');
    }

    if (data.transaction_type === 'transfer' && (!data.source_account_id || !data.destination_account_id)) {
      throw new Error('Las cuentas de origen y destino son requeridas para transferencias');
    }

    if (data.transaction_type === 'transfer' && data.source_account_id === data.destination_account_id) {
      throw new Error('Las cuentas de origen y destino deben ser diferentes');
    }
  }

  /**
   * Obtener transacciones programadas de un usuario
   * @param {number} userId - ID del usuario
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Array>} - Lista de transacciones programadas
   */
  async obtenerTransaccionesProgramadas(userId, filters = {}) {
    try {
      console.log('📋 Obteniendo transacciones programadas para usuario:', userId);
      console.log('🔍 Filtros aplicados:', filters);
      
      let query = db('scheduled_transactions as st')
        .leftJoin('categories as c', 'st.category_id', 'c.id')
        .leftJoin('accounts as sa', 'st.source_account_id', 'sa.id')
        .leftJoin('accounts as da', 'st.destination_account_id', 'da.id')
        .where('st.user_id', userId)
        .select(
          'st.*',
          'c.name as category_name',
          'sa.name as source_account_name',
          'da.name as destination_account_name'
        )
        .orderBy('st.next_run_date', 'asc');

      // Aplicar filtros
      if (filters.is_active !== undefined) {
        query = query.where('st.is_active', filters.is_active);
      }

      if (filters.transaction_type) {
        query = query.where('st.transaction_type', filters.transaction_type);
      }

      console.log('🔍 Query SQL generado:', query.toString());
      
      const results = await query;
      console.log('✅ Resultados obtenidos:', results.length, 'transacciones');
      console.log('📊 Primeros resultados:', JSON.stringify(results.slice(0, 2), null, 2));
      
      return results;

    } catch (error) {
      console.error('❌ Error obteniendo transacciones programadas:', error);
      throw error;
    }
  }

  /**
   * Actualizar una transacción programada
   * @param {number} userId - ID del usuario
   * @param {number} scheduledId - ID de la transacción programada
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} - Transacción programada actualizada
   */
  async actualizarTransaccionProgramada(userId, scheduledId, data) {
    const trx = await db.transaction();

    try {
      // Verificar que la transacción programada pertenece al usuario
      const existing = await trx('scheduled_transactions')
        .where('id', scheduledId)
        .where('user_id', userId)
        .first();

      if (!existing) {
        throw new Error('Transacción programada no encontrada');
      }

      // Preparar datos de actualización
      const updateData = {
        updated_at: new Date()
      };

      // Solo actualizar campos proporcionados
      if (data.description !== undefined) updateData.description = data.description;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.currency_code !== undefined) updateData.currency_code = data.currency_code;
      if (data.category_id !== undefined) updateData.category_id = data.category_id;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.end_date !== undefined) updateData.end_date = data.end_date;
      if (data.start_time !== undefined) updateData.start_time = data.start_time;
      if (data.end_time !== undefined) updateData.end_time = data.end_time;

      // Si se cambia la frecuencia, fecha de inicio o tiempo, recalcular next_run_date
      if (data.frequency || data.start_date || data.start_time) {
        const frequency = data.frequency || existing.frequency;
        const startDate = data.start_date || existing.start_date;
        const startTime = data.start_time || existing.start_time || '09:00';
        updateData.frequency = frequency;
        updateData.start_date = startDate;
        updateData.start_time = startTime;
        
        console.log('🔄 [Actualizar] Recalculando next_run_date con:', {
          startDate,
          startTime,
          frequency
        });
        
        updateData.next_run_date = this.calculateFirstRunDate(startDate, startTime, frequency);
        
        console.log('🔄 [Actualizar] Nueva next_run_date:', updateData.next_run_date);
      }

      await trx('scheduled_transactions')
        .where('id', scheduledId)
        .update(updateData);

      const updated = await trx('scheduled_transactions')
        .where('id', scheduledId)
        .first();

      await trx.commit();
      return updated;

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Eliminar una transacción programada
   * @param {number} userId - ID del usuario
   * @param {number} scheduledId - ID de la transacción programada
   * @returns {Promise<boolean>} - True si se eliminó correctamente
   */
  async eliminarTransaccionProgramada(userId, scheduledId) {
    try {
      const deleted = await db('scheduled_transactions')
        .where('id', scheduledId)
        .where('user_id', userId)
        .del();

      return deleted > 0;

    } catch (error) {
      console.error('Error eliminando transacción programada:', error);
      throw error;
    }
  }

  /**
   * Obtener estado del scheduler
   * @returns {Object} - Estado actual del scheduler
   */
  getSchedulerStatus() {
    return {
      isRunning: this.isSchedulerRunning,
      hasTask: !!this.schedulerTask
    };
  }
}

module.exports = new ScheduledTransactionsService();
