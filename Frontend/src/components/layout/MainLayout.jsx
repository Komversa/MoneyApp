import React from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'
import TabletNavbar from './TabletNavbar'
import NavigationLoader from '../ui/NavigationLoader'
import useNavigationLoading from '../../hooks/useNavigationLoading'

/**
 * Layout principal de la aplicación - VERSIÓN RESPONSIVE
 * 
 * Implementa una navegación adaptativa según el dispositivo:
 * - Móviles (< 768px): Bottom Tab Bar + contenido full-screen
 * - Tablets (768px - 1024px): Header con menú hamburguesa + overlay lateral 
 * - Escritorio (> 1024px): Sidebar fijo tradicional
 */
const MainLayout = () => {
  const { isNavigating } = useNavigationLoading()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      
      {/* =================================== */}
      {/* NAVEGACIÓN PARA ESCRITORIO (1024px+) */}
      {/* =================================== */}
      <div className="hidden lg:flex lg:h-screen">
        {/* Sidebar fijo para escritorio */}
        <Sidebar />

        {/* Contenido principal con margen para sidebar */}
        <div className="flex-1 flex flex-col ml-64">
          <main className="flex-1 overflow-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>

      {/* ======================================= */}
      {/* NAVEGACIÓN PARA TABLETS (768px-1024px) */}
      {/* ======================================= */}
      <div className="hidden md:block lg:hidden">
        {/* Header con menú hamburguesa */}
        <TabletNavbar />
        
        {/* Contenido principal con padding-top para header */}
        <main className="pt-16 min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 md:p-6"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* ================================== */}
      {/* NAVEGACIÓN PARA MÓVILES (<768px) */}
      {/* ================================== */}
      <div className="block md:hidden">
        {/* Contenido principal full-screen con mejor espaciado */}
        <main className="min-h-screen pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 pb-8"
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Bottom Tab Bar fijo */}
        <MobileBottomNav />
      </div>

      {/* Loader global de navegación */}
      <NavigationLoader isLoading={isNavigating} />
    </div>
  )
}

export default MainLayout