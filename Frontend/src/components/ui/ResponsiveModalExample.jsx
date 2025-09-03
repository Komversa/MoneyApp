import React, { useState } from 'react'
import { Smartphone, Monitor, Tablet, Bell, CheckCircle, X } from 'lucide-react'
import Modal from './Modal'
import NotificationToast, { useNotifications } from './NotificationToast'
import { useToast } from './Toaster'
import useResponsive from '../../hooks/useResponsive'

/**
 * Componente de ejemplo para demostrar las mejoras en modales y notificaciones
 * Solo para propósitos de desarrollo y testing
 */
const ResponsiveModalExample = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive()
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  const { 
    notifications, 
    addNotification, 
    removeNotification,
    showSuccess: showCustomSuccess,
    showError: showCustomError 
  } = useNotifications()

  // Estados para modales
  const [modalStandard, setModalStandard] = useState(false)
  const [modalLarge, setModalLarge] = useState(false)
  const [modalSmall, setModalSmall] = useState(false)
  const [modalFullscreen, setModalFullscreen] = useState(false)

  const getDeviceInfo = () => {
    if (isMobile) return { icon: Smartphone, label: 'Móvil', color: 'text-blue-600' }
    if (isTablet) return { icon: Tablet, label: 'Tablet', color: 'text-purple-600' }
    if (isDesktop) return { icon: Monitor, label: 'Desktop', color: 'text-green-600' }
    return { icon: Monitor, label: 'Desconocido', color: 'text-gray-600' }
  }

  const deviceInfo = getDeviceInfo()
  const DeviceIcon = deviceInfo.icon

  return (
    <div className="p-6 space-y-6">
      {/* Header con información del dispositivo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <DeviceIcon className={`h-6 w-6 ${deviceInfo.color}`} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Sistema Responsive - {deviceInfo.label}
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Los modales y notificaciones se adaptan automáticamente según el dispositivo detectado.
        </p>
      </div>

      {/* Botones para probar modales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Prueba de Modales Responsive
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setModalSmall(true)}
            className="btn-outline"
          >
            Modal Pequeño
          </button>
          <button
            onClick={() => setModalStandard(true)}
            className="btn-primary"
          >
            Modal Estándar
          </button>
          <button
            onClick={() => setModalLarge(true)}
            className="btn-outline"
          >
            Modal Grande
          </button>
          <button
            onClick={() => setModalFullscreen(true)}
            className="btn-secondary"
          >
            Pantalla Completa (Móvil)
          </button>
        </div>
      </div>

      {/* Botones para probar notificaciones */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Prueba de Notificaciones/Toasts
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Sistema de Toasts (Toaster)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => showSuccess('¡Operación exitosa!', { title: 'Éxito' })}
                className="btn-sm bg-green-600 text-white hover:bg-green-700"
              >
                Success
              </button>
              <button
                onClick={() => showError('Error en la operación', { title: 'Error' })}
                className="btn-sm bg-red-600 text-white hover:bg-red-700"
              >
                Error
              </button>
              <button
                onClick={() => showWarning('Advertencia importante', { title: 'Atención' })}
                className="btn-sm bg-yellow-600 text-white hover:bg-yellow-700"
              >
                Warning
              </button>
              <button
                onClick={() => showInfo('Información relevante', { title: 'Info' })}
                className="btn-sm bg-blue-600 text-white hover:bg-blue-700"
              >
                Info
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Notificaciones Personalizadas</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => showCustomSuccess('Configuración guardada', 'Tema cambiado', { duration: 3000 })}
                className="btn-sm btn-primary"
              >
                Cambio de Tema
              </button>
              <button
                onClick={() => showCustomError('No se pudo conectar', 'Error de red', { duration: 5000 })}
                className="btn-sm btn-outline"
              >
                Error de Red
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Información sobre las mejoras */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-200">
          Mejoras Implementadas
        </h3>
        <ul className="space-y-2 text-blue-800 dark:text-blue-300">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Modales adaptados automáticamente según el tamaño de pantalla</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Posicionamiento que evita conflictos con navegación móvil</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Notificaciones reposicionadas para mejor UX en móvil</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Animaciones optimizadas según el dispositivo</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Sistema de clases CSS reutilizable para consistencia</span>
          </li>
        </ul>
      </div>

      {/* Modales de ejemplo */}
      <Modal
        isOpen={modalSmall}
        onClose={() => setModalSmall(false)}
        title="Modal Pequeño"
        size="small"
      >
        <p className="text-gray-600 dark:text-gray-400">
          Este es un modal pequeño ideal para confirmaciones y mensajes breves.
          En móvil se adapta automáticamente para mejor usabilidad.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setModalSmall(false)} className="btn-outline btn-sm">
            Cancelar
          </button>
          <button onClick={() => setModalSmall(false)} className="btn-primary btn-sm">
            Confirmar
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={modalStandard}
        onClose={() => setModalStandard(false)}
        title="Modal Estándar"
        size="standard"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Modal estándar con espacio suficiente para formularios y contenido moderado.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nombre</label>
              <input type="text" className="form-input" placeholder="Tu nombre" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="tu@email.com" />
            </div>
          </div>
          <div>
            <label className="form-label">Mensaje</label>
            <textarea className="form-input" rows="3" placeholder="Tu mensaje"></textarea>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalStandard(false)} className="btn-outline">
              Cancelar
            </button>
            <button onClick={() => setModalStandard(false)} className="btn-primary">
              Enviar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalLarge}
        onClose={() => setModalLarge(false)}
        title="Modal Grande"
        size="large"
      >
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            Modal grande para contenido extenso como formularios complejos o visualización de datos detallados.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Información Personal</h4>
              <div className="space-y-3">
                <input type="text" className="form-input" placeholder="Nombre completo" />
                <input type="email" className="form-input" placeholder="Email" />
                <input type="tel" className="form-input" placeholder="Teléfono" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Configuración</h4>
              <div className="space-y-3">
                <select className="form-input">
                  <option>Seleccionar país</option>
                  <option>Nicaragua</option>
                  <option>Costa Rica</option>
                  <option>Guatemala</option>
                </select>
                <input type="text" className="form-input" placeholder="Ciudad" />
                <input type="text" className="form-input" placeholder="Código postal" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalLarge(false)} className="btn-outline">
              Cancelar
            </button>
            <button onClick={() => setModalLarge(false)} className="btn-primary">
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalFullscreen}
        onClose={() => setModalFullscreen(false)}
        title="Modal Pantalla Completa (Solo Móvil)"
        fullscreenMobile={true}
      >
        <div className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Nota:</strong> Este modal se muestra a pantalla completa solo en dispositivos móviles 
              para maximizar el espacio disponible. En desktop mantiene el tamaño normal.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Formulario Complejo</h4>
            
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i}>
                  <label className="form-label">Campo {i + 1}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder={`Ingresa el valor ${i + 1}`} 
                  />
                </div>
              ))}
            </div>
            
            <div>
              <label className="form-label">Descripción detallada</label>
              <textarea 
                className="form-input" 
                rows="4" 
                placeholder="Describe con detalle..."
              ></textarea>
            </div>
          </div>
          
          <div className="modal-footer">
            <button onClick={() => setModalFullscreen(false)} className="btn-outline">
              Cancelar
            </button>
            <button onClick={() => setModalFullscreen(false)} className="btn-primary">
              Guardar Todo
            </button>
          </div>
        </div>
      </Modal>

      {/* Componente de notificaciones personalizadas */}
      <NotificationToast 
        notifications={notifications} 
        onDismiss={removeNotification} 
      />
    </div>
  )
}

export default ResponsiveModalExample
