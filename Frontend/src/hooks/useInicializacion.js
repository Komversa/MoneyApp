import { useState } from 'react'
import { useToast } from '../components/ui/Toaster'

/**
 * Hook específico para inicializar tipos predefinidos para usuarios nuevos
 * No carga datos del servidor, solo maneja el estado local
 */
const useInicializacion = () => {
  const { success } = useToast()

  // Tipos de cuenta predefinidos
  const [tiposCuenta, setTiposCuenta] = useState([
    { id: 1, name: 'Banco' },
    { id: 2, name: 'Cuenta de Ahorros' },
    { id: 3, name: 'Efectivo' },
    { id: 4, name: 'Inversiones' }
  ])

  // Tipos de deuda predefinidos
  const [tiposDeuda, setTiposDeuda] = useState([
    { id: 1, name: 'Tarjeta de Crédito' },
    { id: 2, name: 'Préstamo Personal' },
    { id: 3, name: 'Préstamo Hipotecario' },
    { id: 4, name: 'Préstamo Vehicular' }
  ])

  /**
   * Inicializar tipos predefinidos para usuarios nuevos
   */
  const inicializarTiposPredefinidos = () => {
    const tiposCuentaPredefinidos = [
      { id: 1, name: 'Banco' },
      { id: 2, name: 'Cuenta de Ahorros' },
      { id: 3, name: 'Efectivo' },
      { id: 4, name: 'Inversiones' }
    ]

    const tiposDeudaPredefinidos = [
      { id: 1, name: 'Tarjeta de Crédito' },
      { id: 2, name: 'Préstamo Personal' },
      { id: 3, name: 'Préstamo Hipotecario' },
      { id: 4, name: 'Préstamo Vehicular' }
    ]

    setTiposCuenta(tiposCuentaPredefinidos)
    setTiposDeuda(tiposDeudaPredefinidos)
    
    console.log('✅ Tipos predefinidos inicializados para usuario nuevo')
    return { success: true }
  }

  /**
   * Funciones CRUD para tipos de cuenta (solo estado local)
   */
  const crearTipoCuenta = (nombre) => {
    const nuevoTipo = {
      id: Date.now(),
      name: nombre
    }
    setTiposCuenta(prev => [...prev, nuevoTipo])
    success('Tipo de cuenta creado correctamente')
    return { success: true }
  }

  const actualizarTipoCuenta = (id, nombre) => {
    setTiposCuenta(prev => prev.map(tipo => 
      tipo.id === id ? { ...tipo, name: nombre } : tipo
    ))
    success('Tipo de cuenta actualizado correctamente')
    return { success: true }
  }

  const eliminarTipoCuenta = (id) => {
    setTiposCuenta(prev => prev.filter(tipo => tipo.id !== id))
    success('Tipo de cuenta eliminado correctamente')
    return { success: true }
  }

  /**
   * Funciones CRUD para tipos de deuda (solo estado local)
   */
  const crearTipoDeuda = (nombre) => {
    const nuevoTipo = {
      id: Date.now(),
      name: nombre
    }
    setTiposDeuda(prev => [...prev, nuevoTipo])
    success('Tipo de deuda creado correctamente')
    return { success: true }
  }

  const actualizarTipoDeuda = (id, nombre) => {
    setTiposDeuda(prev => prev.map(tipo => 
      tipo.id === id ? { ...tipo, name: nombre } : tipo
    ))
    success('Tipo de deuda actualizado correctamente')
    return { success: true }
  }

  const eliminarTipoDeuda = (id) => {
    setTiposDeuda(prev => prev.filter(tipo => tipo.id !== id))
    success('Tipo de deuda eliminado correctamente')
    return { success: true }
  }

  return {
    // Estados
    tiposCuenta,
    tiposDeuda,
    
    // Función de inicialización
    inicializarTiposPredefinidos,
    
    // Funciones CRUD - Tipos de Cuenta
    crearTipoCuenta,
    actualizarTipoCuenta,
    eliminarTipoCuenta,
    
    // Funciones CRUD - Tipos de Deuda
    crearTipoDeuda,
    actualizarTipoDeuda,
    eliminarTipoDeuda
  }
}

export default useInicializacion
