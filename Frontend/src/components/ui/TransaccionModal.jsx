import React, { useState, useEffect } from 'react'
import { Loader2, TrendingDown, TrendingUp, ArrowRightLeft } from 'lucide-react'
import Modal from './Modal'
import useCuentas from '../../hooks/useCuentas'
import useConfiguracion from '../../hooks/useConfiguracion'
import { TRANSACTION_TYPE_LABELS } from '../../utils/constants'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Modal para crear/editar transacciones con pestañas
 */
const TransaccionModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  transaccion = null, 
  isLoading = false,
  isProgramada = false
}) => {
  const { cuentas } = useCuentas()
  const { categoriasIngresos, categoriasGastos } = useConfiguracion()
  
  const [tipoActivo, setTipoActivo] = useState('expense')
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    transactionDate: '',
    categoryId: '',
    fromAccountId: '',
    toAccountId: '',
    description: '',
    // Campos específicos para transacciones programadas
    frequency: 'monthly',
    startDate: '',
    startTime: '09:00', // Hora por defecto: 9:00 AM
    endDate: '',
    endTime: '23:59'
  })
  const [errors, setErrors] = useState({})

  const isEditing = Boolean(transaccion)

  // Tipos de transacción con iconos
  const tiposTransaccion = [
    {
      id: 'expense',
      label: 'Gasto',
      icon: TrendingDown,
      color: 'text-danger-600 border-danger-200 hover:bg-danger-50',
      activeColor: 'bg-danger-600 text-white border-danger-600'
    },
    {
      id: 'income',
      label: 'Ingreso',
      icon: TrendingUp,
      color: 'text-success-600 border-success-200 hover:bg-success-50',
      activeColor: 'bg-success-600 text-white border-success-600'
    },
    {
      id: 'transfer',
      label: 'Transferencia',
      icon: ArrowRightLeft,
      color: 'text-blue-600 border-blue-200 hover:bg-blue-50',
      activeColor: 'bg-blue-600 text-white border-blue-600'
    }
  ]

  // Resetear formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      if (isEditing && transaccion) {
        const tipo = isProgramada ? (transaccion.transaction_type || 'expense') : (transaccion.type || 'expense')
        setTipoActivo(tipo)
        
        if (isProgramada) {
          // Transacción programada
          setFormData({
            type: tipo,
            amount: transaccion.amount?.toString() || '',
            transactionDate: transaccion.start_date ? 
              format(new Date(transaccion.start_date), 'yyyy-MM-dd') : 
              format(new Date(), 'yyyy-MM-dd'),
            categoryId: transaccion.category_id?.toString() || '',
            fromAccountId: transaccion.source_account_id?.toString() || '',
            toAccountId: transaccion.destination_account_id?.toString() || '',
            description: transaccion.description || '',
            frequency: transaccion.frequency || 'monthly',
            startDate: transaccion.start_date ? 
              format(new Date(transaccion.start_date), 'yyyy-MM-dd') : 
              format(new Date(), 'yyyy-MM-dd'),
            startTime: transaccion.start_date ? 
              format(new Date(transaccion.start_date), 'HH:mm') : '09:00',
            endDate: transaccion.end_date ? 
              format(new Date(transaccion.end_date), 'yyyy-MM-dd') : '',
            endTime: transaccion.end_date ? 
              format(new Date(transaccion.end_date), 'HH:mm') : '23:59'
          })
        } else {
          // Transacción normal
          setFormData({
            type: tipo,
            amount: transaccion.amount?.toString() || '',
            transactionDate: transaccion.transaction_date ? 
              format(new Date(transaccion.transaction_date), 'yyyy-MM-dd') : 
              format(new Date(), 'yyyy-MM-dd'),
            categoryId: transaccion.category_id?.toString() || '',
            fromAccountId: transaccion.from_account_id?.toString() || '',
            toAccountId: transaccion.to_account_id?.toString() || '',
            description: transaccion.description || '',
            frequency: 'monthly',
            startDate: format(new Date(), 'yyyy-MM-dd'),
            startTime: '09:00',
            endDate: '',
            endTime: '23:59'
          })
        }
      } else {
        const fechaHoy = format(new Date(), 'yyyy-MM-dd')
        setTipoActivo('expense')
        setFormData({
          type: 'expense',
          amount: '',
          transactionDate: fechaHoy,
          categoryId: '',
          fromAccountId: '',
          toAccountId: '',
          description: '',
          frequency: 'monthly',
          startDate: fechaHoy,
          startTime: '09:00',
          endDate: '',
          endTime: '23:59'
        })
      }
      setErrors({})
    }
  }, [isOpen, isEditing, transaccion])

  /**
   * Cambiar tipo de transacción
   */
  const handleCambiarTipo = (nuevoTipo) => {
    setTipoActivo(nuevoTipo)
    setFormData(prev => ({
      ...prev,
      type: nuevoTipo,
      categoryId: '', // Limpiar categoría al cambiar tipo
      fromAccountId: nuevoTipo === 'income' ? '' : prev.fromAccountId,
      toAccountId: nuevoTipo === 'expense' ? '' : prev.toAccountId
    }))
    setErrors({}) // Limpiar errores
  }

  /**
   * Validar formulario según el tipo de transacción
   */
  const validateForm = () => {
    const newErrors = {}

    // Validar monto
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser un número positivo'
    }

    // Validar fecha
    if (isProgramada) {
      if (!formData.startDate) {
        newErrors.startDate = 'La fecha de inicio es requerida'
      }
      if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
        newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio'
      }
    } else {
      if (!formData.transactionDate) {
        newErrors.transactionDate = 'La fecha es requerida'
      }
    }

    // Validaciones específicas por tipo
    if (formData.type === 'expense') {
      if (!formData.fromAccountId) {
        newErrors.fromAccountId = 'Debe seleccionar una cuenta de origen'
      }
    } else if (formData.type === 'income') {
      if (!formData.toAccountId) {
        newErrors.toAccountId = 'Debe seleccionar una cuenta de destino'
      }
    } else if (formData.type === 'transfer') {
      if (!formData.fromAccountId) {
        newErrors.fromAccountId = 'Debe seleccionar una cuenta de origen'
      }
      if (!formData.toAccountId) {
        newErrors.toAccountId = 'Debe seleccionar una cuenta de destino'
      }
      if (formData.fromAccountId && formData.toAccountId && formData.fromAccountId === formData.toAccountId) {
        newErrors.toAccountId = 'Las cuentas de origen y destino deben ser diferentes'
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

    // Preparar datos según el tipo (normal o programada)
    let datosEnvio;
    
    if (isProgramada) {
      datosEnvio = {
        transaction_type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        category_id: formData.categoryId ? parseInt(formData.categoryId) : null,
        source_account_id: formData.fromAccountId ? parseInt(formData.fromAccountId) : null,
        destination_account_id: formData.toAccountId ? parseInt(formData.toAccountId) : null,
        frequency: formData.frequency,
        start_date: formData.startDate,
        start_time: formData.startTime,
        end_date: formData.endDate || null,
        end_time: formData.endDate ? formData.endTime : null,
        currency_code: 'USD' // Por defecto, podría ser dinámico
      }
    } else {
      datosEnvio = formData
    }

    const result = await onSave(datosEnvio)
    
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
   * Obtener categorías según el tipo de transacción
   */
  const obtenerCategorias = () => {
    return formData.type === 'income' ? categoriasIngresos : categoriasGastos
  }

  /**
   * Separar cuentas por tipo
   */
  const cuentasActivos = cuentas.filter(cuenta => cuenta.account_category === 'asset')
  const cuentasPasivos = cuentas.filter(cuenta => cuenta.account_category === 'liability')

  /**
   * Renderizar selector de cuentas con separación visual
   */
  const renderSelectorCuentas = (tipo, name, value, onChange, error, label) => {
    const cuentasParaTipo = tipo === 'todos' ? cuentas : 
                           tipo === 'activos' ? cuentasActivos : 
                           tipo === 'pasivos' ? cuentasPasivos : cuentas

    return (
      <div>
        <label htmlFor={name} className="form-label">
          {label} *
        </label>
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={`form-input ${error ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
          disabled={isLoading}
        >
          <option value="">Selecciona una cuenta</option>
          
          {/* Activos */}
          {(tipo === 'todos' || tipo === 'activos') && cuentasActivos.length > 0 && (
            <>
              <optgroup label="💰 Activos">
                {cuentasActivos
                  .filter(cuenta => name === 'fromAccountId' || cuenta.id.toString() !== formData.fromAccountId)
                  .map((cuenta) => (
                    <option key={cuenta.id} value={cuenta.id}>
                      {cuenta.name} - {cuenta.currency} {cuenta.current_balance}
                    </option>
                  ))}
              </optgroup>
            </>
          )}
          
          {/* Pasivos */}
          {(tipo === 'todos' || tipo === 'pasivos') && cuentasPasivos.length > 0 && (
            <>
              <optgroup label="💳 Pasivos">
                {cuentasPasivos
                  .filter(cuenta => name === 'fromAccountId' || cuenta.id.toString() !== formData.fromAccountId)
                  .map((cuenta) => (
                    <option key={cuenta.id} value={cuenta.id}>
                      {cuenta.name} - {cuenta.currency} {Math.abs(cuenta.current_balance)} (deuda)
                    </option>
                  ))}
              </optgroup>
            </>
          )}
        </select>
        {error && (
          <p className="form-error">{error}</p>
        )}
      </div>
    )
  }

  /**
   * Renderizar campos específicos según el tipo
   */
  const renderCamposEspecificos = () => {
    const categorias = obtenerCategorias()
    
    return (
      <div className="space-y-6">
        {/* GASTOS - Simplificado */}
        {formData.type === 'expense' && (
          <div>
            {renderSelectorCuentas(
              'todos',
              'fromAccountId',
              formData.fromAccountId,
              handleInputChange,
              errors.fromAccountId,
              'Desde la cuenta'
            )}
          </div>
        )}

        {/* INGRESOS - Simplificado */}
        {formData.type === 'income' && (
          <div>
            {renderSelectorCuentas(
              'todos',
              'toAccountId',
              formData.toAccountId,
              handleInputChange,
              errors.toAccountId,
              'Hacia la cuenta'
            )}
          </div>
        )}

        {/* TRANSFERENCIAS - Simplificado */}
        {formData.type === 'transfer' && (
          <div className="space-y-4">
            {renderSelectorCuentas(
              'todos',
              'fromAccountId',
              formData.fromAccountId,
              handleInputChange,
              errors.fromAccountId,
              'Desde la cuenta'
            )}
            
            {renderSelectorCuentas(
              'todos',
              'toAccountId',
              formData.toAccountId,
              handleInputChange,
              errors.toAccountId,
              'Hacia la cuenta'
            )}
          </div>
        )}

        {/* Campo Categoría (solo para ingresos y gastos) */}
        {formData.type !== 'transfer' && (
          <div>
            <label htmlFor="categoryId" className="form-label">
              Categoría (opcional)
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className="form-input"
              disabled={isLoading}
            >
              <option value="">Sin categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.name}
                </option>
              ))}
            </select>
            {categorias.length === 0 && (
              <p className="text-sm text-amber-600 mt-1">
                No hay categorías de {TRANSACTION_TYPE_LABELS[formData.type].toLowerCase()}. 
                Ve a Configuración para añadir categorías.
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isProgramada 
          ? (isEditing ? 'Editar Automatización' : 'Nueva Automatización')
          : (isEditing ? 'Editar Transacción' : 'Nueva Transacción')
      }
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pestañas de tipo de transacción */}
        <div>
          <label className="form-label mb-3">Tipo de Transacción *</label>
          <div className="grid grid-cols-3 gap-2">
            {tiposTransaccion.map((tipo) => {
              const Icon = tipo.icon
              const isActive = tipoActivo === tipo.id
              
              return (
                <button
                  key={tipo.id}
                  type="button"
                  onClick={() => handleCambiarTipo(tipo.id)}
                  disabled={isLoading}
                  className={`
                    p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all
                    ${isActive ? tipo.activeColor : `${tipo.color} bg-white border-gray-200`}
                  `}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{tipo.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Campo Monto */}
          <div>
            <label htmlFor="amount" className="form-label">
              Monto *
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={handleInputChange}
              className={`form-input ${errors.amount ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
              placeholder="0.00"
              disabled={isLoading}
              autoFocus
            />
            {errors.amount && (
              <p className="form-error">{errors.amount}</p>
            )}
          </div>

          {/* Campo Fecha - diferente según el tipo */}
          {isProgramada ? (
            <>
              {/* Fecha y hora de inicio para transacciones programadas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="form-label">
                    Fecha de inicio *
                  </label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={`form-input ${errors.startDate ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                    disabled={isLoading}
                  />
                  {errors.startDate && (
                    <p className="form-error">{errors.startDate}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="startTime" className="form-label">
                    Hora de ejecución *
                  </label>
                  <input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className={`form-input ${errors.startTime ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                    disabled={isLoading}
                  />
                  {errors.startTime && (
                    <p className="form-error">{errors.startTime}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Hora en que se ejecutará la transacción
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="transactionDate" className="form-label">
                Fecha *
              </label>
              <input
                id="transactionDate"
                name="transactionDate"
                type="date"
                value={formData.transactionDate}
                onChange={handleInputChange}
                className={`form-input ${errors.transactionDate ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                disabled={isLoading}
              />
              {errors.transactionDate && (
                <p className="form-error">{errors.transactionDate}</p>
              )}
            </div>
          )}
        </div>

        {/* Campos específicos según el tipo */}
        {renderCamposEspecificos()}

        {/* Campos adicionales para transacciones programadas */}
        {isProgramada && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo Frecuencia */}
            <div>
              <label htmlFor="frequency" className="form-label">
                Frecuencia *
              </label>
              <select
                id="frequency"
                name="frequency"
                value={formData.frequency}
                onChange={handleInputChange}
                className="form-input"
                disabled={isLoading}
              >
                <option value="once">Una vez</option>
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>

            {/* Campo Fecha y hora de fin (opcional) */}
            <div>
              <label className="form-label">
                Fecha de fin (opcional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className={`form-input ${errors.endDate ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                    disabled={isLoading}
                    placeholder="Fecha de finalización"
                  />
                  {errors.endDate && (
                    <p className="form-error">{errors.endDate}</p>
                  )}
                </div>
                
                <div>
                  <input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="form-input"
                    disabled={isLoading || !formData.endDate}
                    placeholder="Hora de finalización"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Hora límite (opcional)
                  </p>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Si no se especifica fecha de fin, la automatización continuará según la frecuencia seleccionada
              </p>
            </div>
            
            {/* Resumen de programación */}
            {formData.startDate && formData.startTime && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  📅 Resumen de Automatización
                </h4>
                <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    <span className="font-medium">Primera ejecución:</span> {' '}
                    {format(new Date(formData.startDate + 'T' + formData.startTime), 'EEEE, dd \'de\' MMMM \'de\' yyyy \'a las\' h:mm a', { locale: es })}
                  </p>
                  <p>
                    <span className="font-medium">Frecuencia:</span> {' '}
                    {formData.frequency === 'once' && 'Una sola vez'}
                    {formData.frequency === 'daily' && 'Diariamente a las ' + format(new Date('2000-01-01T' + formData.startTime), 'h:mm a', { locale: es })}
                    {formData.frequency === 'weekly' && 'Semanalmente los ' + format(new Date(formData.startDate), 'EEEE', { locale: es }) + ' a las ' + format(new Date('2000-01-01T' + formData.startTime), 'h:mm a', { locale: es })}
                    {formData.frequency === 'monthly' && 'Mensualmente el día ' + format(new Date(formData.startDate), 'd') + ' a las ' + format(new Date('2000-01-01T' + formData.startTime), 'h:mm a', { locale: es })}
                  </p>
                  {formData.endDate && (
                    <p>
                      <span className="font-medium">Finaliza:</span> {' '}
                      {format(new Date(formData.endDate + 'T' + formData.endTime), 'EEEE, dd \'de\' MMMM \'de\' yyyy \'a las\' h:mm a', { locale: es })}
                    </p>
                  )}
                  {!formData.endDate && formData.frequency !== 'once' && (
                    <p className="text-amber-600 dark:text-amber-400">
                      <span className="font-medium">⚠️ Sin fecha límite:</span> Continuará indefinidamente
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Campo Descripción */}
        <div>
          <label htmlFor="description" className="form-label">
            Descripción (opcional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            className="form-input resize-none"
            placeholder="Detalles adicionales sobre esta transacción..."
            disabled={isLoading}
          />
        </div>

        {/* Información según el tipo */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
            {isProgramada ? (
              <>
                {formData.type === 'expense' && (
                  <li>• Se creará automáticamente un gasto desde la cuenta seleccionada</li>
                )}
                {formData.type === 'income' && (
                  <li>• Se creará automáticamente un ingreso hacia la cuenta seleccionada</li>
                )}
                {formData.type === 'transfer' && (
                  <li>• Se creará automáticamente una transferencia entre las cuentas seleccionadas</li>
                )}
                <li>• La automatización se ejecutará según la frecuencia configurada</li>
                <li>• Puedes pausar o modificar la automatización en cualquier momento</li>
                <li>• Si configuras una fecha de fin, la automatización se detendrá automáticamente</li>
              </>
            ) : (
              <>
                {formData.type === 'expense' && (
                  <li>• El dinero se restará de la cuenta seleccionada</li>
                )}
                {formData.type === 'income' && (
                  <li>• El dinero se agregará a la cuenta seleccionada</li>
                )}
                {formData.type === 'transfer' && (
                  <li>• El dinero se moverá de la cuenta de origen a la cuenta de destino</li>
                )}
                <li>• El saldo se actualizará automáticamente después de la transacción</li>
                <li>• La transacción aparecerá en el historial de movimientos</li>
              </>
            )}
          </ul>
        </div>

        {/* Validación de cuentas disponibles */}
        {cuentas.length === 0 && (
          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-800">
              No tienes cuentas registradas. Debes crear al menos una cuenta antes de registrar transacciones.
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
              cuentas.length === 0 || 
              !formData.amount || 
              (isProgramada ? (!formData.startDate) : (!formData.transactionDate))
            }
            className="btn-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                {isEditing ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              isProgramada 
                ? (isEditing ? 'Actualizar Automatización' : 'Crear Automatización')
                : (isEditing ? 'Actualizar Transacción' : 'Crear Transacción')
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default TransaccionModal