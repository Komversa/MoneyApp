import { useState, useEffect } from 'react'
import { 
  obtenerTransaccionesAPI, 
  obtenerTransaccionPorIdAPI,
  crearTransaccionAPI, 
  actualizarTransaccionAPI, 
  eliminarTransaccionAPI,
  obtenerEstadisticasAPI,
  obtenerResumenTransaccionesAPI,
  exportarTransaccionesAPI,
  validarTransaccion,
  formatearDatosTransaccion
} from '../api/transactions.api'
import { useToast } from '../components/ui/Toaster'
import { format } from 'date-fns'
import useResponsive from './useResponsive'

/**
 * Hook personalizado para manejar la lógica de transacciones
 * Encapsula toda la lógica de estado y operaciones CRUD
 */
const useTransacciones = () => {
  const { success, error: showError } = useToast()
  const { isMobile } = useResponsive()

  // Estados principales
  const [transacciones, setTransacciones] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [resumen, setResumen] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Determinar límite de paginación según dispositivo
  const getPageLimit = () => isMobile ? 10 : 20

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    startDate: null,
    endDate: null,
    type: null,
    accountId: null,
    categoryId: null,
    limit: getPageLimit(), // Ajuste dinámico según dispositivo
    offset: 0
  })

  // Estados para paginación manual (vista por defecto)
  const [allFetchedTransactions, setAllFetchedTransactions] = useState([])
  const [visibleTransactions, setVisibleTransactions] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCountFromServer, setTotalCountFromServer] = useState(0)
  const [isDefaultView, setIsDefaultView] = useState(true)

  // Efecto para actualizar la paginación cuando cambia el tamaño de pantalla
  useEffect(() => {
    const newLimit = getPageLimit()
    if (filtros.limit !== newLimit) {
      setFiltros(prev => ({ ...prev, limit: newLimit, offset: 0 }))
      // Recargar transacciones con el nuevo límite
      cargarTransacciones({ ...filtros, limit: newLimit, offset: 0 })
    }
  }, [isMobile])

  /**
   * =========================================
   * FUNCIONES DE CARGA
   * =========================================
   */

  /**
   * Cargar transacciones con filtros aplicados
   */
  const cargarTransacciones = async (filtrosPersonalizados = null) => {
    setIsLoading(true)
    setError(null)

    try {
      const filtrosAplicar = filtrosPersonalizados || filtros
      
      // Limpiar filtros vacíos
      const filtrosLimpios = Object.entries(filtrosAplicar).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          acc[key] = value
        }
        return acc
      }, {})

      const response = await obtenerTransaccionesAPI(filtrosLimpios)
      if (response.success) {
        const { transactions, totalItems } = response.data
        
        // Determinar si estamos en vista por defecto o filtrada
        // Ahora solo consideramos filtros de fecha, cuenta y categoría como filtros avanzados
        // Los filtros de tipo (income, expense, transfer) se tratan como vista por defecto con paginación
        const hasAdvancedFilters = filtrosLimpios.startDate || filtrosLimpios.endDate || 
                                 filtrosLimpios.accountId || filtrosLimpios.categoryId
        
        if (hasAdvancedFilters) {
          // Vista con filtros avanzados: mostrar todas las transacciones que coincidan
          setIsDefaultView(false)
          setTransacciones(transactions || [])
          setTotalCountFromServer(totalItems || 0)
        } else {
          // Vista por defecto o con filtro de tipo: implementar paginación manual
          setIsDefaultView(true)
          setAllFetchedTransactions(transactions || [])
          setVisibleTransactions(transactions || [])
          setCurrentPage(1)
          setTotalCountFromServer(totalItems || 0)
          setTransacciones(transactions || [])
          
          // Resetear el estado de paginación cuando se cambia de filtro
          if (filtrosLimpios.type !== filtros.type) {
            setCurrentPage(1)
            setAllFetchedTransactions(transactions || [])
            setVisibleTransactions(transactions || [])
          }
        }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar transacciones'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Cargar estadísticas de transacciones
   */
  const cargarEstadisticas = async (periodo = 'month') => {
    try {
      const response = await obtenerEstadisticasAPI(periodo)
      if (response.success) {
        setEstadisticas(response.data.estadisticas)
      }
    } catch (error) {
      console.warn('Error al cargar estadísticas:', error)
    }
  }

  /**
   * Cargar resumen de transacciones para el dashboard
   */
  const cargarResumen = async (filtrosPersonalizados = null) => {
    try {
      const filtrosAplicar = filtrosPersonalizados || filtros
      
      // Aplicar todos los filtros relevantes para el resumen
      const filtrosResumen = {}
      if (filtrosAplicar?.startDate) filtrosResumen.startDate = filtrosAplicar.startDate
      if (filtrosAplicar?.endDate) filtrosResumen.endDate = filtrosAplicar.endDate
      if (filtrosAplicar?.type) filtrosResumen.type = filtrosAplicar.type
      if (filtrosAplicar?.accountId) filtrosResumen.accountId = filtrosAplicar.accountId
      if (filtrosAplicar?.categoryId) filtrosResumen.categoryId = filtrosAplicar.categoryId
      
      const response = await obtenerResumenTransaccionesAPI(filtrosResumen)
      if (response.success) {
        setResumen(response.data.summary)
      }
    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Obtener una transacción específica por ID
   */
  const obtenerTransaccionPorId = async (id) => {
    try {
      const response = await obtenerTransaccionPorIdAPI(id)
      if (response.success) {
        return response.data.transaction
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al obtener transacción'
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
   * Crear una nueva transacción
   */
  const crearTransaccion = async (datosTransaccion) => {
    // Validar datos
    const validation = validarTransaccion(datosTransaccion)
    if (!validation.isValid) {
      showError(Object.values(validation.errors)[0])
      return { success: false, errors: validation.errors }
    }

    try {
      const datosFormateados = formatearDatosTransaccion(datosTransaccion)
      const response = await crearTransaccionAPI(datosFormateados)
      
      if (response.success) {
        const nuevaTransaccion = response.data.transaction
        
        // Agregar al inicio de la lista local
        setTransacciones(prev => [nuevaTransaccion, ...prev])
        
        // Actualizar estados de paginación si estamos en vista por defecto
        if (isDefaultView) {
          setAllFetchedTransactions(prev => [nuevaTransaccion, ...prev])
          
          // Si tenemos menos de 20 transacciones visibles, agregar la nueva
          if (visibleTransactions.length < 20) {
            setVisibleTransactions(prev => [nuevaTransaccion, ...prev])
          } else {
            // Si ya tenemos 20, mantener solo las primeras 20 incluyendo la nueva
            setVisibleTransactions(prev => [nuevaTransaccion, ...prev.slice(0, 19)])
          }
          
          setTotalCountFromServer(prev => prev + 1)
        }
        
        success('Transacción creada exitosamente')
        
        // Recargar estadísticas y resumen para actualizar las tarjetas en tiempo real
        cargarEstadisticas()
        cargarResumen(filtros) // Pasar filtros actuales para mantener el contexto
        
        return { success: true, data: response.data.transaction }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear transacción'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Actualizar una transacción existente
   */
  const actualizarTransaccion = async (id, datosActualizacion) => {
    // Validar datos
    const validation = validarTransaccion(datosActualizacion)
    if (!validation.isValid) {
      showError(Object.values(validation.errors)[0])
      return { success: false, errors: validation.errors }
    }

    try {
      const datosFormateados = formatearDatosTransaccion(datosActualizacion)
      const response = await actualizarTransaccionAPI(id, datosActualizacion)
      
      if (response.success) {
        const transaccionActualizada = response.data.transaction
        
        // Actualizar estado local
        setTransacciones(prev => 
          prev.map(transaccion => 
            transaccion.id === id ? transaccionActualizada : transaccion
          )
        )
        
        // Actualizar estados de paginación si estamos en vista por defecto
        if (isDefaultView) {
          setAllFetchedTransactions(prev => 
            prev.map(transaccion => 
              transaccion.id === id ? transaccionActualizada : transaccion
            )
          )
          setVisibleTransactions(prev => 
            prev.map(transaccion => 
              transaccion.id === id ? transaccionActualizada : transaccion
            )
          )
        }
        
        success('Transacción actualizada exitosamente')
        
        // Recargar estadísticas y resumen para actualizar las tarjetas en tiempo real
        cargarEstadisticas()
        cargarResumen(filtros) // Pasar filtros actuales para mantener el contexto
        
        return { success: true, data: response.data.transaction }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar transacción'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Eliminar una transacción
   */
  const eliminarTransaccion = async (id) => {
    try {
      const response = await eliminarTransaccionAPI(id)
      
      if (response.success) {
        // Actualizar estado local
        setTransacciones(prev => prev.filter(transaccion => transaccion.id !== id))
        
        // Actualizar estados de paginación si estamos en vista por defecto
        if (isDefaultView) {
          setAllFetchedTransactions(prev => prev.filter(transaccion => transaccion.id !== id))
          setVisibleTransactions(prev => prev.filter(transaccion => transaccion.id !== id))
          setTotalCountFromServer(prev => Math.max(0, prev - 1))
        }
        
        success('Transacción eliminada exitosamente')
        
        // Recargar estadísticas y resumen para actualizar las tarjetas en tiempo real
        cargarEstadisticas()
        cargarResumen(filtros) // Pasar filtros actuales para mantener el contexto
        
        return { success: true }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar transacción'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * =========================================
   * FUNCIONES DE FILTROS
   * =========================================
   */

  /**
   * Aplicar filtros y recargar transacciones
   */
  const aplicarFiltros = (nuevosFiltros) => {
    // Detectar si hay filtros avanzados activos (fechas, cuenta, categoría)
    // Los filtros de tipo mantienen la paginación
    const hasAdvancedFilters = nuevosFiltros.startDate || nuevosFiltros.endDate || 
                             nuevosFiltros.accountId || nuevosFiltros.categoryId
    
    if (hasAdvancedFilters) {
      setIsDefaultView(false)
    } else {
      // Si solo hay filtro de tipo o no hay filtros, mantener paginación
      setIsDefaultView(true)
      setCurrentPage(1)
      
      // Asegurar que se incluyan los parámetros de paginación para filtros de tipo
      if (!nuevosFiltros.limit) {
        nuevosFiltros.limit = getPageLimit()
      }
      if (!nuevosFiltros.offset) {
        nuevosFiltros.offset = 0
      }
    }
    
    setFiltros(nuevosFiltros)
    cargarTransacciones(nuevosFiltros)
    cargarResumen(nuevosFiltros) // También cargar resumen con los nuevos filtros
  }

  /**
   * Limpiar todos los filtros y recargar datos
   */
  const limpiarFiltros = () => {
    const filtrosLimpios = {
      startDate: null,
      endDate: null,
      type: null,
      accountId: null,
      categoryId: null,
      limit: getPageLimit(), // Límite responsive para vista por defecto
      offset: 0
    }
    setFiltros(filtrosLimpios)
    
    // Resetear a vista por defecto
    setIsDefaultView(true)
    setCurrentPage(1)
    
    cargarTransacciones(filtrosLimpios)
    cargarResumen(filtrosLimpios) // También recargar resumen sin filtros
  }

  /**
   * Filtrar por tipo de transacción
   */
  const filtrarPorTipo = (tipo) => {
    // Los filtros de tipo mantienen la paginación (vista por defecto)
    setIsDefaultView(true)
    setCurrentPage(1)
    
    // Incluir parámetros de paginación para mantener el límite de 20
    const filtrosConPaginacion = {
      type: tipo,
      limit: 20,
      offset: 0
    }
    
    aplicarFiltros(filtrosConPaginacion)
  }

  /**
   * Filtrar por cuenta
   */
  const filtrarPorCuenta = (cuentaId) => {
    aplicarFiltros({ accountId: cuentaId })
  }

  /**
   * Filtrar por categoría
   */
  const filtrarPorCategoria = (categoriaId) => {
    aplicarFiltros({ categoryId: categoriaId })
  }

  /**
   * Filtrar por rango de fechas
   */
  const filtrarPorFechas = (fechaInicio, fechaFin) => {
    aplicarFiltros({ 
      startDate: fechaInicio ? format(new Date(fechaInicio), 'yyyy-MM-dd') : null,
      endDate: fechaFin ? format(new Date(fechaFin), 'yyyy-MM-dd') : null
    })
  }

  /**
   * =========================================
   * FUNCIONES DE UTILIDAD
   * =========================================
   */

  /**
   * Recargar transacciones y estadísticas
   */
  const recargarTransacciones = () => {
    cargarTransacciones()
    cargarEstadisticas()
    cargarResumen(filtros) // También recargar resumen para actualizar las tarjetas con filtros actuales
  }

  /**
   * Buscar transacciones por descripción
   */
  const buscarTransacciones = (termino) => {
    if (!termino) return null // Retornar null para indicar que no hay búsqueda activa
    
    // La búsqueda debe funcionar sobre todas las transacciones disponibles
    // Si estamos en vista paginada, usar allFetchedTransactions + hacer API call para obtener más si es necesario
    let transaccionesParaBuscar = transacciones
    
    // Si estamos en vista paginada y hay un término de búsqueda, 
    // necesitamos obtener todas las transacciones para la búsqueda
    if (isDefaultView && termino) {
      // Para búsquedas en vista paginada, hacer una llamada especial sin límite
      // pero manteniendo los filtros de tipo si están activos
      const filtrosBusqueda = { ...filtros }
      delete filtrosBusqueda.limit
      delete filtrosBusqueda.offset
      
      // Hacer llamada a API para obtener todas las transacciones que coincidan
      obtenerTransaccionesAPI(filtrosBusqueda)
        .then(response => {
          if (response.success) {
            const { transactions } = response.data
            // Filtrar localmente por el término de búsqueda
            const resultados = transactions.filter(transaccion => 
              transaccion.description?.toLowerCase().includes(termino.toLowerCase()) ||
              transaccion.category_name?.toLowerCase().includes(termino.toLowerCase()) ||
              transaccion.from_account_name?.toLowerCase().includes(termino.toLowerCase()) ||
              transaccion.to_account_name?.toLowerCase().includes(termino.toLowerCase())
            )
            
            // Actualizar el estado para mostrar todos los resultados de búsqueda
            setTransacciones(resultados)
            setIsDefaultView(false) // Desactivar paginación durante la búsqueda
          }
        })
        .catch(error => {
          console.error('Error en búsqueda:', error)
        })
      
      return [] // Retornar array vacío mientras se cargan los resultados
    }
    
    // Si no estamos en vista paginada, filtrar sobre las transacciones actuales
    return transacciones.filter(transaccion => 
      transaccion.description?.toLowerCase().includes(termino.toLowerCase()) ||
      transaccion.category_name?.toLowerCase().includes(termino.toLowerCase()) ||
      transaccion.from_account_name?.toLowerCase().includes(termino.toLowerCase()) ||
      transaccion.to_account_name?.toLowerCase().includes(termino.toLowerCase())
    )
  }

  /**
   * Cargar más transacciones (paginación)
   */
  const cargarMasTransacciones = () => {
    const nuevosFiltros = { ...filtros, offset: filtros.offset + filtros.limit }
    setFiltros(nuevosFiltros)
    
    // Cargar y agregar a las existentes
    setIsLoading(true)
    obtenerTransaccionesAPI(nuevosFiltros)
      .then(response => {
        if (response.success) {
          setTransacciones(prev => [...prev, ...(response.data.transactions || [])])
        }
      })
      .catch(error => {
        showError('Error al cargar más transacciones')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  /**
   * Mostrar más transacciones en vista por defecto (paginación manual)
   */
  const handleShowMore = async () => {
    if (!isDefaultView) return
    
    setIsLoading(true)
    try {
      const nextPage = currentPage + 1
      const pageLimit = getPageLimit()
      const response = await obtenerTransaccionesAPI({
        limit: pageLimit,
        offset: (nextPage - 1) * pageLimit,
        type: filtros.type // Incluir el filtro de tipo si está activo
      })
      
      if (response.success) {
        const { transactions } = response.data
        setAllFetchedTransactions(prev => [...prev, ...transactions])
        setVisibleTransactions(prev => [...prev, ...transactions])
        setCurrentPage(nextPage)
      }
    } catch (error) {
      showError('Error al cargar más transacciones')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Mostrar menos transacciones en vista por defecto (volver a las primeras 20)
   */
  const handleShowLess = () => {
    if (!isDefaultView) return
    
    const pageLimit = getPageLimit()
    setCurrentPage(1)
    setVisibleTransactions(allFetchedTransactions.slice(0, pageLimit))
  }

  /**
   * =========================================
   * FUNCIÓN DE EXPORTACIÓN A EXCEL
   * =========================================
   */

  /**
   * Exportar transacciones a Excel
   * @param {Object} filtrosExportacion - Filtros específicos para la exportación
   * @returns {Promise<boolean>} - true si la exportación fue exitosa
   */
  const exportarTransacciones = async (filtrosExportacion = null) => {
    try {
      // Usar filtros de exportación específicos o los filtros actuales
      const filtrosAplicar = filtrosExportacion || filtros
      
      // Limpiar filtros vacíos y remover parámetros de paginación
      const filtrosLimpios = Object.entries(filtrosAplicar).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined && value !== '' && 
            key !== 'limit' && key !== 'offset') {
          acc[key] = value
        }
        return acc
      }, {})

      // Realizar la petición de exportación
      const blob = await exportarTransaccionesAPI(filtrosLimpios)
      
      // Crear URL del blob
      const url = window.URL.createObjectURL(blob)
      
      // Crear elemento de descarga
      const link = document.createElement('a')
      link.href = url
      
      // Generar nombre de archivo dinámico
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      let fileName = `Transacciones_${dateStr}`
      
      if (filtrosLimpios.startDate && filtrosLimpios.endDate) {
        const startStr = filtrosLimpios.startDate.split('T')[0]
        const endStr = filtrosLimpios.endDate.split('T')[0]
        fileName = `Transacciones_${startStr}_a_${endStr}`
      } else if (filtrosLimpios.startDate) {
        const startStr = filtrosLimpios.startDate.split('T')[0]
        fileName = `Transacciones_desde_${startStr}`
      } else if (filtrosLimpios.endDate) {
        const endStr = filtrosLimpios.endDate.split('T')[0]
        fileName = `Transacciones_hasta_${endStr}`
      }

      if (filtrosLimpios.type) {
        const typeLabels = {
          income: 'Ingresos',
          expense: 'Gastos',
          transfer: 'Transferencias'
        }
        fileName += `_${typeLabels[filtrosLimpios.type]}`
      }

      fileName += '.xlsx'
      
      link.download = fileName
      
      // Simular clic para iniciar descarga
      document.body.appendChild(link)
      link.click()
      
      // Limpiar
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      success('Archivo Excel exportado exitosamente')
      return true
      
    } catch (error) {
      console.error('Error al exportar transacciones:', error)
      showError('Error al exportar transacciones. Inténtalo de nuevo.')
      return false
    }
  }

  /**
   * =========================================
   * DATOS COMPUTADOS
   * =========================================
   */

  // Separar transacciones por tipo
  const transaccionesIngresos = transacciones.filter(t => t.type === 'income')
  const transaccionesGastos = transacciones.filter(t => t.type === 'expense')
  const transaccionesTransferencias = transacciones.filter(t => t.type === 'transfer')

  // Estadísticas básicas
  const estadisticasLocales = {
    totalTransacciones: transacciones.length,
    totalIngresos: transaccionesIngresos.reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalGastos: transaccionesGastos.reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalTransferencias: transaccionesTransferencias.reduce((sum, t) => sum + parseFloat(t.amount), 0),
    transaccionMasReciente: transacciones[0] || null
  }

  /**
   * =========================================
   * EFECTOS
   * =========================================
   */

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarTransacciones()
    cargarEstadisticas()
    cargarResumen() // Cargar resumen inicial
  }, [])

  return {
    // Estados principales
    transacciones,
    estadisticas,
    resumen,
    isLoading,
    error,

    // Estados de filtros
    filtros,

    // Estados de paginación manual
    allFetchedTransactions,
    visibleTransactions,
    currentPage,
    totalCountFromServer,
    isDefaultView,

    // Datos computados
    transaccionesIngresos,
    transaccionesGastos,
    transaccionesTransferencias,
    estadisticasLocales,

    // Funciones de carga
    cargarTransacciones,
    cargarEstadisticas,
    cargarResumen,
    recargarTransacciones,
    obtenerTransaccionPorId,

    // Funciones CRUD
    crearTransaccion,
    actualizarTransaccion,
    eliminarTransaccion,

    // Funciones de filtros
    aplicarFiltros,
    limpiarFiltros,
    filtrarPorTipo,
    filtrarPorCuenta,
    filtrarPorCategoria,
    filtrarPorFechas,

    // Funciones de utilidad
    buscarTransacciones,
    cargarMasTransacciones,
    handleShowMore,
    handleShowLess,

    // Funciones de exportación
    exportarTransacciones
  }
}

export default useTransacciones