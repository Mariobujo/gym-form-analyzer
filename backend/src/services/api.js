/**
 * GymForm Analyzer - API Service Actualizado
 * Servicio completo para conectar con el backend FastAPI
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
    
    // Agregar token de autenticación si existe
    const token = localStorage.getItem('auth_token');
    if (token && token !== 'fake-jwt-token-for-development') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
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
    } else if (error.response?.status === 401) {
      toast.error('Sesión expirada. Inicia sesión nuevamente.');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
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
// SERVICIOS BÁSICOS DE LA API
// =====================================

export const apiService = {
  // Servicios básicos existentes
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
  },

  // =====================================
  // SERVICIOS DE WORKOUT
  // =====================================

  async saveWorkoutSession(sessionData) {
    try {
      const response = await apiClient.post('/api/workouts/sessions', sessionData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error guardando sesión:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  async getUserSessions(limit = 10, offset = 0) {
    try {
      const response = await apiClient.get('/api/workouts/sessions', {
        params: { limit, offset }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo sesiones:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  async getSessionDetail(sessionId) {
    try {
      const response = await apiClient.get(`/api/workouts/sessions/${sessionId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo detalle de sesión:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  async getWorkoutStats(days = 30) {
    try {
      const response = await apiClient.get('/api/workouts/stats/summary', {
        params: { days }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  // =====================================
  // SERVICIOS DE EJERCICIOS
  // =====================================

  async getExerciseTypes() {
    try {
      const response = await apiClient.get('/api/exercises/types');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo tipos de ejercicios:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  // =====================================
  // SERVICIOS DE AUTENTICACIÓN (TODO)
  // =====================================

  async login(credentials) {
    try {
      // TODO: Implementar endpoint real de login
      const response = await apiClient.post('/api/auth/login', credentials);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  async logout() {
    try {
      // TODO: Implementar endpoint real de logout
      localStorage.removeItem('auth_token');
      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      return { success: false, error: error.message };
    }
  },

  async getCurrentUser() {
    try {
      // TODO: Implementar endpoint real de usuario actual
      const response = await apiClient.get('/api/auth/me');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  }
};

// =====================================
// FUNCIONES DE UTILIDAD
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
      allConnected: health.success && test.success && dbTest.success,
      features: {
        poseAnalysis: test.success && test.data?.data?.ai_ready,
        workoutTracking: dbTest.success && dbTest.data?.tables_ready?.workout_sessions,
        realTimeFeedback: test.success && test.data?.data?.pose_detection
      }
    };
  } catch (error) {
    console.error('❌ Error obteniendo info del sistema:', error);
    return {
      health: null,
      connection: null,
      database: null,
      allConnected: false,
      features: {
        poseAnalysis: false,
        workoutTracking: false,
        realTimeFeedback: false
      }
    };
  }
};

// =====================================
// HOOKS PERSONALIZADOS
// =====================================

export const useWorkoutSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSessions = async (limit = 10, offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.getUserSessions(limit, offset);
      if (result.success) {
        setSessions(result.data);
      } else {
        setError(result.error);
        toast.error('Error cargando sesiones');
      }
    } catch (err) {
      setError(err.message);
      toast.error('Error inesperado cargando sesiones');
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (sessionData) => {
    try {
      const result = await apiService.saveWorkoutSession(sessionData);
      if (result.success) {
        toast.success('Sesión guardada correctamente');
        // Recargar sesiones
        loadSessions();
        return result.data;
      } else {
        toast.error('Error guardando sesión');
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error('Error guardando sesión');
      throw error;
    }
  };

  return {
    sessions,
    loading,
    error,
    loadSessions,
    saveSession
  };
};

export const useWorkoutStats = (days = 30) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.getWorkoutStats(days);
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [days]);

  return {
    stats,
    loading,
    error,
    refreshStats: loadStats
  };
};

// =====================================
// VALIDADORES
// =====================================

export const validateSessionData = (sessionData) => {
  const errors = [];

  if (!sessionData.exercise_type) {
    errors.push('Tipo de ejercicio es requerido');
  }

  if (!sessionData.duration_seconds || sessionData.duration_seconds <= 0) {
    errors.push('Duración debe ser mayor a 0');
  }

  if (sessionData.technique_score < 0 || sessionData.technique_score > 100) {
    errors.push('Puntuación de técnica debe estar entre 0 y 100');
  }

  if (sessionData.accuracy_percentage < 0 || sessionData.accuracy_percentage > 100) {
    errors.push('Porcentaje de precisión debe estar entre 0 y 100');
  }

  if (sessionData.total_frames < 0) {
    errors.push('Total de frames no puede ser negativo');
  }

  if (sessionData.good_frames < 0 || sessionData.good_frames > sessionData.total_frames) {
    errors.push('Frames buenos no puede ser mayor al total');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// =====================================
// TRANSFORMADORES DE DATOS
// =====================================

export const transformSessionDataForBackend = (frontendSessionData) => {
  return {
    exercise_type: frontendSessionData.exerciseType,
    duration_seconds: frontendSessionData.duration,
    technique_score: frontendSessionData.finalScore,
    accuracy_percentage: frontendSessionData.accuracy,
    total_frames: frontendSessionData.totalFrames,
    good_frames: frontendSessionData.goodFrames,
    avg_angles: frontendSessionData.angles && frontendSessionData.angles.length > 0 
      ? calculateAverageAngles(frontendSessionData.angles)
      : {},
    session_notes: `Análisis automático - ${frontendSessionData.exerciseType}`,
    pose_data: JSON.stringify({
      angles: frontendSessionData.angles?.slice(-5) || [], // Últimos 5 frames
      feedback: frontendSessionData.feedback || []
    })
  };
};

export const calculateAverageAngles = (anglesArray) => {
  if (!anglesArray || anglesArray.length === 0) return {};
  
  const avgAngles = {};
  const joints = Object.keys(anglesArray[0] || {});
  
  joints.forEach(joint => {
    const values = anglesArray
      .map(frame => frame[joint])
      .filter(val => val !== null && val !== undefined && !isNaN(val));
    
    if (values.length > 0) {
      avgAngles[joint] = Math.round(
        values.reduce((sum, val) => sum + val, 0) / values.length
      );
    }
  });
  
  return avgAngles;
};

export default apiService;