import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import useAuthStore from '../store/useAuthStore'

/**
 * Página de inicio de sesión
 * Replica el diseño de las capturas de pantalla
 */
const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore()

  // Estado local del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  // Limpiar errores cuando el componente se monta
  useEffect(() => {
    clearError()
  }, [clearError])

  /**
   * Manejar cambios en los inputs
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Limpiar error del campo específico
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    // Limpiar error global
    if (error) {
      clearError()
    }
  }

  /**
   * Validar formulario
   */
  const validateForm = () => {
    const errors = {}

    if (!formData.email.trim()) {
      errors.email = 'El correo electrónico es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El correo electrónico no es válido'
    }

    if (!formData.password.trim()) {
      errors.password = 'La contraseña es requerida'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const success = await login(formData.email.trim(), formData.password)

    if (success) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">
            MoneyApp
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Tu gestor de finanzas personales.
          </p>
        </div>

        {/* Formulario */}
        <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow-soft sm:rounded-lg sm:px-10 transition-colors">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white text-center">
              Iniciar Sesión
            </h2>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="form-label">
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-input ${formErrors.email ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                placeholder="Ingresa tu correo electrónico"
              />
              {formErrors.email && (
                <p className="form-error">{formErrors.email}</p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`form-input pr-10 ${formErrors.password ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Ingresa tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="form-error">{formErrors.password}</p>
              )}
            </div>

            {/* Error global */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-md bg-danger-50 p-4"
              >
                <p className="text-sm text-danger-800">{error}</p>
              </motion.div>
            )}

            {/* Botón de envío */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 text-base font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>

            {/* Enlaces */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes una cuenta?{' '}
                <Link
                  to="/registro"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Regístrate
                </Link>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default Login