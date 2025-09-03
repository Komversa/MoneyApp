import { useState, useCallback } from 'react'

/**
 * Hook para manejar diálogos de confirmación de forma asíncrona
 * @returns {Object} Objeto con la función getConfirmation y estado del modal
 */
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState(null)
  const [resolvePromise, setResolvePromise] = useState(null)

  /**
   * Función principal para obtener confirmación del usuario
   * @param {Object} options - Opciones de configuración del diálogo
   * @returns {Promise<boolean>} Promise que se resuelve a true si confirma, false si cancela
   */
  const getConfirmation = useCallback((options) => {
    return new Promise((resolve) => {
      setConfig(options)
      setResolvePromise(() => resolve)
      setIsOpen(true)
    })
  }, [])

  /**
   * Maneja la confirmación del usuario
   */
  const handleConfirm = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(true)
    }
    setIsOpen(false)
    setConfig(null)
    setResolvePromise(null)
  }, [resolvePromise])

  /**
   * Maneja la cancelación del usuario
   */
  const handleCancel = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(false)
    }
    setIsOpen(false)
    setConfig(null)
    setResolvePromise(null)
  }, [resolvePromise])

  /**
   * Maneja el cierre del modal (X o Escape)
   */
  const handleClose = useCallback(() => {
    handleCancel()
  }, [handleCancel])

  return {
    getConfirmation,
    isOpen,
    config,
    handleConfirm,
    handleCancel,
    handleClose
  }
}
