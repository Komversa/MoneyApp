import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  X, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Loader2,
  Download
} from 'lucide-react'
import useTransacciones from '../hooks/useTransacciones'
import useResponsive from '../hooks/useResponsive'
import { useDebounce } from '../hooks/useDebounce'
import { useConfirmDialogContext } from '../contexts/ConfirmDialogContext'
import TransaccionModal from '../components/ui/TransaccionModal'
import { Toaster } from '../components/ui/Toaster'
import { formatCurrency, formatDate, getTransactionCurrency } from '../utils/formatters'
import { TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_COLORS } from '../utils/constants'

/**
 * Página de gestión de Transacciones
 * Replica el diseño de las capturas de pantalla
 * REDISEÑO MOBILE-FIRST: Optimizado para dispositivos móviles
 */
const Transacciones = () => {
  const { isMobile } = useResponsive()
  
  const {
    transacciones,
    estadisticas,
    resumen,
    isLoading,
    estadisticasLocales,
    filtros,
    crearTransaccion,
    actualizarTransaccion,
    eliminarTransaccion,
    aplicarFiltros,
    limpiarFiltros,
    filtrarPorTipo,
    cargarMasTransacciones,
    // Nuevos estados y funciones para paginación manual
    allFetchedTransactions,
    visibleTransactions,
    currentPage,
    totalCountFromServer,
    isDefaultView,
    handleShowMore,
    handleShowLess,
    cargarTransacciones,
    recargarTransacciones,
    // Función de exportación
    exportarTransacciones
  } = useTransacciones()

  // Determinar límite de paginación según dispositivo
  const getPageLimit = () => isMobile ? 10 : 20

  // Hook para diálogos de confirmación
  const { getConfirmation } = useConfirmDialogContext()

  // Estados para modal
  const [transaccionModal, setTransaccionModal] = useState({
    isOpen: false,
    transaccion: null,
    isLoading: false
  })

  // Estados para filtros y búsqueda
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [filtrosLocales, setFiltrosLocales] = useState({
    startDate: '',
    endDate: '',
    type: ''
  })
  
  // Estado para exportación
  const [isExporting, setIsExporting] = useState(false)
  
  /**
   * =========================================
   * IMPLEMENTACIÓN DE DEBOUNCE PARA BÚSQUEDA
   * =========================================
   * 
   * El debounce mejora significativamente la performance de la búsqueda:
   * - Evita llamadas API innecesarias mientras el usuario está escribiendo
   * - Solo ejecuta la búsqueda después de que el usuario deje de escribir por 300ms
   * - Reduce la carga en el servidor y mejora la experiencia del usuario
   * - Proporciona feedback visual durante el periodo de espera
   */
  
  // Implementar debounce para la búsqueda (300ms de delay)
  const debouncedTerminoBusqueda = useDebounce(terminoBusqueda, 300)
  
  /**
   * =========================================
   * FUNCIONES DE BÚSQUEDA Y RESTAURACIÓN
   * =========================================
   */
  
  // Función para restaurar la vista paginada normal
  const restaurarVistaPaginada = () => {
    // Restaurar a la vista paginada con límite de 20
    const filtrosRestaurados = { ...filtros, limit: 20, offset: 0 }
    cargarTransacciones(filtrosRestaurados)
  }

  // Efecto para manejar la búsqueda independientemente de la paginación
  // Ahora usa el término debouncado para evitar llamadas API excesivas
  useEffect(() => {
    if (debouncedTerminoBusqueda.trim()) {
      // Si hay un término de búsqueda debouncado, hacer búsqueda sin límites de paginación
      const realizarBusqueda = async () => {
        try {
          // Crear filtros de búsqueda sin límites de paginación
          const filtrosBusqueda = { ...filtros }
          delete filtrosBusqueda.limit
          delete filtrosBusqueda.offset
          
          // Usar la función del hook para cargar todas las transacciones
          // Esto desactivará temporalmente la paginación
          await cargarTransacciones(filtrosBusqueda)
        } catch (error) {
          console.error('Error en búsqueda:', error)
        }
      }
      
      realizarBusqueda()
    } else {
      // Si no hay término de búsqueda debouncado, restaurar vista paginada normal
      // Solo restaurar si no estamos ya en vista por defecto o si las transacciones no están paginadas
      if (!isDefaultView || transacciones.length > 20) {
        restaurarVistaPaginada()
      }
    }
  }, [debouncedTerminoBusqueda, filtros])

  // Efecto para refrescar datos cuando se abre el modal
  useEffect(() => {
    // Solo mantener el modal abierto, sin recargas automáticas
  }, [transaccionModal.isOpen])

  /**
   * =========================================
   * FUNCIONES DE CONFIRMACIÓN PARA TRANSACCIONES CONCILIADAS
   * =========================================
   */
  
  // Función para verificar si una transacción está conciliada
  const isTransaccionConciliada = (transaccion) => {
    // Por ahora, simulamos que las transacciones con más de 30 días son conciliadas
    // En una implementación real, esto vendría del backend
    const fechaTransaccion = new Date(transaccion.transaction_date)
    const fechaActual = new Date()
    const diasDiferencia = Math.floor((fechaActual - fechaTransaccion) / (1000 * 60 * 60 * 24))
    
    return diasDiferencia > 30
  }

  // Función para manejar la apertura del modal de edición con confirmación
  const handleAbrirModalEdicion = async (transaccion) => {
    // Si la transacción está conciliada, mostrar advertencia
    if (isTransaccionConciliada(transaccion)) {
      const confirmed = await getConfirmation({
        title: 'Transacción Conciliada',
        message: 'Esta transacción pertenece a un periodo ya conciliado. Modificarla puede generar inconsistencias en tus reportes. ¿Estás seguro de que quieres editarla?',
        confirmText: 'Sí, editar',
        cancelText: 'Cancelar',
        variant: 'warning'
      })
      
      if (!confirmed) {
        return
      }
    }
    
    // Abrir modal de edición
    setTransaccionModal({
      isOpen: true,
      transaccion,
      isLoading: false
    })
  }

  /**
   * =========================================
   * FUNCIONES DEL MODAL
   * =========================================
   */

  const handleAbrirModal = (transaccion = null) => {
    // Solo para crear nuevas transacciones
    setTransaccionModal({
      isOpen: true,
      transaccion: null, // Siempre null para crear
      isLoading: false
    })
  }

  const handleCerrarModal = () => {
    setTransaccionModal({
      isOpen: false,
      transaccion: null,
      isLoading: false
    })
  }

  const handleGuardarTransaccion = async (datosTransaccion) => {
    setTransaccionModal(prev => ({ ...prev, isLoading: true }))

    let result
    if (transaccionModal.transaccion) {
      // Editar
      result = await actualizarTransaccion(transaccionModal.transaccion.id, datosTransaccion)
    } else {
      // Crear
      result = await crearTransaccion(datosTransaccion)
    }

    setTransaccionModal(prev => ({ ...prev, isLoading: false }))
    
    // Si la operación fue exitosa, cerrar el modal
    if (result?.success) {
      setTransaccionModal({
        isOpen: false,
        transaccion: null,
        isLoading: false
      })
      
      // Recargar transacciones para asegurar que la vista esté sincronizada
      // Esto actualiza tanto la lista como las estadísticas
      await recargarTransacciones()
    }
    
    return result
  }

  const handleEliminarTransaccion = async (id, descripcion) => {
    const mensaje = descripcion 
      ? `¿Estás seguro de que deseas eliminar la transacción "${descripcion}"?`
      : '¿Estás seguro de que deseas eliminar esta transacción?'
    
    const confirmed = await getConfirmation({
      title: '¿Eliminar Transacción?',
      message: `${mensaje}\n\nEsta acción no se puede deshacer y afectará los saldos de las cuentas.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    })
    
    if (confirmed) {
      const result = await eliminarTransaccion(id)
      
      // Si la eliminación fue exitosa, recargar la vista
      if (result?.success) {
        await recargarTransacciones()
      }
    }
  }

  /**
   * =========================================
   * FUNCIONES DE FILTROS
   * =========================================
   */

  const handleAplicarFiltros = () => {
    const filtrosAplicar = {}
    
    if (filtrosLocales.startDate) filtrosAplicar.startDate = filtrosLocales.startDate
    if (filtrosLocales.endDate) filtrosAplicar.endDate = filtrosLocales.endDate
    if (filtrosLocales.type) filtrosAplicar.type = filtrosLocales.type

    aplicarFiltros(filtrosAplicar)
    setMostrarFiltros(false)
  }

  const handleLimpiarFiltros = () => {
    setFiltrosLocales({
      startDate: '',
      endDate: '',
      type: ''
    })
    setTerminoBusqueda('')
    limpiarFiltros()
  }

  /**
   * =========================================
   * FUNCIÓN DE EXPORTACIÓN
   * =========================================
   */

  const handleExportarExcel = async () => {
    setIsExporting(true)
    
    try {
      // Usar los filtros locales si están aplicados, o los filtros actuales
      const filtrosExportacion = {}
      
      if (filtrosLocales.startDate) filtrosExportacion.startDate = filtrosLocales.startDate
      if (filtrosLocales.endDate) filtrosExportacion.endDate = filtrosLocales.endDate
      if (filtrosLocales.type) filtrosExportacion.type = filtrosLocales.type
      
      // Si no hay filtros locales, usar los filtros actuales
      if (Object.keys(filtrosExportacion).length === 0) {
        if (filtros.startDate) filtrosExportacion.startDate = filtros.startDate
        if (filtros.endDate) filtrosExportacion.endDate = filtros.endDate
        if (filtros.type) filtrosExportacion.type = filtros.type
      }
      
      await exportarTransacciones(filtrosExportacion)
    } catch (error) {
      console.error('Error en exportación:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleCambioFiltro = (campo, valor) => {
    setFiltrosLocales(prev => ({ ...prev, [campo]: valor }))
  }

  /**
   * =========================================
   * COMPONENTES DE RENDERIZADO
   * =========================================
   */

  // Componente para item de transacción - DISEÑO EXCLUSIVO MÓVIL
  const TransaccionItem = ({ transaccion }) => {
    const tipoIconos = {
      income: TrendingUp,
      expense: TrendingDown,
      transfer: ArrowRightLeft
    }

    const Icon = tipoIconos[transaccion.type]
    const esPositivo = transaccion.type === 'income'
    const esTransferencia = transaccion.type === 'transfer'
    
    // Determinar la moneda de la transacción
    const transactionCurrency = getTransactionCurrency(transaccion)

    // Definir diseño específico para móvil con excelente contraste
    const getMobileDesign = () => {
      switch (transaccion.type) {
        case 'income':
          return {
            // Modo claro: Verde suave con bordes definidos
            // Modo oscuro: Verde brillante con fondo oscuro contrastante
            container: 'bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 dark:from-emerald-950/40 dark:via-green-950/60 dark:to-emerald-950/40 border-l-4 border-emerald-500 dark:border-emerald-400',
            icon: 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 dark:shadow-emerald-400/30',
            amount: 'text-emerald-700 dark:text-emerald-300 font-black',
            badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
            accent: 'text-emerald-600 dark:text-emerald-400'
          }
        case 'expense':
          return {
            // Modo claro: Rojo coral suave con bordes definidos
            // Modo oscuro: Rojo brillante con fondo oscuro contrastante
            container: 'bg-gradient-to-r from-red-50 via-rose-50 to-red-50 dark:from-red-950/40 dark:via-rose-950/60 dark:to-red-950/40 border-l-4 border-red-500 dark:border-red-400',
            icon: 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 dark:shadow-red-400/30',
            amount: 'text-red-700 dark:text-red-300 font-black',
            badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
            accent: 'text-red-600 dark:text-red-400'
          }
        case 'transfer':
          return {
            // Modo claro: Azul cielo con bordes definidos
            // Modo oscuro: Azul brillante con fondo oscuro contrastante
            container: 'bg-gradient-to-r from-blue-50 via-sky-50 to-blue-50 dark:from-blue-950/40 dark:via-sky-950/60 dark:to-blue-950/40 border-l-4 border-blue-500 dark:border-blue-400',
            icon: 'bg-gradient-to-br from-blue-500 to-sky-600 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-400/30',
            amount: 'text-blue-700 dark:text-blue-300 font-black',
            badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
            accent: 'text-blue-600 dark:text-blue-400'
          }
        default:
          return {
            container: 'bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50 dark:from-gray-950/40 dark:via-slate-950/60 dark:to-gray-950/40 border-l-4 border-gray-500 dark:border-gray-400',
            icon: 'bg-gradient-to-br from-gray-500 to-slate-600 text-white shadow-lg shadow-gray-500/25',
            amount: 'text-gray-700 dark:text-gray-300 font-black',
            badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200',
            accent: 'text-gray-600 dark:text-gray-400'
          }
      }
    }

    const design = getMobileDesign()

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={
          isMobile ? (
            // DISEÑO MÓVIL EXCLUSIVO: Ultra-compacto con gradientes y contraste excepcional
            `relative overflow-hidden ${design.container} rounded-2xl p-4 shadow-md hover:shadow-lg dark:shadow-xl dark:shadow-black/20 transition-all duration-300 active:scale-[0.98] border border-white/60 dark:border-gray-800/60`
          ) : (
            // DISEÑO DESKTOP: Mantenemos el diseño tradicional
            'card hover:shadow-medium transition-shadow'
          )
        }
      >
        {isMobile ? (
          /* ========== DISEÑO MÓVIL EXCLUSIVO ========== */
          <div className="space-y-3">
            {/* Header principal: Icono + Descripción + Monto */}
            <div className="flex items-center gap-3">
              {/* Icono con gradiente y sombra */}
              <div className={`p-2.5 rounded-xl ${design.icon} flex-shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              
              {/* Información central */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate leading-tight">
                  {transaccion.description || 'Sin descripción'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {formatDate(transaccion.transaction_date)}
                </p>
              </div>
              
              {/* Monto prominente con máximo contraste */}
              <div className="flex-shrink-0 text-right">
                <p className={`text-xl ${design.amount} leading-none`}>
                  {esPositivo ? '+' : esTransferencia ? '' : '-'}
                  {formatCurrency(transaccion.converted_amount || transaccion.amount, transaccion.primary_currency || 'USD')}
                </p>
                {transaccion.is_converted && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatCurrency(transaccion.original_amount, transaccion.original_currency)}
                  </p>
                )}
              </div>
            </div>

            {/* Línea divisoria sutil */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>

            {/* Footer: Categoría + Tipo + Acciones */}
            <div className="flex items-center justify-between">
              {/* Lado izquierdo: Categoría y tipo */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Categoría */}
                {transaccion.category_name && (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${design.badge} truncate max-w-24`}>
                    {transaccion.category_name}
                  </span>
                )}
                
                {/* Tipo de transacción */}
                <span className={`text-xs font-medium ${design.accent} truncate`}>
                  {TRANSACTION_TYPE_LABELS[transaccion.type]}
                </span>
              </div>
              
              {/* Lado derecho: Acciones compactas */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleAbrirModalEdicion(transaccion)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 active:scale-95"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEliminarTransaccion(transaccion.id, transaccion.description)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 active:scale-95"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Información de cuentas (compacta y solo si es necesaria) */}
            {(transaccion.from_account_name || transaccion.to_account_name) && (
              <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {transaccion.type === 'expense' && transaccion.from_account_name && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Desde:</span>
                      <span className="truncate">{transaccion.from_account_name}</span>
                    </span>
                  )}
                  {transaccion.type === 'income' && transaccion.to_account_name && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Hacia:</span>
                      <span className="truncate">{transaccion.to_account_name}</span>
                    </span>
                  )}
                  {transaccion.type === 'transfer' && transaccion.from_account_name && transaccion.to_account_name && (
                    <span className="flex items-center gap-1">
                      <span className="truncate">{transaccion.from_account_name}</span>
                      <ArrowRightLeft className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{transaccion.to_account_name}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Indicador visual de estado */}
            <div className="absolute top-2 right-2">
              <div className={`w-2 h-2 rounded-full ${design.icon} opacity-80`}></div>
            </div>
          </div>
        ) : (
          /* ========== DISEÑO DESKTOP TRADICIONAL ========== */
          <div className="p-4">
            <div className="flex items-center justify-between">
              {/* Información principal - Lado izquierdo */}
              <div className="flex items-center flex-1">
                {/* Icono */}
                <div className={`p-2 rounded-lg ${
                  transaccion.type === 'income' ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400' :
                  transaccion.type === 'expense' ? 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400' :
                  'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                {/* Información de la transacción */}
                <div className="ml-4 flex-1">
                  {/* Descripción */}
                  <p className="font-semibold heading-dark-contrast">
                    {transaccion.description || 'Sin descripción'}
                  </p>
                  
                  {/* Fecha y categoría */}
                  <p className="text-sm text-subtitle-contrast">
                    {formatDate(transaccion.transaction_date)}
                    {transaccion.category_name && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {transaccion.category_name}
                      </span>
                    )}
                  </p>

                  {/* Información de cuentas */}
                  <div className="mt-1 text-sm text-subtitle-contrast">
                    {transaccion.type === 'expense' && transaccion.from_account_name && (
                      <span>
                        Desde: {transaccion.from_account_name}
                        {transaccion.from_account_category === 'liability' && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                            Pasivo
                          </span>
                        )}
                        {transaccion.from_account_category === 'asset' && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                            Activo
                          </span>
                        )}
                      </span>
                    )}
                    {transaccion.type === 'income' && transaccion.to_account_name && (
                      <span>
                        Hacia: {transaccion.to_account_name}
                        {transaccion.to_account_category === 'liability' && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                            Pasivo
                          </span>
                        )}
                        {transaccion.to_account_category === 'asset' && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                            Activo
                          </span>
                        )}
                      </span>
                    )}
                    {transaccion.type === 'transfer' && (
                      <span>
                        {transaccion.from_account_name}
                        {transaccion.from_account_category === 'liability' && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                            Pasivo
                          </span>
                        )}
                        {transaccion.from_account_category === 'asset' && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                            Activo
                          </span>
                        )}
                        {' → '}
                        {transaccion.to_account_name}
                        {transaccion.to_account_category === 'liability' && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                            Pasivo
                          </span>
                        )}
                        {transaccion.to_account_category === 'asset' && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                            Activo
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Información de monto y acciones - Lado derecho */}
              <div className="flex items-center space-x-4">
                {/* Monto */}
                <div className="text-right">
                  {/* 🚨 NUEVO: Monto convertido como principal */}
                  <p className={`text-lg font-bold ${
                    esPositivo ? 'text-success-600 dark:text-success-400' : 
                    esTransferencia ? 'text-blue-600 dark:text-blue-400' : 
                    'text-danger-600 dark:text-danger-400'
                  }`}>
                    {esPositivo ? '+' : esTransferencia ? '' : '-'}
                    {formatCurrency(transaccion.converted_amount || transaccion.amount, transaccion.primary_currency || 'USD')}
                  </p>
                  
                  {/* 🚨 NUEVO: Monto original como referencia secundaria */}
                  {transaccion.is_converted && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Original: {formatCurrency(transaccion.original_amount, transaccion.original_currency)}
                    </p>
                  )}
                  
                  <p className="text-sm text-subtitle-contrast">
                    {TRANSACTION_TYPE_LABELS[transaccion.type]}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleAbrirModalEdicion(transaccion)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Editar transacción"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEliminarTransaccion(transaccion.id, transaccion.description)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-danger-600 dark:hover:text-danger-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Eliminar transacción"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 transacciones-page"
    >
      {/* Header - OPTIMIZADO PARA MÓVIL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 transacciones-header">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold heading-dark-contrast truncate">Transacciones</h1>
          <p className="text-sm sm:text-base text-subtitle-contrast truncate">Historial y gestión de movimientos financieros</p>
        </div>
        <button
          onClick={() => handleAbrirModal()}
          className="btn-primary w-full sm:w-auto flex-shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Añadir Transacción</span>
          <span className="sm:hidden">Añadir</span>
        </button>
      </div>

      {/* Estadísticas - OPTIMIZADAS PARA MÓVIL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 transacciones-cards">
        {/* Tarjeta de Ingresos */}
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
                TOTAL INGRESOS
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-success-600 dark:text-success-400 truncate transition-colors duration-300">
                {resumen ? formatCurrency(resumen.totalIncome, resumen.primaryCurrency) : 'Cargando...'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                {filtros.startDate || filtros.endDate ? 'En el período seleccionado' : 'Todo el historial'}
              </p>
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <TrendingUp className="h-4 w-4 text-success-500" />
          </div>

          <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
        </motion.div>
        
        {/* Tarjeta de Gastos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-danger-50/20 dark:to-danger-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative flex items-center">
            <div className="p-2 sm:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 text-danger-600 bg-danger-100 dark:text-danger-400 dark:bg-danger-900/30 shadow-sm group-hover:shadow-md">
              <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-3" />
            </div>
            
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide">
                TOTAL GASTOS
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-danger-600 dark:text-danger-400 truncate transition-colors duration-300">
                {resumen ? formatCurrency(resumen.totalExpenses, resumen.primaryCurrency) : 'Cargando...'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                {filtros.startDate || filtros.endDate ? 'En el período seleccionado' : 'Todo el historial'}
              </p>
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <TrendingDown className="h-4 w-4 text-danger-500" />
          </div>

          <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
        </motion.div>
        
        {/* Tarjeta de Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="relative group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden sm:col-span-2 lg:col-span-1"
        >
          <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent ${
            resumen && resumen.balanceNeto >= 0 
              ? 'to-success-50/20 dark:to-success-900/10' 
              : 'to-danger-50/20 dark:to-danger-900/10'
          } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
          
          <div className="relative flex items-center">
            <div className={`p-2 sm:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 shadow-sm group-hover:shadow-md ${
              resumen && resumen.balanceNeto >= 0 
                ? 'text-success-600 bg-success-100 dark:text-success-400 dark:bg-success-900/30' 
                : 'text-danger-600 bg-danger-100 dark:text-danger-400 dark:bg-danger-900/30'
            }`}>
              <ArrowRightLeft className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-3" />
            </div>
            
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide">
                {filtros.startDate || filtros.endDate ? 'BALANCE (PERIODO)' : 'BALANCE HISTÓRICO'}
              </h3>
              <p className={`text-xl sm:text-2xl lg:text-3xl font-black truncate transition-colors duration-300 ${
                resumen && resumen.balanceNeto >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
              }`}>
                {resumen ? formatCurrency(resumen.balanceNeto, resumen.primaryCurrency) : 'Cargando...'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                {filtros.startDate || filtros.endDate ? 'En el período seleccionado' : 'Todo el historial'}
              </p>
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            {resumen && resumen.balanceNeto >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-danger-500" />
            )}
          </div>

          <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
        </motion.div>
      </div>

      {/* Filtros y búsqueda - REDISEÑADO PARA MÓVIL */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold heading-dark-contrast">
            Filtros y Búsqueda
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="btn-outline btn-sm"
            >
              <Filter className="h-4 w-4 mr-1" />
              {isMobile ? 'Filtros' : 'Filtros'}
            </button>
            {(filtros.startDate || filtros.endDate || filtros.type) && (
              <button
                onClick={handleLimpiarFiltros}
                className="btn-outline btn-sm text-danger-600 hover:bg-danger-50"
              >
                <X className="h-4 w-4 mr-1" />
                {isMobile ? 'Limpiar' : 'Limpiar'}
              </button>
            )}
          </div>
        </div>

        {/* Barra de búsqueda - OPTIMIZADA PARA MÓVIL */}
        <div className="relative mb-3 sm:mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={isMobile ? "Buscar..." : "Buscar por descripción, categoría o cuenta..."}
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
            className="form-input pl-10 pr-10 text-sm"
          />
          {/* Indicador de búsqueda en progreso (debounce activo) */}
          {terminoBusqueda.trim() && terminoBusqueda !== debouncedTerminoBusqueda && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
          {terminoBusqueda && (
            <button
              onClick={() => {
                setTerminoBusqueda('')
                // Restaurar vista paginada cuando se limpia la búsqueda
                restaurarVistaPaginada()
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtros rápidos por tipo - COMPACTOS PARA MÓVIL */}
        <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap items-center justify-between gap-2'} mb-3 sm:mb-4`}>
          <div className={`${isMobile ? 'col-span-2 grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2'}`}>
            <button
              onClick={() => filtrarPorTipo(null)}
              className={`btn-sm ${!filtros.type ? 'btn-primary' : 'btn-outline'}`}
            >
              Todas
            </button>
            <button
              onClick={() => filtrarPorTipo('income')}
              className={`btn-sm ${filtros.type === 'income' ? 'bg-success-600 text-white' : 'btn-outline'}`}
            >
              {isMobile ? 'Ingresos' : 'Ingresos'}
            </button>
            <button
              onClick={() => filtrarPorTipo('expense')}
              className={`btn-sm ${filtros.type === 'expense' ? 'bg-danger-600 text-white' : 'btn-outline'}`}
            >
              {isMobile ? 'Gastos' : 'Gastos'}
            </button>
            <button
              onClick={() => filtrarPorTipo('transfer')}
              className={`btn-sm ${filtros.type === 'transfer' ? 'bg-blue-600 text-white' : 'btn-outline'}`}
            >
              {isMobile ? 'Transfers' : 'Transferencias'}
            </button>
          </div>
          
          {/* Botón de exportación rápida - solo visible cuando los filtros están cerrados y en desktop */}
          {!mostrarFiltros && (
            <button
              onClick={handleExportarExcel}
              disabled={isExporting}
              className="btn-outline btn-sm hidden md:block"
              title="Exportar transacciones actuales a Excel"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </>
              )}
            </button>
          )}
        </div>

        {/* Panel de filtros avanzados */}
        {mostrarFiltros && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Fecha Desde</label>
                <input
                  type="date"
                  value={filtrosLocales.startDate}
                  onChange={(e) => handleCambioFiltro('startDate', e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Fecha Hasta</label>
                <input
                  type="date"
                  value={filtrosLocales.endDate}
                  onChange={(e) => handleCambioFiltro('endDate', e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Tipo</label>
                <select
                  value={filtrosLocales.type}
                  onChange={(e) => handleCambioFiltro('type', e.target.value)}
                  className="form-input"
                >
                  <option value="">Todos los tipos</option>
                  <option value="income">Ingresos</option>
                  <option value="expense">Gastos</option>
                  <option value="transfer">Transferencias</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleExportarExcel}
                disabled={isExporting}
                className="btn-outline btn-sm"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar a Excel
                  </>
                )}
              </button>
              <button
                onClick={handleAplicarFiltros}
                className="btn-primary btn-sm"
              >
                Aplicar Filtros
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Lista de Transacciones */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold heading-dark-contrast">
            Historial de Transacciones ({totalCountFromServer})
          </h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <span className="ml-2 text-subtitle-contrast">Cargando transacciones...</span>
          </div>
        ) : (isDefaultView ? visibleTransactions : transacciones).length === 0 ? (
          <div className="card p-12 text-center">
            <ArrowRightLeft className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold heading-dark-contrast mb-2">
              No hay transacciones registradas
            </h3>
            <p className="text-subtitle-contrast mb-6">
              Registra tu primera transacción para comenzar a llevar el control de tus finanzas
            </p>
            <button
              onClick={() => handleAbrirModal()}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primera Transacción
            </button>
          </div>
        ) : (
          <div className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            {/* Mensaje informativo de búsqueda */}
            {terminoBusqueda.trim() && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <Search className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {terminoBusqueda !== debouncedTerminoBusqueda ? (
                        `Buscando: "${terminoBusqueda}"...`
                      ) : (
                        `Búsqueda activa: "${terminoBusqueda}"`
                      )}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {terminoBusqueda !== debouncedTerminoBusqueda ? (
                        'Esperando que termines de escribir...'
                      ) : (
                        'Mostrando todos los resultados que coinciden con tu búsqueda'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Determinar qué transacciones mostrar basado en el estado */}
            {(() => {
              // Si hay un término de búsqueda activo, mostrar todas las transacciones filtradas
              if (terminoBusqueda.trim()) {
                return transacciones
                  .filter(transaccion => {
                    const termino = terminoBusqueda.toLowerCase()
                    return (
                      transaccion.description?.toLowerCase().includes(termino) ||
                      transaccion.category_name?.toLowerCase().includes(termino) ||
                      transaccion.from_account_name?.toLowerCase().includes(termino) ||
                      transaccion.to_account_name?.toLowerCase().includes(termino)
                    )
                  })
                  .map((transaccion) => (
                    <TransaccionItem key={transaccion.id} transaccion={transaccion} />
                  ))
              }
              
              // Si no hay búsqueda activa, usar la lógica normal de paginación
              return (isDefaultView ? visibleTransactions : transacciones)
                .map((transaccion) => (
                  <TransaccionItem 
                    key={transaccion.id} 
                    transaccion={transaccion} 
                  />
                ))
            })()}

            {/* Botones de paginación manual - OPTIMIZADOS PARA MÓVIL */}
            {isDefaultView && !terminoBusqueda.trim() && (
              <div className="flex flex-col items-center justify-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                {/* Contenedor de botones */}
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  {/* Botón "Mostrar menos" - aparece cuando hay más transacciones que el límite inicial */}
                  {visibleTransactions.length > getPageLimit() && (
                    <button
                      onClick={handleShowLess}
                      className="btn-outline btn-sm w-full sm:w-auto"
                      title={`Volver a mostrar solo las primeras ${getPageLimit()} transacciones`}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Mostrar Menos
                    </button>
                  )}
                  
                  {/* Botón "Mostrar más" - aparece si hay más transacciones disponibles */}
                  {visibleTransactions.length < totalCountFromServer && (
                    <button
                      onClick={handleShowMore}
                      disabled={isLoading}
                      className="btn-primary btn-sm w-full sm:w-auto"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Cargando...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Mostrar Más
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                {/* Información de paginación - Mejorada para móvil */}
                <div className="text-xs sm:text-sm text-subtitle-contrast text-center px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {terminoBusqueda.trim() ? (
                    `Mostrando ${transacciones.filter(transaccion => {
                      const termino = terminoBusqueda.toLowerCase()
                      return (
                        transaccion.description?.toLowerCase().includes(termino) ||
                        transaccion.category_name?.toLowerCase().includes(termino) ||
                        transaccion.from_account_name?.toLowerCase().includes(termino) ||
                        transaccion.to_account_name?.toLowerCase().includes(termino)
                      )
                    }).length} resultados de búsqueda`
                  ) : filtros.type ? (
                    `Mostrando ${visibleTransactions.length} de ${totalCountFromServer} ${filtros.type === 'income' ? 'ingresos' : filtros.type === 'expense' ? 'gastos' : 'transferencias'}`
                  ) : (
                    <>
                      Mostrando <span className="font-semibold text-primary-600 dark:text-primary-400">{visibleTransactions.length}</span> de <span className="font-semibold">{totalCountFromServer}</span> transacciones
                      {isMobile && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {getPageLimit()} por página en móvil
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Transacción */}
      <TransaccionModal
        isOpen={transaccionModal.isOpen}
        onClose={handleCerrarModal}
        onSave={handleGuardarTransaccion}
        transaccion={transaccionModal.transaccion}
        isLoading={transaccionModal.isLoading}
      />
    </motion.div>
  )
}

export default Transacciones