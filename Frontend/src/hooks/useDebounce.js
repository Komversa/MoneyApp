import { useState, useEffect } from 'react'

/**
 * Hook personalizado para implementar debounce
 * @param {any} value - El valor a debouncar
 * @param {number} delay - El delay en milisegundos
 * @returns {any} - El valor debouncado
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Crear un timer que se ejecute después del delay
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Limpiar el timer si el valor cambia antes del delay
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
