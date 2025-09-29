import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { 
  obtenerDashboardCompletoAPI,
  procesarDatosDashboard
} from '../api/dashboard.api'
import useAuthStore from '../store/useAuthStore'
import { useToast } from '../components/ui/Toaster'

/**
 * Hook personalizado REFACTORIZADO para Dashboard Fase 1 NIO-USD
 * 
 * ARQUITECTURA SIMPLIFICADA Y ESTABLE:
 * - El backend ya devuelve todos los datos convertidos a la moneda principal
 * - Este hook solo maneja el estado y rendering, SIN cálculos de conversión
 * - Reactivo a cambios de moneda principal del usuario
 * - PREVENCIÓN COMPLETA de múltiples llamadas y ciclos infinitos
 */
const useDashboard = () => {
  const { obtenerConfiguracionUsuario } = useAuthStore()
  const { error: showError } = useToast()
  
  // REFS para controlar el estado de manera estable
  const isLoadingRef = useRef(false)
  const lastCallTimeRef = useRef(0)
  const monedaPrincipalRef = useRef(null)
  const isInitialLoadRef = useRef(true)
  
  // Obtener moneda principal del usuario para reactividad - MEMOIZADO
  const configuracionUsuario = useMemo(() => obtenerConfiguracionUsuario(), [obtenerConfiguracionUsuario])
  const monedaPrincipal = useMemo(() => configuracionUsuario.primary_currency, [configuracionUsuario.primary_currency])

  // Estados principales - SIMPLIFICADOS
  const [dashboardData, setDashboardData] = useState({
    resumen: null,
    ultimasTransacciones: [],
    estadisticasMensuales: null,
    graficoGastos: null
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [error, setError] = useState(null)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)

  /**
   * =========================================
   * FUNCIONES DE CARGA - ESTABLES Y SEGURAS
   * =========================================
   */

  /**
   * Cargar todos los datos del dashboard - CON PREVENCIÓN COMPLETA
   */
  const cargarDashboard = useCallback(async (force = false) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTimeRef.current
    
    // PREVENCIÓN 1: Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current && !force) {
      console.log('🚫 Llamada al dashboard cancelada - ya hay una en progreso');
      return;
    }
    
    // PREVENCIÓN 2: Rate limiting - mínimo 2 segundos entre llamadas
    if (timeSinceLastCall < 2000 && !force) {
      console.log(`⏳ Llamada cancelada - muy reciente (${timeSinceLastCall}ms < 2000ms)`);
      return;
    }
    
    // PREVENCIÓN 3: Verificar si la moneda cambió realmente
    if (monedaPrincipalRef.current === monedaPrincipal && !force && !isInitialLoadRef.current) {
      console.log('🔄 Moneda no cambió realmente, cancelando llamada');
      return;
    }
    
    console.log(`\n🎯 === CARGA DASHBOARD FRONTEND ===`);
    console.log(`💰 Moneda principal actual: ${monedaPrincipal}`);
    console.log(`⏰ Tiempo desde última llamada: ${timeSinceLastCall}ms`);
    console.log(`🔧 Forzada: ${force}`);
    
    // Actualizar referencias
    isLoadingRef.current = true;
    lastCallTimeRef.current = now;
    monedaPrincipalRef.current = monedaPrincipal;
    
    setError(null)

    try {
      const response = await obtenerDashboardCompletoAPI()
      
      if (response.success) {
        const datosFormateados = procesarDatosDashboard(response.data)
        setDashboardData(datosFormateados)
        setUltimaActualizacion(new Date())
        setShowContent(true)
        setIsLoading(false)
        setIsInitialLoad(false)
        isInitialLoadRef.current = false;
      } else {
        throw new Error(response.message || 'Error al cargar dashboard')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar el dashboard'
      setError(errorMessage)
      showError(errorMessage)
      setIsLoading(false)
      setShowContent(true)
      if (import.meta.env.DEV) console.error('❌ Error cargando dashboard:', error)
    } finally {
      isLoadingRef.current = false;
    }
  }, [monedaPrincipal, showError])

  /**
   * Recargar dashboard (para uso manual)
   */
  const recargarDashboard = useCallback(() => {
    console.log('🔄 Recarga manual solicitada');
    cargarDashboard(true);
  }, [cargarDashboard])

  /**
   * =========================================
   * DATOS COMPUTADOS - MEMOIZADOS
   * =========================================
   */

  // Resumen financiero
  const resumenFinanciero = useMemo(() => dashboardData.resumen || {}, [dashboardData.resumen])
  
  // Calcular balance del mes (ingresos - gastos)
  const estadisticasMes = useMemo(() => dashboardData.estadisticasMensuales || {}, [dashboardData.estadisticasMensuales])
  const ingresosMes = useMemo(() => estadisticasMes.totalIngresosConvertido || estadisticasMes.totalIngresos || 0, [estadisticasMes])
  const gastosMes = useMemo(() => estadisticasMes.totalGastosConvertido || estadisticasMes.totalGastos || 0, [estadisticasMes])
  const balanceMes = useMemo(() => parseFloat(ingresosMes) - parseFloat(gastosMes), [ingresosMes, gastosMes])

  // Datos para tarjetas de resumen - MEMOIZADO para evitar re-renders
  const tarjetasResumen = useMemo(() => ({
    saldoTotal: {
      titulo: 'Patrimonio Neto',
      valor: resumenFinanciero.patrimonioNeto || resumenFinanciero.saldoTotalConvertido || resumenFinanciero.saldoTotal || 0,
      subtitulo: 'Activos - Pasivos',
      tipo: 'saldo',
      tendencia: balanceMes > 0 ? 'positiva' : balanceMes < 0 ? 'negativa' : 'neutral'
    },
    ingresosMes: {
      titulo: 'Ingresos (Mes)',
      valor: ingresosMes,
      subtitulo: 'Este mes',
      tipo: 'ingreso',
      tendencia: 'positiva'
    },
    gastosMes: {
      titulo: 'Gastos (Mes)',
      valor: gastosMes,
      subtitulo: 'Este mes',
      tipo: 'gasto',
      tendencia: 'negativa'
    },
    balanceMes: {
      titulo: 'Balance (Mes)',
      valor: balanceMes,
      subtitulo: 'Ingresos - Gastos',
      tipo: 'balance',
      tendencia: balanceMes > 0 ? 'positiva' : balanceMes < 0 ? 'negativa' : 'neutral'
    }
  }), [resumenFinanciero, balanceMes, ingresosMes, gastosMes])

  // Últimas transacciones formateadas - MEMOIZADO
  const ultimasTransacciones = useMemo(() => 
    (dashboardData.ultimasTransacciones || []).slice(0, 7),
    [dashboardData.ultimasTransacciones]
  )

  // Datos del gráfico de gastos - MEMOIZADO
  const datosGrafico = useMemo(() => 
    dashboardData.graficoGastos || null,
    [dashboardData.graficoGastos]
  )

  // Verificar si hay datos suficientes - MEMOIZADO
  const hayDatos = useMemo(() => 
    ultimasTransacciones.length > 0 || Object.keys(resumenFinanciero).length > 0,
    [ultimasTransacciones, resumenFinanciero]
  )

  // Estados de carga optimizados con control de visibilidad
  const estadosCarga = useMemo(() => ({
    resumen: isLoading || !showContent,
    transacciones: isLoading || !showContent,
    grafico: isLoading || !showContent,
    general: isLoading,
    initial: isInitialLoad,
    showContent: showContent
  }), [isLoading, isInitialLoad, showContent])

  /**
   * =========================================
   * UTILIDADES
   * =========================================
   */

  /**
   * Obtener color para tipo de transacción
   */
  const obtenerColorTransaccion = useCallback((tipo) => {
    const colores = {
      income: 'text-success-600',
      expense: 'text-danger-600',
      transfer: 'text-blue-600'
    }
    return colores[tipo] || 'text-gray-600'
  }, [])

  /**
   * Obtener icono para tipo de transacción
   */
  const obtenerIconoTransaccion = useCallback((tipo) => {
    const iconos = {
      income: 'TrendingUp',
      expense: 'TrendingDown',
      transfer: 'ArrowLeftRight'
    }
    return iconos[tipo] || 'Circle'
  }, [])

  /**
   * Verificar si necesita actualización (datos más antiguos de 5 minutos)
   */
  const necesitaActualizacion = useCallback(() => {
    if (!ultimaActualizacion) return true
    
    const ahora = new Date()
    const tiempoTranscurrido = ahora - ultimaActualizacion
    const cincoMinutos = 5 * 60 * 1000 // 5 minutos en milisegundos
    
    return tiempoTranscurrido > cincoMinutos
  }, [ultimaActualizacion])

  /**
   * =========================================
   * EFECTOS - OPTIMIZADOS Y SEGUROS
   * =========================================
   */

  // Cargar datos al montar el componente - SOLO UNA VEZ
  useEffect(() => {
    console.log('🚀 Componente Dashboard montado - carga inicial');
    cargarDashboard();
    
    // Cleanup al desmontar
    return () => {
      console.log('🧹 Componente Dashboard desmontado - cleanup');
      isLoadingRef.current = false;
    }
  }, []) // Solo se ejecuta al montar

  // REACTIVIDAD: Recargar cuando cambie la moneda principal - CON PREVENCIÓN COMPLETA
  useEffect(() => {
    // Solo ejecutar si no es la primera carga y la moneda cambió realmente
    if (!isInitialLoadRef.current && monedaPrincipal && monedaPrincipal !== monedaPrincipalRef.current) {
      console.log(`🔄 Moneda principal cambió de ${monedaPrincipalRef.current} a ${monedaPrincipal}`);
      
      // Programar recarga con delay para evitar múltiples llamadas
      const timer = setTimeout(() => {
        console.log('⏰ Ejecutando recarga programada por cambio de moneda');
        cargarDashboard();
      }, 1000); // 1 segundo de delay
      
      return () => {
        clearTimeout(timer);
        console.log('⏰ Timer de cambio de moneda cancelado');
      }
    }
  }, [monedaPrincipal, cargarDashboard])

  // Auto-refresh cada 5 minutos si la página está visible - OPTIMIZADO
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && necesitaActualizacion()) {
        console.log('⏰ Auto-refresh programado - datos antiguos detectados');
        cargarDashboard();
      }
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(interval)
  }, [necesitaActualizacion, cargarDashboard])

  return {
    // Estados principales
    dashboardData,
    isLoading,
    isInitialLoad,
    showContent,
    error,
    ultimaActualizacion,

    // Datos computados (YA CONVERTIDOS por el backend)
    tarjetasResumen,
    ultimasTransacciones,
    datosGrafico,
    resumenFinanciero,
    estadisticasMes,
    balanceMes,

    // Estados de carga simplificados
    estadosCarga,

    // Configuración de usuario
    configuracionUsuario,
    monedaPrincipal, // Moneda principal para componentes

    // Banderas
    hayDatos,
    necesitaActualizacion: necesitaActualizacion(),

    // Funciones
    cargarDashboard,
    recargarDashboard,

    // Utilidades
    obtenerColorTransaccion,
    obtenerIconoTransaccion
  }
}

export default useDashboard