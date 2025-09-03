import { useState, useEffect } from 'react'
import { 
  obtenerTiposCuentaAPI, 
  crearTipoCuentaAPI, 
  actualizarTipoCuentaAPI, 
  eliminarTipoCuentaAPI,
  obtenerCategoriasAPI, 
  crearCategoriaAPI, 
  actualizarCategoriaAPI, 
  eliminarCategoriaAPI,
  obtenerTasasDeCambioAPI,
  crearTasaDeCambioAPI,
  actualizarTasaDeCambioAPI,
  eliminarTasaDeCambioAPI,
  actualizarConfiguracionUsuarioAPI,
  validarTipoCuenta,
  validarCategoria,
  validarTasaDeCambio
} from '../api/settings.api'
import useAuthStore from '../store/useAuthStore'
import { useToast } from '../components/ui/Toaster'
import useErrorHandler from './useErrorHandler'
import { OPERATION_TYPES } from '../utils/errorHandler'
import { getExchangeRateCurrencyOptions } from '../utils/currencyData'

/**
 * Hook personalizado para manejar la lógica de la página de Configuración
 * Encapsula toda la lógica de estado y operaciones CRUD
 */
const useConfiguracion = () => {
  const { 
    actualizarConfiguracionUsuario, 
    obtenerConfiguracionUsuario,
    cambiarTema,
    isAuthenticated 
  } = useAuthStore()
  const { success, error: showError } = useToast()
  const errorHandler = useErrorHandler()

  // Estados para tipos de cuenta
  const [tiposCuenta, setTiposCuenta] = useState([
    { id: 1, name: 'Banco' },
    { id: 2, name: 'Cuenta de Ahorros' },
    { id: 3, name: 'Efectivo' },
    { id: 4, name: 'Inversiones' }
  ])
  const [tiposCuentaLoading, setTiposCuentaLoading] = useState(false)
  const [tiposCuentaError, setTiposCuentaError] = useState(null)

  // Estados para tipos de deuda
  const [tiposDeuda, setTiposDeuda] = useState([
    { id: 1, name: 'Tarjeta de Crédito' },
    { id: 2, name: 'Préstamo Personal' },
    { id: 3, name: 'Préstamo Hipotecario' },
    { id: 4, name: 'Préstamo Vehicular' }
  ])
  const [tiposDeudaLoading, setTiposDeudaLoading] = useState(false)
  const [tiposDeudaError, setTiposDeudaError] = useState(null)

  // Estados para categorías
  const [categorias, setCategorias] = useState([])
  const [categoriasLoading, setCategoriasLoading] = useState(false)
  const [categoriasError, setCategoriasError] = useState(null)

  // Estados para tasas de cambio
  const [tasasCambio, setTasasCambio] = useState([])
  const [tasasCambioLoading, setTasasCambioLoading] = useState(false)
  const [tasasCambioError, setTasasCambioError] = useState(null)

  // Estados para configuración general
  const [configuracionUsuario, setConfiguracionUsuario] = useState({
    theme: 'light',
    primary_currency: 'USD'  // 🚨 CAMBIO: USD como moneda principal por defecto
  })
  const [configuracionLoading, setConfiguracionLoading] = useState(false)

  /**
   * =========================================
   * FUNCIONES DE CARGA INICIAL
   * =========================================
   */

  /**
   * Cargar tipos de cuenta del usuario
   */
  const cargarTiposCuenta = async () => {
    setTiposCuentaLoading(true)
    setTiposCuentaError(null)

    try {
      const response = await errorHandler.executeWithRetry(
        () => obtenerTiposCuentaAPI(),
        {
          operationType: OPERATION_TYPES.READ,
          entityName: 'tipos de cuenta',
          maxRetries: 2,
          onRetry: (attempt, maxRetries) => {
            console.log(`Reintentando carga de tipos de cuenta (${attempt}/${maxRetries})`)
          }
        }
      )
      
      if (response.success) {
        setTiposCuenta(response.data.accountTypes || [])
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorInfo = errorHandler.handleError(error, {
        operationType: OPERATION_TYPES.READ,
        entityName: 'tipos de cuenta'
      })
      setTiposCuentaError(errorInfo.userMessage)
    } finally {
      setTiposCuentaLoading(false)
    }
  }

  /**
   * Cargar categorías del usuario
   */
  const cargarCategorias = async () => {
    setCategoriasLoading(true)
    setCategoriasError(null)

    try {
      const response = await errorHandler.executeWithRetry(
        () => obtenerCategoriasAPI(),
        {
          operationType: OPERATION_TYPES.READ,
          entityName: 'categorías',
          maxRetries: 2,
          onRetry: (attempt, maxRetries) => {
            console.log(`Reintentando carga de categorías (${attempt}/${maxRetries})`)
          }
        }
      )
      
      if (response.success) {
        setCategorias(response.data.categories || [])
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorInfo = errorHandler.handleError(error, {
        operationType: OPERATION_TYPES.READ,
        entityName: 'categorías'
      })
      setCategoriasError(errorInfo.userMessage)
    } finally {
      setCategoriasLoading(false)
    }
  }

  /**
   * Cargar tasas de cambio del usuario
   * 🚨 OPTIMIZACIÓN: Agregado cache y mejor manejo de rate limiting
   */
  const cargarTasasCambio = async () => {
    // Evitar múltiples requests simultáneos
    if (tasasCambioLoading) {
      console.log('⏳ Ya hay una carga de tasas de cambio en progreso')
      return
    }

    // Verificar cache primero
    const cachedData = getTasasCambioFromCache()
    if (cachedData) {
      console.log('📦 Usando tasas de cambio en cache')
      setTasasCambio(cachedData)
      return
    }

    setTasasCambioLoading(true)
    setTasasCambioError(null)

    try {
      const response = await errorHandler.executeWithRetry(
        () => obtenerTasasDeCambioAPI(),
        {
          operationType: OPERATION_TYPES.READ,
          entityName: 'tasas de cambio',
          maxRetries: 1, // Reducido para evitar rate limiting
          onRetry: (attempt, maxRetries) => {
            console.log(`Reintentando carga de tasas de cambio (${attempt}/${maxRetries})`)
          }
        }
      )
      
      if (response.success) {
        const tasasData = response.data.tasasCambio || []
        setTasasCambio(tasasData)
        
        // Guardar en cache
        saveTasasCambioToCache(tasasData)
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      // Manejo especial para errores de rate limiting
      if (error.response?.status === 429) {
        console.log('🚨 Rate limit alcanzado, usando cache si está disponible')
        const cachedData = getTasasCambioFromCache()
        if (cachedData) {
          setTasasCambio(cachedData)
          setTasasCambioError('Usando datos en cache debido a límite de solicitudes')
        } else {
          setTasasCambioError('Demasiadas solicitudes. Intenta de nuevo en un minuto.')
        }
      } else {
        const errorInfo = errorHandler.handleError(error, {
          operationType: OPERATION_TYPES.READ,
          entityName: 'tasas de cambio'
        })
        setTasasCambioError(errorInfo.userMessage)
      }
    } finally {
      setTasasCambioLoading(false)
    }
  }

  /**
   * Obtener tasas de cambio desde cache
   */
  const getTasasCambioFromCache = () => {
    try {
      const cacheKey = 'tasasCambioCache'
      const cached = localStorage.getItem(cacheKey)
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const cacheAge = Date.now() - timestamp
        const cacheValid = cacheAge < 5 * 60 * 1000 // 5 minutos
        
        if (cacheValid && data && data.length > 0) {
          return data
        }
      }
    } catch (error) {
      console.log('❌ Error al leer cache:', error.message)
    }
    return null
  }

  /**
   * Guardar tasas de cambio en cache
   */
  const saveTasasCambioToCache = (data) => {
    try {
      const cacheKey = 'tasasCambioCache'
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.log('⚠️ No se pudo guardar en cache:', error.message)
    }
  }

  /**
   * Cargar configuración del usuario
   * CORRECCIÓN CRÍTICA: Ahora sincroniza con el store global y aplica el tema
   */
  const cargarConfiguracionUsuario = () => {
    const config = obtenerConfiguracionUsuario()
    console.log(`🔄 Sincronizando configuración local con store global:`, config)
    setConfiguracionUsuario(config)
    
    // 🚨 CORRECCIÓN CRÍTICA: Aplicar tema visual inmediatamente
    if (config.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  /**
   * =========================================
   * FUNCIONES CRUD - TIPOS DE CUENTA
   * =========================================
   */

  /**
   * Crear un nuevo tipo de cuenta
   */
  const crearTipoCuenta = async (nombre) => {
    // Validar datos
    const validation = validarTipoCuenta({ name: nombre })
    if (!validation.isValid) {
      showError(Object.values(validation.errors)[0])
      return { success: false, errors: validation.errors }
    }

    try {
      const response = await errorHandler.executeWithRetry(
        () => crearTipoCuentaAPI({ name: nombre.trim() }),
        {
          operationType: OPERATION_TYPES.CREATE,
          entityName: 'tipo de cuenta',
          maxRetries: 2,
          onRetry: (attempt, maxRetries) => {
            console.log(`Reintentando creación de tipo de cuenta (${attempt}/${maxRetries})`)
          }
        }
      )
      
      if (response.success) {
        // Actualizar estado local
        setTiposCuenta(prev => [...prev, response.data.accountType])
        success('Tipo de cuenta creado exitosamente')
        return { success: true, data: response.data.accountType }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorInfo = errorHandler.handleError(error, {
        operationType: OPERATION_TYPES.CREATE,
        entityName: 'tipo de cuenta'
      })
      return { success: false, error: errorInfo.userMessage }
    }
  }

  /**
   * Actualizar un tipo de cuenta existente
   */
  const actualizarTipoCuenta = async (id, nombre) => {
    // Validar datos
    const validation = validarTipoCuenta({ name: nombre })
    if (!validation.isValid) {
      showError(Object.values(validation.errors)[0])
      return { success: false, errors: validation.errors }
    }

    try {
      const response = await errorHandler.executeWithRetry(
        () => actualizarTipoCuentaAPI(id, { name: nombre.trim() }),
        {
          operationType: OPERATION_TYPES.UPDATE,
          entityName: 'tipo de cuenta',
          maxRetries: 2,
          onRetry: (attempt, maxRetries) => {
            console.log(`Reintentando actualización de tipo de cuenta (${attempt}/${maxRetries})`)
          }
        }
      )
      
      if (response.success) {
        // Actualizar estado local
        setTiposCuenta(prev => 
          prev.map(tipo => 
            tipo.id === id ? response.data.accountType : tipo
          )
        )
        success('Tipo de cuenta actualizado exitosamente')
        return { success: true, data: response.data.accountType }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorInfo = errorHandler.handleError(error, {
        operationType: OPERATION_TYPES.UPDATE,
        entityName: 'tipo de cuenta'
      })
      return { success: false, error: errorInfo.userMessage }
    }
  }

  /**
   * Eliminar un tipo de cuenta
   */
  const eliminarTipoCuenta = async (id) => {
    try {
      const response = await errorHandler.executeWithRetry(
        () => eliminarTipoCuentaAPI(id),
        {
          operationType: OPERATION_TYPES.DELETE,
          entityName: 'tipo de cuenta',
          maxRetries: 2,
          onRetry: (attempt, maxRetries) => {
            console.log(`Reintentando eliminación de tipo de cuenta (${attempt}/${maxRetries})`)
          }
        }
      )
      
      if (response.success) {
        // Actualizar estado local
        setTiposCuenta(prev => prev.filter(tipo => tipo.id !== id))
        success('Tipo de cuenta eliminado exitosamente')
        return { success: true }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorInfo = errorHandler.handleError(error, {
        operationType: OPERATION_TYPES.DELETE,
        entityName: 'tipo de cuenta'
      })
      return { success: false, error: errorInfo.userMessage }
    }
  }

  /**
   * =========================================
   * FUNCIONES CRUD - CATEGORÍAS
   * =========================================
   */

  /**
   * Crear una nueva categoría
   */
  const crearCategoria = async (nombre, tipo) => {
    // Validar datos
    const validation = validarCategoria({ name: nombre, type: tipo })
    if (!validation.isValid) {
      showError(Object.values(validation.errors)[0])
      return { success: false, errors: validation.errors }
    }

    try {
      const response = await errorHandler.executeWithRetry(
        () => crearCategoriaAPI({ 
          name: nombre.trim(), 
          type: tipo 
        }),
        {
          operationType: OPERATION_TYPES.CREATE,
          entityName: 'categoría',
          maxRetries: 2,
          onRetry: (attempt, maxRetries) => {
            console.log(`Reintentando creación de categoría (${attempt}/${maxRetries})`)
          }
        }
      )
      
      if (response.success) {
        // Actualizar estado local
        setCategorias(prev => [...prev, response.data.category])
        success('Categoría creada exitosamente')
        return { success: true, data: response.data.category }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorInfo = errorHandler.handleError(error, {
        operationType: OPERATION_TYPES.CREATE,
        entityName: 'categoría'
      })
      return { success: false, error: errorInfo.userMessage }
    }
  }

  /**
   * Actualizar una categoría existente
   */
  const actualizarCategoria = async (id, nombre, tipo) => {
    // Validar datos
    const validation = validarCategoria({ name: nombre, type: tipo })
    if (!validation.isValid) {
      showError(Object.values(validation.errors)[0])
      return { success: false, errors: validation.errors }
    }

    try {
      const response = await errorHandler.executeWithRetry(
        () => actualizarCategoriaAPI(id, { 
          name: nombre.trim(), 
          type: tipo 
        }),
        {
          operationType: OPERATION_TYPES.UPDATE,
          entityName: 'categoría',
          maxRetries: 2,
          onRetry: (attempt, maxRetries) => {
            console.log(`Reintentando actualización de categoría (${attempt}/${maxRetries})`)
          }
        }
      )
      
      if (response.success) {
        // Actualizar estado local
        setCategorias(prev => 
          prev.map(categoria => 
            categoria.id === id ? response.data.category : categoria
          )
        )
        success('Categoría actualizada exitosamente')
        return { success: true, data: response.data.category }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorInfo = errorHandler.handleError(error, {
        operationType: OPERATION_TYPES.UPDATE,
        entityName: 'categoría'
      })
      return { success: false, error: errorInfo.userMessage }
    }
  }

  /**
   * Eliminar una categoría
   */
  const eliminarCategoria = async (id) => {
    try {
      const response = await errorHandler.executeWithRetry(
        () => eliminarCategoriaAPI(id),
        {
          operationType: OPERATION_TYPES.DELETE,
          entityName: 'categoría',
          maxRetries: 2,
          onRetry: (attempt, maxRetries) => {
            console.log(`Reintentando eliminación de categoría (${attempt}/${maxRetries})`)
          }
        }
      )
      
      if (response.success) {
        // Actualizar estado local
        setCategorias(prev => prev.filter(categoria => categoria.id !== id))
        success('Categoría eliminada exitosamente')
        return { success: true }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorInfo = errorHandler.handleError(error, {
        operationType: OPERATION_TYPES.DELETE,
        entityName: 'categoría'
      })
      return { success: false, error: errorInfo.userMessage }
    }
  }

  /**
   * =========================================
   * FUNCIONES CRUD - TASAS DE CAMBIO
   * =========================================
   */

  /**
   * Crear una nueva tasa de cambio
   */
  const crearTasaCambio = async (currencyCode, rate) => {
    // Validar datos
    const validation = validarTasaDeCambio({ currencyCode, rate })
    if (!validation.isValid) {
      showError(Object.values(validation.errors)[0])
      return { success: false, errors: validation.errors }
    }

    try {
      const response = await errorHandler.executeWithRetry(
        () => crearTasaDeCambioAPI({ 
          currencyCode: currencyCode.trim().toUpperCase(), 
          rate: parseFloat(rate)
        }),
        {
          operationType: OPERATION_TYPES.CREATE,
          entityName: 'tasa de cambio',
          maxRetries: 2,
          onRetry: (attempt, maxRetries) => {
            console.log(`Reintentando creación de tasa de cambio (${attempt}/${maxRetries})`)
          }
        }
      )
      
      if (response.success) {
        // Actualizar estado local
        setTasasCambio(prev => [...prev, response.data.tasaCambio])
        success('Tasa de cambio creada exitosamente')
        return { success: true, data: response.data.tasaCambio }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorInfo = errorHandler.handleError(error, {
        operationType: OPERATION_TYPES.CREATE,
        entityName: 'tasa de cambio'
      })
      return { success: false, error: errorInfo.userMessage }
    }
  }

  /**
   * Actualizar una tasa de cambio existente
   */
  const actualizarTasaCambio = async (currencyCode, rate) => {
    // Validar datos
    const validation = validarTasaDeCambio({ currencyCode, rate })
    if (!validation.isValid) {
      showError(Object.values(validation.errors)[0])
      return { success: false, errors: validation.errors }
    }

    try {
      const response = await errorHandler.executeWithRetry(
        () => actualizarTasaDeCambioAPI(currencyCode, { 
          rate: parseFloat(rate)
        }),
        {
          operationType: OPERATION_TYPES.UPDATE,
          entityName: 'tasa de cambio',
          maxRetries: 2,
          onRetry: (attempt, maxRetries) => {
            console.log(`Reintentando actualización de tasa de cambio (${attempt}/${maxRetries})`)
          }
        }
      )
      
      if (response.success) {
        // Actualizar estado local
        setTasasCambio(prev => 
          prev.map(tasa => 
            tasa.currency_code === currencyCode ? response.data.tasaCambio : tasa
          )
        )
        success('Tasa de cambio actualizada exitosamente')
        return { success: true, data: response.data.tasaCambio }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorInfo = errorHandler.handleError(error, {
        operationType: OPERATION_TYPES.UPDATE,
        entityName: 'tasa de cambio'
      })
      return { success: false, error: errorInfo.userMessage }
    }
  }

  /**
   * Eliminar una tasa de cambio
   */
  const eliminarTasaCambio = async (currencyCode) => {
    try {
      const response = await errorHandler.executeWithRetry(
        () => eliminarTasaDeCambioAPI(currencyCode),
        {
          operationType: OPERATION_TYPES.DELETE,
          entityName: 'tasa de cambio',
          maxRetries: 2,
          onRetry: (attempt, maxRetries) => {
            console.log(`Reintentando eliminación de tasa de cambio (${attempt}/${maxRetries})`)
          }
        }
      )
      
      if (response.success) {
        // Actualizar estado local
        setTasasCambio(prev => prev.filter(tasa => tasa.currency_code !== currencyCode))
        success('Tasa de cambio eliminada exitosamente')
        return { success: true }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorInfo = errorHandler.handleError(error, {
        operationType: OPERATION_TYPES.DELETE,
        entityName: 'tasa de cambio'
      })
      return { success: false, error: errorInfo.userMessage }
    }
  }

  /**
   * =========================================
   * FUNCIONES DE CONFIGURACIÓN
   * =========================================
   */

  /**
   * Inicializar tipos predefinidos para usuarios nuevos
   * Esta función ahora solo se usa para compatibilidad
   * La funcionalidad real está en useInicializacion
   */
  const inicializarTiposPredefinidos = () => {
    console.log('ℹ️ useConfiguracion: inicializarTiposPredefinidos llamado (usar useInicializacion en su lugar)')
    return { success: true }
  }

  /**
   * Actualizar configuración de usuario
   */
  const actualizarConfiguracion = async (nuevaConfiguracion) => {
    setConfiguracionLoading(true)

    try {
      // Llamada al backend para guardar la configuración
      const response = await errorHandler.executeWithRetry(
        () => actualizarConfiguracionUsuarioAPI(nuevaConfiguracion),
        {
          operationType: OPERATION_TYPES.UPDATE,
          entityName: 'configuración',
          maxRetries: 2,
          onRetry: (attempt, maxRetries) => {
            console.log(`Reintentando actualización de configuración (${attempt}/${maxRetries})`)
          }
        }
      )
      
      if (response.success) {
        // Actualizar en el store local después del éxito
        actualizarConfiguracionUsuario(nuevaConfiguracion)
        setConfiguracionUsuario(prev => ({ ...prev, ...nuevaConfiguracion }))
        
        success('Configuración guardada exitosamente')
        return { success: true }
      } else {
        throw new Error(response.message || 'Error al guardar configuración')
      }
    } catch (error) {
      const errorInfo = errorHandler.handleError(error, {
        operationType: OPERATION_TYPES.UPDATE,
        entityName: 'configuración'
      })
      return { success: false, error: errorInfo.userMessage }
    } finally {
      setConfiguracionLoading(false)
    }
  }

  /**
   * Cambiar tema de la aplicación
   * CORRECCIÓN CRÍTICA: Ahora persiste el cambio en la base de datos y actualiza el store global inmediatamente
   */
  const handleCambiarTema = async (nuevoTema) => {
    try {
      console.log(`\n🎨 === CAMBIO DE TEMA ===`)
      console.log(`🔄 Cambiando a tema: ${nuevoTema}`)

      // PASO 1: Aplicar cambio visual inmediatamente (UX responsiva)
      if (nuevoTema === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      // PASO 2: Actualizar store global inmediatamente para sincronización en tiempo real
      actualizarConfiguracionUsuario({ theme: nuevoTema })
      console.log(`✅ Store global actualizado inmediatamente a: ${nuevoTema}`)

      // PASO 3: Persistir en base de datos
      console.log(`💾 Persistiendo cambio de tema en base de datos...`)
      
      const response = await errorHandler.executeWithRetry(
        () => actualizarConfiguracionUsuarioAPI({ theme: nuevoTema }),
        {
          operationType: OPERATION_TYPES.UPDATE,
          entityName: 'tema',
          maxRetries: 2,
          onRetry: (attempt, maxRetries) => {
            console.log(`Reintentando cambio de tema (${attempt}/${maxRetries})`)
          }
        }
      )
      
      if (response.success) {
        console.log(`✅ Tema persistido exitosamente en BD: ${nuevoTema}`)
        success(`Tema cambiado a ${nuevoTema === 'light' ? 'claro' : 'oscuro'}`)
      } else {
        // Revertir cambios si falla el backend
        const configGlobal = obtenerConfiguracionUsuario()
        const temaAnterior = configGlobal.theme === nuevoTema ? 'light' : configGlobal.theme
        console.error(`❌ Error al persistir tema en BD, revirtiendo a: ${temaAnterior}`)
        
        actualizarConfiguracionUsuario({ theme: temaAnterior })
        
        if (temaAnterior === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        
        throw new Error(response.message || 'Error al guardar el tema')
      }
      
    } catch (error) {
      console.error(`❌ Error en proceso de cambio de tema:`, error.message)
      
      // Usar el nuevo sistema de manejo de errores
      const errorInfo = errorHandler.handleError(error, {
        operationType: OPERATION_TYPES.UPDATE,
        entityName: 'tema'
      })
      
      // Asegurar que el UI refleje el estado correcto en caso de error
      const configGlobal = obtenerConfiguracionUsuario()
      const temaActual = configGlobal.theme
      if (temaActual === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  /**
   * Actualizar tasas de cambio (usado después de cambiar moneda principal)
   */
  const actualizarTasasCambio = (nuevasTasas) => {
    setTasasCambio(nuevasTasas)
  }

  /**
   * Actualizar configuración de usuario (usado después de cambiar moneda principal)
   */
  const actualizarConfiguracionUsuarioLocal = (nuevaConfiguracion) => {
    setConfiguracionUsuario(prev => ({ ...prev, ...nuevaConfiguracion }))
  }

  /**
   * =========================================
   * EFECTOS
   * =========================================
   */

  // Cargar datos al montar el componente (solo si está autenticado)
  useEffect(() => {
    if (isAuthenticated) {
      cargarTiposCuenta()
      cargarCategorias()
      cargarTasasCambio()
      cargarConfiguracionUsuario()
    }
  }, [isAuthenticated])

  // 🚨 CORRECCIÓN: Eliminado efecto de sincronización para evitar loops infinitos
  // Ahora el componente usa directamente el store global para sincronización en tiempo real

  /**
   * =========================================
   * DATOS COMPUTADOS
   * =========================================
   */

  // Separar categorías por tipo
  const categoriasIngresos = categorias.filter(cat => cat.type === 'income')
  const categoriasGastos = categorias.filter(cat => cat.type === 'expense')

  // Estado de carga general
  const isLoading = tiposCuentaLoading || categoriasLoading || tasasCambioLoading || configuracionLoading

  // Obtener monedas disponibles que aún no tienen tasa configurada
  // 🚨 REFACTORIZACIÓN: Usar nuevas funciones de monedas
  const monedasDisponibles = getExchangeRateCurrencyOptions(configuracionUsuario.primary_currency || 'USD')

  return {
    // Estados de datos
    tiposCuenta,
    categorias,
    categoriasIngresos,
    categoriasGastos,
    tasasCambio,
    configuracionUsuario,
    monedasDisponibles,

    // Estados de carga y error
    isLoading,
    tiposCuentaLoading,
    categoriasLoading,
    tasasCambioLoading,
    configuracionLoading,
    tiposCuentaError,
    categoriasError,
    tasasCambioError,

    // Funciones de recarga
    cargarTiposCuenta,
    cargarCategorias,
    cargarTasasCambio,
    cargarConfiguracionUsuario,

    // Funciones CRUD - Tipos de Cuenta
    crearTipoCuenta,
    actualizarTipoCuenta,
    eliminarTipoCuenta,

    // Funciones CRUD - Categorías
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,

      // Funciones CRUD - Tasas de Cambio
  crearTasaCambio,
  actualizarTasaCambio,
  eliminarTasaCambio,

  // Funciones CRUD - Tipos de Deuda
  tiposDeuda,
  crearTipoDeuda: (nombre) => {
    const nuevoTipo = {
      id: Date.now(),
      name: nombre
    }
    setTiposDeuda(prev => [...prev, nuevoTipo])
    success('Tipo de deuda creado correctamente')
    return { success: true }
  },
  actualizarTipoDeuda: (id, nombre) => {
    setTiposDeuda(prev => prev.map(tipo => 
      tipo.id === id ? { ...tipo, name: nombre } : tipo
    ))
    success('Tipo de deuda actualizado correctamente')
    return { success: true }
  },
  eliminarTipoDeuda: (id) => {
    setTiposDeuda(prev => prev.filter(tipo => tipo.id !== id))
    success('Tipo de deuda eliminado correctamente')
    return { success: true }
  },

  // Funciones de configuración
  actualizarConfiguracion,
  handleCambiarTema,
  actualizarTasasCambio,
  actualizarConfiguracionUsuarioLocal,
  inicializarTiposPredefinidos,

  // Sistema de manejo de errores
  errorHandler
  }
}

export default useConfiguracion