import React, { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { updatePasswordAPI } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toaster'

/**
 * Componente aislado para el formulario de cambio de contraseña
 * Evita re-renders del componente padre al escribir
 */
const PasswordUpdateForm = ({ onCancel }) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const { success, error } = useToast()

  const handleUpdatePassword = async () => {
    try {
      setIsUpdatingPassword(true)
      
      const response = await updatePasswordAPI(currentPassword, newPassword)
      
      if (response.success) {
        success('Contraseña actualizada exitosamente')
        
        // Limpiar formulario y ocultar
        onCancel()
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        throw new Error(response.message || 'Error al actualizar contraseña')
      }
    } catch (err) {
      console.error('❌ Error al actualizar contraseña:', err)
      
      // Manejar errores específicos
      if (err.response?.status === 401) {
        error('Contraseña actual incorrecta')
      } else if (err.response?.status === 400) {
        error(err.response?.data?.message || 'Verifica los datos ingresados')
      } else {
        error('Error al actualizar la contraseña. Inténtalo nuevamente.')
      }
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="form-label">Contraseña Actual</label>
        <input
          type="password"
          className="form-input"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Ingresa tu contraseña actual"
        />
      </div>
      <div>
        <label className="form-label">Nueva Contraseña</label>
        <input
          type="password"
          className="form-input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Ingresa tu nueva contraseña (mínimo 6 caracteres)"
        />
      </div>
      <div>
        <label className="form-label">Confirmar Nueva Contraseña</label>
        <input
          type="password"
          className="form-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirma tu nueva contraseña"
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleUpdatePassword}
          disabled={isUpdatingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
          className="btn-primary disabled:opacity-50"
        >
          {isUpdatingPassword ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Actualizando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Actualizar Contraseña
            </>
          )}
        </button>
        <button
          onClick={() => {
            onCancel()
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
          }}
          className="btn-secondary"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default PasswordUpdateForm
