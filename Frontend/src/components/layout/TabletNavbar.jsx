import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { 
  Menu,
  X,
  LayoutDashboard, 
  CreditCard, 
  TrendingDown,
  ArrowUpDown, 
  Settings, 
  LogOut,
  Clock,
  User
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '../../store/useAuthStore'

/**
 * Componente de navegación para tablets
 * Implementa un header con menú hamburguesa y sidebar overlay
 */
const TabletNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()

  /**
   * Elementos de navegación principal
   */
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      exact: true
    },
    {
      name: 'Cuentas',
      href: '/cuentas',
      icon: CreditCard,
      exact: false
    },
    {
      name: 'Deudas',
      href: '/deudas',
      icon: TrendingDown,
      exact: false
    },
    {
      name: 'Transacciones',
      href: '/transacciones',
      icon: ArrowUpDown,
      exact: false
    },
    {
      name: 'Automatizaciones',
      href: '/automatizaciones',
      icon: Clock,
      exact: false
    },
    {
      name: 'Configuración',
      href: '/configuracion',
      icon: Settings,
      exact: false
    }
  ]

  /**
   * Cerrar menú al hacer clic fuera o al cambiar de ruta
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.tablet-menu-container')) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  /**
   * Cerrar menú al presionar Escape
   */
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMenuOpen])

  /**
   * Manejar cierre de sesión
   */
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
    setIsMenuOpen(false)
  }

  /**
   * Cerrar menú al navegar
   */
  const handleNavigation = () => {
    setIsMenuOpen(false)
  }

  return (
    <>
      {/* Header con menú hamburguesa - Solo visible en tablets */}
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="hidden md:flex lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95"
      >
        <div className="flex items-center justify-between w-full px-4 py-3">
          {/* Botón hamburguesa y título */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
              MoneyApp
            </h1>
          </div>

          {/* Usuario info en header */}
          {user && (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Usuario activo
                </p>
              </div>
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          )}
        </div>
      </motion.header>

      {/* Overlay del menú */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm md:block lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Panel del menú lateral */}
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="tablet-menu-container fixed top-0 left-0 bottom-0 z-50 w-80 bg-white dark:bg-gray-800 shadow-2xl border-r border-gray-200 dark:border-gray-700 md:block lg:hidden overflow-y-auto"
            >
              {/* Header del menú */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Navegación
                </h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  aria-label="Cerrar menú"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Navegación principal */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navigationItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <NavLink
                        to={item.href}
                        end={item.exact}
                        onClick={handleNavigation}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-r-2 border-primary-500'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                          }`
                        }
                      >
                        <Icon className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" />
                        <span>{item.name}</span>
                      </NavLink>
                    </motion.div>
                  )
                })}
              </nav>

              {/* Footer del menú con información del usuario */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                {/* Información del usuario expandida */}
                {user && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Usuario activo
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón de cerrar sesión */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors group"
                >
                  <LogOut className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default TabletNavbar
