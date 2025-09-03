import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import useResponsive from '../../hooks/useResponsive'

/**
 * Componente de diálogo de confirmación moderno y responsivo
 * REDISEÑADO EXCLUSIVAMENTE PARA MÓVIL
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Estado de apertura del modal
 * @param {Object} props.config - Configuración del diálogo
 * @param {Function} props.onConfirm - Función a ejecutar al confirmar
 * @param {Function} props.onCancel - Función a ejecutar al cancelar
 * @param {Function} props.onClose - Función a ejecutar al cerrar
 */
const ConfirmDialog = ({ isOpen, config, onConfirm, onCancel, onClose }) => {
  const { isMobile } = useResponsive()
  // Manejar tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!config) return null

  const { title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'default' } = config

  // Configuración de variantes
  const variantConfig = {
    default: {
      icon: CheckCircle,
      iconColor: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
      borderColor: 'border-primary-200 dark:border-primary-800',
      buttonColor: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
      titleColor: 'text-gray-900 dark:text-white'
    },
    danger: {
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      titleColor: 'text-red-900 dark:text-red-100'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      buttonColor: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400',
      titleColor: 'text-amber-800 dark:text-amber-100'
    }
  }

  const currentVariant = variantConfig[variant]
  const IconComponent = currentVariant.icon

  // Animaciones específicas para móvil
  const getAnimationProps = () => {
    if (isMobile) {
      return {
        initial: { opacity: 0, scale: 0.9, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.9, y: 20 }
      }
    }
    return {
      initial: { opacity: 0, scale: 0.96, y: 10 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.96, y: 10 }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay" 
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <motion.div
            {...getAnimationProps()}
            transition={{ 
              duration: isMobile ? 0.35 : 0.3, 
              ease: isMobile ? [0.16, 1, 0.3, 1] : 'easeOut',
              type: 'tween'
            }}
            className="modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header móvil optimizado */}
            <div className={`modal-header ${currentVariant.bgColor} ${
              isMobile ? 'text-center relative' : ''
            }`}>
              <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'space-x-3'}`}>
                <IconComponent className={`h-6 w-6 ${currentVariant.iconColor} ${
                  isMobile ? 'mx-auto' : ''
                }`} />
                <h2 className={`text-lg font-bold ${currentVariant.titleColor} ${
                  isMobile ? 'text-center' : ''
                }`}>
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isMobile ? 'absolute right-4 top-4' : ''
                }`}
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">
              <div className={`text-gray-700 dark:text-gray-300 leading-relaxed ${
                isMobile ? 'text-center text-base' : ''
              }`}>
                {typeof message === 'string' ? (
                  <div className="whitespace-pre-line">
                    {message}
                  </div>
                ) : (
                  message
                )}
              </div>
            </div>

            {/* Footer móvil optimizado */}
            <div className="modal-footer">
              <button
                onClick={onCancel}
                className={`px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-all ${
                  isMobile ? 'text-base font-semibold py-3' : ''
                }`}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white ${currentVariant.buttonColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                  isMobile ? 'text-base font-semibold py-3' : ''
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmDialog
