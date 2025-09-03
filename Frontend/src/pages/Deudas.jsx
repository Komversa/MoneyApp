import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CreditCard,
  TrendingDown,
  Calendar,
  Percent
} from 'lucide-react'
import useDeudas from '../hooks/useDeudas'
import { useConfirmDialogContext } from '../contexts/ConfirmDialogContext'
import { formatCurrency } from '../utils/formatters'
import { CURRENCY_SYMBOLS } from '../utils/constants'
import DeudaModal from '../components/ui/DeudaModal'
import { useToast } from '../components/ui/Toaster'

/**
 * Página de gestión de Deudas - Módulo completo de pasivos
 * Replica el diseño de MoneyApp con funcionalidades de patrimonio neto
 */
const Deudas = () => {
  const {
    deudas,
    resumenDeudas,
    isLoading,
    crearDeuda,
    actualizarDeuda,
    eliminarDeuda
  } = useDeudas()

  const { success } = useToast()

  // Hook para diálogos de confirmación
  const { getConfirmation } = useConfirmDialogContext()

  // Estados para modales
  const [deudaModal, setDeudaModal] = useState({
    isOpen: false,
    deuda: null,
    isLoading: false
  })



  /**
   * =========================================
   * FUNCIONES DEL MODAL DE DEUDAS
   * =========================================
   */

  const handleAbrirModalDeuda = (deuda = null) => {
    setDeudaModal({
      isOpen: true,
      deuda,
      isLoading: false
    })
  }

  const handleCerrarModalDeuda = () => {
    setDeudaModal({
      isOpen: false,
      deuda: null,
      isLoading: false
    })
  }

  const handleGuardarDeuda = async (datosDeuda) => {
    setDeudaModal(prev => ({ ...prev, isLoading: true }))

    let result
    if (deudaModal.deuda) {
      // Editar
      result = await actualizarDeuda(deudaModal.deuda.id, datosDeuda)
    } else {
      // Crear
      result = await crearDeuda(datosDeuda)
    }

    setDeudaModal(prev => ({ ...prev, isLoading: false }))
    
    if (result.success) {
      handleCerrarModalDeuda()
    }
    
    return result
  }



  /**
   * =========================================
   * FUNCIÓN DE ELIMINACIÓN
   * =========================================
   */

  const handleEliminarDeuda = async (id, nombreDeuda) => {
    const confirmed = await getConfirmation({
      title: '¿Eliminar Deuda?',
      message: `Estás a punto de eliminar la deuda '${nombreDeuda}' y todas sus transacciones asociadas. Esta acción es irreversible. ¿Deseas continuar?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    })

    if (confirmed) {
      await eliminarDeuda(id)
    }
  }

  /**
   * =========================================
   * FUNCIÓN DE FORMATEO
   * =========================================
   */

  /**
   * Formatear fecha de vencimiento con cálculo dinámico de días restantes
   * Esta función se ejecuta cada vez que se renderiza el componente,
   * por lo que los días se actualizan automáticamente según avanza el tiempo
   */
  const formatearFechaVencimiento = (fecha) => {
    if (!fecha) return 'Sin vencimiento'
    
    const fechaVencimiento = new Date(fecha)
    const ahora = new Date()
    const diasRestantes = Math.ceil((fechaVencimiento - ahora) / (1000 * 60 * 60 * 24))
    
    if (diasRestantes < 0) {
      return <span className="text-red-600 font-semibold">Vencida ({Math.abs(diasRestantes)} días)</span>
    } else if (diasRestantes <= 30) {
      return <span className="text-yellow-600 font-semibold">Vence en {diasRestantes} días</span>
    } else {
      return <span className="text-gray-600">{fechaVencimiento.toLocaleDateString('es-ES')}</span>
    }
  }



  /**
   * =========================================
   * RENDERIZADO PRINCIPAL
   * =========================================
   */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-2 text-blue-600"
        >
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando deudas...</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Deudas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra tus pasivos y mejora tu patrimonio neto
          </p>
        </div>

        <button
          onClick={() => handleAbrirModalDeuda()}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Deuda
        </button>
      </motion.div>

      {/* Resumen de Deudas - OPTIMIZADO PARA MÓVIL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Total de Deudas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-danger-50/20 dark:to-danger-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative flex items-center">
            <div className="p-2 sm:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 text-danger-600 bg-danger-100 dark:text-danger-400 dark:bg-danger-900/30 shadow-sm group-hover:shadow-md">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-3" />
            </div>
            
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide">
                TOTAL DEUDAS
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-danger-600 dark:text-danger-400 truncate transition-colors duration-300">
                {formatCurrency(resumenDeudas.totalDeudas, resumenDeudas.monedaPrincipal)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                En {resumenDeudas.monedaPrincipal}
              </p>
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <CreditCard className="h-4 w-4 text-danger-500" />
          </div>

          <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
        </motion.div>

        {/* Tasa de Interés Promedio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-50/20 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative flex items-center">
            <div className="p-2 sm:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30 shadow-sm group-hover:shadow-md">
              <Percent className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-3" />
            </div>
            
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide">
                TASA PROMEDIO
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-purple-600 dark:text-purple-400 truncate transition-colors duration-300">
                {resumenDeudas.tasaPromedio ? `${resumenDeudas.tasaPromedio.toFixed(2)}%` : '0.00%'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                Promedio ponderado
              </p>
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <Percent className="h-4 w-4 text-purple-500" />
          </div>

          <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
        </motion.div>

        {/* Cantidad de Deudas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="relative group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden sm:col-span-2 lg:col-span-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50/20 dark:to-gray-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative flex items-center">
            <div className="p-2 sm:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700 shadow-sm group-hover:shadow-md">
              <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-3" />
            </div>
            
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide">
                CANTIDAD DEUDAS
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-600 dark:text-gray-400 truncate transition-colors duration-300">
                {deudas.length}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                {deudas.length === 1 ? 'Deuda registrada' : 'Deudas registradas'}
              </p>
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <TrendingDown className="h-4 w-4 text-gray-500" />
          </div>

          <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
        </motion.div>
      </div>

      {/* Lista de Deudas - Diseño similar a Activos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mis Pasivos ({deudas.length})
          </h2>
        </div>

        {deudas.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No tienes deudas registradas
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              ¡Excelente! Mantén así tu patrimonio neto.
            </p>
            <button
              onClick={() => handleAbrirModalDeuda()}
              className="btn-primary mx-auto mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Deuda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deudas.map((deuda, index) => (
              <motion.div
                key={deuda.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="card p-6 hover:shadow-lg transition-shadow duration-200"
              >
                {/* Header con icono, nombre y acciones - similar a activos */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
                      <CreditCard className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {deuda.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {deuda.account_type_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAbrirModalDeuda(deuda)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 
                                 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Editar Deuda"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEliminarDeuda(deuda.id, deuda.name)}
                      className="p-1.5 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400 
                                 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Eliminar Deuda"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Saldo actual */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Saldo Actual
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(Math.abs(deuda.current_balance), deuda.currency)}
                  </p>
                </div>

                {/* Información adicional compacta */}
                <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                  {deuda.original_amount > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 dark:text-gray-500">Original:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {formatCurrency(deuda.original_amount, deuda.currency)}
                      </span>
                    </div>
                  )}
                  
                  {deuda.interest_rate > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 dark:text-gray-500">Interés:</span>
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {deuda.interest_rate}%
                      </span>
                    </div>
                  )}
                  
                  {deuda.due_date && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 dark:text-gray-500">Vence:</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {formatearFechaVencimiento(deuda.due_date)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Deuda */}
      <DeudaModal
        isOpen={deudaModal.isOpen}
        onClose={handleCerrarModalDeuda}
        onSave={handleGuardarDeuda}
        deuda={deudaModal.deuda}
        isLoading={deudaModal.isLoading}
      />


    </div>
  )
}

export default Deudas
