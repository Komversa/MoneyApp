import React from 'react'
import { motion } from 'framer-motion'

/**
 * Componentes de Skeleton Loading optimizados para evitar parpadeos
 * Proporcionan feedback visual inmediato mientras se cargan los datos
 */

// Skeleton base reutilizable
export const SkeletonBase = ({ className = '', animated = true, children }) => (
  <div className={`
    ${animated ? 'animate-pulse' : ''} 
    bg-gray-200 dark:bg-gray-700 rounded 
    ${className}
  `}>
    {children}
  </div>
)

// Skeleton con efecto shimmer
export const SkeletonShimmer = ({ className = '', height = 'h-4' }) => (
  <div className={`relative overflow-hidden rounded ${height} ${className}`}>
    <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700" />
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-gray-500/30 to-transparent" />
  </div>
)

// Skeleton para tarjetas de resumen del dashboard
export const SkeletonSummaryCard = ({ className = '' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className={`card p-4 sm:p-6 ${className}`}
  >
    <div className="flex items-center">
      {/* Icono skeleton */}
      <SkeletonBase className="p-2 sm:p-3 rounded-xl flex-shrink-0">
        <div className="h-5 w-5 sm:h-6 sm:w-6 bg-gray-300 dark:bg-gray-600 rounded" />
      </SkeletonBase>
      
      {/* Contenido skeleton */}
      <div className="ml-3 sm:ml-4 flex-1 space-y-2">
        <SkeletonShimmer height="h-3 sm:h-4" className="w-20 sm:w-24" />
        <SkeletonShimmer height="h-6 sm:h-8" className="w-24 sm:w-32" />
        <SkeletonShimmer height="h-2 sm:h-3" className="w-16 sm:w-20" />
      </div>
    </div>
  </motion.div>
)

// Skeleton para lista de transacciones
export const SkeletonTransactionList = ({ count = 5, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: count }, (_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className="card p-4"
      >
        <div className="flex items-center gap-3">
          {/* Icono skeleton */}
          <SkeletonBase className="p-2 rounded-lg flex-shrink-0">
            <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded" />
          </SkeletonBase>
          
          {/* Contenido principal */}
          <div className="flex-1 space-y-2">
            <SkeletonShimmer height="h-4" className="w-32 sm:w-40" />
            <div className="flex items-center gap-4">
              <SkeletonShimmer height="h-3" className="w-16 sm:w-20" />
              <SkeletonShimmer height="h-3" className="w-12 sm:w-16" />
            </div>
          </div>
          
          {/* Monto skeleton */}
          <div className="text-right space-y-1">
            <SkeletonShimmer height="h-5" className="w-16 sm:w-20" />
            <SkeletonShimmer height="h-3" className="w-12 sm:w-16" />
          </div>
        </div>
      </motion.div>
    ))}
  </div>
)

// Skeleton para gráfico de gastos
export const SkeletonChart = ({ className = '' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, delay: 0.2 }}
    className={`card ${className}`}
  >
    {/* Header */}
    <div className="card-header">
      <div className="flex items-center gap-3">
        <SkeletonBase className="p-2 rounded-lg">
          <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded" />
        </SkeletonBase>
        <div className="space-y-1">
          <SkeletonShimmer height="h-4" className="w-32" />
          <SkeletonShimmer height="h-3" className="w-24" />
        </div>
      </div>
    </div>
    
    {/* Contenido del gráfico */}
    <div className="card-body flex items-center justify-center">
      <div className="relative">
        {/* Círculo principal del gráfico */}
        <SkeletonBase 
          className="w-48 h-48 sm:w-56 sm:h-56 rounded-full" 
          animated={false}
        >
          <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-full" />
        </SkeletonBase>
        
        {/* Efecto de loading rotativo */}
        <div className="absolute inset-0 animate-spin">
          <div className="w-full h-full border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full" />
        </div>
      </div>
    </div>
    
    {/* Leyenda skeleton */}
    <div className="card-body border-t border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-2">
            <SkeletonBase className="w-3 h-3 rounded-full" />
            <SkeletonShimmer height="h-3" className="flex-1" />
          </div>
        ))}
      </div>
    </div>
  </motion.div>
)

// Skeleton para página completa
export const SkeletonPageLayout = ({ 
  showSummaryCards = true, 
  summaryCardsCount = 4,
  showTransactions = true,
  showChart = true,
  className = '' 
}) => (
  <div className={`space-y-6 ${className}`}>
    {/* Header skeleton */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <SkeletonShimmer height="h-8" className="w-32 sm:w-40" />
        <SkeletonShimmer height="h-4" className="w-48 sm:w-64" />
      </div>
      <SkeletonBase className="w-32 h-10 rounded-lg" />
    </div>

    {/* Tarjetas de resumen */}
    {showSummaryCards && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: summaryCardsCount }, (_, index) => (
          <SkeletonSummaryCard key={index} />
        ))}
      </div>
    )}

    {/* Contenido principal */}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Transacciones skeleton */}
      {showTransactions && (
        <div className="order-2 xl:order-1">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <SkeletonBase className="p-2 rounded-lg">
                  <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded" />
                </SkeletonBase>
                <div className="space-y-1">
                  <SkeletonShimmer height="h-4" className="w-36" />
                  <SkeletonShimmer height="h-3" className="w-28" />
                </div>
              </div>
            </div>
            <div className="card-body">
              <SkeletonTransactionList count={3} />
            </div>
          </div>
        </div>
      )}

      {/* Gráfico skeleton */}
      {showChart && (
        <div className="order-1 xl:order-2">
          <SkeletonChart />
        </div>
      )}
    </div>
  </div>
)

export default {
  SkeletonBase,
  SkeletonShimmer,
  SkeletonSummaryCard,
  SkeletonTransactionList,
  SkeletonChart,
  SkeletonPageLayout
}

