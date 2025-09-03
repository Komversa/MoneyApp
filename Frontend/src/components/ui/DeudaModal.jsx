import React, { useState, useEffect } from 'react'
import { Loader2, CreditCard, DollarSign, Info } from 'lucide-react'
import Modal from './Modal'
import useConfiguracion from '../../hooks/useConfiguracion'
import { obtenerOpcionesMonedas } from '../../api/currencies.api'

/**
 * Modal para crear/editar deudas (cuentas de tipo pasivo)
 */
const DeudaModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  deuda = null, 
  isLoading = false 
}) => {
  const { tiposCuenta, tiposDeuda, configuracionUsuario } = useConfiguracion()

  const [formData, setFormData] = useState({
    name: '',
    debtTypeId: '', // Cambio: usar debtTypeId en lugar de accountTypeId
    totalAmount: '', // Cambio: usar totalAmount en lugar de originalAmount
    currentBalance: '', // Cambio: usar currentBalance en lugar de initialBalance
    currency: '',
    interestRate: '',
    dueDate: ''
  })
  const [errors, setErrors] = useState({})
  const [monedasDisponibles, setMonedasDisponibles] = useState([])
  const [cargandoMonedas, setCargandoMonedas] = useState(false)

  const isEditing = Boolean(deuda)

  // Cargar monedas disponibles cuando se abre el modal (solo USD y NIO)
  useEffect(() => {
    if (isOpen && monedasDisponibles.length === 0) {
      // Solo mostrar las monedas habilitadas en el sistema
      const monedasHabilitadas = [
        { value: 'USD', label: 'USD - Dólar Estadounidense', symbol: '$' },
        { value: 'NIO', label: 'NIO - Córdoba Nicaragüense', symbol: 'C$' }
      ]
      setMonedasDisponibles(monedasHabilitadas)
      setCargandoMonedas(false)
    }
  }, [isOpen])

  // Resetear formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      if (isEditing && deuda) {
        // Formatear la fecha para el input de tipo date (YYYY-MM-DD)
        const formatearFechaParaInput = (fecha) => {
          if (!fecha) return ''
          const date = new Date(fecha)
          return date.toISOString().split('T')[0]
        }

        setFormData({
          name: deuda.name || '',
          debtTypeId: deuda.account_type_id || '',
          totalAmount: deuda.original_amount || '',
          currentBalance: Math.abs(deuda.current_balance || 0).toString(),
          currency: deuda.currency || configuracionUsuario.primary_currency,
          interestRate: deuda.interest_rate || '',
          dueDate: formatearFechaParaInput(deuda.due_date)
        })
      } else {
        setFormData({
          name: '',
          debtTypeId: '',
          totalAmount: '',
          currentBalance: '',
          currency: configuracionUsuario.primary_currency,
          interestRate: '',
          dueDate: ''
        })
      }
      setErrors({})
    }
  }, [isOpen, isEditing, deuda, configuracionUsuario])

  /**
   * Validar formulario
   */
  const validateForm = () => {
    const newErrors = {}

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la deuda es requerido'
    }

    // Validar tipo de deuda
    if (!formData.debtTypeId) {
      newErrors.debtTypeId = 'Debes seleccionar un tipo de deuda'
    }

    // Validar monto total (obligatorio)
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'El monto total es requerido y debe ser mayor a 0'
    }

    // Validar saldo actual (obligatorio)
    if (!formData.currentBalance || parseFloat(formData.currentBalance) < 0) {
      newErrors.currentBalance = 'El saldo actual es requerido y no puede ser negativo'
    }

    // Validar que el saldo actual no sea mayor al monto total
    if (formData.currentBalance && formData.totalAmount && 
        parseFloat(formData.currentBalance) > parseFloat(formData.totalAmount)) {
      newErrors.currentBalance = 'El saldo actual no puede ser mayor al monto total'
    }

    // Validar moneda
    if (!formData.currency) {
      newErrors.currency = 'Debes seleccionar una moneda'
    }

    // Validar tasa de interés (opcional pero debe ser positiva si se proporciona)
    if (formData.interestRate && parseFloat(formData.interestRate) < 0) {
      newErrors.interestRate = 'La tasa de interés no puede ser negativa'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Manejar cambios en el formulario
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Preparar datos para enviar
    const datosDeuda = {
      name: formData.name.trim(),
      accountTypeId: parseInt(formData.debtTypeId), // Usar el tipo de deuda seleccionado
      initialBalance: -Math.abs(parseFloat(formData.currentBalance)), // Saldo negativo para deudas
      currency: formData.currency,
      accountCategory: 'liability', // Siempre es pasivo
      originalAmount: parseFloat(formData.totalAmount),
      interestRate: formData.interestRate ? parseFloat(formData.interestRate) : 0,
      dueDate: formData.dueDate || null
    }

    await onSave(datosDeuda)
  }



  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Deuda' : 'Nueva Deuda'}
      size="standard"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cabecera compacta */}
        <div className="text-center pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full mb-2">
            <CreditCard className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Deuda' : 'Nueva Deuda'}
          </h3>
        </div>

        {/* Información básica - Layout compacto */}
        <div className="space-y-3">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre de la Deuda *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ej: Tarjeta BAC, Préstamo Personal..."
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 
                         dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors
                         ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Tipo y Moneda en grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Tipo de deuda */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo *
              </label>
              <select
                value={formData.debtTypeId}
                onChange={(e) => handleInputChange('debtTypeId', e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 
                           dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors
                           ${errors.debtTypeId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              >
                <option value="">
                  {tiposDeuda.length > 0 ? 'Seleccionar' : 'Sin tipos'}
                </option>
                {tiposDeuda.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.name}
                  </option>
                ))}
              </select>
              {errors.debtTypeId && (
                <p className="mt-1 text-xs text-red-600">{errors.debtTypeId}</p>
              )}
            </div>

                         {/* Moneda */}
             <div>
               <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Moneda *
               </label>
                               <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 
                             dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors
                             ${errors.currency ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                >
                  <option value="">Selecciona una moneda</option>
                  {monedasDisponibles.map(moneda => (
                    <option key={moneda.value} value={moneda.value}>
                      {moneda.label}
                    </option>
                  ))}
                </select>
               {errors.currency && (
                 <p className="mt-1 text-xs text-red-600">{errors.currency}</p>
               )}
             </div>
          </div>
        </div>

        {/* Montos principales - Sección destacada */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center">
            <DollarSign className="h-3 w-3 mr-1" />
            Montos de la Deuda
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Monto total */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monto Total *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totalAmount}
                onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                placeholder="0.00"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 
                           dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors
                           ${errors.totalAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              />
              {errors.totalAmount && (
                <p className="mt-1 text-xs text-red-600">{errors.totalAmount}</p>
              )}
            </div>

            {/* Saldo actual */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Saldo Actual *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.currentBalance}
                onChange={(e) => handleInputChange('currentBalance', e.target.value)}
                placeholder="0.00"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 
                           dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors
                           ${errors.currentBalance ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              />
              {errors.currentBalance && (
                <p className="mt-1 text-xs text-red-600">{errors.currentBalance}</p>
              )}
            </div>
          </div>
          
          {/* Información contextual */}
          <div className="mt-2 text-xs text-red-700 dark:text-red-300">
            <p>• <strong>Monto Total:</strong> Préstamo original o límite de crédito</p>
            <p>• <strong>Saldo Actual:</strong> Cuánto debes actualmente</p>
          </div>
        </div>

        {/* Información opcional - Compacta */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-gray-900 dark:text-white">
            Información Adicional
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Tasa de interés */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tasa de Interés (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.interestRate}
                onChange={(e) => handleInputChange('interestRate', e.target.value)}
                placeholder="0.00"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 
                           dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors
                           ${errors.interestRate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              />
              {errors.interestRate && (
                <p className="mt-1 text-xs text-red-600">{errors.interestRate}</p>
              )}
            </div>

                         {/* Fecha de vencimiento */}
             <div>
               <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Fecha de Vencimiento
               </label>
                               <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 
                             dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors
                             ${errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
               
              </div>
          </div>
        </div>

        {/* Mensaje de ayuda compacto */}
        {tiposDeuda.length === 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              💡 <strong>Tipos de deuda:</strong> Ve a Configuración → Personalización para agregar tipos personalizados
            </p>
          </div>
        )}

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
              !formData.debtTypeId || 
              !formData.totalAmount || 
              !formData.currentBalance || 
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
              isEditing ? 'Actualizar Deuda' : 'Crear Deuda'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default DeudaModal
