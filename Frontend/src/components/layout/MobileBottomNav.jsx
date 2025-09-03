import React, { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  CreditCard, 
  TrendingDown,
  ArrowUpDown,
  Clock,
  Settings
} from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * Componente de navegación inferior para móviles
 * Implementa un Bottom Tab Bar nativo siguiendo principios de Material Design
 * SOLUCIONADO: Problema de scroll horizontal y desestructuración de botones
 * SOLUCIÓN ESPECÍFICA: Para página de transacciones
 */
const MobileBottomNav = () => {
  const location = useLocation()

  /**
   * SOLUCIÓN ESPECÍFICA: Prevenir scroll horizontal en página de transacciones
   */
  useEffect(() => {
    if (location.pathname === '/transacciones') {
      // Forzar overflow-x: hidden en el body cuando estemos en transacciones
      document.body.style.overflowX = 'hidden'
      
      // También en el contenedor principal
      const mainContainer = document.querySelector('.transacciones-page')
      if (mainContainer) {
        mainContainer.style.overflowX = 'hidden'
        mainContainer.style.maxWidth = '100vw'
        mainContainer.style.width = '100%'
      }
      
      return () => {
        // Restaurar cuando salgamos de la página
        document.body.style.overflowX = ''
        if (mainContainer) {
          mainContainer.style.overflowX = ''
          mainContainer.style.maxWidth = ''
          mainContainer.style.width = ''
        }
      }
    }
  }, [location.pathname])

  /**
   * Configuración de elementos de navegación
   * 6 módulos principales con colores específicos para cada burbuja
   */
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      exact: true,
      label: 'Inicio',
      color: 'blue', // Azul para Dashboard
      gradient: 'from-blue-500 via-blue-600 to-blue-700',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      name: 'Cuentas',
      href: '/cuentas',
      icon: CreditCard,
      exact: false,
      label: 'Cuentas',
      color: 'green', // Verde para Cuentas
      gradient: 'from-green-500 via-green-600 to-green-700',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      name: 'Transacciones',
      href: '/transacciones',
      icon: ArrowUpDown,
      exact: false,
      label: 'Trans',
      color: 'purple', // Morado para Transacciones (como pediste)
      gradient: 'from-purple-500 via-purple-600 to-purple-700',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      name: 'Deudas',
      href: '/deudas',
      icon: TrendingDown,
      exact: false,
      label: 'Deudas',
      color: 'red', // Rojo para Deudas
      gradient: 'from-red-500 via-red-600 to-red-700',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-600 dark:text-red-400'
    },
    {
      name: 'Automatizaciones',
      href: '/automatizaciones',
      icon: Clock,
      exact: false,
      label: 'Auto',
      color: 'orange', // Naranja para Automatizaciones
      gradient: 'from-orange-500 via-orange-600 to-orange-700',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      name: 'Configuración',
      href: '/configuracion',
      icon: Settings,
      exact: false,
      label: 'Config',
      color: 'gray', // Gris para Configuración
      gradient: 'from-gray-500 via-gray-600 to-gray-700',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      textColor: 'text-gray-600 dark:text-gray-400'
    }
  ]

  /**
   * Determinar si un item está activo
   */
  const isActiveItem = (item) => {
    if (item.exact) {
      return location.pathname === item.href
    }
    return location.pathname.startsWith(item.href.split('?')[0])
  }

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95 md:hidden mobile-bottom-nav"
    >
      {/* Barra de navegación optimizada para 6 elementos - SOLUCIONADO SCROLL HORIZONTAL */}
      <nav className="flex items-center justify-between px-1 py-2 w-full overflow-hidden flex-container-mobile">
        {navigationItems.map((item, index) => {
          const Icon = item.icon
          const isActive = isActiveItem(item)
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.exact}
              className={({ isActive: linkActive }) => `
                relative flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-300 min-w-0 group flex-1 max-w-[65px]
                ${(linkActive || isActive) 
                  ? item.textColor 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }
                hover:bg-gray-50 dark:hover:bg-gray-700/50 active:scale-95
              `}
            >
              {/* Contenedor del ícono - UNIFORMIZADO PARA TODOS LOS BOTONES */}
              <div className={`
                relative flex items-center justify-center rounded-full transition-all duration-300
                ${(isActive || (item.exact && location.pathname === item.href))
                  ? `w-12 h-12 bg-gradient-to-br ${item.gradient} text-white shadow-lg hover:shadow-xl hover:scale-110` 
                  : `w-8 h-8 ${item.bgColor} ${item.textColor} hover:shadow-md hover:scale-110`
                }
              `}>
                <Icon className="w-5 h-5 transition-all duration-300" />
                
                {/* Efecto de pulso para botón activo */}
                {(isActive || (item.exact && location.pathname === item.href)) && (
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${item.gradient} animate-ping opacity-20`}></div>
                )}

                {/* Efecto de brillo sutil en hover */}
                <div className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></div>
              </div>

              {/* Etiqueta del elemento - Uniformizada */}
              <span className={`
                text-xs font-medium mt-1 truncate max-w-full transition-colors duration-300 leading-tight
                ${(isActive || (item.exact && location.pathname === item.href))
                  ? `${item.textColor} font-semibold`
                  : 'font-normal'
                }
              `}>
                {item.label}
              </span>



              {/* Ripple effect para feedback táctil */}
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-current opacity-0 hover:opacity-5 active:opacity-10 transition-opacity duration-150" />
              </div>
            </NavLink>
          )
        })}
      </nav>

      {/* Área segura para dispositivos con notch/home indicator */}
      <div className="h-safe-bottom bg-white dark:bg-gray-800" />
    </motion.div>
  )
}

export default MobileBottomNav
