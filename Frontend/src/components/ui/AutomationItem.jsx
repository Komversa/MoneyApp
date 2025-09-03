import React from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  Pause, 
  Play, 
  Edit, 
  Trash2, 
  Repeat,
  Calendar,
  Clock,
  Building2,
  ArrowRight,
  DollarSign
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency, formatDate } from '../../utils/formatters'

/**
 * Componente de tarjeta para mostrar automatizaciones
 * Diseño mejorado con información detallada y controles intuitivos
 */
const AutomationItem = ({ 
  transaccion, 
  onToggle, 
  onEdit, 
  onDelete 
}) => {
  
  // Configuración de iconos y colores por tipo de transacción
  const getTransactionConfig = (type) => {
    const configs = {
      income: {
        icon: TrendingUp,
        iconColor: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        amountColor: 'text-green-700 dark:text-green-400',
        prefix: '+'
      },
      expense: {
        icon: TrendingDown,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        amountColor: 'text-red-700 dark:text-red-400',
        prefix: '-'
      },
      transfer: {
        icon: ArrowRightLeft,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        amountColor: 'text-blue-700 dark:text-blue-400',
        prefix: ''
      }
    }
    return configs[type] || configs.expense
  }

  const config = getTransactionConfig(transaccion.transaction_type)
  const IconComponent = config.icon

  // Obtener etiqueta de frecuencia con emoji
  const getFrequencyLabel = (frequency) => {
    const labels = {
      once: { text: 'Una sola vez', emoji: '🎯' },
      daily: { text: 'Diario', emoji: '📅' },
      weekly: { text: 'Semanal', emoji: '📆' },
      monthly: { text: 'Mensual', emoji: '🗓️' }
    }
    return labels[frequency] || labels.once
  }

  const frequencyData = getFrequencyLabel(transaccion.frequency)

  // Formatear próxima ejecución
  const formatNextExecution = (date) => {
    if (!date) return 'No programada'
    
    try {
      const nextDate = new Date(date)
      const now = new Date()
      
      // Verificar si es hoy
      const isToday = nextDate.toDateString() === now.toDateString()
      
      if (isToday) {
        return `Hoy a las ${format(nextDate, 'h:mm a', { locale: es })}`
      }
      
      // Verificar si es mañana
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const isTomorrow = nextDate.toDateString() === tomorrow.toDateString()
      
      if (isTomorrow) {
        return `Mañana a las ${format(nextDate, 'h:mm a', { locale: es })}`
      }
      
      // Formato completo para otras fechas
      return format(nextDate, 'dd/MM/yyyy, h:mm a', { locale: es })
    } catch (error) {
      return formatDate(date, 'datetime')
    }
  }

  // Renderizar flujo de cuentas
  const renderAccountFlow = () => {
    if (transaccion.transaction_type === 'expense' && transaccion.source_account_name) {
      return (
        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
          <Building2 className="h-3 w-3" />
          <span>Desde: {transaccion.source_account_name}</span>
        </div>
      )
    }
    
    if (transaccion.transaction_type === 'income' && transaccion.destination_account_name) {
      return (
        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
          <Building2 className="h-3 w-3" />
          <span>Hacia: {transaccion.destination_account_name}</span>
        </div>
      )
    }
    
    if (transaccion.transaction_type === 'transfer' && transaccion.source_account_name && transaccion.destination_account_name) {
      return (
        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
          <Building2 className="h-3 w-3" />
          <span>{transaccion.source_account_name}</span>
          <ArrowRight className="h-3 w-3" />
          <span>{transaccion.destination_account_name}</span>
        </div>
      )
    }
    
    return null
  }

  // Renderizar flujo de cuentas compacto para desktop
  const renderCompactAccountFlow = () => {
    if (!transaccion.source_account_name && !transaccion.destination_account_name) {
      return null
    }

    if (transaccion.transaction_type === 'transfer' && transaccion.source_account_name && transaccion.destination_account_name) {
      return (
        <>
          <span>{transaccion.source_account_name}</span>
          <ArrowRight className="h-3 w-3" />
          <span>{transaccion.destination_account_name}</span>
        </>
      )
    }

    if (transaccion.transaction_type === 'expense' && transaccion.source_account_name) {
      return <span>Desde: {transaccion.source_account_name}</span>
    }

    if (transaccion.transaction_type === 'income' && transaccion.destination_account_name) {
      return <span>Hacia: {transaccion.destination_account_name}</span>
    }

    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${config.borderColor} shadow-sm hover:shadow-md transition-all duration-200`}
    >
      {/* Contenido principal compacto */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Sección izquierda: Información principal */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Icono y descripción */}
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center border ${config.borderColor}`}>
                <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {transaccion.description}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    transaccion.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {transaccion.is_active ? '🟢 Activa' : '⏸️ Pausada'}
                  </span>
                  {transaccion.category_name && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      • {transaccion.category_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Información de programación en línea - Solo desktop */}
            <div className="hidden xl:flex items-center space-x-6 flex-1 min-w-0">
              {/* Frecuencia */}
              <div className="flex items-center space-x-2 min-w-0">
                <Repeat className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {frequencyData.emoji} {frequencyData.text}
                </span>
              </div>

              {/* Próxima ejecución */}
              <div className="flex items-center space-x-2 min-w-0">
                <Clock className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {formatNextExecution(transaccion.next_run_date)}
                </span>
              </div>

              {/* Flujo de cuentas compacto */}
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 min-w-0">
                {renderCompactAccountFlow()}
              </div>
            </div>
          </div>

          {/* Sección derecha: Monto y acciones */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Monto */}
            <div className="text-right">
              <div className={`text-xl font-bold ${config.amountColor}`}>
                {config.prefix}{formatCurrency(transaccion.amount, transaccion.currency_code)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {transaccion.currency_code}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onToggle(transaccion)}
                className={`p-2 rounded-lg transition-colors ${
                  transaccion.is_active 
                    ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
                    : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                }`}
                title={transaccion.is_active ? 'Pausar automatización' : 'Reanudar automatización'}
              >
                {transaccion.is_active ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={() => onEdit(transaccion)}
                className="p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                title="Editar automatización"
              >
                <Edit className="h-4 w-4" />
              </button>

              <button
                onClick={() => onDelete(transaccion)}
                className="p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Eliminar automatización"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Información adicional en móviles y tablets */}
        <div className="xl:hidden mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            {/* Frecuencia */}
            <div className="flex items-center space-x-2">
              <Repeat className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600 dark:text-gray-300">
                {frequencyData.text}
              </span>
            </div>

            {/* Próxima ejecución */}
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-gray-600 dark:text-gray-300 truncate">
                {formatNextExecution(transaccion.next_run_date)}
              </span>
            </div>
          </div>

          {/* Flujo de cuentas en móvil */}
          <div className="mb-3">
            {renderAccountFlow()}
          </div>
        </div>

        {/* Footer compacto */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Creada {formatDate(transaccion.created_at, 'short')}</span>
            {transaccion.end_date && (
              <span className="hidden sm:inline">• Termina {formatDate(transaccion.end_date, 'short')}</span>
            )}
            {!transaccion.end_date && transaccion.frequency !== 'once' && (
              <span className="text-amber-600 dark:text-amber-400 hidden sm:inline">• ♾️ Sin límite</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AutomationItem
