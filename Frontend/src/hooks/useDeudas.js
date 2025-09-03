import { useState, useEffect, useCallback } from 'react'
import { getDebts, createDebt, updateDebt, deleteDebt, makeDebtPayment } from '../api/debts.api'
import { getAccounts } from '../api/accounts.api'
import useErrorHandler from './useErrorHandler'
import { useToast } from '../components/ui/Toaster'
import useAuthStore from '../store/useAuthStore'
import apiClient from '../api/auth.api'

/**
 * Hook personalizado para gestión de deudas
 * Proporciona funcionalidades CRUD para deudas y pagos
 */
const useDeudas = () => {
  const { obtenerConfiguracionUsuario } = useAuthStore()
  const configuracionUsuario = obtenerConfiguracionUsuario()
  const monedaPrincipal = configuracionUsuario.primary_currency || 'USD'

  const [deudas, setDeudas] = useState([])
  const [activosDisponibles, setActivosDisponibles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [resumenDeudas, setResumenDeudas] = useState({
    totalDeudas: 0,
    tasaPromedio: 0,
    monedaPrincipal: monedaPrincipal
  })

  const { handleError } = useErrorHandler()
  const { success, error: showError } = useToast()

  /**
   * Cargar todas las deudas del usuario
   */
  const cargarDeudas = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log('🔄 Cargando deudas...')

      const response = await getDebts()
      
      if (response.success) {
        const deudasProcesadas = response.data.accounts || []
        setDeudas(deudasProcesadas)
        
        // Calcular resumen de deudas con conversión de monedas
        await calcularResumenDeudas(deudasProcesadas)
        
        console.log('✅ Deudas cargadas:', deudasProcesadas.length)
      } else {
        throw new Error(response.message || 'Error al cargar deudas')
      }
    } catch (error) {
      console.error('❌ Error cargando deudas:', error)
      showError('No se pudieron cargar las deudas')
      setDeudas([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Cargar activos disponibles para pagos
   */
  const cargarActivosDisponibles = useCallback(async () => {
    try {
      console.log('🔄 Cargando activos disponibles...')

      const response = await getAccounts('asset')
      
      if (response.success) {
        const activos = response.data.accounts || []
        // Filtrar solo activos con saldo positivo
        const activosConSaldo = activos.filter(activo => 
          parseFloat(activo.current_balance || 0) > 0
        )
        setActivosDisponibles(activosConSaldo)
        
        console.log('✅ Activos disponibles:', activosConSaldo.length)
      } else {
        throw new Error(response.message || 'Error al cargar activos')
      }
    } catch (error) {
      console.error('❌ Error cargando activos:', error)
      showError('No se pudieron cargar los activos')
      setActivosDisponibles([])
    }
  }, [])

  /**
   * Calcular resumen de deudas con conversión de monedas
   */
  const calcularResumenDeudas = useCallback(async (deudasData) => {
    try {
      console.log('🔄 Calculando resumen de deudas con conversión de monedas...')
      console.log('💰 Moneda principal del usuario:', monedaPrincipal)
      console.log('🔍 [DEBUG] ConfiguracionUsuario completa:', configuracionUsuario)
      console.log('🔍 [DEBUG] Deudas recibidas:', deudasData)

      // Validar que tenemos moneda principal válida
      if (!monedaPrincipal || monedaPrincipal.trim() === '') {
        console.error('❌ No se puede calcular resumen: moneda principal no válida')
        setResumenDeudas({
          totalDeudas: 0,
          tasaPromedio: 0,
          monedaPrincipal: 'USD'
        })
        return
      }

      let totalDeudasConvertido = 0
      let sumaTasasInteres = 0
      let deudasConTasa = 0
      let totalesPorMoneda = {}

      // Agrupar deudas por moneda
      deudasData.forEach((deuda, index) => {
        console.log(`🔍 [DEBUG] Procesando deuda ${index}:`, deuda)
        
        const currency = deuda.currency || 'USD'
        const saldoDeuda = Math.abs(parseFloat(deuda.current_balance || 0))
        
        console.log(`🔍 [DEBUG] Deuda ${index} - Currency: "${currency}", Saldo: ${saldoDeuda}`)
        
        // Solo procesar si el saldo es válido
        if (saldoDeuda > 0) {
          if (!totalesPorMoneda[currency]) {
            totalesPorMoneda[currency] = 0
          }
          totalesPorMoneda[currency] += saldoDeuda

          // Calcular tasa de interés promedio
          if (deuda.interest_rate && parseFloat(deuda.interest_rate) > 0) {
            sumaTasasInteres += parseFloat(deuda.interest_rate)
            deudasConTasa++
          }
        } else {
          console.log(`⚠️ Saltando deuda ${index} con saldo inválido: ${saldoDeuda}`)
        }
      })

      console.log('🔍 [DEBUG] Totales por moneda antes de conversión:', totalesPorMoneda)
      
      // Verificar si realmente necesitamos hacer conversiones
      if (Object.keys(totalesPorMoneda).length === 0) {
        console.log('ℹ️ No hay deudas para procesar')
        setResumenDeudas({
          totalDeudas: 0,
          tasaPromedio: 0,
          monedaPrincipal: monedaPrincipal
        })
        return
      }

      // Si solo hay una moneda y es la misma que la principal, no necesitamos conversión
      const monedas = Object.keys(totalesPorMoneda)
      if (monedas.length === 1 && monedas[0] === monedaPrincipal) {
        console.log('ℹ️ Solo hay una moneda y coincide con la principal, no se necesita conversión')
        totalDeudasConvertido = totalesPorMoneda[monedaPrincipal]
      } else {
        // Convertir cada moneda a la moneda principal
        for (const [currency, amount] of Object.entries(totalesPorMoneda)) {
        if (currency === monedaPrincipal) {
          totalDeudasConvertido += amount
        } else {
          try {
            // Debug: verificar los valores antes de enviar
            console.log('🔍 [DEBUG] Intentando conversión:', {
              amount,
              fromCurrency: currency,
              toCurrency: monedaPrincipal,
              amountType: typeof amount,
              currencyType: typeof currency,
              toCurrencyType: typeof monedaPrincipal
            })

            // Validar que los parámetros no estén vacíos o sean inválidos
            if (!amount || amount <= 0) {
              console.warn(`⚠️ Amount inválido: ${amount}, saltando conversión`)
              continue
            }
            
            if (!currency || currency.trim() === '') {
              console.warn(`⚠️ Currency inválida: "${currency}", saltando conversión`)
              continue
            }
            
            if (!monedaPrincipal || monedaPrincipal.trim() === '') {
              console.warn(`⚠️ MonedaPrincipal inválida: "${monedaPrincipal}", saltando conversión`)
              totalDeudasConvertido += amount
              continue
            }

            // Usar el servicio de conversión del backend
            const response = await apiClient.post('/api/currencies/convert', {
              amount: Number(amount),
              fromCurrency: currency.trim(),
              toCurrency: monedaPrincipal.trim()
            })

            if (response.data.success) {
              const convertedAmount = response.data.data.convertedAmount
              totalDeudasConvertido += convertedAmount
              console.log(`✅ Convertido ${amount} ${currency} a ${convertedAmount} ${monedaPrincipal}`)
            } else {
              console.warn(`⚠️ Error convirtiendo ${currency}, usando valor original`)
              totalDeudasConvertido += amount
            }
          } catch (conversionError) {
            console.warn(`⚠️ Error en conversión de ${currency}:`, conversionError)
            totalDeudasConvertido += amount
          }
        }
      }
      }

      // Calcular tasa de interés promedio
      const tasaPromedio = deudasConTasa > 0 ? sumaTasasInteres / deudasConTasa : 0

      const resumenActualizado = {
        totalDeudas: Math.round(totalDeudasConvertido * 100) / 100,
        tasaPromedio: Math.round(tasaPromedio * 100) / 100,
        monedaPrincipal: monedaPrincipal
      }

      setResumenDeudas(resumenActualizado)

      console.log('📊 Resumen de deudas calculado:', resumenActualizado)
      console.log('💱 Totales por moneda:', totalesPorMoneda)

    } catch (error) {
      console.error('❌ Error calculando resumen:', error)
      // Fallback: calcular sin conversión
      let totalDeudas = 0
      let sumaTasasInteres = 0
      let deudasConTasa = 0

      deudasData.forEach(deuda => {
        const saldoDeuda = Math.abs(parseFloat(deuda.current_balance || 0))
        totalDeudas += saldoDeuda

        if (deuda.interest_rate && parseFloat(deuda.interest_rate) > 0) {
          sumaTasasInteres += parseFloat(deuda.interest_rate)
          deudasConTasa++
        }
      })

      const tasaPromedio = deudasConTasa > 0 ? sumaTasasInteres / deudasConTasa : 0

      setResumenDeudas({
        totalDeudas: Math.round(totalDeudas * 100) / 100,
        tasaPromedio: Math.round(tasaPromedio * 100) / 100,
        monedaPrincipal: monedaPrincipal
      })
    }
  }, [monedaPrincipal, configuracionUsuario])

  /**
   * Crear una nueva deuda
   */
  const crearDeuda = useCallback(async (deudaData) => {
    try {
      setIsLoading(true)
      console.log('🔄 Creando deuda:', deudaData)

      const response = await createDebt(deudaData)
      
      if (response.success) {
        success('Deuda creada exitosamente')
        await cargarDeudas() // Recargar deudas
        return { success: true, data: response.data }
      } else {
        throw new Error(response.message || 'Error al crear deuda')
      }
    } catch (error) {
      console.error('❌ Error creando deuda:', error)
      const errorMessage = error.message || 'Error al crear la deuda'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Actualizar una deuda existente
   */
  const actualizarDeuda = useCallback(async (deudaId, updateData) => {
    try {
      setIsLoading(true)
      console.log('🔄 Actualizando deuda:', deudaId, updateData)

      const response = await updateDebt(deudaId, updateData)
      
      if (response.success) {
        success('Deuda actualizada exitosamente')
        await cargarDeudas() // Recargar deudas
        return { success: true, data: response.data }
      } else {
        throw new Error(response.message || 'Error al actualizar deuda')
      }
    } catch (error) {
      console.error('❌ Error actualizando deuda:', error)
      const errorMessage = error.message || 'Error al actualizar la deuda'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Eliminar una deuda
   */
  const eliminarDeuda = useCallback(async (deudaId) => {
    try {
      setIsLoading(true)
      console.log('🔄 Eliminando deuda:', deudaId)

      const response = await deleteDebt(deudaId)
      
      if (response.success) {
        success('Deuda eliminada exitosamente')
        await cargarDeudas() // Recargar deudas
        return { success: true }
      } else {
        throw new Error(response.message || 'Error al eliminar deuda')
      }
    } catch (error) {
      console.error('❌ Error eliminando deuda:', error)
      const errorMessage = error.message || 'Error al eliminar la deuda'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [cargarDeudas])

  /**
   * Realizar un pago a una deuda
   */
  const realizarPagoDeuda = useCallback(async (paymentData) => {
    try {
      setIsLoading(true)
      console.log('🔄 Realizando pago de deuda:', paymentData)

      const response = await makeDebtPayment(paymentData)
      
      if (response.success) {
        success('Pago realizado exitosamente')
        await cargarDeudas() // Recargar deudas
        await cargarActivosDisponibles() // Recargar activos
        return { success: true, data: response.data }
      } else {
        throw new Error(response.message || 'Error al realizar el pago')
      }
    } catch (error) {
      console.error('❌ Error realizando pago:', error)
      const errorMessage = error.message || 'Error al realizar el pago'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Efecto para cargar datos iniciales
   */
  useEffect(() => {
    cargarDeudas()
    cargarActivosDisponibles()
  }, []) // Solo ejecutar una vez al montar el componente

  /**
   * Efecto para recalcular resumen cuando cambie la moneda principal
   */
  useEffect(() => {
    if (deudas.length > 0 && monedaPrincipal) {
      calcularResumenDeudas(deudas)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monedaPrincipal, deudas])

  // Retornar el estado y las funciones
  return {
    // Estado
    deudas,
    activosDisponibles,
    resumenDeudas,
    isLoading,
    
    // Funciones
    cargarDeudas,
    cargarActivosDisponibles,
    crearDeuda,
    actualizarDeuda,
    eliminarDeuda,
    realizarPagoDeuda
  }
}

export default useDeudas
