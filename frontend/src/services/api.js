/**
 * GymForm Analyzer - API Service Actualizado
 * Servicio completo para conectar con el backend FastAPI
 */

import axios from 'axios';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

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
};

// =====================================
// SERVICIOS DE AUTENTICACIÓN
// =====================================

export const authService = {
  async login(credentials) {
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      const { access_token, user } = response.data;
      
      // Guardar token y datos de usuario
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(user));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  async register(userData) {
    try {
      const response = await apiClient.post('/api/auth/register', userData);
      const { access_token, user } = response.data;
      
      // Guardar token y datos de usuario
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(user));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error en registro:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  async getCurrentUser() {
    try {
      const response = await apiClient.get('/api/auth/me');
      
      // Actualizar datos de usuario en localStorage
      localStorage.setItem('user_data', JSON.stringify(response.data));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  async updateProfile(updateData) {
    try {
      const response = await apiClient.put('/api/auth/me', updateData);
      
      // Actualizar datos de usuario en localStorage
      localStorage.setItem('user_data', JSON.stringify(response.data));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    toast.success('Sesión cerrada correctamente');
    return { success: true };
  },

  isAuthenticated() {
    const token = localStorage.getItem('auth_token');
    return token && token !== 'fake-jwt-token-for-development';
  },

  getCurrentUserData() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
};

// =====================================
// SERVICIOS DE WORKOUT
// =====================================

export const workoutService = {
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

  async getAdvancedStats(days = 30) {
    try {
      const response = await apiClient.get('/api/workouts/stats/advanced', {
        params: { days }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo estadísticas avanzadas:', error);
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
        realTimeFeedback: test.success && test.data?.data?.pose_detection,
        authentication: true
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
        realTimeFeedback: false,
        authentication: false
      }
    };
  }
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

export const validateUserRegistration = (userData) => {
  const errors = [];

  if (!userData.username || userData.username.length < 3) {
    errors.push('Usuario debe tener al menos 3 caracteres');
  }

  if (!userData.email || !/\S+@\S+\.\S+/.test(userData.email)) {
    errors.push('Email debe tener formato válido');
  }

  if (!userData.password || userData.password.length < 6) {
    errors.push('Contraseña debe tener al menos 6 caracteres');
  }

  if (userData.height && (userData.height < 100 || userData.height > 250)) {
    errors.push('Altura debe estar entre 100 y 250 cm');
  }

  if (userData.weight && (userData.weight < 30 || userData.weight > 300)) {
    errors.push('Peso debe estar entre 30 y 300 kg');
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
    technique_score: frontendSessionData.finalScore || frontendSessionData.averageScore || 0,
    accuracy_percentage: frontendSessionData.accuracy || 0,
    total_frames: frontendSessionData.totalFrames || 0,
    good_frames: frontendSessionData.goodFrames || 0,
    avg_angles: frontendSessionData.angles && frontendSessionData.angles.length > 0 
      ? calculateAverageAngles(frontendSessionData.angles)
      : frontendSessionData.lastAngles || {},
    session_notes: `Análisis automático con IA - ${frontendSessionData.exerciseType}`,
    pose_data: JSON.stringify({
      angles: frontendSessionData.angles?.slice(-10) || [],
      feedback: frontendSessionData.feedback || [],
      confidence: frontendSessionData.confidence || 0,
      detected: frontendSessionData.detected || false
    }),
    angle_history: frontendSessionData.angles || [],
    feedback: frontendSessionData.feedback || []
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

// =====================================
// HOOKS PERSONALIZADOS
// =====================================

export const useAuth = () => {
  const [user, setUser] = useState(authService.getCurrentUserData());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  const login = async (credentials) => {
    const result = await authService.login(credentials);
    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);
      toast.success(`¡Bienvenido ${result.data.user.first_name || result.data.user.username}!`);
    }
    return result;
  };

  const register = async (userData) => {
    const result = await authService.register(userData);
    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);
      toast.success('¡Cuenta creada exitosamente!');
    }
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (updateData) => {
    const result = await authService.updateProfile(updateData);
    if (result.success) {
      setUser(result.data);
      toast.success('Perfil actualizado correctamente');
    }
    return result;
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile
  };
};

export const useWorkoutSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSessions = async (limit = 10, offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await workoutService.getUserSessions(limit, offset);
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
      // Transformar datos para el backend
      const transformedData = transformSessionDataForBackend(sessionData);
      
      // Validar datos
      const validation = validateSessionData(transformedData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      const result = await workoutService.saveWorkoutSession(transformedData);
      if (result.success) {
        toast.success('Sesión guardada correctamente con análisis IA');
        // Recargar sesiones
        loadSessions();
        return result.data;
      } else {
        toast.error('Error guardando sesión');
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error(`Error guardando sesión: ${error.message}`);
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
      const result = await workoutService.getAdvancedStats(days);
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

// Exportar servicios principales
export default {
  auth: authService,
  workout: workoutService,
  api: apiService
};