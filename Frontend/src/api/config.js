// Configuración de la API según el entorno
const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL || 'https://moneyapp-n5tg.onrender.com'
  : 'http://localhost:3001';

// Timeout más largo en producción para cold starts de Render
const TIMEOUT = import.meta.env.PROD ? 60000 : 30000;

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  maxRedirects: 5,
  maxContentLength: 50 * 1024 * 1024,
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  }
};

export default API_CONFIG;
