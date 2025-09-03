import { useState, useEffect, useCallback } from 'react';
import {
  obtenerTransaccionesProgramadas,
  obtenerTransaccionProgramada,
  crearTransaccionProgramada,
  actualizarTransaccionProgramada,
  toggleTransaccionProgramada,
  eliminarTransaccionProgramada,
  obtenerEstadoScheduler,
  ejecutarSchedulerManual
} from '../api/scheduled-transactions.api';
import useErrorHandler from './useErrorHandler';

/**
 * Hook personalizado para manejar transacciones programadas
 */
export const useTransaccionesProgramadas = () => {
  const [transacciones, setTransacciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [estadoScheduler, setEstadoScheduler] = useState(null);
  const { handleError } = useErrorHandler();

  /**
   * Cargar todas las transacciones programadas
   */
  const cargarTransacciones = useCallback(async (filters = {}) => {
    console.log('🔄 [Frontend] Iniciando carga de transacciones programadas');
    console.log('🔍 [Frontend] Filtros:', filters);
    
    setCargando(true);
    setError(null);
    
    try {
      console.log('📡 [Frontend] Llamando a API...');
      const response = await obtenerTransaccionesProgramadas(filters);
      console.log('📨 [Frontend] Respuesta recibida:', response);
      
      if (response.success) {
        console.log('✅ [Frontend] Datos exitosos:', response.data.length, 'transacciones');
        setTransacciones(response.data || []);
      } else {
        throw new Error(response.message || 'Error cargando transacciones programadas');
      }
    } catch (err) {
      console.error('❌ [Frontend] Error cargando transacciones programadas:', err);
      setError(err.message);
      // handleError(err); // Removido para evitar dependencia problemática
    } finally {
      console.log('🏁 [Frontend] Finalizando carga, setCargando(false)');
      setCargando(false);
    }
  }, []); // Sin dependencias para evitar recreaciones

  /**
   * Obtener una transacción programada específica
   */
  const obtenerTransaccion = useCallback(async (id) => {
    setCargando(true);
    setError(null);
    
    try {
      const response = await obtenerTransaccionProgramada(id);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Error obteniendo transacción programada');
      }
    } catch (err) {
      console.error('Error obteniendo transacción programada:', err);
      setError(err.message);
      handleError(err);
      return null;
    } finally {
      setCargando(false);
    }
  }, [handleError]);

  /**
   * Crear nueva transacción programada
   */
  const crear = useCallback(async (datosTransaccion) => {
    setCargando(true);
    setError(null);
    
    try {
      const response = await crearTransaccionProgramada(datosTransaccion);
      
      if (response.success) {
        // Agregar la nueva transacción a la lista local
        setTransacciones(prev => [...prev, response.data]);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error creando transacción programada');
      }
    } catch (err) {
      console.error('Error creando transacción programada:', err);
      setError(err.message);
      handleError(err);
      return { success: false, error: err.message };
    } finally {
      setCargando(false);
    }
  }, [handleError]);

  /**
   * Actualizar transacción programada existente
   */
  const actualizar = useCallback(async (id, datosActualizacion) => {
    setCargando(true);
    setError(null);
    
    try {
      const response = await actualizarTransaccionProgramada(id, datosActualizacion);
      
      if (response.success) {
        // Actualizar la transacción en la lista local
        setTransacciones(prev => 
          prev.map(t => t.id === id ? { ...t, ...response.data } : t)
        );
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error actualizando transacción programada');
      }
    } catch (err) {
      console.error('Error actualizando transacción programada:', err);
      setError(err.message);
      handleError(err);
      return { success: false, error: err.message };
    } finally {
      setCargando(false);
    }
  }, [handleError]);

  /**
   * Pausar/reanudar transacción programada
   */
  const toggle = useCallback(async (id) => {
    setCargando(true);
    setError(null);
    
    try {
      const response = await toggleTransaccionProgramada(id);
      
      if (response.success) {
        // Actualizar el estado en la lista local
        setTransacciones(prev => 
          prev.map(t => t.id === id ? { ...t, is_active: !t.is_active } : t)
        );
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error cambiando estado de transacción programada');
      }
    } catch (err) {
      console.error('Error cambiando estado de transacción programada:', err);
      setError(err.message);
      handleError(err);
      return { success: false, error: err.message };
    } finally {
      setCargando(false);
    }
  }, [handleError]);

  /**
   * Eliminar transacción programada
   */
  const eliminar = useCallback(async (id) => {
    setCargando(true);
    setError(null);
    
    try {
      const response = await eliminarTransaccionProgramada(id);
      
      if (response.success) {
        // Remover la transacción de la lista local
        setTransacciones(prev => prev.filter(t => t.id !== id));
        return { success: true };
      } else {
        throw new Error(response.message || 'Error eliminando transacción programada');
      }
    } catch (err) {
      console.error('Error eliminando transacción programada:', err);
      setError(err.message);
      handleError(err);
      return { success: false, error: err.message };
    } finally {
      setCargando(false);
    }
  }, [handleError]);

  /**
   * Cargar estado del scheduler
   */
  const cargarEstadoScheduler = useCallback(async () => {
    try {
      const response = await obtenerEstadoScheduler();
      
      if (response.success) {
        setEstadoScheduler(response.data);
      } else {
        console.warn('No se pudo obtener el estado del scheduler:', response.message);
        setEstadoScheduler({ isRunning: false, hasTask: false, error: 'unavailable' });
      }
    } catch (err) {
      // Solo log del error, sin UI para evitar spam
      console.warn('Estado del scheduler no disponible:', err.message);
      setEstadoScheduler({ isRunning: false, hasTask: false, error: 'unavailable' });
    }
  }, []); // Sin dependencias para evitar recreaciones

  /**
   * Ejecutar scheduler manualmente (para desarrollo)
   */
  const ejecutarScheduler = useCallback(async () => {
    setCargando(true);
    setError(null);
    
    try {
      const response = await ejecutarSchedulerManual();
      
      if (response.success) {
        // Recargar transacciones después de ejecutar el scheduler
        await cargarTransacciones();
        return { success: true };
      } else {
        throw new Error(response.message || 'Error ejecutando scheduler');
      }
    } catch (err) {
      console.error('Error ejecutando scheduler:', err);
      setError(err.message);
      handleError(err);
      return { success: false, error: err.message };
    } finally {
      setCargando(false);
    }
  }, [handleError, cargarTransacciones]);

  /**
   * Filtrar transacciones por estado activo
   */
  const transaccionesActivas = transacciones.filter(t => t.is_active);
  const transaccionesInactivas = transacciones.filter(t => !t.is_active);

  /**
   * Estadísticas útiles
   */
  const estadisticas = {
    total: transacciones.length,
    activas: transaccionesActivas.length,
    inactivas: transaccionesInactivas.length,
    porTipo: {
      ingresos: transacciones.filter(t => t.transaction_type === 'income').length,
      gastos: transacciones.filter(t => t.transaction_type === 'expense').length,
      transferencias: transacciones.filter(t => t.transaction_type === 'transfer').length
    },
    porFrecuencia: {
      unica: transacciones.filter(t => t.frequency === 'once').length,
      diaria: transacciones.filter(t => t.frequency === 'daily').length,
      semanal: transacciones.filter(t => t.frequency === 'weekly').length,
      mensual: transacciones.filter(t => t.frequency === 'monthly').length
    }
  };

  /**
   * Cargar transacciones programadas al montar el componente
   */
  useEffect(() => {
    console.log('🎯 [Frontend] useEffect ejecutándose - cargarTransacciones');
    
    // Cargar transacciones (apiClient maneja automáticamente la autenticación)
    cargarTransacciones();
    
    // Cargar estado del scheduler de forma independiente y silenciosa
    setTimeout(() => {
      cargarEstadoScheduler();
    }, 1000); // Delay de 1 segundo para evitar sobrecarga
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  return {
    // Estado
    transacciones,
    transaccionesActivas,
    transaccionesInactivas,
    estadisticas,
    estadoScheduler,
    cargando,
    error,
    
    // Métodos
    cargarTransacciones,
    obtenerTransaccion,
    crear,
    actualizar,
    toggle,
    eliminar,
    cargarEstadoScheduler,
    ejecutarScheduler,
    
    // Utilidades
    setError
  };
};
