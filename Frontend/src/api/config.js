// Configuración de la API según el entorno
const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL || 'https://moneyapp-n5tg.onrender.com'
  : 'http://localhost:3001';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000, // Aumentado a 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
  // Configuraciones adicionales para mejor rendimiento
  maxRedirects: 5,
  maxContentLength: 50 * 1024 * 1024, // 50MB
  validateStatus: function (status) {
    return status >= 200 && status < 300; // Solo aceptar respuestas exitosas
  }
};

export default API_CONFIG;
