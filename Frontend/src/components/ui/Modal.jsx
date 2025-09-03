import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import useResponsive from '../../hooks/useResponsive'

/**
 * Componente Modal reutilizable
 * Proporciona una base para modales con animaciones
 * DISEÑO EXCLUSIVO MÓVIL: Todos los modales centrados
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'standard',
  fullscreenMobile = false,
  showCloseButton = true 
}) => {
  const { isMobile } = useResponsive()
  
  // Mapeo de tamaños a nuestras clases CSS
  const sizeClasses = {
    small: 'modal-small',
    standard: 'modal-standard', 
    large: 'modal-large'
  }

  // Manejar tecla Escape
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Determinar clases del modal
  const getModalClasses = () => {
    if (fullscreenMobile) {
      return 'modal-fullscreen-mobile'
    }
    return sizeClasses[size] || sizeClasses.standard
  }

  // Animaciones adaptativas específicas para móvil
  const getAnimationProps = () => {
    if (isMobile) {
      // Todos los modales en móvil: aparición centrada con fade y scale
      return {
        initial: { opacity: 0, scale: 0.9, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.9, y: 20 }
      }
    }
    
    // Desktop: animación suave centrada
    return {
      initial: { opacity: 0, scale: 0.96, y: 10 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.96, y: 10 }
    }
  }

  // Animaciones del overlay
  const getOverlayAnimationProps = () => {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay"
          onClick={onClose}
          {...getOverlayAnimationProps()}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <motion.div
            {...getAnimationProps()}
            transition={{ 
              duration: 0.3, 
              ease: 'easeOut',
              type: 'tween'
            }}
            className={getModalClasses()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="modal-header">
                {title && (
                  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white truncate ${
                    isMobile ? 'text-center flex-1' : ''
                  }`}>
                    {title}
                  </h3>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={`flex-shrink-0 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      isMobile ? 'absolute right-4 top-4' : ''
                    }`}
                    aria-label="Cerrar modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className={`modal-body ${isMobile ? '' : 'p-4 sm:p-6'}`}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Modal