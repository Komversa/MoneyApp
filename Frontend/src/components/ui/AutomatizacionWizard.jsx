import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, TrendingDown, TrendingUp, ArrowRightLeft, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Modal from './Modal'
import useCuentas from '../../hooks/useCuentas'
import useConfiguracion from '../../hooks/useConfiguracion'
import useResponsive from '../../hooks/useResponsive'
import { TRANSACTION_TYPE_LABELS } from '../../utils/constants'
import { formatCurrency } from '../../utils/formatters'

/**
 * Asistente de Automatización - Proceso de dos pasos
 * Paso 1: Detalles de la transacción (idéntico al modal normal)
 * Paso 2: Programación y horario (configuración avanzada)
 */
const AutomatizacionWizard = ({ 
  isOpen, 
  onClose, 
  onSave, 
  transaccion = null, 
  isLoading = false 
}) => {
  const { cuentas, cuentasActivos, cuentasPasivos } = useCuentas()
  const { categoriasIngresos, categoriasGastos, configuracionUsuario } = useConfiguracion()
  const { isMobile } = useResponsive()
  
  // Estados del wizard
  const [currentStep, setCurrentStep] = useState(1)
  const [tipoActivo, setTipoActivo] = useState('expense')
  
  // Datos del formulario (combinados de ambos pasos)
  const [formData, setFormData] = useState({
    // Paso 1: Detalles básicos
    type: 'expense',
    amount: '',
    description: '',
    categoryId: '',
    fromAccountId: '',
    toAccountId: '',
    
    // Paso 2: Programación
    frequency: 'monthly',
    startDate: '',
    startTime: '09:00',
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
      color: 'text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20',
      activeColor: 'bg-red-600 text-white border-red-600'
    },
    {
      id: 'income',
      label: 'Ingreso',
      icon: TrendingUp,
      color: 'text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20',
      activeColor: 'bg-green-600 text-white border-green-600'
    },
    {
      id: 'transfer',
      label: 'Transferencia',
      icon: ArrowRightLeft,
      color: 'text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20',
      activeColor: 'bg-blue-600 text-white border-blue-600'
    }
  ]

  // Inicializar formulario
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1)
      
      if (isEditing && transaccion) {
        // Modo edición
        const tipo = transaccion.transaction_type
        setTipoActivo(tipo)
        setFormData({
          type: tipo,
          amount: transaccion.amount?.toString() || '',
          description: transaccion.description || '',
          categoryId: transaccion.category_id?.toString() || '',
          fromAccountId: transaccion.source_account_id?.toString() || '',
          toAccountId: transaccion.destination_account_id?.toString() || '',
          frequency: transaccion.frequency || 'monthly',
          startDate: transaccion.start_date ? 
            format(new Date(transaccion.start_date), 'yyyy-MM-dd') : 
            format(new Date(), 'yyyy-MM-dd'),
          startTime: transaccion.start_time ? 
            (transaccion.start_time.length > 5 ? transaccion.start_time.substring(0, 5) : transaccion.start_time) : 
            '09:00',
          endDate: transaccion.end_date ? 
            format(new Date(transaccion.end_date), 'yyyy-MM-dd') : '',
          endTime: transaccion.end_time ? 
            (transaccion.end_time.length > 5 ? transaccion.end_time.substring(0, 5) : transaccion.end_time) : 
            '23:59'
        })
      } else {
        // Modo creación
        const fechaHoy = format(new Date(), 'yyyy-MM-dd')
        setTipoActivo('expense')
        setFormData({
          type: 'expense',
          amount: '',
          description: '',
          categoryId: '',
          fromAccountId: '',
          toAccountId: '',
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

  // Manejar cambios en inputs
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

  // Manejar cambio de tipo de transacción
  const handleTipoChange = (tipo) => {
    setTipoActivo(tipo)
    setFormData(prev => ({
      ...prev,
      type: tipo,
      categoryId: '', // Reset categoría al cambiar tipo
      fromAccountId: tipo === 'income' ? '' : prev.fromAccountId,
      toAccountId: tipo === 'expense' ? '' : prev.toAccountId
    }))
  }

  // Validar paso 1
  const validateStep1 = () => {
    const newErrors = {}

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser un número positivo'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida'
    }

    // Validar cuentas según el tipo
    if (formData.type === 'expense' && !formData.fromAccountId) {
      newErrors.fromAccountId = 'Selecciona la cuenta de origen'
    }
    
    if (formData.type === 'income' && !formData.toAccountId) {
      newErrors.toAccountId = 'Selecciona la cuenta destino'
    }
    
    if (formData.type === 'transfer') {
      if (!formData.fromAccountId) {
        newErrors.fromAccountId = 'Selecciona la cuenta de origen'
      }
      if (!formData.toAccountId) {
        newErrors.toAccountId = 'Selecciona la cuenta destino'
      }
      if (formData.fromAccountId === formData.toAccountId) {
        newErrors.toAccountId = 'Las cuentas deben ser diferentes'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validar paso 2
  const validateStep2 = () => {
    const newErrors = {}

    if (!formData.startDate) {
      newErrors.startDate = 'La fecha de inicio es requerida'
    }

    if (!formData.startTime) {
      newErrors.startTime = 'La hora de inicio es requerida'
    }

    if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Avanzar al siguiente paso
  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2)
    }
  }

  // Retroceder al paso anterior
  const handlePrevStep = () => {
    setCurrentStep(1)
  }

  // Obtener moneda de la cuenta seleccionada
  const getCurrencyFromAccount = () => {
    let accountId = null
    
    // Seleccionar la cuenta apropiada según el tipo de transacción
    switch (formData.type) {
      case 'expense':
        // Para gastos, usar la cuenta de origen (desde donde sale el dinero)
        accountId = formData.fromAccountId
        break
      case 'income':
        // Para ingresos, usar la cuenta destino (donde llega el dinero)
        accountId = formData.toAccountId
        break
      case 'transfer':
        // Para transferencias, usar la cuenta de origen (desde donde sale)
        accountId = formData.fromAccountId
        break
      default:
        accountId = formData.fromAccountId || formData.toAccountId
    }
    
    if (!accountId) return 'USD' // Fallback por defecto
    
    const cuenta = cuentas.find(c => c.id === parseInt(accountId))
    return cuenta?.currency || 'USD'
  }

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateStep2()) return

    // Obtener moneda de la cuenta seleccionada
    const currencyFromAccount = getCurrencyFromAccount()

    // Preparar datos para envío
    const datosEnvio = {
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
      currency_code: currencyFromAccount
    }

    console.log('🚀 [Frontend] Enviando datos de automatización:', {
      start_time: formData.startTime,
      end_time: formData.endTime,
      start_date: formData.startDate,
      end_date: formData.endDate,
      isEditing
    });

    await onSave(datosEnvio)
  }

  // Obtener categorías según el tipo
  const getCategorias = () => {
    if (formData.type === 'income') return categoriasIngresos
    if (formData.type === 'expense') return categoriasGastos
    return []
  }

  // Generar vista previa de la programación
  const generatePreview = () => {
    if (!formData.startDate || !formData.startTime) return null

    const firstExecution = format(
      new Date(formData.startDate + 'T' + formData.startTime), 
      'EEEE, dd \'de\' MMMM \'de\' yyyy \'a las\' h:mm a', 
      { locale: es }
    )

    let frequencyText = ''
    if (formData.frequency === 'once') {
      frequencyText = 'Una sola vez'
    } else if (formData.frequency === 'daily') {
      frequencyText = `Diariamente a las ${format(new Date('2000-01-01T' + formData.startTime), 'h:mm a', { locale: es })}`
    } else if (formData.frequency === 'weekly') {
      frequencyText = `Semanalmente los ${format(new Date(formData.startDate), 'EEEE', { locale: es })} a las ${format(new Date('2000-01-01T' + formData.startTime), 'h:mm a', { locale: es })}`
    } else if (formData.frequency === 'monthly') {
      frequencyText = `Mensualmente el día ${format(new Date(formData.startDate), 'd')} a las ${format(new Date('2000-01-01T' + formData.startTime), 'h:mm a', { locale: es })}`
    }

    // Información adicional sobre monto y moneda
    let transactionInfo = ''
    if (formData.amount && formData.description) {
      const currency = getCurrencyFromAccount()
      const formattedAmount = formatCurrency(parseFloat(formData.amount), currency)
      const typePrefix = formData.type === 'expense' ? '-' : formData.type === 'income' ? '+' : ''
      transactionInfo = `${typePrefix}${formattedAmount} - ${formData.description}`
    }

    return { firstExecution, frequencyText, transactionInfo }
  }

  const preview = generatePreview()

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large" fullscreenMobile={true} showCloseButton={false}>
      <div className="relative">
        {/* Header con progreso */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Editar Automatización' : 'Nueva Automatización'}
            </h2>
            
            {/* Indicador de progreso compacto */}
            <div className="flex items-center space-x-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep >= 1 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                1
              </div>
              <div className={`w-3 h-0.5 rounded ${
                currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep >= 2 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                2
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Contenido del formulario */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Título del paso */}
                <div className="text-center">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    ✏️ Detalles de la Transacción
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Define qué transacción quieres automatizar
                  </p>
                </div>

                {/* Tipo de Transacción */}
                <div>
                  <label className="form-label">Tipo de Transacción *</label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {tiposTransaccion.map((tipo) => {
                      const IconComponent = tipo.icon
                      const isActive = tipoActivo === tipo.id
                      
                      return (
                        <button
                          key={tipo.id}
                          type="button"
                          onClick={() => handleTipoChange(tipo.id)}
                          className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${
                            isActive ? tipo.activeColor : `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${tipo.color}`
                          }`}
                        >
                          <IconComponent className="h-6 w-6 mb-2" />
                          <span className="text-sm font-medium">{tipo.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Monto y Descripción */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="amount" className="form-label">Monto *</label>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className={`form-input ${errors.amount ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="0.00"
                      disabled={isLoading}
                    />
                    {errors.amount && (
                      <p className="form-error">{errors.amount}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="description" className="form-label">Descripción *</label>
                    <input
                      id="description"
                      name="description"
                      type="text"
                      value={formData.description}
                      onChange={handleInputChange}
                      className={`form-input ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Ej: Renta mensual"
                      disabled={isLoading}
                    />
                    {errors.description && (
                      <p className="form-error">{errors.description}</p>
                    )}
                  </div>
                </div>

                {/* Cuentas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(formData.type === 'expense' || formData.type === 'transfer') && (
                    <div>
                      <label htmlFor="fromAccountId" className="form-label">
                        Desde la cuenta *
                      </label>
                      <select
                        id="fromAccountId"
                        name="fromAccountId"
                        value={formData.fromAccountId}
                        onChange={handleInputChange}
                        className={`form-input ${errors.fromAccountId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        disabled={isLoading}
                        style={{ appearance: 'none' }}
                      >
                        <option value="">Selecciona una cuenta</option>
                        
                        {/* Activos */}
                        {cuentasActivos.length > 0 && (
                          <optgroup label="💰 Activos">
                            {cuentasActivos.map((cuenta) => (
                              <option key={cuenta.id} value={cuenta.id}>
                                {cuenta.name} - {cuenta.currency} {cuenta.current_balance}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        
                        {/* Pasivos */}
                        {cuentasPasivos.length > 0 && (
                          <optgroup label="💳 Pasivos">
                            {cuentasPasivos.map((cuenta) => (
                              <option key={cuenta.id} value={cuenta.id}>
                                {cuenta.name} - {cuenta.currency} {Math.abs(cuenta.current_balance)} (deuda)
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      {errors.fromAccountId && (
                        <p className="form-error">{errors.fromAccountId}</p>
                      )}
                    </div>
                  )}

                  {(formData.type === 'income' || formData.type === 'transfer') && (
                    <div>
                      <label htmlFor="toAccountId" className="form-label">
                        Hacia la cuenta *
                      </label>
                      <select
                        id="toAccountId"
                        name="toAccountId"
                        value={formData.toAccountId}
                        onChange={handleInputChange}
                        className={`form-input ${errors.toAccountId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        disabled={isLoading}
                        style={{ appearance: 'none' }}
                      >
                        <option value="">Selecciona una cuenta</option>
                        
                        {/* Activos */}
                        {cuentasActivos.length > 0 && (
                          <optgroup label="💰 Activos">
                            {cuentasActivos
                              .filter(cuenta => cuenta.id.toString() !== formData.fromAccountId)
                              .map((cuenta) => (
                                <option key={cuenta.id} value={cuenta.id}>
                                  {cuenta.name} - {cuenta.currency} {cuenta.current_balance}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        
                        {/* Pasivos */}
                        {cuentasPasivos.length > 0 && (
                          <optgroup label="💳 Pasivos">
                            {cuentasPasivos
                              .filter(cuenta => cuenta.id.toString() !== formData.fromAccountId)
                              .map((cuenta) => (
                                <option key={cuenta.id} value={cuenta.id}>
                                  {cuenta.name} - {cuenta.currency} {Math.abs(cuenta.current_balance)} (deuda)
                                </option>
                              ))}
                          </optgroup>
                        )}
                      </select>
                      {errors.toAccountId && (
                        <p className="form-error">{errors.toAccountId}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Categoría */}
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
                      style={{ appearance: 'none' }}
                    >
                      <option value="">Sin categoría</option>
                      {getCategorias().map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Título del paso */}
                <div className="text-center">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    ⏰ Programación y Horario
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Configura cuándo y con qué frecuencia se ejecutará
                  </p>
                </div>

                {/* Grid de tres columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Columna 1: Programación de Horario */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                        Programación
                      </h4>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="startDate" className="form-label text-blue-800 dark:text-blue-200">
                          Fecha de inicio *
                        </label>
                        <input
                          id="startDate"
                          name="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          className={`form-input ${errors.startDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-blue-300 focus:border-blue-500 focus:ring-blue-500'}`}
                          disabled={isLoading}
                        />
                        {errors.startDate && (
                          <p className="form-error">{errors.startDate}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="startTime" className="form-label text-blue-800 dark:text-blue-200">
                          Hora de ejecución *
                        </label>
                        <select
                          id="startTime"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          className={`form-input ${errors.startTime ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-blue-300 focus:border-blue-500 focus:ring-blue-500'}`}
                          disabled={isLoading}
                          style={{ appearance: 'none' }}
                        >
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0') + ':00';
                            const displayHour = i === 0 ? '12:00 AM' :
                                              i < 12 ? `${i}:00 AM` :
                                              i === 12 ? '12:00 PM' :
                                              `${i - 12}:00 PM`;
                            return (
                              <option key={hour} value={hour}>
                                {displayHour}
                              </option>
                            );
                          })}
                        </select>
                        {errors.startTime && (
                          <p className="form-error">{errors.startTime}</p>
                        )}
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          ⏰ Las transacciones se ejecutan al inicio de cada hora (minuto :00)
                        </div>
                      </div>

                      <div>
                        <label htmlFor="frequency" className="form-label text-blue-800 dark:text-blue-200">
                          Frecuencia *
                        </label>
                        <select
                          id="frequency"
                          name="frequency"
                          value={formData.frequency}
                          onChange={handleInputChange}
                          className="form-input border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                          disabled={isLoading}
                          style={{ appearance: 'none' }}
                        >
                          <option value="once">Una sola vez</option>
                          <option value="daily">Diariamente</option>
                          <option value="weekly">Semanalmente</option>
                          <option value="monthly">Mensualmente</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Columna 2: Finalización */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                        Finalización
                      </h4>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="endDate" className="form-label text-amber-800 dark:text-amber-200">
                          Fecha de fin (opcional)
                        </label>
                        <input
                          id="endDate"
                          name="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={handleInputChange}
                          className={`form-input ${errors.endDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-amber-300 focus:border-amber-500 focus:ring-amber-500'}`}
                          disabled={isLoading || formData.frequency === 'once'}
                        />
                        {errors.endDate && (
                          <p className="form-error">{errors.endDate}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="endTime" className="form-label text-amber-800 dark:text-amber-200">
                          Hora de fin (opcional)
                        </label>
                        <select
                          id="endTime"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleInputChange}
                          className="form-input border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                          disabled={isLoading || !formData.endDate || formData.frequency === 'once'}
                          style={{ appearance: 'none' }}
                        >
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0') + ':00';
                            const displayHour = i === 0 ? '12:00 AM' :
                                              i < 12 ? `${i}:00 AM` :
                                              i === 12 ? '12:00 PM' :
                                              `${i - 12}:00 PM`;
                            return (
                              <option key={hour} value={hour}>
                                {displayHour}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {formData.frequency === 'once' && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            💡 Para transacciones únicas no necesitas fecha de fin
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Columna 3: Vista Previa */}
                  {preview && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <h4 className="font-semibold text-green-900 dark:text-green-100">
                          Vista Previa
                        </h4>
                      </div>

                      <div className="space-y-4">
                        {preview.transactionInfo && (
                          <div>
                            <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                              Transacción:
                            </p>
                            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                              {preview.transactionInfo}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                            Primera ejecución:
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {preview.firstExecution}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                            Se repetirá:
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {preview.frequencyText}
                          </p>
                        </div>

                        {formData.endDate && (
                          <div>
                            <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                              Finaliza:
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {format(new Date(formData.endDate + 'T' + formData.endTime), 'dd \'de\' MMMM \'de\' yyyy \'a las\' h:mm a', { locale: es })}
                            </p>
                          </div>
                        )}

                        {!formData.endDate && formData.frequency !== 'once' && (
                          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <p className="text-xs text-amber-800 dark:text-amber-200">
                              ⚠️ Continuará indefinidamente
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botones de navegación */}
          <div className={`pt-4 border-t border-gray-200 dark:border-gray-700 ${
            isMobile ? 'space-y-3' : 'flex items-center justify-between'
          }`}>
            {/* Botón Atrás - Solo en paso 2 */}
            {currentStep === 2 && (
              <div className={isMobile ? 'w-full' : ''}>
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className={`btn-secondary ${isMobile ? 'w-full justify-center py-3 text-base' : ''}`}
                  disabled={isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Atrás
                </button>
              </div>
            )}

            {/* Botones principales */}
            <div className={`${isMobile ? 'space-y-3' : 'flex space-x-3'}`}>
              {/* Botón Cancelar */}
              <button
                type="button"
                onClick={onClose}
                className={`btn-secondary ${isMobile ? 'w-full justify-center py-3 text-base' : ''}`}
                disabled={isLoading}
              >
                Cancelar
              </button>

              {/* Botón Siguiente o Crear/Actualizar */}
              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`btn-primary ${isMobile ? 'w-full justify-center py-3 text-base' : ''}`}
                  disabled={isLoading}
                >
                  {isMobile ? 'Siguiente' : 'Siguiente: Programar'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              ) : (
                <form onSubmit={handleSubmit} className={isMobile ? 'w-full' : 'inline'}>
                  <button
                    type="submit"
                    className={`btn-primary ${isMobile ? 'w-full justify-center py-3 text-base' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isMobile ? 'Procesando...' : (isEditing ? 'Actualizando...' : 'Creando...')}
                      </>
                    ) : (
                      <>
                        {isMobile ? (isEditing ? 'Actualizar' : 'Crear') : (isEditing ? 'Actualizar Automatización' : 'Crear Automatización')}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default AutomatizacionWizard
