import React, { useState, useEffect } from 'react'
import { Loader2, CreditCard } from 'lucide-react'
import Modal from './Modal'

/**
 * Modal para crear/editar tipos de deuda
 */
const TipoDeudaModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  tipoDeuda = null, 
  isLoading = false 
}) => {
  const [nombre, setNombre] = useState('')
  const [errors, setErrors] = useState({})

  const isEditing = Boolean(tipoDeuda)

  // Resetear formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      if (isEditing && tipoDeuda) {
        setNombre(tipoDeuda.name || '')
      } else {
        setNombre('')
      }
      setErrors({})
    }
  }, [isOpen, isEditing, tipoDeuda])

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

    const result = await onSave(nombre.trim())
    
    if (result?.success) {
      onClose()
    }
  }

  /**
   * Manejar cambio en el input
   */
  const handleInputChange = (e) => {
    const value = e.target.value
    setNombre(value)
    
    // Limpiar error del campo si hay
    if (errors.nombre) {
      setErrors(prev => ({ ...prev, nombre: '' }))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Tipo de Deuda' : 'Nuevo Tipo de Deuda'}
      size="small"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo Nombre */}
        <div>
          <label htmlFor="nombre" className="form-label">
            Nombre del Tipo de Deuda
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={nombre}
            onChange={handleInputChange}
            className={`form-input ${errors.nombre ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
            placeholder="Ej: Tarjeta de Crédito, Préstamo Personal"
            disabled={isLoading}
            autoFocus
          />
          {errors.nombre && (
            <p className="form-error">{errors.nombre}</p>
          )}
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

export default TipoDeudaModal
