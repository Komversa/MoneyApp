import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from './Modal'
import useConfiguracion from '../../hooks/useConfiguracion'
import { SUPPORTED_CURRENCIES } from '../../utils/currencyData'
import useAuthStore from '../../store/useAuthStore'
import { obtenerOpcionesMonedas } from '../../api/currencies.api'

/**
 * Modal para crear/editar cuentas
 */
const CuentaModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  cuenta = null, 
  isLoading = false,
  activeTab = 'activos' // Nueva prop para saber la pestaña activa
}) => {
  const { tiposCuenta, tasasCambio, configuracionUsuario } = useConfiguracion()
const { user } = useAuthStore()

const [formData, setFormData] = useState({
  name: '',
  accountTypeId: '',
  initialBalance: '',
  currency: ''
})
const [errors, setErrors] = useState({})
const [monedasDisponibles, setMonedasDisponibles] = useState([])
const [cargandoMonedas, setCargandoMonedas] = useState(false)

  const isEditing = Boolean(cuenta)

  // Cargar monedas disponibles cuando se abre el modal
  useEffect(() => {
    if (isOpen && monedasDisponibles.length === 0) {
      const cargarMonedas = async () => {
        setCargandoMonedas(true);
        try {
          const opciones = await obtenerOpcionesMonedas();
          setMonedasDisponibles(opciones);
        } catch (error) {
          console.error('Error cargando monedas:', error);
          // Fallback a monedas básicas
          setMonedasDisponibles([
            { value: 'USD', label: 'USD - Dólar Estadounidense', symbol: '$' },
            { value: 'NIO', label: 'NIO - Córdoba Nicaragüense', symbol: 'C$' }
          ]);
        } finally {
          setCargandoMonedas(false);
        }
      };
      cargarMonedas();
    }
  }, [isOpen, monedasDisponibles.length]);

  // Resetear formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      if (isEditing && cuenta) {
        // Editar cuenta existente de activo
        setFormData({
          name: cuenta.name || '',
          accountTypeId: cuenta.account_type_id || '',
          initialBalance: cuenta.initial_balance || '',
          currency: cuenta.currency || configuracionUsuario.primary_currency
        })
      } else {
        // Crear nueva cuenta de activo
        setFormData({
          name: '',
          accountTypeId: '',
          initialBalance: '',
          currency: configuracionUsuario.primary_currency
        })
      }
      setErrors({})
    }
  }, [isOpen, isEditing, cuenta, configuracionUsuario])

  /**
   * Validar formulario
   */
  const validateForm = () => {
    const newErrors = {}

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'El nombre no puede exceder los 100 caracteres'
    }

    // Validar tipo de cuenta
    if (!formData.accountTypeId) {
      newErrors.accountTypeId = 'Debe seleccionar un tipo de cuenta'
    }

    // Validar saldo inicial (solo al crear, no al editar)
    if (!isEditing && formData.initialBalance && isNaN(parseFloat(formData.initialBalance))) {
      newErrors.initialBalance = 'El saldo inicial debe ser un número válido'
    }

    // Validar moneda
    if (!formData.currency) {
      newErrors.currency = 'Debe seleccionar una moneda'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const result = await onSave(formData)
    
    if (result?.success) {
      onClose()
    }
  }

  /**
   * Manejar cambio en los inputs
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Limpiar error del campo si hay
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  /**
   * 🚨 REFACTORIZADO: Usar monedas disponibles desde el nuevo sistema
   * 
   * Ahora usa las monedas obtenidas de la API de supported_currencies
   * en lugar de depender solo de las tasas de cambio configuradas
   */
  
  // Usar solo las monedas habilitadas en el sistema (USD y NIO)
  const selectableCurrencies = [
    { value: 'USD', label: 'USD - Dólar Estadounidense', symbol: '$' },
    { value: 'NIO', label: 'NIO - Córdoba Nicaragüense', symbol: 'C$' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Cuenta de Activo' : 'Nueva Cuenta de Activo'}
      size="standard"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información sobre el tipo de cuenta */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            💰 Cuenta de Activo
          </h4>
          <p className="text-sm text-green-700 dark:text-green-300">
            Las cuentas de activo representan recursos de valor como cuentas bancarias, efectivo, inversiones, etc.
            Para gestionar deudas, utiliza el módulo "Deudas" en el menú principal.
          </p>
        </div>

        {/* Campo Nombre */}
        <div>
          <label htmlFor="name" className="form-label">
            Nombre de la Cuenta *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            className={`form-input ${errors.name ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
            placeholder="Ej: Bac Credomatic, Efectivo, Banco Santander"
            disabled={isLoading}
            autoFocus
          />
          {errors.name && (
            <p className="form-error">{errors.name}</p>
          )}
        </div>

        {/* Campo Tipo de Cuenta */}
        <div>
          <label htmlFor="accountTypeId" className="form-label">
            Tipo de Cuenta *
          </label>
          <select
            id="accountTypeId"
            name="accountTypeId"
            value={formData.accountTypeId}
            onChange={handleInputChange}
            className={`form-input ${errors.accountTypeId ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
            disabled={isLoading}
          >
            <option value="">Selecciona un tipo de cuenta</option>
            {tiposCuenta.filter(tipo => 
              !tipo.name.toLowerCase().includes('tarjeta') && 
              !tipo.name.toLowerCase().includes('préstamo') &&
              !tipo.name.toLowerCase().includes('credito') &&
              !tipo.name.toLowerCase().includes('deuda')
            ).map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.name}
              </option>
            ))}
          </select>
          {errors.accountTypeId && (
            <p className="form-error">{errors.accountTypeId}</p>
          )}
          {tiposCuenta.length === 0 && (
            <p className="text-sm text-amber-600 mt-1">
              No hay tipos de cuenta configurados. Ve a Configuración para añadir tipos.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Campo Saldo Inicial */}
          <div>
            <label htmlFor="initialBalance" className="form-label">
              Saldo Inicial
            </label>
            <input
              id="initialBalance"
              name="initialBalance"
              type="number"
              step="0.01"
              min="0"
              value={formData.initialBalance}
              onChange={handleInputChange}
              className={`form-input ${errors.initialBalance ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
              placeholder="0.00"
              disabled={isLoading || isEditing} // Deshabilitar si está cargando O si está editando
            />
            {errors.initialBalance && (
              <p className="form-error">{errors.initialBalance}</p>
            )}
            {isEditing ? (
              <p className="text-sm text-gray-500 mt-1">
                El saldo inicial no se puede modificar después de crear la cuenta
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                El saldo inicial será el saldo actual de la cuenta al crearla
              </p>
            )}
          </div>

          {/* Campo Moneda */}
          <div>
            <label htmlFor="currency" className="form-label">
              Moneda *
            </label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className={`form-input ${errors.currency ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
              disabled={isLoading || cargandoMonedas}
            >
              <option value="">
                {cargandoMonedas ? 'Cargando monedas...' : 'Selecciona una moneda'}
              </option>
              {selectableCurrencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
            {errors.currency && (
              <p className="form-error">{errors.currency}</p>
            )}
          </div>
        </div>

        {/* Información */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
            <li>• El saldo inicial será el saldo actual de la cuenta al crearla</li>
            <li>• Puedes cambiar el nombre y tipo después de crear la cuenta</li>
            <li>• La moneda determina cómo se mostrarán los montos</li>
          </ul>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn-outline"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              isLoading || 
              !formData.name.trim() || 
              !formData.accountTypeId || 
              !formData.currency
            }
            className="btn-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                {isEditing ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              isEditing ? 'Actualizar Cuenta' : 'Crear Cuenta'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CuentaModal