import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  CreditCard, 
  TrendingDown,
  ArrowUpDown, 
  Settings, 
  LogOut,
  Sun,
  Moon,
  Clock
} from 'lucide-react'
import { motion } from 'framer-motion'
import useAuthStore from '../../store/useAuthStore'

/**
 * Componente Sidebar - Barra lateral de navegación
 * Replica el diseño de las capturas de pantalla
 */
const Sidebar = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()

  /**
   * Manejar cierre de sesión
   */
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

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

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transition-colors"
    >
      {/* Header del Sidebar */}
      <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
          MoneyApp
        </h1>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.exact}
              className={({ isActive }) =>
                isActive
                  ? 'sidebar-link-active'
                  : 'sidebar-link-inactive'
              }
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Footer del Sidebar */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {/* Información del usuario */}
        {user && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.email}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Usuario activo
            </p>
          </div>
        )}

        {/* Botón de cerrar sesión */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </motion.div>
  )
}

export default Sidebar