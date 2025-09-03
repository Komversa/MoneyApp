import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { loginAPI, registerAPI, getProfileAPI, refreshTokenAPI } from '../api/auth.api'

/**
 * Store de autenticación usando Zustand
 * Maneja el estado global de autenticación del usuario
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /**
       * Acción para iniciar sesión
       * CORRECCIÓN CRÍTICA: Backend ahora devuelve configuraciones completas directamente
       * @param {string} email - Email del usuario
       * @param {string} password - Contraseña del usuario
       * @returns {Promise<boolean>} - true si el login fue exitoso
       */
      login: async (email, password) => {
        set({ isLoading: true, error: null })

        try {
          console.log(`\n🔐 === INICIO DE SESIÓN ===`)
          console.log(`📧 Email: ${email}`)

          // PASO 1: Autenticación con configuraciones completas
          const loginResponse = await loginAPI(email, password)
          
          if (!loginResponse.success) {
            set({
              isLoading: false,
              error: loginResponse.message || 'Error al iniciar sesión'
            })
            return false
          }

          const { user: completeUser, accessToken, refreshToken } = loginResponse.data
          console.log(`✅ Autenticación exitosa para: ${completeUser.email}`)
          console.log(`✅ Configuraciones cargadas:`)
          console.log(`   - Moneda principal: ${completeUser.settings?.primary_currency || 'NO DEFINIDA'}`)
          console.log(`   - Tema: ${completeUser.settings?.theme || 'NO DEFINIDO'}`)

          // PASO 2: Guardar usuario completo con configuraciones
          set({
            user: completeUser,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })

          console.log(`🎉 Login completo exitoso con configuraciones persistidas`)
          return true

        } catch (error) {
          console.error(`❌ Error en proceso de login:`, error.message)
          
          const errorMessage = error.response?.data?.message || 
                              error.message || 
                              'Error de conexión. Verifique su conexión a internet.'
          
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null
          })
          return false
        }
      },

      /**
       * Acción para registrar un nuevo usuario
       * CORRECCIÓN: Backend ahora devuelve configuraciones completas directamente
       * @param {Object} userData - Datos del usuario {email, password}
       * @returns {Promise<boolean>} - true si el registro fue exitoso
       */
      register: async (userData) => {
        set({ isLoading: true, error: null })

        try {
          console.log(`\n📝 === REGISTRO DE USUARIO ===`)

          // PASO 1: Registro con configuraciones completas
          const registerResponse = await registerAPI(userData)
          
          if (!registerResponse.success) {
            set({
              isLoading: false,
              error: registerResponse.message || 'Error al registrar usuario'
            })
            return false
          }

          const { user: completeUser, accessToken } = registerResponse.data
          console.log(`✅ Registro exitoso para: ${completeUser.email}`)
          console.log(`✅ Configuraciones iniciales cargadas:`)
          console.log(`   - Moneda principal: ${completeUser.settings?.primary_currency || 'NIO'}`)
          console.log(`   - Tema: ${completeUser.settings?.theme || 'light'}`)

          // PASO 2: Guardar usuario completo con configuraciones
          set({
            user: completeUser,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })

          console.log(`🎉 Registro completo exitoso con configuraciones`)
          return true

        } catch (error) {
          console.error(`❌ Error en proceso de registro:`, error.message)
          
          const errorMessage = error.response?.data?.message || 
                              error.message || 
                              'Error de conexión. Verifique su conexión a internet.'
          
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            accessToken: null
          })
          return false
        }
      },

      /**
       * Acción para cerrar sesión
       * Limpia todo el estado de autenticación
       */
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
      },

      /**
       * Acción para limpiar errores
       */
      clearError: () => {
        set({ error: null })
      },

      /**
       * Acción para actualizar datos del usuario
       * @param {Object} userData - Nuevos datos del usuario
       */
      updateUser: (userData) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData }
          })
        }
      },

      /**
       * Acción para establecer el estado de carga
       * @param {boolean} loading - Estado de carga
       */
      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      /**
       * Acción para obtener el token actual
       * @returns {string|null} - Token de acceso actual
       */
      getToken: () => {
        return get().accessToken
      },

      /**
       * Acción para renovar el token de acceso usando el refresh token
       * CORRECCIÓN: Backend ahora devuelve configuraciones completas
       * @returns {Promise<boolean>} - true si la renovación fue exitosa
       */
      refreshAccessToken: async () => {
        const { refreshToken } = get()
        
        if (!refreshToken) {
          console.warn('No hay refresh token disponible')
          return false
        }

        try {
          console.log('🔄 Renovando token de acceso...')
          
          const response = await refreshTokenAPI(refreshToken)
          
          if (response.success) {
            const { accessToken, user: completeUser } = response.data
            
            console.log(`✅ Token renovado exitosamente`)
            console.log(`✅ Configuraciones cargadas:`)
            console.log(`   - Moneda principal: ${completeUser.settings?.primary_currency || 'NO DEFINIDA'}`)
            console.log(`   - Tema: ${completeUser.settings?.theme || 'NO DEFINIDO'}`)
            
            // Actualizar el token de acceso y usuario completo
            set({
              accessToken,
              user: completeUser
            })
            
            console.log('✅ Token de acceso renovado exitosamente con configuraciones')
            return true
          } else {
            console.warn('⚠️ No se pudo renovar el token:', response.message)
            return false
          }
        } catch (error) {
          console.error('❌ Error al renovar token:', error)
          
          // Si el refresh token también expiró, hacer logout
          if (error.response?.status === 401) {
            console.log('🔄 Refresh token expirado, cerrando sesión...')
            get().logout()
          }
          
          return false
        }
      },

      /**
       * Acción para verificar si el usuario está autenticado
       * @returns {boolean} - true si está autenticado
       */
      checkAuth: () => {
        const { accessToken, user } = get()
        return !!(accessToken && user)
      },

      /**
       * Acción para actualizar configuraciones del usuario
       * @param {Object} configuraciones - Nuevas configuraciones del usuario
       */
      actualizarConfiguracionUsuario: (configuraciones) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { 
              ...currentUser, 
              settings: {
                ...currentUser.settings,
                ...configuraciones
              }
            }
          })
        }
      },

      /**
       * Acción para obtener configuraciones del usuario
       * @returns {Object} - Configuraciones actuales del usuario
       */
      obtenerConfiguracionUsuario: () => {
        const { user } = get()
        // Retornar objeto con referencia estable para evitar re-renders
        const defaultConfig = {
          theme: 'light',
          primary_currency: 'USD'  // 🚨 CAMBIO: USD como moneda principal por defecto
        }
        
        if (!user?.settings) {
          return defaultConfig
        }
        
        return {
          theme: user.settings.theme || defaultConfig.theme,
          primary_currency: user.settings.primary_currency || defaultConfig.primary_currency
        }
      },

      /**
       * Acción para cambiar el tema de la aplicación
       * @param {string} theme - Nuevo tema ('light' o 'dark')
       */
      cambiarTema: (theme) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              settings: {
                ...currentUser.settings,
                theme
              }
            }
          })
        }
      }
    }),
    {
      name: 'moneyapp-auth', // Clave en localStorage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export default useAuthStore