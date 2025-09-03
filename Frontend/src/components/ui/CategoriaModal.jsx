import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from './Modal'
import { TRANSACTION_TYPE_LABELS } from '../../utils/constants'

/**
 * Modal para crear/editar categorías
 */
const CategoriaModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  categoria = null, 
  isLoading = false 
}) => {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('expense')
  const [errors, setErrors] = useState({})

  const isEditing = Boolean(categoria)

  // Resetear formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      if (isEditing && categoria) {
        setNombre(categoria.name || '')
        setTipo(categoria.type || 'expense')
      } else {
        setNombre('')
        setTipo('expense')
      }
      setErrors({})
    }
  }, [isOpen, isEditing, categoria])

  /**
   * Validar formulario
   */
  const validateForm = () => {
    const newErrors = {}

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    } else if (nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres'
    } else if (nombre.trim().length > 100) {
      newErrors.nombre = 'El nombre no puede exceder los 100 caracteres'
    }

    if (!tipo || !['income', 'expense'].includes(tipo)) {
      newErrors.tipo = 'Debe seleccionar un tipo válido'
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

    const result = await onSave(nombre.trim(), tipo)
    
    if (result?.success) {
      onClose()
    }
  }

  /**
   * Manejar cambio en el input nombre
   */
  const handleInputChange = (e) => {
    const value = e.target.value
    setNombre(value)
    
    // Limpiar error del campo si hay
    if (errors.nombre) {
      setErrors(prev => ({ ...prev, nombre: '' }))
    }
  }

  /**
   * Manejar cambio en el select tipo
   */
  const handleTipoChange = (e) => {
    const value = e.target.value
    setTipo(value)
    
    // Limpiar error del campo si hay
    if (errors.tipo) {
      setErrors(prev => ({ ...prev, tipo: '' }))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
      size="small"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo Nombre */}
        <div>
          <label htmlFor="nombre" className="form-label">
            Nombre de la Categoría
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={nombre}
            onChange={handleInputChange}
            className={`form-input ${errors.nombre ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
            placeholder="Ej: Comida, Transporte, Salario"
            disabled={isLoading}
            autoFocus
          />
          {errors.nombre && (
            <p className="form-error">{errors.nombre}</p>
          )}
        </div>

        {/* Campo Tipo */}
        <div>
          <label htmlFor="tipo" className="form-label">
            Tipo de Categoría
          </label>
          <select
            id="tipo"
            name="tipo"
            value={tipo}
            onChange={handleTipoChange}
            className={`form-input ${errors.tipo ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
            disabled={isLoading}
          >
            <option value="expense">{TRANSACTION_TYPE_LABELS.expense}</option>
            <option value="income">{TRANSACTION_TYPE_LABELS.income}</option>
          </select>
          {errors.tipo && (
            <p className="form-error">{errors.tipo}</p>
          )}
        </div>

        {/* Descripción del tipo */}
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-600">
            {tipo === 'income' ? (
              <span>
                <strong>Ingreso:</strong> Para categorizar dinero que entra (salario, ventas, etc.)
              </span>
            ) : (
              <span>
                <strong>Gasto:</strong> Para categorizar dinero que sale (comida, transporte, etc.)
              </span>
            )}
          </p>
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
            disabled={isLoading || !nombre.trim()}
            className="btn-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                {isEditing ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              isEditing ? 'Actualizar' : 'Crear'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CategoriaModal