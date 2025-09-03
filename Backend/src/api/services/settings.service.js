const { db } = require('../../config/db');
const CurrencyConversionService = require('./CurrencyConversionService');

/**
 * Servicio de configuraciones que contiene la lógica de negocio
 * para tipos de cuenta y categorías
 */
class SettingsService {
  
  /**
   * ===========================================
   * TIPOS DE CUENTA (ACCOUNT TYPES)
   * ===========================================
   */

  /**
   * Obtener todos los tipos de cuenta de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Array>} - Lista de tipos de cuenta
   */
  async obtenerTiposCuentaPorUsuario(userId) {
    try {
      const accountTypes = await db('account_types')
        .select(['id', 'name', 'created_at', 'updated_at'])
        .where({ user_id: userId })
        .orderBy('name', 'asc');

      return accountTypes;
    } catch (error) {
      throw new Error('Error interno del servidor al obtener tipos de cuenta');
    }
  }

  /**
   * Crear un nuevo tipo de cuenta para un usuario
   * @param {number} userId - ID del usuario
   * @param {Object} accountTypeData - Datos del tipo de cuenta
   * @returns {Promise<Object>} - Tipo de cuenta creado
   */
  async crearTipoCuentaParaUsuario(userId, accountTypeData) {
    try {
      const { name } = accountTypeData;

      // Verificar si ya existe un tipo de cuenta con ese nombre para el usuario
      const existingType = await db('account_types')
        .where({ user_id: userId, name })
        .first();

      if (existingType) {
        throw new Error('Ya existe un tipo de cuenta con ese nombre');
      }

      // Crear el nuevo tipo de cuenta
      const [newAccountType] = await db('account_types')
        .insert({
          user_id: userId,
          name: name.trim()
        })
        .returning(['id', 'name', 'created_at', 'updated_at']);

      return newAccountType;

    } catch (error) {
      if (error.message === 'Ya existe un tipo de cuenta con ese nombre') {
        throw error;
      }
      throw new Error('Error interno del servidor al crear tipo de cuenta');
    }
  }

  /**
   * Actualizar un tipo de cuenta
   * @param {number} userId - ID del usuario
   * @param {number} accountTypeId - ID del tipo de cuenta
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} - Tipo de cuenta actualizado
   */
  async actualizarTipoCuenta(userId, accountTypeId, updateData) {
    try {
      const { name } = updateData;

      // Verificar que el tipo de cuenta pertenece al usuario
      const accountType = await db('account_types')
        .where({ id: accountTypeId, user_id: userId })
        .first();

      if (!accountType) {
        throw new Error('Tipo de cuenta no encontrado');
      }

      // Verificar si ya existe otro tipo de cuenta con ese nombre
      if (name && name !== accountType.name) {
        const existingType = await db('account_types')
          .where({ user_id: userId, name })
          .whereNot({ id: accountTypeId })
          .first();

        if (existingType) {
          throw new Error('Ya existe un tipo de cuenta con ese nombre');
        }
      }

      // Actualizar el tipo de cuenta
      const [updatedAccountType] = await db('account_types')
        .where({ id: accountTypeId, user_id: userId })
        .update({
          name: name ? name.trim() : accountType.name,
          updated_at: db.fn.now()
        })
        .returning(['id', 'name', 'created_at', 'updated_at']);

      return updatedAccountType;

    } catch (error) {
      if (['Tipo de cuenta no encontrado', 'Ya existe un tipo de cuenta con ese nombre'].includes(error.message)) {
        throw error;
      }
      throw new Error('Error interno del servidor al actualizar tipo de cuenta');
    }
  }

  /**
   * Eliminar un tipo de cuenta
   * @param {number} userId - ID del usuario
   * @param {number} accountTypeId - ID del tipo de cuenta
   * @returns {Promise<void>}
   */
  async eliminarTipoCuenta(userId, accountTypeId) {
    try {
      // Verificar que el tipo de cuenta pertenece al usuario
      const accountType = await db('account_types')
        .where({ id: accountTypeId, user_id: userId })
        .first();

      if (!accountType) {
        throw new Error('Tipo de cuenta no encontrado');
      }

      // TODO: Verificar si el tipo de cuenta está siendo usado por alguna cuenta
      // antes de eliminarlo (implementar en futuras iteraciones)

      // Eliminar el tipo de cuenta
      await db('account_types')
        .where({ id: accountTypeId, user_id: userId })
        .del();

    } catch (error) {
      if (error.message === 'Tipo de cuenta no encontrado') {
        throw error;
      }
      throw new Error('Error interno del servidor al eliminar tipo de cuenta');
    }
  }

  /**
   * ===========================================
   * CATEGORÍAS (CATEGORIES)
   * ===========================================
   */

  /**
   * Obtener todas las categorías de un usuario
   * @param {number} userId - ID del usuario
   * @param {string} type - Filtro por tipo ('income', 'expense', o null para todas)
   * @returns {Promise<Array>} - Lista de categorías
   */
  async obtenerCategoriasPorUsuario(userId, type = null) {
    try {
      let query = db('categories')
        .select(['id', 'name', 'type', 'created_at', 'updated_at'])
        .where({ user_id: userId });

      if (type && ['income', 'expense'].includes(type)) {
        query = query.where({ type });
      }

      const categories = await query.orderBy(['type', 'name'], ['asc', 'asc']);

      return categories;
    } catch (error) {
      throw new Error('Error interno del servidor al obtener categorías');
    }
  }

  /**
   * Crear una nueva categoría para un usuario
   * @param {number} userId - ID del usuario
   * @param {Object} categoryData - Datos de la categoría
   * @returns {Promise<Object>} - Categoría creada
   */
  async crearCategoriaParaUsuario(userId, categoryData) {
    try {
      const { name, type } = categoryData;

      // Validar el tipo de categoría
      if (!['income', 'expense'].includes(type)) {
        throw new Error('Tipo de categoría inválido');
      }

      // Verificar si ya existe una categoría con ese nombre y tipo para el usuario
      const existingCategory = await db('categories')
        .where({ user_id: userId, name, type })
        .first();

      if (existingCategory) {
        throw new Error('Ya existe una categoría con ese nombre y tipo');
      }

      // Crear la nueva categoría
      const [newCategory] = await db('categories')
        .insert({
          user_id: userId,
          name: name.trim(),
          type
        })
        .returning(['id', 'name', 'type', 'created_at', 'updated_at']);

      return newCategory;

    } catch (error) {
      if (['Tipo de categoría inválido', 'Ya existe una categoría con ese nombre y tipo'].includes(error.message)) {
        throw error;
      }
      throw new Error('Error interno del servidor al crear categoría');
    }
  }

  /**
   * Actualizar una categoría
   * @param {number} userId - ID del usuario
   * @param {number} categoryId - ID de la categoría
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} - Categoría actualizada
   */
  async actualizarCategoria(userId, categoryId, updateData) {
    try {
      const { name, type } = updateData;

      // Verificar que la categoría pertenece al usuario
      const category = await db('categories')
        .where({ id: categoryId, user_id: userId })
        .first();

      if (!category) {
        throw new Error('Categoría no encontrada');
      }

      // Validar el tipo si se está actualizando
      if (type && !['income', 'expense'].includes(type)) {
        throw new Error('Tipo de categoría inválido');
      }

      // Verificar si ya existe otra categoría con ese nombre y tipo
      const finalName = name ? name.trim() : category.name;
      const finalType = type || category.type;

      if (finalName !== category.name || finalType !== category.type) {
        const existingCategory = await db('categories')
          .where({ user_id: userId, name: finalName, type: finalType })
          .whereNot({ id: categoryId })
          .first();

        if (existingCategory) {
          throw new Error('Ya existe una categoría con ese nombre y tipo');
        }
      }

      // Actualizar la categoría
      const [updatedCategory] = await db('categories')
        .where({ id: categoryId, user_id: userId })
        .update({
          name: finalName,
          type: finalType,
          updated_at: db.fn.now()
        })
        .returning(['id', 'name', 'type', 'created_at', 'updated_at']);

      return updatedCategory;

    } catch (error) {
      if (['Categoría no encontrada', 'Tipo de categoría inválido', 'Ya existe una categoría con ese nombre y tipo'].includes(error.message)) {
        throw error;
      }
      throw new Error('Error interno del servidor al actualizar categoría');
    }
  }

  /**
   * Eliminar una categoría
   * @param {number} userId - ID del usuario
   * @param {number} categoryId - ID de la categoría
   * @returns {Promise<void>}
   */
  async eliminarCategoria(userId, categoryId) {
    try {
      // Verificar que la categoría pertenece al usuario
      const category = await db('categories')
        .where({ id: categoryId, user_id: userId })
        .first();

      if (!category) {
        throw new Error('Categoría no encontrada');
      }

      // TODO: Verificar si la categoría está siendo usada por alguna transacción
      // antes de eliminarla (implementar en futuras iteraciones)

      // Eliminar la categoría
      await db('categories')
        .where({ id: categoryId, user_id: userId })
        .del();

    } catch (error) {
      if (error.message === 'Categoría no encontrada') {
        throw error;
      }
      throw new Error('Error interno del servidor al eliminar categoría');
    }
  }

  /**
   * =========================================
   * TASAS DE CAMBIO (EXCHANGE RATES)
   * =========================================
   */

  /**
   * Obtener todas las tasas de cambio de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Array>} - Lista de tasas de cambio
   */
  async obtenerTasasCambioPorUsuario(userId) {
    try {
      // 🚨 REFACTORIZADO: Usar el nuevo CurrencyConversionService
      const tasasCambio = await CurrencyConversionService.getUserExchangeRates(userId);
      
      // Formatear para mantener compatibilidad con el frontend
      return tasasCambio.map(rate => ({
        id: rate.id,
        currency_code: rate.currency_code,
        rate: rate.rate_to_usd, // Convertir rate_to_usd a rate para compatibilidad
        updated_at: rate.updated_at
      }));
    } catch (error) {
      throw new Error('Error interno del servidor al obtener tasas de cambio');
    }
  }

  /**
   * Obtener una tasa de cambio específica
   * @param {number} userId - ID del usuario
   * @param {string} currencyCode - Código de moneda
   * @returns {Promise<Object>} - Tasa de cambio
   */
  async obtenerTasaCambioPorMoneda(userId, currencyCode) {
    try {
      // 🚨 REFACTORIZADO: Usar el nuevo CurrencyConversionService
      const tasasCambio = await CurrencyConversionService.getUserExchangeRates(userId);
      const tasaCambio = tasasCambio.find(rate => rate.currency_code === currencyCode.toUpperCase());

      if (!tasaCambio) {
        throw new Error('Tasa de cambio no encontrada');
      }

      // Formatear para mantener compatibilidad con el frontend
      return {
        id: tasaCambio.id,
        currency_code: tasaCambio.currency_code,
        rate: tasaCambio.rate_to_usd, // Convertir rate_to_usd a rate para compatibilidad
        updated_at: tasaCambio.updated_at
      };
    } catch (error) {
      if (error.message === 'Tasa de cambio no encontrada') {
        throw error;
      }
      throw new Error('Error interno del servidor al obtener tasa de cambio');
    }
  }

  /**
   * Crear una nueva tasa de cambio para un usuario
   * @param {number} userId - ID del usuario
   * @param {Object} tasaCambioData - Datos de la tasa de cambio
   * @returns {Promise<Object>} - Tasa de cambio creada
   */
  async crearTasaCambioParaUsuario(userId, tasaCambioData) {
    try {
      const { currencyCode, rate } = tasaCambioData;

      // Validar que la tasa sea positiva
      if (!rate || parseFloat(rate) <= 0) {
        throw new Error('La tasa de cambio debe ser un número positivo');
      }

      // Validar código de moneda
      if (!currencyCode || typeof currencyCode !== 'string' || currencyCode.trim().length === 0) {
        throw new Error('El código de moneda es requerido');
      }

      const currencyCodeUpper = currencyCode.trim().toUpperCase();

      // Verificar que la moneda no sea la misma que la principal del usuario
      const userSettings = await db('user_settings')
        .where({ user_id: userId })
        .first();

      if (userSettings && userSettings.primary_currency === currencyCodeUpper) {
        throw new Error('No se puede crear una tasa de cambio para la moneda principal');
      }

      // 🚨 REFACTORIZADO: Usar el nuevo CurrencyConversionService
      const result = await CurrencyConversionService.updateExchangeRate(userId, currencyCodeUpper, parseFloat(rate));
      
      if (!result.success) {
        throw new Error('Error al crear la tasa de cambio');
      }

      // Obtener la tasa creada para devolverla
      const tasasCambio = await CurrencyConversionService.getUserExchangeRates(userId);
      const newRate = tasasCambio.find(rate => rate.currency_code === currencyCodeUpper);

      if (!newRate) {
        throw new Error('Error al obtener la tasa de cambio creada');
      }

      // Formatear para mantener compatibilidad con el frontend
      return {
        id: newRate.id,
        currency_code: newRate.currency_code,
        rate: newRate.rate_to_usd, // Convertir rate_to_usd a rate para compatibilidad
        updated_at: newRate.updated_at
      };

      return newRate;

    } catch (error) {
      if ([
        'La tasa de cambio debe ser un número positivo',
        'El código de moneda es requerido',
        'Ya existe una tasa de cambio para esta moneda',
        'No se puede crear una tasa de cambio para la moneda principal'
      ].includes(error.message)) {
        throw error;
      }
      throw new Error('Error interno del servidor al crear tasa de cambio');
    }
  }

  /**
   * Actualizar una tasa de cambio existente
   * @param {number} userId - ID del usuario
   * @param {string} currencyCode - Código de moneda
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} - Tasa de cambio actualizada
   */
  async actualizarTasaCambio(userId, currencyCode, updateData) {
    try {
      const { rate } = updateData;

      // Validar que la tasa sea positiva
      if (!rate || parseFloat(rate) <= 0) {
        throw new Error('La tasa de cambio debe ser un número positivo');
      }

      const currencyCodeUpper = currencyCode.toUpperCase();

      // 🚨 REFACTORIZADO: Usar el nuevo CurrencyConversionService
      const result = await CurrencyConversionService.updateExchangeRate(userId, currencyCodeUpper, parseFloat(rate));
      
      if (!result.success) {
        throw new Error('Error al actualizar la tasa de cambio');
      }

      // Obtener la tasa actualizada para devolverla
      const tasasCambio = await CurrencyConversionService.getUserExchangeRates(userId);
      const updatedRate = tasasCambio.find(rate => rate.currency_code === currencyCodeUpper);

      if (!updatedRate) {
        throw new Error('Error al obtener la tasa de cambio actualizada');
      }

      // Formatear para mantener compatibilidad con el frontend
      return {
        id: updatedRate.id,
        currency_code: updatedRate.currency_code,
        rate: updatedRate.rate_to_usd, // Convertir rate_to_usd a rate para compatibilidad
        updated_at: updatedRate.updated_at
      };

    } catch (error) {
      if ([
        'La tasa de cambio debe ser un número positivo',
        'Error al actualizar la tasa de cambio',
        'Error al obtener la tasa de cambio actualizada'
      ].includes(error.message)) {
        throw error;
      }
      throw new Error('Error interno del servidor al actualizar tasa de cambio');
    }
  }

  /**
   * Eliminar una tasa de cambio
   * @param {number} userId - ID del usuario
   * @param {string} currencyCode - Código de moneda
   * @returns {Promise<void>}
   */
  async eliminarTasaCambio(userId, currencyCode) {
    try {
      const currencyCodeUpper = currencyCode.toUpperCase();

      // Verificar si hay cuentas que usan esta moneda
      const accountsUsingCurrency = await db('accounts')
        .where({ user_id: userId, currency: currencyCodeUpper })
        .first();

      if (accountsUsingCurrency) {
        throw new Error('No se puede eliminar la tasa de cambio porque hay cuentas que usan esta moneda');
      }

      // 🚨 REFACTORIZADO: Usar el nuevo CurrencyConversionService
      const result = await CurrencyConversionService.deleteExchangeRate(userId, currencyCodeUpper);
      
      if (!result.success) {
        throw new Error('Error al eliminar la tasa de cambio');
      }

    } catch (error) {
      if ([
        'No se puede eliminar la tasa de cambio porque hay cuentas que usan esta moneda',
        'Error al eliminar la tasa de cambio'
      ].includes(error.message)) {
        throw error;
      }
      throw new Error('Error interno del servidor al eliminar tasa de cambio');
    }
  }

  /**
   * =========================================
   * CONFIGURACIÓN DE USUARIO
   * =========================================
   */

  /**
   * Actualizar configuración del usuario
   * @param {number} idDelUsuario - ID del usuario 
   * @param {Object} configuracion - Nueva configuración
   * @returns {Promise<Object>} - Resultado de la operación
   */
  async actualizarConfiguracionUsuario(idDelUsuario, configuracion) {
    try {
      // Filtrar solo campos válidos
      const fieldsToUpdate = {};
      
      if (configuracion.theme !== undefined) {
        fieldsToUpdate.theme = configuracion.theme;
      }
      
      if (configuracion.primary_currency !== undefined) {
        fieldsToUpdate.primary_currency = configuracion.primary_currency;
      }
      


      // Solo actualizar si hay campos para actualizar
      if (Object.keys(fieldsToUpdate).length === 0) {
        return {
          success: false,
          message: 'No se proporcionaron campos para actualizar'
        };
      }

      // Actualizar en la base de datos
      const updatedRows = await db('user_settings')
        .where({ user_id: idDelUsuario })
        .update(fieldsToUpdate);

      if (updatedRows === 0) {
        // Si no existe, crear configuración inicial
        const newSettings = {
          user_id: idDelUsuario,
          theme: fieldsToUpdate.theme || 'light',
          primary_currency: fieldsToUpdate.primary_currency || 'NIO'
        };

        await db('user_settings').insert(newSettings);
      }

      // Obtener configuración actualizada
      const configuracionActualizada = await db('user_settings')
        .where({ user_id: idDelUsuario })
        .first();

      return {
        success: true,
        data: configuracionActualizada
      };

    } catch (error) {
      console.error('Error en actualizarConfiguracionUsuario:', error);
      return {
        success: false,
        message: 'Error al actualizar configuración del usuario'
      };
    }
  }

  /**
   * Actualizar moneda principal del usuario
   * 🚨 VERSIÓN SIMPLIFICADA: Solo para USD y NIO
   * @param {number} userId - ID del usuario
   * @param {string} newPrimaryCurrencyCode - Nueva moneda principal
   * @returns {Promise<Object>} - Estado completo y validado del sistema
   */
  async updatePrimaryCurrency(userId, newPrimaryCurrencyCode) {
    console.log(`\n🔄 === ACTUALIZACIÓN DE MONEDA PRINCIPAL ===`);
    console.log(`👤 Usuario ID: ${userId}`);
    console.log(`💱 Nueva moneda principal: ${newPrimaryCurrencyCode}`);

    return db.transaction(async (trx) => {
      try {
        // =========================================================
        // FASE 1: VALIDACIÓN Y OBTENCIÓN DE DATOS
        // =========================================================
        
        console.log(`\n📋 FASE 1: Validando y obteniendo datos...`);
        
        // 1.1 Validar que la moneda sea soportada
        if (!['USD', 'NIO'].includes(newPrimaryCurrencyCode)) {
          throw new Error(`Moneda no soportada: ${newPrimaryCurrencyCode}. Solo se permiten USD y NIO.`);
        }
        
        // 1.2 Obtener configuración actual del usuario
        const userSettings = await trx('user_settings')
          .where({ user_id: userId })
          .forUpdate()
          .first();

        if (!userSettings) {
          throw new Error('Configuración de usuario no encontrada');
        }

        const oldPrimaryCurrencyCode = userSettings.primary_currency;
        
        console.log(`💰 Moneda principal actual: ${oldPrimaryCurrencyCode}`);
        
        // 1.3 Verificar si es necesario el cambio
        if (oldPrimaryCurrencyCode === newPrimaryCurrencyCode) {
          console.log(`✅ La moneda principal ya es ${newPrimaryCurrencyCode}. No se requiere cambio.`);
          return { 
            success: true,
            message: 'La moneda principal ya es la seleccionada',
            newPrimaryCurrency: newPrimaryCurrencyCode,
            updatedRates: []
          };
        }

        // =========================================================
        // FASE 2: ACTUALIZACIÓN SIMPLIFICADA
        // =========================================================
        
        console.log(`\n💾 FASE 2: Actualizando moneda principal...`);
        
        // 2.1 Actualizar user_settings
        const userUpdateResult = await trx('user_settings')
          .where({ user_id: userId })
          .update({ 
            primary_currency: newPrimaryCurrencyCode,
            updated_at: trx.fn.now()
          });
        
        if (userUpdateResult === 0) {
          throw new Error('No se pudo actualizar la moneda principal del usuario');
        }
        
        console.log(`✅ Moneda principal actualizada: ${oldPrimaryCurrencyCode} → ${newPrimaryCurrencyCode}`);

        // 2.2 Limpiar tasas de cambio existentes (solo mantener USD y NIO)
        console.log(`🧹 Limpiando tasas de cambio...`);
        
        // Usar CurrencyConversionService para limpiar tasas obsoletas
        const CurrencyConversionService = require('./CurrencyConversionService');
        
        // Obtener todas las tasas actuales
        const currentRates = await CurrencyConversionService.getUserExchangeRates(userId);
        
        // Eliminar tasas que no sean USD o NIO
        for (const rate of currentRates) {
          if (!['USD', 'NIO'].includes(rate.currency_code)) {
            await CurrencyConversionService.deleteExchangeRate(userId, rate.currency_code);
          }
        }
        
        console.log(`🗑️  Tasas de cambio obsoletas eliminadas`);

        // 2.3 Asegurar que existe la tasa de cambio correcta
        console.log(`🔧 Configurando tasa de cambio...`);
        
        // Si la nueva moneda principal es USD, necesitamos tasa NIO->USD
        // Si la nueva moneda principal es NIO, necesitamos tasa USD->NIO
        const otherCurrency = newPrimaryCurrencyCode === 'USD' ? 'NIO' : 'USD';
        
        // Verificar si ya existe la tasa necesaria
        const existingRates = await CurrencyConversionService.getUserExchangeRates(userId);
        const existingRate = existingRates.find(rate => rate.currency_code === otherCurrency);
        
        if (!existingRate) {
          // Crear tasa por defecto
          const defaultRate = newPrimaryCurrencyCode === 'USD' ? 0.0274 : 36.5; // NIO->USD o USD->NIO
          
          await CurrencyConversionService.updateExchangeRate(userId, otherCurrency, defaultRate);
          
          console.log(`✅ Creada tasa por defecto: 1 ${otherCurrency} = ${defaultRate} USD`);
        } else {
          console.log(`✅ Tasa existente: 1 ${otherCurrency} = ${existingRate.rate_to_usd} USD`);
        }

        // =========================================================
        // FASE 3: VALIDACIÓN FINAL
        // =========================================================
        
        console.log(`\n🔍 FASE 3: Validando estado final...`);
        
        // 3.1 Verificar configuración actualizada
        const verifyUserSettings = await trx('user_settings')
          .where({ user_id: userId })
          .first();
        
        if (verifyUserSettings.primary_currency !== newPrimaryCurrencyCode) {
          throw new Error(`Inconsistencia: La moneda principal no se actualizó correctamente`);
        }

        // 3.2 Obtener tasas finales
        const finalRates = await CurrencyConversionService.getUserExchangeRates(userId);
        
        console.log(`📊 Estado final: ${finalRates.length} tasas de cambio`);
        finalRates.forEach(rate => {
          console.log(`   - 1 ${rate.currency_code} = ${parseFloat(rate.rate_to_usd).toFixed(6)} USD`);
        });

        console.log(`\n🎉 === ACTUALIZACIÓN COMPLETADA ===`);
        console.log(`💰 Nueva moneda principal: ${newPrimaryCurrencyCode}`);
        console.log(`✅ Estado del sistema: CONSISTENTE`);

        return {
          success: true,
          message: 'Moneda principal actualizada exitosamente',
          newPrimaryCurrency: newPrimaryCurrencyCode,
          updatedRates: finalRates
        };

      } catch (error) {
        console.error(`\n❌ === ERROR EN ACTUALIZACIÓN DE MONEDA PRINCIPAL ===`);
        console.error(`💥 Error: ${error.message}`);
        console.error(`🔄 La transacción será revertida automáticamente`);
        throw error;
      }
    });
  }
}

module.exports = new SettingsService();