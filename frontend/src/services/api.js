/**
 * GymForm Analyzer - API Service
 * Servicio para conectar con el backend FastAPI
 */

import axios from 'axios';
import toast from 'react-hot-toast';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔗 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Error en response:', error);
    
    if (error.code === 'ECONNABORTED') {
      toast.error('Timeout: El servidor no responde');
    } else if (error.response?.status === 404) {
      toast.error('Endpoint no encontrado');
    } else if (error.response?.status === 500) {
      toast.error('Error interno del servidor');
    } else if (error.message === 'Network Error') {
      toast.error('Error de conexión. ¿Está el backend funcionando?');
    }
    
    return Promise.reject(error);
  }
);

// =====================================
// SERVICIOS DE LA API
// =====================================

export const apiService = {
  async checkHealth() {
    try {
      const response = await apiClient.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async testConnection() {
    try {
      const response = await apiClient.get('/api/test');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async testDatabase() {
    try {
      const response = await apiClient.get('/api/db-test');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// =====================================
// UTILIDADES
// =====================================

export const checkBackendStatus = async () => {
  try {
    const result = await apiService.checkHealth();
    if (result.success) {
      console.log('✅ Backend disponible:', result.data);
      return true;
    } else {
      console.log('❌ Backend no disponible:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error verificando backend:', error);
    return false;
  }
};

export const getSystemInfo = async () => {
  try {
    const [health, test, dbTest] = await Promise.all([
      apiService.checkHealth(),
      apiService.testConnection(),
      apiService.testDatabase()
    ]);

    return {
      health: health.success ? health.data : null,
      connection: test.success ? test.data : null,
      database: dbTest.success ? dbTest.data : null,
      allConnected: health.success && test.success && dbTest.success
    };
  } catch (error) {
    console.error('❌ Error obteniendo info del sistema:', error);
    return {
      health: null,
      connection: null,
      database: null,
      allConnected: false
    };
  }
};

export default apiService;