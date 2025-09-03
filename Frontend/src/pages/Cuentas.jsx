import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Crown,
  PieChart,
  Coins,
  ChevronDown,
  ChevronUp,
  BarChart3,
  RefreshCw,
  Infinity
} from 'lucide-react'
import useCuentas from '../hooks/useCuentas'
import { useConfirmDialogContext } from '../contexts/ConfirmDialogContext'
import CuentaModal from '../components/ui/CuentaModal'
import { FinancialProgressBar } from '../components/ui/ProgressBar'
import { formatCurrency } from '../utils/formatters'
import { CURRENCY_SYMBOLS } from '../utils/constants'

/**
 * Página de gestión de Cuentas
 * Replica el diseño de las capturas de pantalla
 */
const Cuentas = () => {
  const {
    cuentas,
    cuentasActivos,
    cuentasPasivos,
    resumenFinanciero,
    panelPatrimonio,
    isLoading,
    estadisticas,
    cargarCuentasPorCategoria,
    crearCuenta,
    actualizarCuenta,
    eliminarCuenta
  } = useCuentas()

  // Módulo simplificado - solo activos

  // Hook para diálogos de confirmación
  const { getConfirmation } = useConfirmDialogContext()

  // Estados para modal
  const [cuentaModal, setCuentaModal] = useState({
    isOpen: false,
    cuenta: null,
    isLoading: false
  })

  // Estado para panel de análisis detallado
  const [mostrarAnalisisDetallado, setMostrarAnalisisDetallado] = useState(false)

  /**
   * =========================================
   * FUNCIONES DEL MODAL
   * =========================================
   */

  const handleAbrirModal = (cuenta = null) => {
    setCuentaModal({
      isOpen: true,
      cuenta: cuenta, // Pasar null para cuentas nuevas, el objeto completo para editar
      isLoading: false
    })
  }

  const handleCerrarModal = () => {
    setCuentaModal({
      isOpen: false,
      cuenta: null,
      isLoading: false
    })
    
    // Recargar activos después de cerrar el modal
    cargarCuentasPorCategoria('asset')
  }

  const handleGuardarCuenta = async (datosCuenta) => {
    setCuentaModal(prev => ({ ...prev, isLoading: true }))

    let result
    if (cuentaModal.cuenta) {
      // Editar
      result = await actualizarCuenta(cuentaModal.cuenta.id, datosCuenta)
    } else {
      // Crear
      result = await crearCuenta(datosCuenta)
    }

    setCuentaModal(prev => ({ ...prev, isLoading: false }))
    
    // Si la operación fue exitosa, recargar activos
    if (result?.success) {
      await cargarCuentasPorCategoria('asset')
    }
    
    return result
  }

  const handleEliminarCuenta = async (id, nombreCuenta) => {
    const confirmed = await getConfirmation({
      title: '¿Eliminar Cuenta?',
      message: `Estás a punto de eliminar la cuenta '${nombreCuenta}' y todas sus transacciones asociadas. Esta acción es irreversible. ¿Deseas continuar?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    })
    
    if (confirmed) {
      await eliminarCuenta(id)
      // Recargar activos después de eliminar
      await cargarCuentasPorCategoria('asset')
    }
  }

  /**
   * =========================================
   * INICIALIZACIÓN
   * =========================================
   */

  // Cargar activos al inicializar
  React.useEffect(() => {
    if (cuentasActivos.length === 0) {
      cargarCuentasPorCategoria('asset')
    }
  }, [])

  /**
   * =========================================
   * COMPONENTES DE RENDERIZADO
   * =========================================
   */

  /**
   * =========================================
   * COMPONENTES DEL PANEL DE PATRIMONIO
   * =========================================
   */

  // Componente para tarjeta de estadística (similar a Dashboard y Transacciones)
  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'primary' }) => {
    const colorClasses = {
      primary: 'text-primary-600 bg-primary-100',
      success: 'text-success-600 bg-success-100',
      danger: 'text-danger-600 bg-danger-100',
      blue: 'text-blue-600 bg-blue-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      green: 'text-green-600 bg-green-100'
    }

    return (
      <div className="card p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="stat-title">{title}</h3>
            <p className="stat-value">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Tarjeta de Cuenta Principal (Compacta)
  const TarjetaCuentaPrincipal = ({ cuenta, primaryCurrency }) => {
    return (
      <div className="card p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Crown className="h-6 w-6" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="stat-title">CUENTA PRINCIPAL</h3>
            <p className="stat-value truncate" title={cuenta?.name}>
              {cuenta?.name || 'No hay cuentas'}
            </p>
            <p className="text-sm text-subtitle-contrast mt-1">
              {cuenta ? `${formatCurrency(cuenta.balance, cuenta.currency_code)} • ${cuenta.type}` : 'Crea tu primera cuenta'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Tarjeta de Distribución por Tipo (para análisis detallado)
  const TarjetaDistribucionTipo = ({ distribuciones, total, primaryCurrency }) => {
    return (
      <div className="bg-white dark:bg-gray-800 p-5 hover:shadow-lg transition-all duration-300 rounded-lg border border-gray-200 dark:border-none">
        <div className="flex items-center mb-5">
          <div className="p-3 rounded-xl bg-blue-500 text-white shadow-sm">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">DISTRIBUCIÓN POR TIPO</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Análisis de tipos de cuenta</p>
          </div>
        </div>
        
        <div className="mt-4">
          <FinancialProgressBar
            items={distribuciones}
            totalValue={total}
            currency={primaryCurrency}
            emptyMessage="No hay distribución por tipos"
          />
        </div>
      </div>
    )
  }

  // Tarjeta de Distribución por Divisa (para análisis detallado)
  const TarjetaDistribucionDivisa = ({ distribuciones, total, primaryCurrency }) => {
    return (
      <div className="bg-white dark:bg-gray-800 p-5 hover:shadow-lg transition-all duration-300 rounded-lg border border-gray-200 dark:border-none">
        <div className="flex items-center mb-5">
          <div className="p-3 rounded-xl bg-green-500 text-white shadow-sm">
            <Infinity className="h-6 w-6" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">DISTRIBUCIÓN POR DIVISA</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Análisis por monedas</p>
          </div>
        </div>
        
        <div className="mt-4">
          <FinancialProgressBar
            items={distribuciones}
            totalValue={total}
            currency={primaryCurrency}
            emptyMessage="No hay distribución por divisas"
          />
        </div>
      </div>
    )
  }

  // Componente para tarjeta de cuenta (RESPONSIVE como transacciones)
  const CuentaCard = ({ cuenta }) => {
    const saldoActual = parseFloat(cuenta.current_balance || 0)
    const saldoInicial = parseFloat(cuenta.initial_balance || 0)
    const diferencia = saldoActual - saldoInicial

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="card hover:shadow-medium transition-shadow"
      >
        <div className="p-4 sm:p-6">
          {/* Header de la tarjeta */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center flex-1 min-w-0">
              <div className="p-2 bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 rounded-lg flex-shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <h3 className="font-semibold heading-dark-contrast truncate">{cuenta.name}</h3>
                <p className="text-sm text-subtitle-contrast truncate">{cuenta.account_type_name}</p>
              </div>
            </div>
            
            {/* Acciones */}
            <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
              <button
                onClick={() => handleAbrirModal(cuenta)}
                className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Editar cuenta"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleEliminarCuenta(cuenta.id, cuenta.name)}
                className="p-2 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Eliminar cuenta"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Saldo actual - Más prominente y limpio */}
          <div className="mb-4">
            <p className="text-sm text-subtitle-contrast mb-2">Saldo Actual</p>
            <p className="text-2xl font-bold heading-dark-contrast">
              {formatCurrency(saldoActual, cuenta.currency)}
            </p>
          </div>

          {/* Cambio desde saldo inicial - Mejorado visualmente */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-subtitle-contrast">Desde inicio</span>
            <div className="flex items-center">
              {diferencia > 0 ? (
                <TrendingUp className="h-4 w-4 text-success-600 dark:text-success-400 mr-1" />
              ) : diferencia < 0 ? (
                <TrendingDown className="h-4 w-4 text-danger-600 dark:text-danger-400 mr-1" />
              ) : (
                <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" />
              )}
              <span className={`font-medium ${
                diferencia > 0 ? 'text-success-600 dark:text-success-400' : 
                diferencia < 0 ? 'text-danger-600 dark:text-danger-400' : 
                'text-subtitle-contrast'
              }`}>
                {diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia, cuenta.currency)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold heading-dark-contrast">Cuentas</h1>
          <p className="text-subtitle-contrast">Gestiona tus cuentas bancarias y de efectivo</p>
        </div>
        <button
          onClick={() => handleAbrirModal()}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Añadir Cuenta
        </button>
      </div>

      {/* Resumen Financiero */}
      {/* Tarjetas de estadísticas - OPTIMIZADAS PARA MÓVIL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Total de Activos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-success-50/20 dark:to-success-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative flex items-center">
            <div className="p-2 sm:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 text-success-600 bg-success-100 dark:text-success-400 dark:bg-success-900/30 shadow-sm group-hover:shadow-md">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-3" />
            </div>
            
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide">
                TOTAL ACTIVOS
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-success-600 dark:text-success-400 truncate transition-colors duration-300">
                {formatCurrency(resumenFinanciero?.totalActivos || 0, resumenFinanciero?.primaryCurrency || 'USD')}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                En {resumenFinanciero?.primaryCurrency || 'USD'}
              </p>
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <TrendingUp className="h-4 w-4 text-success-500" />
          </div>

          <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
        </motion.div>

        {/* Cuenta Principal */}
        {isLoading ? (
          <div className="card p-4 sm:p-6 animate-pulse">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-xl bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                <div className="h-5 w-5 sm:h-6 sm:w-6 bg-gray-300 dark:bg-gray-500 rounded"></div>
              </div>
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 sm:w-24 mb-2"></div>
                <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-600 rounded w-24 sm:w-32 mb-1"></div>
                <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-600 rounded w-16 sm:w-20"></div>
              </div>
            </div>
          </div>
        ) : panelPatrimonio?.principalAccount ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-yellow-50/20 dark:to-yellow-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative flex items-center">
              <div className="p-2 sm:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 shadow-sm group-hover:shadow-md">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-3" />
              </div>
              
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide">
                  CUENTA PRINCIPAL
                </h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-yellow-600 dark:text-yellow-400 truncate transition-colors duration-300" title={panelPatrimonio.principalAccount?.name}>
                  {panelPatrimonio.principalAccount?.name}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                  {formatCurrency(panelPatrimonio.principalAccount?.balance || 0, panelPatrimonio?.primaryCurrency)}
                </p>
              </div>
            </div>

            <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
              <Crown className="h-4 w-4 text-yellow-500" />
            </div>

            <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50/20 dark:to-gray-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative flex items-center">
              <div className="p-2 sm:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 shadow-sm group-hover:shadow-md">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-3" />
              </div>
              
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide">
                  CUENTA PRINCIPAL
                </h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-500 dark:text-gray-400 truncate transition-colors duration-300">
                  No hay cuentas
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                  Crea tu primera cuenta
                </p>
              </div>
            </div>

            <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
          </motion.div>
        )}

        {/* Distribución */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="relative group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden sm:col-span-2 lg:col-span-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/20 dark:to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative flex items-center">
            <div className="p-2 sm:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm group-hover:shadow-md">
              <PieChart className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-3" />
            </div>
            
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide">
                DISTRIBUCIÓN
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-600 dark:text-blue-400 truncate transition-colors duration-300">
                {panelPatrimonio?.distributionByType?.length || 0} tipos
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                {panelPatrimonio?.distributionByCurrency?.length || 0} moneda(s)
              </p>
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <PieChart className="h-4 w-4 text-blue-500" />
          </div>

          <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
        </motion.div>
      </div>

      {/* Análisis Detallado (Plegable) */}
      {panelPatrimonio && (panelPatrimonio.distributionByType?.length > 0 || panelPatrimonio.distributionByCurrency?.length > 0) && (
        <div className="mt-6">
          <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-6 shadow-lg">
            <button
              onClick={() => setMostrarAnalisisDetallado(!mostrarAnalisisDetallado)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-200 dark:hover:bg-gray-800/50 transition-all duration-300 rounded-lg group"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-gray-600 to-gray-500 text-gray-200 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300 shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:from-blue-500 group-hover:to-blue-400 group-hover:text-white dark:group-hover:from-blue-500 dark:group-hover:to-blue-400 dark:group-hover:text-white">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div className="ml-4 text-left">
                  <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors duration-300">
                    Análisis Detallado de Patrimonio
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                    Distribución por tipos de cuenta y divisas
                  </p>
                </div>
              </div>
              <ChevronDown 
                className={`h-6 w-6 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-all duration-300 ${
                  mostrarAnalisisDetallado ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {/* Contenido expandible */}
            {mostrarAnalisisDetallado && (
              <motion.div 
                className="p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Distribución por Tipo */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <TarjetaDistribucionTipo 
                      distribuciones={panelPatrimonio.distributionByType}
                      total={panelPatrimonio.consolidatedTotal}
                      primaryCurrency={panelPatrimonio.primaryCurrency}
                    />
                  </motion.div>
                  
                  {/* Distribución por Divisa */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                  >
                    <TarjetaDistribucionDivisa 
                      distribuciones={panelPatrimonio.distributionByCurrency}
                      total={panelPatrimonio.consolidatedTotal}
                      primaryCurrency={panelPatrimonio.primaryCurrency}
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Lista de Cuentas con Pestañas */}
      <div>
        {/* Sección simplificada - Solo Activos */}

        <div className="mb-4">
          <h2 className="text-lg font-semibold heading-dark-contrast">
            Mis Activos ({cuentasActivos.length})
          </h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <span className="ml-2 text-gray-600">Cargando cuentas...</span>
          </div>
        ) : cuentasActivos.length === 0 ? (
          <div className="card p-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold heading-dark-contrast mb-2">
              No tienes activos registrados
            </h3>
            <p className="text-subtitle-contrast mb-6">
              Añade tu primera cuenta de activo para comenzar a gestionar tus finanzas
            </p>
            <button
              onClick={() => handleAbrirModal()}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Cuenta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {cuentasActivos.map((cuenta) => (
              <CuentaCard key={cuenta.id} cuenta={cuenta} />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Cuenta */}
      <CuentaModal
        isOpen={cuentaModal.isOpen}
        onClose={handleCerrarModal}
        onSave={handleGuardarCuenta}
        cuenta={cuentaModal.cuenta}
        isLoading={cuentaModal.isLoading}
        activeTab="activos"
      />
    </motion.div>
  )
}

export default Cuentas