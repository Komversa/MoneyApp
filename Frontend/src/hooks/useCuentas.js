import { useState, useEffect } from 'react'
import { 
  obtenerCuentasAPI, 
  obtenerCuentaPorIdAPI,
  crearCuentaAPI, 
  actualizarCuentaAPI, 
  eliminarCuentaAPI,
  obtenerResumenFinancieroAPI,
  obtenerPanelPatrimonioAPI,
  validarCuenta,
  formatearDatosCuenta
} from '../api/accounts.api'
import { useToast } from '../components/ui/Toaster'

/**
 * Hook personalizado para manejar la lógica de cuentas
 * Encapsula toda la lógica de estado y operaciones CRUD
 */
const useCuentas = () => {
  const { success, error: showError } = useToast()

  // Estados principales
  const [cuentas, setCuentas] = useState([])
  const [cuentasActivos, setCuentasActivos] = useState([])
  const [cuentasPasivos, setCuentasPasivos] = useState([])
  const [resumenFinanciero, setResumenFinanciero] = useState(null)
  const [panelPatrimonio, setPanelPatrimonio] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * =========================================
   * FUNCIONES DE CARGA
   * =========================================
   */

  /**
   * Cargar todas las cuentas del usuario
   */
  const cargarCuentas = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await obtenerCuentasAPI()
      if (response.success) {
        const todasLasCuentas = response.data.accounts || []
        setCuentas(todasLasCuentas)
        
        // Separar cuentas por categoría
        const activos = todasLasCuentas.filter(cuenta => cuenta.account_category === 'asset')
        const pasivos = todasLasCuentas.filter(cuenta => cuenta.account_category === 'liability')
        
        setCuentasActivos(activos)
        setCuentasPasivos(pasivos)
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar cuentas'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Cargar cuentas por categoría específica
   */
  const cargarCuentasPorCategoria = async (categoria) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await obtenerCuentasAPI(categoria)
      if (response.success) {
        const cuentasCategoria = response.data.accounts || []
        
        if (categoria === 'asset') {
          setCuentasActivos(cuentasCategoria)
        } else if (categoria === 'liability') {
          setCuentasPasivos(cuentasCategoria)
        }
        
        return cuentasCategoria
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar cuentas'
      setError(errorMessage)
      showError(errorMessage)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Cargar resumen financiero
   */
  const cargarResumenFinanciero = async () => {
    try {
      const response = await obtenerResumenFinancieroAPI()
      if (response.success) {
        setResumenFinanciero(response.data.resumen)
      }
    } catch (error) {
      console.warn('Error al cargar resumen financiero:', error)
    }
  }

  /**
   * Cargar panel de patrimonio avanzado
   */
  const cargarPanelPatrimonio = async () => {
    try {
      console.log('📊 [Frontend] Cargando panel de patrimonio...')
      const response = await obtenerPanelPatrimonioAPI()
      if (response.success) {
        console.log('✅ [Frontend] Panel de patrimonio cargado:', response.data.patrimonio)
        setPanelPatrimonio(response.data.patrimonio)
      }
    } catch (error) {
      console.warn('❌ [Frontend] Error al cargar panel de patrimonio:', error)
    }
  }

  /**
   * Obtener una cuenta específica por ID
   */
  const obtenerCuentaPorId = async (id) => {
    try {
      const response = await obtenerCuentaPorIdAPI(id)
      if (response.success) {
        return response.data.account
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al obtener cuenta'
      showError(errorMessage)
      return null
    }
  }

  /**
   * =========================================
   * FUNCIONES CRUD
   * =========================================
   */

  /**
   * Crear una nueva cuenta
   */
  const crearCuenta = async (datosCuenta) => {
    // Validar datos
    const validation = validarCuenta(datosCuenta)
    if (!validation.isValid) {
      showError(Object.values(validation.errors)[0])
      return { success: false, errors: validation.errors }
    }

    try {
      const datosFormateados = formatearDatosCuenta(datosCuenta)
      const response = await crearCuentaAPI(datosFormateados)
      
      if (response.success) {
        // Actualizar estado local
        setCuentas(prev => [...prev, response.data.account])
        success('Cuenta creada exitosamente')
        
        // Recargar resumen financiero y panel de patrimonio
        cargarResumenFinanciero()
        cargarPanelPatrimonio()
        
        return { success: true, data: response.data.account }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear cuenta'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Actualizar una cuenta existente
   */
  const actualizarCuenta = async (id, datosActualizacion) => {
    // Validar datos
    const validation = validarCuenta(datosActualizacion)
    if (!validation.isValid) {
      showError(Object.values(validation.errors)[0])
      return { success: false, errors: validation.errors }
    }

    try {
      const datosFormateados = formatearDatosCuenta(datosActualizacion)
      const response = await actualizarCuentaAPI(id, datosFormateados)
      
      if (response.success) {
        // Actualizar estado local
        setCuentas(prev => 
          prev.map(cuenta => 
            cuenta.id === id ? response.data.account : cuenta
          )
        )
        success('Cuenta actualizada exitosamente')
        
        // Recargar resumen financiero y panel de patrimonio
        cargarResumenFinanciero()
        cargarPanelPatrimonio()
        
        return { success: true, data: response.data.account }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar cuenta'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Eliminar una cuenta
   */
  const eliminarCuenta = async (id) => {
    try {
      const response = await eliminarCuentaAPI(id)
      
      if (response.success) {
        // Actualizar estado local
        setCuentas(prev => prev.filter(cuenta => cuenta.id !== id))
        success('Cuenta eliminada exitosamente')
        
        // Recargar resumen financiero y panel de patrimonio
        cargarResumenFinanciero()
        cargarPanelPatrimonio()
        
        return { success: true }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar cuenta'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * =========================================
   * FUNCIONES DE UTILIDAD
   * =========================================
   */

  /**
   * Recargar todas las cuentas
   */
  const recargarCuentas = () => {
    cargarCuentas()
    cargarResumenFinanciero()
    cargarPanelPatrimonio()
  }

  /**
   * Buscar cuentas por nombre
   */
  const buscarCuentas = (termino) => {
    if (!termino) return cuentas
    
    return cuentas.filter(cuenta => 
      cuenta.name.toLowerCase().includes(termino.toLowerCase()) ||
      cuenta.account_type_name?.toLowerCase().includes(termino.toLowerCase())
    )
  }

  /**
   * Filtrar cuentas por moneda
   */
  const filtrarCuentasPorMoneda = (moneda) => {
    if (!moneda) return cuentas
    return cuentas.filter(cuenta => cuenta.currency === moneda)
  }

  /**
   * Obtener cuenta por ID desde el estado local
   */
  const obtenerCuentaLocal = (id) => {
    return cuentas.find(cuenta => cuenta.id === parseInt(id))
  }

  /**
   * =========================================
   * DATOS COMPUTADOS
   * =========================================
   */

  // Separar cuentas por moneda
  const cuentasNIO = cuentas.filter(cuenta => cuenta.currency === 'NIO')
  const cuentasUSD = cuentas.filter(cuenta => cuenta.currency === 'USD')

  // Calcular totales por moneda
  const totalNIO = cuentasNIO.reduce((sum, cuenta) => sum + parseFloat(cuenta.current_balance || 0), 0)
  const totalUSD = cuentasUSD.reduce((sum, cuenta) => sum + parseFloat(cuenta.current_balance || 0), 0)

  // Estadísticas básicas
  const estadisticas = {
    totalCuentas: cuentas.length,
    cuentasNIO: cuentasNIO.length,
    cuentasUSD: cuentasUSD.length,
    totalNIO,
    totalUSD,
    cuentaConMayorSaldo: cuentas.reduce((max, cuenta) => 
      parseFloat(cuenta.current_balance) > parseFloat(max?.current_balance || 0) ? cuenta : max, 
      null
    )
  }

  /**
   * =========================================
   * EFECTOS
   * =========================================
   */

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarCuentas()
    cargarResumenFinanciero()
    cargarPanelPatrimonio()
  }, [])

  return {
    // Estados principales
    cuentas,
    cuentasActivos,
    cuentasPasivos,
    resumenFinanciero,
    panelPatrimonio,
    isLoading,
    error,

    // Datos computados
    cuentasNIO,
    cuentasUSD,
    totalNIO,
    totalUSD,
    estadisticas,

    // Funciones de carga
    cargarCuentas,
    cargarCuentasPorCategoria,
    cargarResumenFinanciero,
    cargarPanelPatrimonio,
    recargarCuentas,
    obtenerCuentaPorId,

    // Funciones CRUD
    crearCuenta,
    actualizarCuenta,
    eliminarCuenta,

    // Funciones de utilidad
    buscarCuentas,
    filtrarCuentasPorMoneda,
    obtenerCuentaLocal
  }
}

export default useCuentas