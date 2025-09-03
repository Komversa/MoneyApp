const express = require('express');
const dashboardService = require('../services/dashboard.service');
const { protegerRuta } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Rutas del Dashboard
 * Base: /api/dashboard
 * TODAS las rutas requieren autenticación
 */

// Aplicar middleware de autenticación a todas las rutas
router.use(protegerRuta);

/**
 * ===========================================
 * RUTAS DEL DASHBOARD
 * ===========================================
 */

// GET /api/dashboard - Obtener resumen completo del dashboard
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const dashboardData = await dashboardService.obtenerResumenDashboard(userId);
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error en ruta del dashboard:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor al obtener datos del dashboard'
    });
  }
});

// GET /api/dashboard/grafico-gastos - Obtener datos del gráfico de gastos por categoría
router.get('/grafico-gastos', async (req, res) => {
  try {
    const userId = req.user.id;
    const graficoData = await dashboardService.obtenerDatosGraficoGastos(userId);
    
    res.json({
      success: true,
      data: graficoData
    });
  } catch (error) {
    console.error('Error obteniendo gráfico de gastos:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor al obtener datos del gráfico'
    });
  }
});

module.exports = router;
