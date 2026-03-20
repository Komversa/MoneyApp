import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Sun, 
  Moon, 
  Save,
  Loader2,
  DollarSign,
  AlertCircle,
  Settings,
  Palette,
  Coins,
  FileText,
  Tag,
  CreditCard
} from 'lucide-react'
import useConfiguracion from '../hooks/useConfiguracion'
import useAuthStore from '../store/useAuthStore'
import useResponsive from '../hooks/useResponsive'
import { useConfirmDialogContext } from '../contexts/ConfirmDialogContext'
import TipoCuentaModal from '../components/ui/TipoCuentaModal'
import CategoriaModal from '../components/ui/CategoriaModal'
import TipoDeudaModal from '../components/ui/TipoDeudaModal'
import TasaCambioModal from '../components/ui/TasaCambioModal'
import ErrorDisplay from '../components/ui/ErrorDisplay'
import RetryIndicator from '../components/ui/RetryIndicator'
import ErrorDebugPanel from '../components/ui/ErrorDebugPanel'
import PasswordUpdateForm from '../components/ui/PasswordUpdateForm'
import { TRANSACTION_TYPE_LABELS } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'
import { SUPPORTED_CURRENCIES, getAvailableCurrencies, getCurrencyOptions, getPrimaryCurrencyOptions, getExchangeRateCurrencyOptions } from '../utils/currencyData'
import { actualizarMonedaPrincipalAPI } from '../api/settings.api'
import { obtenerTasasUsuarioAPI, obtenerOpcionesMonedas } from '../api/currencies.api'
import { updatePasswordAPI } from '../api/auth.api'
import { useToast } from '../components/ui/Toaster'

/**
 * Página de Configuración rediseñada con navegación por pestañas
 * Soluciona el desequilibrio visual y mejora la organización
 */
const Configuracion = () => {
  // Estados para perfil de usuario
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const { user } = useAuthStore()
  const { isMobile } = useResponsive()

  const {
    // Estados de datos
    tiposCuenta,
    categoriasIngresos,
    categoriasGastos,
    tasasCambio,
    configuracionUsuario,
    monedasDisponibles,

    // Estados de carga
    isLoading,
    configuracionLoading,
    tasasCambioLoading,

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

    // Funciones de configuración
    actualizarConfiguracion,
    handleCambiarTema,
    actualizarTasasCambio,
    actualizarConfiguracionUsuarioLocal,

    // Sistema de manejo de errores
    errorHandler,

    // Constantes
    MONEDAS_DISPONIBLES
  } = useConfiguracion()

  // 🚨 CORRECCIÓN: Obtener configuración directamente del store global para sincronización en tiempo real
  const { obtenerConfiguracionUsuario } = useAuthStore()
  const configuracionGlobal = obtenerConfiguracionUsuario()

  const { success, error: showError } = useToast()

  // Hook para diálogos de confirmación
  const { getConfirmation } = useConfirmDialogContext()

  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState('general')

  // Estados para modales
  const [tipoCuentaModal, setTipoCuentaModal] = useState({
    isOpen: false,
    tipoCuenta: null,
    isLoading: false
  })

  const [categoriaModal, setCategoriaModal] = useState({
    isOpen: false,
    categoria: null,
    isLoading: false
  })

  const [tasaCambioModal, setTasaCambioModal] = useState({
    isOpen: false,
    tasaExistente: null,
    isLoading: false
  })

  const [tipoDeudaModal, setTipoDeudaModal] = useState({
    isOpen: false,
    tipoDeuda: null,
    isLoading: false
  })

  // Tipos de deuda (temporal hasta implementar en backend)
  const [tiposDeuda, setTiposDeuda] = useState([
    { id: 1, name: 'Tarjeta de Crédito' },
    { id: 2, name: 'Préstamo Personal' },
    { id: 3, name: 'Préstamo Hipotecario' },
    { id: 4, name: 'Préstamo Vehicular' }
  ])

  // Estados para configuración de moneda principal
  const [monedaPrincipal, setMonedaPrincipal] = useState(
    configuracionGlobal.primary_currency || 'NIO'
  )
  const [isChangingCurrency, setIsChangingCurrency] = useState(false)

  // Efecto para actualizar moneda principal cuando cambie la configuración del usuario
  // Solo se ejecuta cuando NO estamos cambiando la moneda manualmente
  useEffect(() => {
    if (!isChangingCurrency) {
      setMonedaPrincipal(configuracionGlobal.primary_currency || 'NIO')
    }
  }, [configuracionGlobal, isChangingCurrency])

  // Obtener monedas disponibles para tasas de cambio
  const monedasDisponiblesParaTasas = getExchangeRateCurrencyOptions(configuracionGlobal.primary_currency || 'USD')  // 🚨 CAMBIO: USD por defecto

  // Obtener opciones de moneda principal
  const opcionesMonedaPrincipal = getPrimaryCurrencyOptions()

  // Configuración de pestañas
  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: Settings,
      description: 'Configuraciones básicas y apariencia'
    },
    {
      id: 'monedas',
      label: 'Monedas',
      icon: Coins,
      description: 'Gestión de monedas y tasas de cambio'
    },
    {
      id: 'personalizacion',
      label: 'Personalización',
      icon: FileText,
      description: 'Tipos de cuenta y categorías'
    }
  ]

  /**
   * =========================================
   * FUNCIONES PARA TIPOS DE CUENTA
   * =========================================
   */

  const handleAbrirTipoCuentaModal = (tipoCuenta = null) => {
    setTipoCuentaModal({
      isOpen: true,
      tipoCuenta,
      isLoading: false
    })
  }

  const handleCerrarTipoCuentaModal = () => {
    setTipoCuentaModal({
      isOpen: false,
      tipoCuenta: null,
      isLoading: false
    })
  }

  const handleGuardarTipoCuenta = async (nombre) => {
    setTipoCuentaModal(prev => ({ ...prev, isLoading: true }))

    let result
    if (tipoCuentaModal.tipoCuenta) {
      // Editar
      result = await actualizarTipoCuenta(tipoCuentaModal.tipoCuenta.id, nombre)
    } else {
      // Crear
      result = await crearTipoCuenta(nombre)
    }

    setTipoCuentaModal(prev => ({ ...prev, isLoading: false }))
    return result
  }

  const handleEliminarTipoCuenta = async (id) => {
    const confirmed = await getConfirmation({
      title: '¿Eliminar Tipo de Cuenta?',
      message: '¿Estás seguro de que deseas eliminar este tipo de cuenta? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    })
    
    if (confirmed) {
      await eliminarTipoCuenta(id)
    }
  }

  /**
   * =========================================
   * FUNCIONES PARA CATEGORÍAS
   * =========================================
   */

  const handleAbrirCategoriaModal = (categoria = null) => {
    setCategoriaModal({
      isOpen: true,
      categoria,
      isLoading: false
    })
  }

  const handleCerrarCategoriaModal = () => {
    setCategoriaModal({
      isOpen: false,
      categoria: null,
      isLoading: false
    })
  }

  const handleGuardarCategoria = async (nombre, tipo) => {
    setCategoriaModal(prev => ({ ...prev, isLoading: true }))

    let result
    if (categoriaModal.categoria) {
      // Editar
      result = await actualizarCategoria(categoriaModal.categoria.id, nombre, tipo)
    } else {
      // Crear
      result = await crearCategoria(nombre, tipo)
    }

    setCategoriaModal(prev => ({ ...prev, isLoading: false }))
    return result
  }

  const handleEliminarCategoria = async (id) => {
    const confirmed = await getConfirmation({
      title: '¿Eliminar Categoría?',
      message: '¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    })
    
    if (confirmed) {
      await eliminarCategoria(id)
    }
  }

  /**
   * =========================================
   * FUNCIONES PARA TIPOS DE DEUDA
   * =========================================
   */

  const handleAbrirTipoDeudaModal = (tipoDeuda = null) => {
    setTipoDeudaModal({
      isOpen: true,
      tipoDeuda,
      isLoading: false
    })
  }

  const handleCerrarTipoDeudaModal = () => {
    setTipoDeudaModal({
      isOpen: false,
      tipoDeuda: null,
      isLoading: false
    })
  }

  const handleGuardarTipoDeuda = async (nombre) => {
    setTipoDeudaModal(prev => ({ ...prev, isLoading: true }))

    try {
      if (tipoDeudaModal.tipoDeuda) {
        // Modo edición
        const tipoActualizado = { ...tipoDeudaModal.tipoDeuda, name: nombre }
        setTiposDeuda(prev => prev.map(tipo => 
          tipo.id === tipoActualizado.id ? tipoActualizado : tipo
        ))
        success('Tipo de deuda actualizado correctamente')
      } else {
        // Modo creación
        const nuevoTipo = {
          id: Date.now(), // ID temporal
          name: nombre
        }
        setTiposDeuda(prev => [...prev, nuevoTipo])
        success('Tipo de deuda creado correctamente')
      }

      handleCerrarTipoDeudaModal()
      return { success: true }
    } catch (error) {
      showError('Error al guardar el tipo de deuda')
      return { success: false }
    } finally {
      setTipoDeudaModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleEliminarTipoDeuda = async (id) => {
    const confirmed = await getConfirmation({
      title: '¿Eliminar Tipo de Deuda?',
      message: '¿Estás seguro de que deseas eliminar este tipo de deuda? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    })
    
    if (confirmed) {
      setTiposDeuda(prev => prev.filter(tipo => tipo.id !== id))
      success('Tipo de deuda eliminado correctamente')
    }
  }

  /**
   * =========================================
   * FUNCIONES PARA TASAS DE CAMBIO
   * =========================================
   */

  const handleAbrirTasaCambioModal = (tasaExistente = null) => {
    setTasaCambioModal({
      isOpen: true,
      tasaExistente,
      isLoading: false
    })
  }

  const handleCerrarTasaCambioModal = () => {
    setTasaCambioModal({
      isOpen: false,
      tasaExistente: null,
      isLoading: false
    })
  }

  const handleGuardarTasaCambio = async (currencyCode, rate) => {
    setTasaCambioModal(prev => ({ ...prev, isLoading: true }))

    try {
      let result
      if (tasaCambioModal.tasaExistente) {
        // Modo edición
        result = await actualizarTasaCambio(currencyCode, rate)
      } else {
        // Modo creación
        result = await crearTasaCambio(currencyCode, rate)
      }

      return result
    } finally {
      setTasaCambioModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleEliminarTasaCambio = async (currencyCode) => {
    const confirmed = await getConfirmation({
      title: '¿Eliminar Tasa de Cambio?',
      message: '¿Estás seguro de que deseas eliminar esta tasa de cambio? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    })
    
    if (confirmed) {
      await eliminarTasaCambio(currencyCode)
    }
  }

  /**
   * =========================================
   * FUNCIONES PARA CONFIGURACIÓN
   * =========================================
   */

  const handleGuardarMonedaPrincipal = async () => {
    try {
      // Marcar que estamos cambiando la moneda
      setIsChangingCurrency(true)
      
      // ⚠️ CONFIRMACIÓN INFORMATIVA: Mostrar información sobre el cambio de moneda principal
      const confirmed = await getConfirmation({
        title: 'Cambio de Moneda Principal',
        message: `Vas a cambiar tu moneda principal de ${configuracionGlobal.primary_currency} a ${monedaPrincipal}.

¿Qué sucederá?
• Se recalcularán todos los balances en la nueva moneda
• Los reportes se actualizarán automáticamente
• Las transacciones existentes mantendrán su moneda original
• Podrás cambiar la moneda principal en cualquier momento

¿Deseas continuar con el cambio?`,
        confirmText: 'Cambiar moneda',
        cancelText: 'Cancelar',
        variant: 'warning'
      })
      
      if (!confirmed) {
        setIsChangingCurrency(false)
        return
      }

      // Llamar a la nueva API para actualizar moneda principal
      const response = await actualizarMonedaPrincipalAPI(monedaPrincipal)
      
      if (response.success) {
        // 🔧 CORRECCIÓN DEL BUG: Actualizar AMBOS estados (local + global)
        
        // 1. Actualizar estado local del hook useConfiguracion
        actualizarConfiguracionUsuarioLocal({
          primary_currency: response.data.newPrimaryCurrency
        })
        
        // 2. 🚨 CRÍTICO: Actualizar store global de autenticación para persistencia
        // NOTA: No usamos actualizarConfiguracion() porque haría doble llamada API
        // En su lugar, llamamos directamente al store de autenticación
        const { actualizarConfiguracionUsuario } = useAuthStore.getState()
        actualizarConfiguracionUsuario({
          primary_currency: response.data.newPrimaryCurrency
        })
        
        // 3. Actualizar tasas de cambio si vienen en la respuesta
        if (response.data.updatedRates) {
          actualizarTasasCambio(response.data.updatedRates)
        }
        
        console.log(`✅ Moneda principal actualizada: ${response.data.newPrimaryCurrency}`)
        console.log(`🔄 Store global sincronizado para persistencia`)
        
        success('Moneda principal actualizada exitosamente')
      } else {
        throw new Error(response.message || 'Error al actualizar moneda principal')
      }
    } catch (error) {
      console.error(`❌ Error al actualizar moneda principal:`, error)
      
      // Usar el nuevo sistema de manejo de errores
      const errorInfo = errorHandler.handleError(error, {
        operationType: 'update',
        entityName: 'moneda principal'
      })
    } finally {
      // Resetear el estado de cambio de moneda
      setIsChangingCurrency(false)
    }
  }

  /**
   * =========================================
   * COMPONENTES DE RENDERIZADO
   * =========================================
   */

  // Componente para lista de ítems (tipos de cuenta o categorías)
  const ListaItems = ({ items, onEdit, onDelete, emptyMessage }) => (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm italic py-4 text-center">
          {emptyMessage}
        </p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.name}
              </span>
              {item.type && (
                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  item.type === 'income' 
                    ? 'bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300' 
                    : 'bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300'
                }`}>
                  {TRANSACTION_TYPE_LABELS[item.type]}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(item)}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-danger-600 dark:hover:text-danger-400 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )

  // Componente para el contenido de la pestaña General
  const TabGeneral = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Sección de Apariencia */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Apariencia</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Personaliza el tema de la aplicación</p>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              {configuracionGlobal.theme === 'light' ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-blue-500" />
              )}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Tema {configuracionGlobal.theme === 'light' ? 'Claro' : 'Oscuro'}
              </span>
            </div>
            
            {/* Toggle Switch */}
            <button
              onClick={() => handleCambiarTema(configuracionGlobal.theme === 'light' ? 'dark' : 'light')}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${configuracionGlobal.theme === 'light' ? 'bg-gray-200' : 'bg-primary-600'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${configuracionGlobal.theme === 'light' ? 'translate-x-1' : 'translate-x-6'}
                `}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Sección de Perfil de Usuario */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Perfil de Usuario</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Información personal y preferencias</p>
            </div>
          </div>
        </div>
        <div className="card-body space-y-6">
          {/* Información del usuario */}
          <div className="space-y-4">
            <div>
              <label className="form-label">Correo Electrónico</label>
              <div className="form-input bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {user?.email || 'No disponible'}
              </div>
            </div>
          </div>

          {/* Sección de contraseña */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Actualizar Contraseña</h4>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {showPasswordForm ? 'Cancelar' : 'Cambiar contraseña'}
              </button>
            </div>

            {showPasswordForm && (
              <PasswordUpdateForm 
                onCancel={() => setShowPasswordForm(false)} 
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )

  // Componente para el contenido de la pestaña Monedas
  const TabMonedas = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Moneda Principal */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Moneda Principal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Configura tu moneda de referencia</p>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              Esta será tu moneda de referencia. Todos los cálculos se mostrarán en esta moneda.
            </p>
            
            {/* Layout responsive para móvil */}
            <div className={`${isMobile ? 'space-y-4' : 'flex items-end gap-3'}`}>
              <div className="flex-1">
                <label className="form-label">Seleccionar Moneda Principal</label>
                <select 
                  className="form-input"
                  value={monedaPrincipal}
                  onChange={(e) => {
                    setMonedaPrincipal(e.target.value)
                    setIsChangingCurrency(true)
                  }}
                >
                  {opcionesMonedaPrincipal.map(currency => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleGuardarMonedaPrincipal}
                disabled={configuracionLoading || monedaPrincipal === configuracionGlobal.primary_currency}
                className={`btn-primary disabled:opacity-50 ${isMobile ? 'w-full justify-center py-3 text-base' : ''}`}
              >
                {configuracionLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    {isMobile ? 'Guardando...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </button>
            </div>
            
            {/* Indicador de reintentos */}
            <RetryIndicator
              isRetrying={errorHandler.isRetrying}
              retryCount={errorHandler.retryCount}
              maxRetries={3}
              onCancel={errorHandler.cancelOperation}
              message="Reintentando actualización de moneda principal..."
              className="mt-3"
            />
            
            {/* Display de errores */}
            {errorHandler.hasError && (
              <ErrorDisplay
                error={errorHandler.lastError}
                onRetry={handleGuardarMonedaPrincipal}
                onDismiss={errorHandler.clearError}
                showRetryButton={errorHandler.isErrorType('network') || errorHandler.isErrorType('timeout') || errorHandler.isErrorType('server')}
                className="mt-3"
              />
            )}
          </div>
        </div>
      </div>

      {/* Tasas de Cambio */}
      <div className="card">
        <div className="card-header">
          <div className={`${isMobile ? 'space-y-4' : 'flex items-center justify-between'}`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold dark:text-white">Tasas de Cambio</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Define las tasas de conversión de otras monedas</p>
              </div>
            </div>
            <button
              onClick={() => handleAbrirTasaCambioModal()}
              disabled={monedasDisponiblesParaTasas.length === 0}
              className={`btn-primary disabled:opacity-50 ${isMobile ? 'w-full justify-center py-3 text-base' : ''}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir Moneda
            </button>
          </div>
        </div>
        <div className="card-body">
          {/* Lista de Tasas de Cambio */}
          {tasasCambioLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-300">Cargando tasas de cambio...</span>
            </div>
          ) : tasasCambio.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                No tienes tasas de cambio configuradas
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                Añade monedas para realizar conversiones automáticas
              </p>
            </div>
          ) : (
            <>
              {/* Vista de tabla para tablet y PC */}
              {!isMobile && (
                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Moneda
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Valor en USD
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Ejemplo
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {tasasCambio.map((tasa) => {
                        // 🚨 REFACTORIZADO: Usar rate_to_usd en lugar de rate
                        const rateValue = tasa.rate_to_usd || tasa.rate;
                        const monedaInfo = SUPPORTED_CURRENCIES[tasa.currency_code];
                        
                        return (
                          <tr key={tasa.currency_code} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {tasa.currency_code}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {monedaInfo?.name || 'Moneda desconocida'}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900 dark:text-white font-mono">
                                {parseFloat(rateValue).toFixed(6)} USD
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                1 {tasa.currency_code} = {formatCurrency(rateValue, 'USD')}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleAbrirTasaCambioModal(tasa)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                                  title="Editar tasa"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEliminarTasaCambio(tasa.currency_code)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                                  title="Eliminar tasa"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Vista de tarjetas para móvil */}
              {isMobile && (
                <div className="space-y-3">
                  {tasasCambio.map((tasa) => {
                    // 🚨 REFACTORIZADO: Usar rate_to_usd en lugar de rate
                    const rateValue = tasa.rate_to_usd || tasa.rate;
                    const monedaInfo = SUPPORTED_CURRENCIES[tasa.currency_code];
                    
                    return (
                      <div key={tasa.currency_code} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        {/* Header de la tarjeta */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                              <DollarSign className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {tasa.currency_code}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {monedaInfo?.name || 'Moneda desconocida'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAbrirTasaCambioModal(tasa)}
                              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Editar tasa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEliminarTasaCambio(tasa.currency_code)}
                              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Eliminar tasa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Contenido de la tarjeta */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Valor en USD:</span>
                            <span className="text-sm font-mono text-gray-900 dark:text-white">
                              {parseFloat(rateValue).toFixed(6)} USD
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Ejemplo:</span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              1 {tasa.currency_code} = {formatCurrency(rateValue, 'USD')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Advertencia si no hay monedas disponibles */}
          {monedasDisponiblesParaTasas.length === 0 && tasasCambio.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mt-4">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Has configurado todas las monedas disponibles
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                  Si necesitas más monedas, contacta al administrador del sistema
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )

  // Componente para el contenido de la pestaña Personalización
  const TabPersonalizacion = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Definiciones Personalizadas</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Gestiona tipos de cuenta y categorías</p>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tipos de Cuenta */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">Tipos de Cuenta</h4>
                <button
                  onClick={() => handleAbrirTipoCuentaModal()}
                  className="btn-primary btn-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
              ) : (
                <ListaItems
                  items={tiposCuenta}
                  onEdit={handleAbrirTipoCuentaModal}
                  onDelete={handleEliminarTipoCuenta}
                  emptyMessage="No hay tipos de cuenta definidos"
                />
              )}
            </div>

            {/* Tipos de Deuda */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">Tipos de Deuda</h4>
                <button
                  onClick={() => handleAbrirTipoDeudaModal()}
                  className="btn-secondary btn-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
              ) : (
                <ListaItems
                  items={tiposDeuda}
                  onEdit={handleAbrirTipoDeudaModal}
                  onDelete={handleEliminarTipoDeuda}
                  emptyMessage="No hay tipos de deuda definidos"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Categorías</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Gestiona categorías de ingresos y gastos</p>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Categorías de Ingresos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">Ingresos</h4>
                <button
                  onClick={() => handleAbrirCategoriaModal(null, 'income')}
                  className="btn-success btn-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
              ) : (
                <ListaItems
                  items={categoriasIngresos}
                  onEdit={(categoria) => handleAbrirCategoriaModal(categoria, 'income')}
                  onDelete={handleEliminarCategoria}
                  emptyMessage="No hay categorías de ingresos"
                />
              )}
            </div>

            {/* Categorías de Gastos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">Gastos</h4>
                <button
                  onClick={() => handleAbrirCategoriaModal(null, 'expense')}
                  className="btn-danger btn-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
              ) : (
                <ListaItems
                  items={categoriasGastos}
                  onEdit={(categoria) => handleAbrirCategoriaModal(categoria, 'expense')}
                  onDelete={handleEliminarCategoria}
                  emptyMessage="No hay categorías de gastos"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-600 dark:text-gray-300">Personaliza tu experiencia y configuraciones del sistema</p>
      </div>

      {/* Navegación por Pestañas */}
      <div className="card">
        <div className="card-body p-0">
          {/* Tabs Header */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group relative min-w-0 flex-1 overflow-hidden py-4 px-1 text-center text-sm font-medium hover:text-gray-700 dark:hover:text-gray-300 focus:z-10 focus:outline-none
                      ${isActive 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-500 dark:text-gray-400'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Icon className={`h-5 w-5 transition-colors ${
                        isActive 
                          ? 'text-primary-600 dark:text-primary-400' 
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                      }`} />
                      <span className="hidden sm:block">{tab.label}</span>
                    </div>
                    
                    {/* Indicador activo */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    
                    {/* Tooltip para pantallas pequeñas */}
                    <div className="absolute inset-x-0 -top-2 z-20 opacity-0 transition-opacity group-hover:opacity-100 sm:hidden">
                      <div className="absolute inset-x-0 top-0 flex -translate-y-1/2 justify-center">
                        <div className="rounded bg-gray-900 px-2 py-1 text-xs text-white">
                          {tab.description}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tabs Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'general' && <TabGeneral key="general" />}
              {activeTab === 'monedas' && <TabMonedas key="monedas" />}
              {activeTab === 'personalizacion' && <TabPersonalizacion key="personalizacion" />}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* MODALES */}
      {/* ========================================= */}
      
      {/* Modal Tipo de Cuenta */}
      <TipoCuentaModal
        isOpen={tipoCuentaModal.isOpen}
        onClose={handleCerrarTipoCuentaModal}
        onSave={handleGuardarTipoCuenta}
        tipoCuenta={tipoCuentaModal.tipoCuenta}
        isLoading={tipoCuentaModal.isLoading}
      />

      {/* Modal Categoría */}
      <CategoriaModal
        isOpen={categoriaModal.isOpen}
        onClose={handleCerrarCategoriaModal}
        onSave={handleGuardarCategoria}
        categoria={categoriaModal.categoria}
        isLoading={categoriaModal.isLoading}
      />

      {/* Modal Tipo de Deuda */}
      <TipoDeudaModal
        isOpen={tipoDeudaModal.isOpen}
        onClose={handleCerrarTipoDeudaModal}
        onSave={handleGuardarTipoDeuda}
        tipoDeuda={tipoDeudaModal.tipoDeuda}
        isLoading={tipoDeudaModal.isLoading}
      />

      {/* Modal para Tasas de Cambio */}
      <TasaCambioModal
        isOpen={tasaCambioModal.isOpen}
        onClose={handleCerrarTasaCambioModal}
        onSave={handleGuardarTasaCambio}
        monedasDisponibles={monedasDisponiblesParaTasas}
        tasaExistente={tasaCambioModal.tasaExistente}
        isLoading={tasaCambioModal.isLoading}
                        primaryCurrency={configuracionGlobal.primary_currency || 'USD'}  // 🚨 NUEVO: Pasar moneda principal
      />

      {/* Panel de Debug de Errores (solo visible en desarrollo) */}
      {import.meta.env.DEV && (
        <ErrorDebugPanel
          errorStats={errorHandler.getErrorStats()}
          errorLog={errorHandler.getErrorLog()}
          onClearLog={errorHandler.clearErrorLog}
          className="mt-6"
        />
      )}
    </motion.div>
  )
}

export default Configuracion