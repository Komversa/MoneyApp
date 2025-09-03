import React, { useEffect, useState } from 'react'
import { formatCurrency } from '../../utils/formatters'
import { motion } from 'framer-motion'

/**
 * Componente reutilizable para mostrar barras de progreso con valores y porcentajes
 * Diseñado específicamente para visualizaciones financieras del Panel de Patrimonio
 */
const ProgressBar = ({ 
  label, 
  value, 
  currency, 
  percentage, 
  color = 'primary',
  showPercentage = true,
  showValue = true,
  size = 'default' 
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)
  
  // Configuraciones de colores
  const colorClasses = {
    primary: {
      bg: 'bg-blue-500',
      bgLight: 'bg-gray-200 dark:bg-gray-700',
      text: 'text-gray-800 dark:text-white',
      hover: 'hover:bg-blue-600'
    },
    success: {
      bg: 'bg-green-500',
      bgLight: 'bg-gray-200 dark:bg-gray-700',
      text: 'text-gray-800 dark:text-white',
      hover: 'hover:bg-green-600'
    },
    blue: {
      bg: 'bg-blue-500',
      bgLight: 'bg-gray-200 dark:bg-gray-700',
      text: 'text-gray-800 dark:text-white',
      hover: 'hover:bg-blue-600'
    },
    indigo: {
      bg: 'bg-purple-500',
      bgLight: 'bg-gray-200 dark:bg-gray-700',
      text: 'text-gray-800 dark:text-white',
      hover: 'hover:bg-purple-600'
    },
    purple: {
      bg: 'bg-purple-500',
      bgLight: 'bg-gray-200 dark:bg-gray-700',
      text: 'text-gray-800 dark:text-white',
      hover: 'hover:bg-purple-600'
    },
    pink: {
      bg: 'bg-pink-500',
      bgLight: 'bg-gray-200 dark:bg-gray-700',
      text: 'text-gray-800 dark:text-white',
      hover: 'hover:bg-pink-600'
    },
    yellow: {
      bg: 'bg-orange-500',
      bgLight: 'bg-gray-200 dark:bg-gray-700',
      text: 'text-gray-800 dark:text-white',
      hover: 'hover:bg-orange-600'
    },
    orange: {
      bg: 'bg-orange-500',
      bgLight: 'bg-gray-200 dark:bg-gray-700',
      text: 'text-gray-800 dark:text-white',
      hover: 'hover:bg-orange-600'
    }
  }

  // Configuraciones de tamaño
  const sizeClasses = {
    small: {
      container: 'py-2',
      bar: 'h-3',
      text: 'text-sm',
      spacing: 'space-y-2'
    },
    default: {
      container: 'py-3',
      bar: 'h-3.5',
      text: 'text-base',
      spacing: 'space-y-2'
    },
    large: {
      container: 'py-4',
      bar: 'h-4',
      text: 'text-lg',
      spacing: 'space-y-3'
    }
  }

  const colors = colorClasses[color] || colorClasses.primary
  const sizes = sizeClasses[size] || sizeClasses.default

  // Formatear el valor para mostrar
  const formattedValue = showValue && value !== undefined && value !== null
    ? formatCurrency(value, currency)
    : null

  // Asegurar que el porcentaje esté entre 0 y 100
  const safePercentage = Math.max(0, Math.min(100, percentage || 0))

  // Animación de la barra de progreso
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(safePercentage)
    }, 100)
    return () => clearTimeout(timer)
  }, [safePercentage])

  return (
    <div className={`${sizes.container} group hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg px-3 transition-all duration-300`}>
      <div className="space-y-2">
        {/* Header con Label, Valor y Porcentaje */}
        <div className="flex items-center justify-between">
          {/* Label - Izquierda */}
          <span className={`font-bold ${colors.text} ${sizes.text} transition-colors duration-200 flex-shrink-0`}>
            {label}
          </span>
          
          {/* Valor y Porcentaje - Derecha */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {formattedValue && (
              <span className={`font-bold ${colors.text} ${sizes.text} transition-colors duration-200`}>
                {formattedValue}
              </span>
            )}
            {showPercentage && (
              <span className={`font-bold ${colors.bg} text-white px-2 py-0.5 rounded-full text-xs transition-all duration-200`}>
                {safePercentage.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        
        {/* Barra de progreso - Abajo */}
        <div className={`w-full ${colors.bgLight} rounded-full ${sizes.bar} overflow-hidden shadow-inner transition-all duration-300 group-hover:shadow-md`}>
          <div
            className={`${colors.bg} ${sizes.bar} rounded-full transition-all duration-1000 ease-out shadow-sm`}
            style={{ 
              width: `${animatedPercentage}%`,
              transform: 'translateX(0)',
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-out'
            }}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Componente especializado para distribuciones financieras
 * Incluye colores automáticos y formateo optimizado
 */
export const FinancialProgressBar = ({ 
  items, 
  totalValue, 
  currency, 
  title,
  emptyMessage = "No hay datos para mostrar"
}) => {
  
  // Colores predefinidos para diferentes items
  const predefinedColors = [
    'blue', 'success', 'purple', 'orange', 'pink'
  ]

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <p className="text-gray-500 dark:text-gray-400 text-sm">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {title && (
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">
          {title}
        </h4>
      )}
      
      {items.map((item, index) => {
        const percentage = totalValue > 0 ? (item.totalConverted / totalValue) * 100 : 0
        const colorIndex = index % predefinedColors.length
        
        return (
          <motion.div
            key={item.type || item.currency_code || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.1,
              ease: "easeOut"
            }}
          >
            <ProgressBar
              label={item.type || item.currency_code}
              value={item.totalConverted}
              currency={currency}
              percentage={percentage}
              color={predefinedColors[colorIndex]}
              size="small"
            />
          </motion.div>
        )
      })}
    </div>
  )
}

export default ProgressBar
