import React, { useState, useEffect } from 'react'
import { Save, Loader2, DollarSign, Info } from 'lucide-react'
import Modal from './Modal'
import useResponsive from '../../hooks/useResponsive'

/**
 * Modal para añadir/editar tasas de cambio
 * Utilizado en la página de Configuración
 */
const TasaCambioModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  monedasDisponibles = [], 
  tasaExistente = null,
  isLoading = false,
  primaryCurrency = 'USD'
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive()
  const [formData, setFormData] = useState({
    currencyCode: '',
    rate: ''
  })
  const [errors, setErrors] = useState({})

  // Efecto para cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (tasaExistente) {
        // Modo edición
        setFormData({
          currencyCode: tasaExistente.currency_code,
          rate: tasaExistente.rate.toString()
        })
      } else {
        // Modo creación
        setFormData({
          currencyCode: '',
          rate: ''
        })
      }
      setErrors({})
    }
  }, [isOpen, tasaExistente])

  /**
   * Manejar cambios en los inputs
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Limpiar error del campo específico
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  /**
   * Validar formulario
   */
  const validateForm = () => {
    const newErrors = {}

    if (!formData.currencyCode.trim()) {
      newErrors.currencyCode = 'Debe seleccionar una moneda'
    }

    if (!formData.rate.trim()) {
      newErrors.rate = 'La tasa de cambio es requerida'
    } else {
      const rate = parseFloat(formData.rate)
      if (isNaN(rate) || rate <= 0) {
        newErrors.rate = 'La tasa debe ser un número positivo'
      }
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

    const result = await onSave(formData.currencyCode, parseFloat(formData.rate))
    
    if (result?.success) {
      onClose()
    }
  }

  /**
   * Manejar cierre del modal
   */
  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  // Encontrar la información de la moneda seleccionada
  const monedaSeleccionada = monedasDisponibles.find(m => m.value === formData.currencyCode)

  // 🚨 NUEVO: Validar y filtrar monedas disponibles
  const monedasValidas = Array.isArray(monedasDisponibles) 
    ? monedasDisponibles.filter(moneda => moneda && moneda.value && moneda.label)
    : []

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      size={isMobile ? "standard" : "large"} 
      title={tasaExistente ? 'Editar Tasa de Cambio' : 'Configurar Tasa de Cambio'}
    >
      <div className={`space-y-6 ${isMobile ? 'p-4' : 'p-6'}`}>
        {/* Header con icono */}
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {tasaExistente ? 'Editar Tasa de Cambio' : 'Añadir Nueva Moneda'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tasaExistente ? 'Modifica la tasa de cambio existente' : 'Define la tasa de conversión de una nueva moneda'}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selector de Moneda */}
          <div className="space-y-2">
            <label htmlFor="currencyCode" className="form-label">
              Moneda *
            </label>
            <select
              id="currencyCode"
              name="currencyCode"
              value={formData.currencyCode}
              onChange={handleInputChange}
              disabled={isLoading || !!tasaExistente}
              className={`form-input ${errors.currencyCode ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''} disabled:opacity-50`}
            >
              <option value="">Seleccionar moneda...</option>
              {monedasValidas.map((moneda, index) => (
                <option 
                  key={moneda.value || `moneda-${index}`} 
                  value={moneda.value || ''}
                >
                  {moneda.label}
                </option>
              ))}
            </select>
            {errors.currencyCode && (
              <p className="form-error">{errors.currencyCode}</p>
            )}
            {monedaSeleccionada && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Símbolo:</span>
                <span className="font-medium">{monedaSeleccionada.symbol}</span>
              </div>
            )}
          </div>

          {/* Campo de Tasa de Cambio */}
          <div className="space-y-2">
            <label htmlFor="rate" className="form-label">
              Tasa de Cambio *
            </label>
            <div className="relative">
              <input
                id="rate"
                name="rate"
                type="number"
                step="0.0001"
                min="0"
                value={formData.rate}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`form-input ${errors.rate ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''} disabled:opacity-50`}
                placeholder="Ej: 36.5000"
              />
            </div>
            {errors.rate && (
              <p className="form-error">{errors.rate}</p>
            )}
            
            {/* Información sobre la tasa */}
            <div className="flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                Cantidad de {primaryCurrency} por 1 unidad de {formData.currencyCode || 'esta moneda'}
              </span>
            </div>
          </div>

          {/* Ejemplo de conversión */}
          {formData.currencyCode && formData.rate && !isNaN(parseFloat(formData.rate)) && parseFloat(formData.rate) > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Ejemplo de Conversión
                </span>
              </div>
              <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  <strong>1 {formData.currencyCode}</strong> = {parseFloat(formData.rate).toFixed(4)} {primaryCurrency}
                </p>
                <p>
                  <strong>100 {formData.currencyCode}</strong> = {(parseFloat(formData.rate) * 100).toFixed(2)} {primaryCurrency}
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Footer con botones responsive */}
        <div className={`pt-4 border-t border-gray-200 dark:border-gray-700 ${
          isMobile ? 'space-y-3' : 'flex items-center justify-end gap-3'
        }`}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className={`btn-secondary ${isMobile ? 'w-full justify-center py-3 text-base' : ''}`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className={`btn-primary ${isMobile ? 'w-full justify-center py-3 text-base' : ''}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                {isMobile ? 'Procesando...' : (tasaExistente ? 'Actualizando...' : 'Creando...')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {tasaExistente ? 'Actualizar' : 'Crear'}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default TasaCambioModal
