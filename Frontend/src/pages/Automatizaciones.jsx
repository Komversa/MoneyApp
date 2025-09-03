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
  Play,
  Pause,
  Clock,
  Repeat,
  Loader2,
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useTransaccionesProgramadas } from '../hooks/useTransaccionesProgramadas'
import { useDebounce } from '../hooks/useDebounce'
import { useConfirmDialogContext } from '../contexts/ConfirmDialogContext'
import useAuthStore from '../store/useAuthStore'
import AutomatizacionWizard from '../components/ui/AutomatizacionWizard'
import AutomationItem from '../components/ui/AutomationItem'
import { Toaster } from '../components/ui/Toaster'
import { formatCurrency, formatDate } from '../utils/formatters'
import { TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_COLORS } from '../utils/constants'

/**
 * Página de gestión de Transacciones Programadas (Automatizaciones)
 * Permite crear, gestionar y visualizar transacciones automáticas
 */
const Automatizaciones = () => {
  const { isAuthenticated, accessToken } = useAuthStore()
  
  // Si no está autenticado, mostrar mensaje
  if (!isAuthenticated || !accessToken) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-red-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Sesión Expirada
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Por favor, inicia sesión nuevamente para acceder a las automatizaciones.
          </p>
        </div>
      </div>
    )
  }
  
  const {
    transacciones,
    transaccionesActivas,
    transaccionesInactivas,
    estadisticas,
    estadoScheduler,
    cargando,
    error,
    cargarTransacciones,
    crear,
    actualizar,
    toggle,
    eliminar,
    ejecutarScheduler
  } = useTransaccionesProgramadas()

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
    is_active: '',
    transaction_type: ''
  })

  // Estado para vista actual
  const [vistaActual, setVistaActual] = useState('todas') // 'todas', 'activas', 'inactivas'

  // Implementar debounce para la búsqueda
  const debouncedTerminoBusqueda = useDebounce(terminoBusqueda, 300)

  /**
   * Aplicar filtros de búsqueda local
   */
  const transaccionesFiltradas = React.useMemo(() => {
    let resultado = transacciones;

    // Filtrar por vista actual
    if (vistaActual === 'activas') {
      resultado = transaccionesActivas;
    } else if (vistaActual === 'inactivas') {
      resultado = transaccionesInactivas;
    }

    // Filtrar por término de búsqueda
    if (debouncedTerminoBusqueda) {
      resultado = resultado.filter(t =>
        t.description?.toLowerCase().includes(debouncedTerminoBusqueda.toLowerCase()) ||
        t.source_account_name?.toLowerCase().includes(debouncedTerminoBusqueda.toLowerCase()) ||
        t.destination_account_name?.toLowerCase().includes(debouncedTerminoBusqueda.toLowerCase()) ||
        t.category_name?.toLowerCase().includes(debouncedTerminoBusqueda.toLowerCase())
      );
    }

    // Filtrar por tipo de transacción
    if (filtrosLocales.transaction_type) {
      resultado = resultado.filter(t => t.transaction_type === filtrosLocales.transaction_type);
    }

    return resultado;
  }, [transacciones, transaccionesActivas, transaccionesInactivas, vistaActual, debouncedTerminoBusqueda, filtrosLocales]);

  /**
   * Manejar apertura de modal para nueva transacción programada
   */
  const handleNuevaTransaccion = () => {
    setTransaccionModal({
      isOpen: true,
      transaccion: null,
      isLoading: false
    });
  };

  /**
   * Manejar apertura de modal para editar transacción programada
   */
  const handleEditarTransaccion = (transaccion) => {
    setTransaccionModal({
      isOpen: true,
      transaccion: transaccion,
      isLoading: false
    });
  };

  /**
   * Cerrar modal
   */
  const handleCerrarModal = () => {
    setTransaccionModal({
      isOpen: false,
      transaccion: null,
      isLoading: false
    });
  };

  /**
   * Manejar guardado de transacción programada
   */
  const handleGuardarTransaccion = async (datosTransaccion) => {
    setTransaccionModal(prev => ({ ...prev, isLoading: true }));

    try {
      let resultado;
      
      if (transaccionModal.transaccion) {
        // Actualizar transacción existente
        resultado = await actualizar(transaccionModal.transaccion.id, datosTransaccion);
      } else {
        // Crear nueva transacción programada
        resultado = await crear(datosTransaccion);
      }

      if (resultado.success) {
        handleCerrarModal();
      }
    } catch (error) {
      console.error('Error guardando transacción programada:', error);
    } finally {
      setTransaccionModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Manejar pausar/reanudar transacción programada
   */
  const handleToggleTransaccion = async (transaccion) => {
    const accion = transaccion.is_active ? 'pausar' : 'reanudar';
    const confirmado = await getConfirmation({
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} Automatización`,
      message: `¿Estás seguro de que deseas ${accion} esta transacción programada?\n\nEsto ${transaccion.is_active ? 'pausará' : 'reanudará'} la ejecución automática.`,
      confirmText: accion.charAt(0).toUpperCase() + accion.slice(1),
      cancelText: 'Cancelar',
      variant: accion === 'pausar' ? 'warning' : 'default'
    });

    if (confirmado) {
      await toggle(transaccion.id);
    }
  };

  /**
   * Manejar eliminación de transacción programada
   */
  const handleEliminarTransaccion = async (transaccion) => {
    const confirmado = await getConfirmation({
      title: 'Eliminar Automatización',
      message: `¿Estás seguro de que deseas eliminar la automatización "${transaccion.description}"?\n\nEsta acción no se puede deshacer. Se eliminará permanentemente.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    });

    if (confirmado) {
      await eliminar(transaccion.id);
    }
  };

  /**
   * Aplicar filtros
   */
  const handleAplicarFiltros = () => {
    const filtros = {};
    if (filtrosLocales.is_active !== '') {
      filtros.is_active = filtrosLocales.is_active;
    }
    if (filtrosLocales.transaction_type) {
      filtros.transaction_type = filtrosLocales.transaction_type;
    }
    
    cargarTransacciones(filtros);
    setMostrarFiltros(false);
  };

  /**
   * Limpiar filtros
   */
  const handleLimpiarFiltros = () => {
    setFiltrosLocales({
      is_active: '',
      transaction_type: ''
    });
    setTerminoBusqueda('');
    cargarTransacciones();
    setMostrarFiltros(false);
  };

  /**
   * Obtener etiqueta de frecuencia
   */
  const obtenerEtiquetaFrecuencia = (frequency) => {
    const etiquetas = {
      once: 'Una vez',
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual'
    };
    return etiquetas[frequency] || frequency;
  };

  /**
   * Obtener color del estado
   */
  const obtenerColorEstado = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  /**
   * Ejecutar scheduler manualmente (solo para desarrollo)
   */
  const handleEjecutarScheduler = async () => {
    const confirmado = await getConfirmation({
      title: 'Ejecutar Scheduler',
      message: '¿Estás seguro de que deseas ejecutar el scheduler manualmente?\n\nEsto procesará todas las transacciones programadas pendientes.',
      confirmText: 'Ejecutar',
      cancelText: 'Cancelar',
      variant: 'default'
    });

    if (confirmado) {
      await ejecutarScheduler();
    }
  };

  return (
    <div className="space-y-6">
      <Toaster />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Automatizaciones
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestiona tus transacciones programadas y pagos automáticos
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {/* Estado del Scheduler */}
          {estadoScheduler && !estadoScheduler.error && (
            <div className="flex items-center space-x-2 text-sm">
              {estadoScheduler.isRunning ? (
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span>Activo</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>Inactivo</span>
                </div>
              )}
            </div>
          )}
          
          {/* Estado cuando hay error de scheduler */}
          {estadoScheduler && estadoScheduler.error === 'unavailable' && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Settings className="h-4 w-4 mr-1" />
              <span>N/A</span>
            </div>
          )}
          
          {/* Botón ejecutar scheduler (solo desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleEjecutarScheduler}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Settings className="h-4 w-4 mr-1" />
              Ejecutar
            </button>
          )}
          
          <button
            onClick={handleNuevaTransaccion}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Automatización
          </button>
        </div>
      </div>

      {/* Estadísticas - OPTIMIZADAS PARA MÓVIL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/20 dark:to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative flex items-center">
            <div className="p-2 sm:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 shadow-sm group-hover:shadow-md">
              <Repeat className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-3" />
            </div>
            
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide">
                TOTAL
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-600 dark:text-blue-400 truncate transition-colors duration-300">
                {estadisticas.total}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                Automatizaciones creadas
              </p>
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <Repeat className="h-4 w-4 text-blue-500" />
          </div>

          <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
        </motion.div>

        {/* Activas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-green-50/20 dark:to-green-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative flex items-center">
            <div className="p-2 sm:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30 shadow-sm group-hover:shadow-md">
              <Play className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-3" />
            </div>
            
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide">
                ACTIVAS
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-green-600 dark:text-green-400 truncate transition-colors duration-300">
                {estadisticas.activas}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                En funcionamiento
              </p>
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <Play className="h-4 w-4 text-green-500" />
          </div>

          <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
        </motion.div>

        {/* Pausadas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="relative group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-yellow-50/20 dark:to-yellow-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative flex items-center">
            <div className="p-2 sm:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30 shadow-sm group-hover:shadow-md">
              <Pause className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-3" />
            </div>
            
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide">
                PAUSADAS
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-yellow-600 dark:text-yellow-400 truncate transition-colors duration-300">
                {estadisticas.inactivas}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                Temporalmente inactivas
              </p>
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <Pause className="h-4 w-4 text-yellow-500" />
          </div>

          <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
        </motion.div>

        {/* Mensuales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="relative group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden sm:col-span-2 lg:col-span-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-50/20 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative flex items-center">
            <div className="p-2 sm:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30 shadow-sm group-hover:shadow-md">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-3" />
            </div>
            
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide">
                MENSUALES
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-purple-600 dark:text-purple-400 truncate transition-colors duration-300">
                {estadisticas.porFrecuencia.mensual}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                Frecuencia mensual
              </p>
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <Calendar className="h-4 w-4 text-purple-500" />
          </div>

          <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
        </motion.div>
      </div>

      {/* Barra de herramientas */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Búsqueda */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Buscar automatizaciones..."
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                />
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center space-x-3">
              {/* Selector de vista */}
              <select
                value={vistaActual}
                onChange={(e) => setVistaActual(e.target.value)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="activas">Activas</option>
                <option value="inactivas">Pausadas</option>
              </select>

              {/* Botón de filtros */}
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </button>
            </div>
          </div>

          {/* Panel de filtros expandible */}
          {mostrarFiltros && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={filtrosLocales.is_active}
                    onChange={(e) => setFiltrosLocales(prev => ({ ...prev, is_active: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos</option>
                    <option value="true">Activas</option>
                    <option value="false">Pausadas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo
                  </label>
                  <select
                    value={filtrosLocales.transaction_type}
                    onChange={(e) => setFiltrosLocales(prev => ({ ...prev, transaction_type: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos</option>
                    <option value="income">Ingresos</option>
                    <option value="expense">Gastos</option>
                    <option value="transfer">Transferencias</option>
                  </select>
                </div>

                <div className="flex items-end space-x-2">
                  <button
                    onClick={handleAplicarFiltros}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={handleLimpiarFiltros}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Lista de transacciones programadas */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {cargando ? (
          <div className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Cargando automatizaciones...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-red-600" />
            <p className="mt-2 text-sm text-red-600">
              Error: {error}
            </p>
          </div>
        ) : transaccionesFiltradas.length === 0 ? (
          <div className="p-6 text-center">
            <Clock className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No hay automatizaciones
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {terminoBusqueda || filtrosLocales.transaction_type || filtrosLocales.is_active
                ? 'No se encontraron automatizaciones que coincidan con los filtros.'
                : 'Comienza creando tu primera automatización.'}
            </p>
            {!terminoBusqueda && !filtrosLocales.transaction_type && !filtrosLocales.is_active && (
              <div className="mt-6">
                <button
                  onClick={handleNuevaTransaccion}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Automatización
                </button>
              </div>
            )}
          </div>
                 ) : (
           <div className="grid grid-cols-1 gap-6">
             {transaccionesFiltradas.map((transaccion) => (
               <AutomationItem
                 key={transaccion.id}
                 transaccion={transaccion}
                 onToggle={handleToggleTransaccion}
                 onEdit={handleEditarTransaccion}
                 onDelete={handleEliminarTransaccion}
               />
             ))}
           </div>
         )}
      </div>

             {/* Wizard de automatización */}
       <AutomatizacionWizard
         isOpen={transaccionModal.isOpen}
         onClose={handleCerrarModal}
         transaccion={transaccionModal.transaccion}
         onSave={handleGuardarTransaccion}
         isLoading={transaccionModal.isLoading}
       />
    </div>
  )
}

export default Automatizaciones
