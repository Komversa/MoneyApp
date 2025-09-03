import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import useResponsive from '../../hooks/useResponsive'

/**
 * Componente de notificaciones/toasts optimizado para móvil
 * Se posiciona automáticamente evitando conflictos con la navegación móvil
 */
const NotificationToast = ({ 
  notifications = [], 
  onDismiss,
  position = 'auto' // 'auto', 'top', 'bottom'
}) => {
  const { isMobile } = useResponsive()

  // Iconos para diferentes tipos
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }

  // Colores para diferentes tipos
  const styles = {
    success: 'notification-success',
    error: 'toast-error',
    warning: 'notification-warning',
    info: 'notification-info'
  }

  // Determinar posición automática
  const getPosition = () => {
    if (position !== 'auto') return position
    return isMobile ? 'top' : 'top-right'
  }

  // Clases de posicionamiento
  const getContainerClasses = () => {
    const pos = getPosition()
    
    if (isMobile) {
      return 'fixed top-4 left-4 right-4 z-50 pointer-events-none'
    }
    
    switch (pos) {
      case 'top-right':
        return 'fixed top-4 right-4 z-50 pointer-events-none'
      case 'top':
        return 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none'
      case 'bottom':
        return 'fixed bottom-4 right-4 z-50 pointer-events-none'
      default:
        return 'fixed top-4 right-4 z-50 pointer-events-none'
    }
  }

  // Animaciones
  const getAnimationVariants = () => {
    if (isMobile) {
      return {
        initial: { opacity: 0, y: -100, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -100, scale: 0.9 }
      }
    }
    
    return {
      initial: { opacity: 0, x: 100, scale: 0.9 },
      animate: { opacity: 1, x: 0, scale: 1 },
      exit: { opacity: 0, x: 100, scale: 0.9 }
    }
  }

  const variants = getAnimationVariants()

  return (
    <div className={getContainerClasses()}>
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => {
          const Icon = icons[notification.type] || Info
          const styleClass = styles[notification.type] || styles.info
          
          return (
            <motion.div
              key={notification.id || index}
              layout
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ 
                duration: 0.3, 
                ease: 'easeOut',
                layout: { duration: 0.2 }
              }}
              className={`
                toast pointer-events-auto mb-3 ${styleClass}
                ${isMobile ? 'w-full' : 'min-w-[300px] max-w-[400px]'}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Icono */}
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className="h-5 w-5" />
                </div>
                
                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  {notification.title && (
                    <h4 className="font-semibold text-sm mb-1 truncate">
                      {notification.title}
                    </h4>
                  )}
                  <p className="text-sm leading-relaxed">
                    {notification.message}
                  </p>
                </div>
                
                {/* Botón cerrar */}
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(notification.id || index)}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    aria-label="Cerrar notificación"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Barra de progreso si tiene duración */}
              {notification.duration && (
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-current opacity-30 rounded-b-lg"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: notification.duration / 1000, ease: 'linear' }}
                />
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/**
 * Hook para gestionar notificaciones
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])

  const addNotification = (notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      type: 'info',
      duration: 4000,
      ...notification
    }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-dismiss después de la duración especificada
    if (newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  // Métodos de conveniencia
  const showSuccess = (message, title, options = {}) => 
    addNotification({ ...options, type: 'success', message, title })
    
  const showError = (message, title, options = {}) => 
    addNotification({ ...options, type: 'error', message, title })
    
  const showWarning = (message, title, options = {}) => 
    addNotification({ ...options, type: 'warning', message, title })
    
  const showInfo = (message, title, options = {}) => 
    addNotification({ ...options, type: 'info', message, title })

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}

export default NotificationToast
