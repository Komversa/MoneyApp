import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Calendar,
  ArrowRightLeft,
  Loader2,
  ChevronDown,
  ArrowRight,
  Plus,
  PieChart,
  List
} from 'lucide-react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import useDashboard from '../hooks/useDashboard'
import { formatCurrency, formatDate, formatDateRelative, getTransactionCurrency } from '../utils/formatters'
import { TRANSACTION_TYPE_LABELS } from '../utils/constants'
import { 
  SkeletonPageLayout, 
  SkeletonSummaryCard, 
  SkeletonTransactionList, 
  SkeletonChart
} from '../components/ui/SkeletonLoading'

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend)

/**
 * Página principal del Dashboard
 * Replica el diseño de la captura de pantalla
 */
const Dashboard = () => {
  const {
    tarjetasResumen,
    ultimasTransacciones,
    datosGrafico,
    isLoading,
    isInitialLoad,
    showContent,
    error,
    ultimaActualizacion,
    hayDatos,
    recargarDashboard,
    obtenerColorTransaccion,
    monedaPrincipal,
    estadosCarga
  } = useDashboard()

  // Hook para detectar si es móvil
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  /**
   * =========================================
   * COMPONENTES DE RENDERIZADO
   * =========================================
   */

  // Componente para tarjeta de resumen - OPTIMIZADA PARA RESPONSIVE Y SKELETON
  const TarjetaResumen = ({ datos, isLoading: cargando = false, monedaPrincipal = 'NIO', index = 0 }) => {
    const iconos = {
      saldo: DollarSign,
      ingreso: TrendingUp,
      gasto: TrendingDown,
      balance: Activity
    }

    const colores = {
      saldo: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
      ingreso: 'text-success-600 bg-success-100 dark:text-success-400 dark:bg-success-900/30',
      gasto: 'text-danger-600 bg-danger-100 dark:text-danger-400 dark:bg-danger-900/30',
      balance: datos.tendencia === 'positiva' ? 'text-success-600 bg-success-100 dark:text-success-400 dark:bg-success-900/30' : 
               datos.tendencia === 'negativa' ? 'text-danger-600 bg-danger-100 dark:text-danger-400 dark:bg-danger-900/30' : 
               'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700/30'
    }

    // Función para determinar el color del valor según el tipo y tendencia
    const getValueColor = () => {
      if (datos.tipo === 'balance') {
        // Para balance del mes, usar verde si es positivo, rojo si es negativo
        const valor = parseFloat(datos.valor) || 0
        return valor >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
      }
      // Para otros tipos, usar el color por defecto
      return 'text-gray-900 dark:text-white'
    }

    const Icon = iconos[datos.tipo] || DollarSign

    if (cargando) {
      return (
        <SkeletonSummaryCard />
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="relative group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
      >
        {/* Efecto de gradiente sutil en hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary-50/20 dark:to-primary-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative flex items-center">
          {/* Ícono - Mejorado con efectos */}
          <div className={`p-2 sm:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 ${colores[datos.tipo]} shadow-sm group-hover:shadow-md`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-3" />
          </div>
          
          {/* Contenido - Optimizado para móviles */}
          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide">
              {datos.titulo}
            </h3>
            <p className={`text-xl sm:text-2xl lg:text-3xl font-black ${getValueColor()} truncate transition-colors duration-300`}>
              {formatCurrency(datos.valor, monedaPrincipal)}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
              {datos.subtitulo}
            </p>
          </div>
        </div>

        {/* Indicador de tendencia para balance */}
        {datos.tipo === 'balance' && (
          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            {parseFloat(datos.valor) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-danger-500" />
            )}
          </div>
        )}

        {/* Ripple effect en tap/click */}
        <div className="absolute inset-0 bg-current opacity-0 active:opacity-5 transition-opacity duration-150 rounded-xl"></div>
      </motion.div>
    )
  }

  // Componente para item de transacción - OPTIMIZADO PARA MÓVILES
  const ItemTransaccion = ({ transaccion }) => {
    const tipoIconos = {
      income: TrendingUp,
      expense: TrendingDown,
      transfer: ArrowRightLeft
    }

    const Icon = tipoIconos[transaccion.type] || ArrowRightLeft
    const colorMonto = obtenerColorTransaccion(transaccion.type)
    
    // Determinar la moneda de la transacción
    const transactionCurrency = getTransactionCurrency(transaccion)

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-between py-3 px-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors active:scale-[0.98]"
      >
        <div className="flex items-center flex-1 min-w-0">
          {/* Ícono responsive */}
          <div className={`p-2 rounded-lg flex-shrink-0 ${
            transaccion.type === 'income' ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400' :
            transaccion.type === 'expense' ? 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400' :
            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
          }`}>
            <Icon className="h-4 w-4" />
          </div>
          
          {/* Información de transacción - Layout optimizado para móviles */}
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium heading-dark-contrast truncate">
              {transaccion.description || 'Sin descripción'}
            </p>
            
            {/* Información secundaria - Stack en móviles, inline en pantallas grandes */}
            <div className="flex flex-col sm:flex-row sm:items-center text-xs text-subtitle-contrast space-y-1 sm:space-y-0">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{formatDateRelative(transaccion.transaction_date)}</span>
              </div>
              
              {transaccion.category_name && (
                <>
                  <span className="hidden sm:inline mx-1">•</span>
                  <span className="truncate text-primary-600 dark:text-primary-400 font-medium">
                    {transaccion.category_name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Información monetaria - Mejorada para móviles */}
        <div className="text-right flex-shrink-0 ml-2">
          <p className={`text-sm sm:text-base font-semibold ${colorMonto} leading-tight`}>
            {transaccion.type === 'income' ? '+' : 
             transaccion.type === 'expense' ? '-' : ''}
            {formatCurrency(transaccion.converted_amount || transaccion.amount, transaccion.primary_currency || 'USD')}
          </p>
          
          {/* Monto original - Solo mostrar en pantallas más grandes si existe */}
          {transaccion.is_converted && (
            <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 mt-1">
              Original: {formatCurrency(transaccion.original_amount, transaccion.original_currency)}
            </p>
          )}
          
          <p className="text-xs text-subtitle-contrast leading-tight">
            {TRANSACTION_TYPE_LABELS[transaccion.type]}
          </p>
        </div>
      </motion.div>
    )
  }

  // Componente para gráfico de gastos rediseñado
  const GraficoGastos = ({ datos, isLoading: cargando = false, monedaPrincipal = 'NIO' }) => {
    const [mostrarLeyendas, setMostrarLeyendas] = useState(false)

    if (cargando) {
      return (
        <div className="flex items-center justify-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2 text-subtitle-contrast">Cargando gráfico...</span>
        </div>
      )
    }

    if (!datos || !datos.labels || datos.labels.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-80 text-subtitle-contrast">
          <TrendingDown className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium heading-dark-contrast mb-2">No hay gastos registrados</p>
          <p className="text-sm text-subtitle-contrast">Este mes no se han registrado gastos</p>
        </div>
      )
    }

    const chartData = {
      labels: datos.labels,
      datasets: datos.datasets
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Ocultamos la leyenda por defecto, usaremos nuestra propia
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: 'rgb(255, 255, 255)',
          bodyColor: 'rgb(229, 231, 235)',
          borderColor: 'rgb(75, 85, 99)',
          borderWidth: 1,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const label = context.label || ''
              const value = formatCurrency(context.parsed, monedaPrincipal)
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0
              return `${label}: ${value} (${percentage}%)`
            }
          }
        }
      },
      cutout: '65%',
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
        easing: 'easeOut'
      }
    }

    // Calcular total y porcentajes
    const totalGastos = datos.totalGastos || 0
    const categorias = datos.labels.map((label, index) => {
      const valor = datos.datasets[0].data[index]
      const porcentaje = totalGastos > 0 ? ((valor / totalGastos) * 100).toFixed(1) : 0
      const color = datos.datasets[0].backgroundColor[index]
      
      return {
        nombre: label,
        valor,
        porcentaje: parseFloat(porcentaje),
        color
      }
    }).sort((a, b) => b.porcentaje - a.porcentaje) // Ordenar por porcentaje descendente

    return (
      <div className="space-y-6">
        {/* Gráfico centrado */}
        <div className="flex justify-center">
          <div className="relative w-80 h-80">
            <Doughnut data={chartData} options={options} />
            
            {/* Centro del gráfico con total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-sm text-subtitle-contrast mb-1">Total Gastos</p>
                <p className="text-2xl font-bold heading-dark-contrast">
                  {formatCurrency(totalGastos, monedaPrincipal)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Carrusel de Leyendas */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                <TrendingDown className="h-4 w-4" />
              </div>
              <div className="ml-2">
                <h4 className="font-semibold heading-dark-contrast text-sm">Leyendas de Categorías</h4>
                <p className="text-xs text-subtitle-contrast">{categorias.length} categorías</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-subtitle-contrast">Desliza para ver más</span>
              <ArrowRight className="h-3 w-3 text-gray-400 animate-pulse" />
            </div>
          </div>

          {/* Contenedor del carrusel */}
          <div className="relative group">
            <div 
              className="overflow-x-auto scrollbar-hide scroll-smooth cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => {
                const container = e.currentTarget;
                let isDown = false;
                let startX = e.pageX - container.offsetLeft;
                let scrollLeft = container.scrollLeft;

                const handleMouseMove = (e) => {
                  if (!isDown) return;
                  e.preventDefault();
                  const x = e.pageX - container.offsetLeft;
                  const walk = (x - startX) * 2;
                  container.scrollLeft = scrollLeft - walk;
                };

                const handleMouseUp = () => {
                  isDown = false;
                  container.classList.remove('cursor-grabbing');
                  container.classList.add('cursor-grab');
                };

                const handleMouseLeave = () => {
                  isDown = false;
                  container.classList.remove('cursor-grabbing');
                  container.classList.add('cursor-grab');
                };

                isDown = true;
                container.classList.remove('cursor-grab');
                container.classList.add('cursor-grabbing');

                container.addEventListener('mousemove', handleMouseMove);
                container.addEventListener('mouseup', handleMouseUp);
                container.addEventListener('mouseleave', handleMouseLeave);
              }}
            >
              <div className="flex space-x-3 pb-1" style={{ width: `${categorias.length * 160}px`, minWidth: '100%' }}>
                {categorias.map((categoria, index) => (
                  <motion.div
                    key={categoria.nombre}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.06 }}
                    className="flex-shrink-0 w-40 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:shadow-lg transition-all duration-200 cursor-pointer group/card hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-600"
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* Header de la categoría */}
                    <div className="flex items-center mb-3">
                      <div 
                        className="w-3 h-3 rounded-full mr-2.5 flex-shrink-0 shadow-sm ring-2 ring-white dark:ring-gray-700"
                        style={{ backgroundColor: categoria.color }}
                      />
                      <span className="font-semibold text-gray-800 dark:text-white text-xs truncate group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors">
                        {categoria.nombre}
                      </span>
                    </div>

                    {/* Información de la categoría */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2.5 py-1.5">
                        <span className="text-xs text-subtitle-contrast font-medium">Monto</span>
                        <span className="text-xs font-bold text-gray-800 dark:text-white">
                          {formatCurrency(categoria.valor, monedaPrincipal)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-subtitle-contrast font-medium">Porcentaje</span>
                        <span 
                          className="text-xs font-bold px-2.5 py-1 rounded-full text-white shadow-sm"
                          style={{ backgroundColor: categoria.color }}
                        >
                          {categoria.porcentaje}%
                        </span>
                      </div>

                      {/* Barra de progreso visual mejorada */}
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-2.5 overflow-hidden">
                        <motion.div
                          className="h-2 rounded-full shadow-sm"
                          style={{ backgroundColor: categoria.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${categoria.porcentaje}%` }}
                          transition={{ duration: 0.8, delay: index * 0.08, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Si es la primera carga, mostrar skeleton completo
  if (isLoading && isInitialLoad) {
    return (
      <SkeletonPageLayout 
        summaryCardsCount={4}
        className="loading-fade-in"
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header - RESPONSIVE OPTIMIZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold heading-dark-contrast truncate">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-subtitle-contrast">
            Resumen de tu situación financiera
          </p>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
          {ultimaActualizacion && (
            <p className="text-xs sm:text-sm text-subtitle-contrast truncate">
              <span className="hidden sm:inline">Actualizado: </span>
              <span className="sm:hidden">Últ: </span>
              {formatDate(ultimaActualizacion, 'HH:mm')}
            </p>
          )}
          <button
            onClick={recargarDashboard}
            disabled={isLoading}
            className="btn-outline btn-sm flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 sm:mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-1">
              {isLoading ? 'Cargando...' : 'Actualizar'}
            </span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 px-4 py-3 rounded-lg">
          <p className="text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* 
        Tarjetas de resumen - DISEÑO MOBILE-FIRST RESPONSIVE
        - Móvil: 1 columna, tarjetas apiladas verticalmente
        - Tablet: 2 columnas en cuadrícula 2x2
        - Escritorio: 4 columnas horizontales
      */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 transition-all duration-300 ${showContent ? 'content-visible' : 'content-hidden'}`}>
        <TarjetaResumen datos={tarjetasResumen.saldoTotal} isLoading={estadosCarga.resumen} monedaPrincipal={monedaPrincipal} index={0} />
        <TarjetaResumen datos={tarjetasResumen.ingresosMes} isLoading={estadosCarga.resumen} monedaPrincipal={monedaPrincipal} index={1} />
        <TarjetaResumen datos={tarjetasResumen.gastosMes} isLoading={estadosCarga.resumen} monedaPrincipal={monedaPrincipal} index={2} />
        <TarjetaResumen datos={tarjetasResumen.balanceMes} isLoading={estadosCarga.resumen} monedaPrincipal={monedaPrincipal} index={3} />
      </div>

      {/* 
        Layout del contenido principal - REORGANIZADO PARA MÓVIL
        - Móvil: 1 columna, orden específico (GRÁFICO → TRANSACCIONES)
        - Tablet: 1 columna con mejor espaciado
        - Escritorio: 2 columnas lado a lado (transacciones | gráfico)
      */}
      <div className={`grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 transition-all duration-300 ${showContent ? 'content-visible content-slide-up' : 'content-hidden'}`}>
        {/* Gráfico de Gastos por Categoría - PRIORIDAD EN MÓVIL */}
        <div className="card order-1 xl:order-2">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                <TrendingDown className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold heading-dark-contrast">Gastos por Categoría</h3>
                <p className="text-xs sm:text-sm text-subtitle-contrast">Distribución del mes actual</p>
              </div>
            </div>
          </div>
          <div className="card-body p-3 sm:p-6">
            {estadosCarga.grafico ? (
              <SkeletonChart />
            ) : (
              <GraficoGastos datos={datosGrafico} isLoading={false} monedaPrincipal={monedaPrincipal} />
            )}
          </div>
        </div>

        {/* Últimas Transacciones - SEGUNDO EN MÓVIL */}
        <div className="card order-2 xl:order-1">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm">
                  <ArrowRightLeft className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold heading-dark-contrast">Últimas Transacciones</h3>
                  <p className="text-xs sm:text-sm text-subtitle-contrast">Movimientos más recientes</p>
                </div>
              </div>
              {/* Botón rápido para agregar transacción en móvil */}
              <button 
                onClick={() => window.location.href = '/transacciones?nuevo=true'}
                className="md:hidden p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="card-body p-3 sm:p-6">
            {estadosCarga.transacciones ? (
              <SkeletonTransactionList count={isMobile ? 3 : 5} />
            ) : ultimasTransacciones.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <ArrowRightLeft className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-subtitle-contrast text-sm mb-3">No hay transacciones registradas</p>
                <button 
                  onClick={() => window.location.href = '/transacciones?nuevo=true'}
                  className="btn-primary btn-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Crear Primera Transacción
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Mostrar solo 5 transacciones en móvil, todas en desktop */}
                {ultimasTransacciones.slice(0, isMobile ? 5 : ultimasTransacciones.length).map((transaccion) => (
                  <ItemTransaccion key={transaccion.id} transaccion={transaccion} />
                ))}
                
                {/* Botón para ver todas las transacciones - Solo en desktop */}
                {ultimasTransacciones.length > 5 && !isMobile && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button 
                      onClick={() => window.location.href = '/transacciones'}
                      className="w-full flex items-center justify-center space-x-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium py-3 px-4 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg transition-colors"
                    >
                      <span>Ver todas las transacciones</span>
                      <span className="bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 text-xs px-2 py-1 rounded-full">
                        +{ultimasTransacciones.length - 5}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                {/* Mensaje cuando hay exactamente 5 o menos transacciones - Solo en desktop */}
                {ultimasTransacciones.length <= 5 && ultimasTransacciones.length > 0 && !isMobile && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button 
                      onClick={() => window.location.href = '/transacciones'}
                      className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                    >
                      Ver historial completo →
                    </button>
                  </div>
                )}
                
                {/* Espaciado adicional en móvil para evitar que quede debajo de la navegación */}
                {isMobile && (
                  <div className="h-4"></div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estado vacío general */}
      {!isLoading && !hayDatos && (
        <div className="card p-12 text-center">
          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold heading-dark-contrast mb-2">
            ¡Bienvenido a MoneyApp!
          </h3>
          <p className="text-subtitle-contrast mb-4">
            Tu cuenta ya está preconfigurada con tipos de cuenta y categorías. 
            ¡Solo falta que crees tus primeras cuentas y comiences a registrar transacciones!
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">✨ Tu cuenta incluye:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-200">
              <div>
                <strong>Tipos de Cuenta:</strong>
                <ul className="list-disc list-inside ml-2 text-xs">
                  <li>Banco</li>
                  <li>Cuenta de Ahorros</li>
                  <li>Efectivo</li>
                  <li>Inversiones</li>
                  <li>Tarjeta de Crédito</li>
                </ul>
              </div>
              <div>
                <strong>Categorías:</strong>
                <ul className="list-disc list-inside ml-2 text-xs">
                  <li>6 categorías de ingresos</li>
                  <li>11 categorías de gastos</li>
                  <li>Listas para usar inmediatamente</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => window.location.href = '/cuentas'}
              className="btn-primary"
            >
              Crear Primera Cuenta
            </button>
            <button 
              onClick={() => window.location.href = '/configuracion'}
              className="btn-outline"
            >
              Ver Configuración
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default Dashboard