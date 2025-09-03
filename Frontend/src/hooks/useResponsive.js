import { useState, useEffect } from 'react'

/**
 * Hook para detectar el tamaño de pantalla y estado responsive
 */
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
      setIsDesktop(width >= 1024)
    }
    
    // Verificar tamaño inicial
    checkScreenSize()
    
    // Agregar listener para cambios de tamaño
    window.addEventListener('resize', checkScreenSize)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return {
    isMobile,
    isTablet,
    isDesktop,
    // Helpers útiles
    isSmall: isMobile,
    isMedium: isTablet,
    isLarge: isDesktop
  }
}

export default useResponsive
