const { db } = require('../../config/db');
const { hashPassword, verifyPassword } = require('../../utils/bcrypt.utils');
const { generateTokenPair } = require('../../utils/jwt.utils');

/**
 * Servicio de autenticación que contiene toda la lógica de negocio
 */
class AuthService {
  /**
   * Registrar un nuevo usuario
   * @param {Object} userData - Datos del usuario { email, password }
   * @returns {Promise<Object>} - Usuario registrado con tokens
   */
  async register(userData) {
    const { email, password } = userData;

    try {
      // Verificar si el usuario ya existe
      const existingUser = await db('users')
        .where({ email })
        .first();

      if (existingUser) {
        throw new Error('El usuario ya existe');
      }

      // Hashear la contraseña
      const passwordHash = await hashPassword(password);

      // Usar transacción para garantizar atomicidad
      const result = await db.transaction(async (trx) => {
        // Crear el usuario
        const [newUser] = await trx('users')
          .insert({
            email,
            password_hash: passwordHash
          })
          .returning(['id', 'email', 'created_at']);

        // Crear configuración por defecto del usuario
        await trx('user_settings')
          .insert({
            user_id: newUser.id,
            theme: 'light',
            primary_currency: 'USD'  // 🚨 CAMBIO: USD como moneda principal por defecto
          });

        // Crear tipos de cuenta predeterminados
        const accountTypesData = [
          { user_id: newUser.id, name: 'Banco' },
          { user_id: newUser.id, name: 'Cuenta de Ahorros' },
          { user_id: newUser.id, name: 'Efectivo' },
          { user_id: newUser.id, name: 'Inversiones' }
        ];

        await trx('account_types').insert(accountTypesData);

        // Crear categorías predeterminadas
        const categoriesData = [
          // Categorías de INGRESOS
          { user_id: newUser.id, name: 'Salario', type: 'income' },
          { user_id: newUser.id, name: 'Freelance', type: 'income' },
          { user_id: newUser.id, name: 'Inversiones', type: 'income' },
          { user_id: newUser.id, name: 'Bonificaciones', type: 'income' },
          { user_id: newUser.id, name: 'Ventas', type: 'income' },
          { user_id: newUser.id, name: 'Otros Ingresos', type: 'income' },

          // Categorías de GASTOS
          { user_id: newUser.id, name: 'Comida', type: 'expense' },
          { user_id: newUser.id, name: 'Transporte', type: 'expense' },
          { user_id: newUser.id, name: 'Vivienda', type: 'expense' },
          { user_id: newUser.id, name: 'Servicios Públicos', type: 'expense' },
          { user_id: newUser.id, name: 'Entretenimiento', type: 'expense' },
          { user_id: newUser.id, name: 'Salud', type: 'expense' },
          { user_id: newUser.id, name: 'Educación', type: 'expense' },
          { user_id: newUser.id, name: 'Compras', type: 'expense' },
          { user_id: newUser.id, name: 'Impuestos', type: 'expense' },
          { user_id: newUser.id, name: 'Seguros', type: 'expense' },
          { user_id: newUser.id, name: 'Otros Gastos', type: 'expense' }
        ];

        await trx('categories').insert(categoriesData);

        // Log de éxito para desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Usuario registrado: ${email}`);
          console.log(`📦 Tipos de cuenta creados: ${accountTypesData.length}`);
          console.log(`📊 Categorías creadas: ${categoriesData.length}`);
        }

        return newUser;
      });

      // Generar tokens JWT
      const tokens = generateTokenPair({
        id: result.id,
        email: result.email
      });

      // 🚨 CORRECCIÓN CRÍTICA: Cargar configuraciones completas del usuario recién creado
      console.log(`🔄 Cargando configuraciones del usuario recién registrado...`);
      const completeUser = await this.getUserById(result.id);

      console.log(`✅ Configuraciones iniciales cargadas:`);
      console.log(`   - Tema: ${completeUser.settings?.theme || 'light'}`);
      console.log(`   - Moneda Principal: ${completeUser.settings?.primary_currency || 'NIO'}`);

      return {
        user: completeUser,
        ...tokens
      };

    } catch (error) {
      // Si es un error conocido, relanzarlo
      if (error.message === 'El usuario ya existe') {
        throw error;
      }
      
      // Error genérico para otros casos
      throw new Error('Error interno del servidor al registrar usuario');
    }
  }

  /**
   * Iniciar sesión de usuario
   * CORRECCIÓN CRÍTICA: Ahora carga configuraciones completas del usuario
   * @param {Object} credentials - Credenciales { email, password }
   * @returns {Promise<Object>} - Usuario autenticado con tokens y configuraciones
   */
  async login(credentials) {
    const { email, password } = credentials;

    try {
      console.log(`\n🔐 === INICIO DE SESIÓN ===`);
      console.log(`📧 Email: ${email}`);

      // Buscar usuario por email
      const user = await db('users')
        .where({ email })
        .first();

      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      console.log(`✅ Usuario encontrado: ${user.email}`);

      // Verificar la contraseña
      const isPasswordValid = await verifyPassword(password, user.password_hash);

      if (!isPasswordValid) {
        throw new Error('Credenciales inválidas');
      }

      console.log(`✅ Contraseña verificada correctamente`);

      // 🚨 CORRECCIÓN CRÍTICA: Cargar configuraciones completas del usuario
      console.log(`🔄 Cargando configuraciones completas del usuario...`);
      const completeUser = await this.getUserById(user.id);

      console.log(`✅ Configuraciones cargadas:`);
      console.log(`   - Tema: ${completeUser.settings?.theme || 'NO DEFINIDO'}`);
      console.log(`   - Moneda Principal: ${completeUser.settings?.primary_currency || 'NO DEFINIDA'}`);

      // Generar tokens JWT
      const tokens = generateTokenPair({
        id: user.id,
        email: user.email
      });

      console.log(`🎉 Login completo exitoso con configuraciones`);

      return {
        user: completeUser,
        ...tokens
      };

    } catch (error) {
      console.error(`❌ Error en proceso de login:`, error.message);
      
      // Si es un error conocido, relanzarlo
      if (error.message === 'Credenciales inválidas') {
        throw error;
      }
      
      // Error genérico para otros casos
      throw new Error('Error interno del servidor al iniciar sesión');
    }
  }

  /**
   * Renovar token de acceso usando refresh token
   * CORRECCIÓN CRÍTICA: Ahora carga configuraciones completas del usuario
   * @param {string} refreshToken - Token de refresco válido
   * @returns {Promise<Object>} - Nuevo access token con usuario completo
   */
  async refreshAccessToken(refreshToken) {
    try {
      console.log(`\n🔄 === RENOVACIÓN DE TOKEN ===`);
      
      // Verificar el refresh token
      const { verifyRefreshToken } = require('../../utils/jwt.utils');
      const decodedToken = verifyRefreshToken(refreshToken);

      console.log(`✅ Token de refresco válido para usuario ID: ${decodedToken.id}`);

      // 🚨 CORRECCIÓN CRÍTICA: Cargar configuraciones completas del usuario
      const completeUser = await this.getUserById(decodedToken.id);

      console.log(`✅ Configuraciones cargadas:`);
      console.log(`   - Tema: ${completeUser.settings?.theme || 'NO DEFINIDO'}`);
      console.log(`   - Moneda Principal: ${completeUser.settings?.primary_currency || 'NO DEFINIDA'}`);

      // Generar nuevo access token
      const { generateTokenPair } = require('../../utils/jwt.utils');
      const newTokens = generateTokenPair({
        id: completeUser.id,
        email: completeUser.email
      });

      console.log(`🎉 Token renovado exitosamente con configuraciones`);

      return {
        accessToken: newTokens.accessToken,
        user: completeUser
      };

    } catch (error) {
      console.error(`❌ Error al renovar token:`, error.message);
      
      if (error.message === 'Token de refresco expirado') {
        throw new Error('Refresh token expirado');
      }
      if (error.message === 'Token de refresco inválido') {
        throw new Error('Refresh token inválido');
      }
      throw new Error('Error al renovar el token de acceso');
    }
  }

  /**
   * Obtener información COMPLETA del usuario por ID incluyendo configuraciones
   * CORRECCIÓN CRÍTICA: Ahora carga user_settings para asegurar persistencia de configuraciones
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Información completa del usuario con configuraciones
   */
  async getUserById(userId) {
    try {
      console.log(`\n👤 === CARGA COMPLETA DE USUARIO ===`);
      console.log(`🔍 Obteniendo usuario ID: ${userId}`);

      // Obtener datos básicos del usuario
      const user = await db('users')
        .select(['id', 'email', 'created_at'])
        .where({ id: userId })
        .first();

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      console.log(`✅ Usuario encontrado: ${user.email}`);

      // 🚨 CORRECCIÓN CRÍTICA: Obtener configuraciones del usuario
      const userSettings = await db('user_settings')
        .select(['theme', 'primary_currency', 'updated_at'])
        .where({ user_id: userId })
        .first();

      if (!userSettings) {
        console.warn(`⚠️  No se encontraron configuraciones para usuario ${userId}. Usando valores por defecto.`);
        // Si no existen configuraciones, crear valores por defecto
        const defaultSettings = {
          theme: 'light',
          primary_currency: 'USD'  // 🚨 CAMBIO: USD como moneda principal por defecto
        };
        
        console.log(`🔧 Configuraciones por defecto aplicadas:`, defaultSettings);

        return {
          ...user,
          settings: defaultSettings
        };
      }

      console.log(`🎯 Configuraciones cargadas desde DB:`);
      console.log(`   - Tema: ${userSettings.theme}`);
      console.log(`   - Moneda Principal: ${userSettings.primary_currency}`);
      console.log(`   - Última actualización: ${userSettings.updated_at}`);

      // Construir respuesta completa con configuraciones
      const completeUser = {
        ...user,
        settings: {
          theme: userSettings.theme,
          primary_currency: userSettings.primary_currency
        }
      };

      console.log(`✅ Usuario completo preparado para frontend`);
      
      return completeUser;

    } catch (error) {
      console.error(`❌ Error al obtener usuario completo:`, error.message);
      
      if (error.message === 'Usuario no encontrado') {
        throw error;
      }
      throw new Error('Error interno del servidor al obtener usuario');
    }
  }
}

module.exports = new AuthService();