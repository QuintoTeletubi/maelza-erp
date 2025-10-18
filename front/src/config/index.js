// Configuración centralizada para URLs de API
const config = {
  // En desarrollo usará localhost, en producción usará la variable de entorno
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development'
}

export default config