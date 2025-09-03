import { createContext, useContext } from 'react'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import ConfirmDialog from '../components/ui/ConfirmDialog'

// Crear el contexto
const ConfirmDialogContext = createContext()

/**
 * Hook personalizado para usar el contexto de confirmación
 * @returns {Object} Objeto con la función getConfirmation
 */
export const useConfirmDialogContext = () => {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error('useConfirmDialogContext debe ser usado dentro de ConfirmDialogProvider')
  }
  return context
}

/**
 * Provider del contexto de confirmación
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export const ConfirmDialogProvider = ({ children }) => {
  const confirmDialog = useConfirmDialog()

  return (
    <ConfirmDialogContext.Provider value={confirmDialog}>
      {children}
      
      {/* Renderizar el modal de confirmación a nivel raíz */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        config={confirmDialog.config}
        onConfirm={confirmDialog.handleConfirm}
        onCancel={confirmDialog.handleCancel}
        onClose={confirmDialog.handleClose}
      />
    </ConfirmDialogContext.Provider>
  )
}
