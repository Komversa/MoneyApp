import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import useResponsive from '../../hooks/useResponsive'

/**
 * Sistema de notificaciones toast
 * Componente para mostrar mensajes temporales al usuario
 */

// Store simple para manejar los toasts
let toastId = 0
const toastStore = {
  toasts: [],
  listeners: [],
  
  addToast: (toast) => {
    const id = ++toastId
    const newToast = { id, ...toast }
    toastStore.toasts.push(newToast)
    toastStore.notify()
    
    // Auto-eliminar después de la duración especificada
    setTimeout(() => {
      toastStore.removeToast(id)
    }, toast.duration || 5000)
    
    return id
  },
  
  removeToast: (id) => {
    toastStore.toasts = toastStore.toasts.filter(toast => toast.id !== id)
    toastStore.notify()
  },
  
  subscribe: (listener) => {
    toastStore.listeners.push(listener)
    return () => {
      toastStore.listeners = toastStore.listeners.filter(l => l !== listener)
    }
  },
  
  notify: () => {
    toastStore.listeners.forEach(listener => listener(toastStore.toasts))
  }
}

// Hook para usar toasts
export const useToast = () => {
  return {
    toast: (options) => toastStore.addToast(options),
    success: (message, options = {}) => toastStore.addToast({ 
      type: 'success', 
      message, 
      ...options 
    }),
    error: (message, options = {}) => toastStore.addToast({ 
      type: 'error', 
      message, 
      ...options 
    }),
    warning: (message, options = {}) => toastStore.addToast({ 
      type: 'warning', 
      message, 
      ...options 
    }),
    info: (message, options = {}) => toastStore.addToast({ 
      type: 'info', 
      message, 
      ...options 
    })
  }
}

/**
 * Componente individual Toast - MEJORADO PARA MÓVIL
 */
const Toast = ({ toast, onClose }) => {
  const { isMobile } = useResponsive()
  
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }

  // Usar las clases CSS que definimos en index.css
  const styles = {
    success: 'toast-success',
    error: 'toast-error', 
    warning: 'toast-warning',
    info: 'toast-info'
  }

  const iconStyles = {
    success: 'text-success-600 dark:text-success-400',
    error: 'text-danger-600 dark:text-danger-400',
    warning: 'text-warning-600 dark:text-warning-400',
    info: 'text-blue-600 dark:text-blue-400'
  }

  const Icon = icons[toast.type] || Info

  // Animaciones adaptativas según dispositivo
  const getAnimationProps = () => {
    if (isMobile) {
      return {
        initial: { opacity: 0, y: -100, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -100, scale: 0.9, transition: { duration: 0.2 } }
      }
    }
    
    return {
      initial: { opacity: 0, x: 100, scale: 0.9 },
      animate: { opacity: 1, x: 0, scale: 1 },
      exit: { opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }
    }
  }

  return (
    <motion.div
      {...getAnimationProps()}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        toast ${styles[toast.type] || styles.info}
        ${isMobile ? 'w-full' : 'w-full max-w-sm'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={`h-5 w-5 ${iconStyles[toast.type] || iconStyles.info}`} />
        </div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="text-sm font-semibold mb-1 truncate">{toast.title}</p>
          )}
          <p className={`text-sm leading-relaxed ${toast.title ? '' : 'pt-0.5'}`}>
            {toast.message}
          </p>
        </div>
        <button
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          onClick={() => onClose(toast.id)}
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Barra de progreso si tiene duración */}
      {toast.duration && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30 rounded-b-lg"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  )
}

/**
 * Componente principal Toaster - OPTIMIZADO PARA MÓVIL
 */
export const Toaster = () => {
  const [toasts, setToasts] = useState([])
  const { isMobile } = useResponsive()

  useEffect(() => {
    const unsubscribe = toastStore.subscribe(setToasts)
    return unsubscribe
  }, [])

  // Clases de contenedor adaptativas
  const getContainerClasses = () => {
    if (isMobile) {
      return 'toast-container' // Usar nuestra clase CSS personalizada
    }
    
    // Desktop: esquina superior derecha
    return 'toast-container'
  }

  return (
    <div className={getContainerClasses()}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={toastStore.removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}