/**
 * GymForm Analyzer - Updated Camera Page
 * Página de cámara con análisis de pose integrado
 */

import { useState } from 'react';
import { Activity, Target, BarChart3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import PoseAnalysisComponent from '../components/analysis/PoseAnalysisComponent';
import { apiService, transformSessionDataForBackend } from '../services/api';

const CameraPage = () => {
  const [selectedExercise, setSelectedExercise] = useState('general');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Ejercicios disponibles
  const exercises = [
    { id: 'general', name: 'General', description: 'Análisis general de postura' },
    { id: 'squat', name: 'Sentadilla', description: 'Análisis específico para sentadillas' },
    { id: 'pushup', name: 'Flexión', description: 'Análisis específico para flexiones' },
    { id: 'deadlift', name: 'Peso Muerto', description: 'Análisis específico para peso muerto' },
  ];

  // =====================================
  // MANEJO DE SESIONES
  // =====================================

  const handleSessionComplete = async (sessionData) => {
    console.log('Sesión completada:', sessionData);
    
    // Agregar a historial local
    const newSession = {
      id: Date.now(),
      ...sessionData,
      createdAt: new Date().toISOString()
    };
    
    setSessionHistory(prev => [newSession, ...prev]);
    
    // Intentar guardar en backend
    await saveSessionToBackend(newSession);
  };

  const saveSessionToBackend = async (sessionData) => {
    setIsSaving(true);
    
    try {
      // Transformar datos para el backend
      const backendData = transformSessionDataForBackend(sessionData);
      
      console.log('Enviando datos al backend:', backendData);
      
      // Guardar en backend
      const result = await apiService.saveWorkoutSession(backendData);
      
      if (result.success) {
        toast.success('Sesión guardada correctamente');
      } else {
        toast.error('Error guardando en servidor');
        console.error('Error del backend:', result.error);
      }
    } catch (error) {
      console.error('Error guardando sesión:', error);
      toast.error('Error guardando en servidor');
    } finally {
      setIsSaving(false);
    }
  };

  // =====================================
  // UTILIDADES
  // =====================================

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 75) return 'bg-blue-100 text-blue-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📹 Análisis de Técnica en Tiempo Real
          </h1>
          <p className="text-gray-600">
            Mejora tu técnica con análisis de pose basado en IA
          </p>
        </div>

        {/* Selector de ejercicio */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="mr-2" size={20} />
            Seleccionar Ejercicio
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => setSelectedExercise(exercise.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedExercise === exercise.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium text-gray-900">{exercise.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Componente principal de análisis */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="mr-2" size={20} />
              Análisis: {exercises.find(e => e.id === selectedExercise)?.name}
            </h2>
          </div>
          
          <div className="p-6">
            <PoseAnalysisComponent
              exerciseType={selectedExercise}
              onSessionComplete={handleSessionComplete}
            />
          </div>
        </div>

        {/* Historial de sesiones */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="mr-2" size={20} />
              Historial de Sesiones
            </h2>
            
            {isSaving && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm">Guardando...</span>
              </div>
            )}
          </div>
          
          <div className="p-6">
            {sessionHistory.length > 0 ? (
              <div className="space-y-4">
                {sessionHistory.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBadge(session.finalScore)}`}>
                          {Math.round(session.finalScore)} pts
                        </span>
                        <span className="font-medium text-gray-900 capitalize">
                          {session.exerciseType}
                        </span>
                        <span className="text-gray-500">
                          {formatDuration(session.duration)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {new Date(session.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Precisión:</span>
                        <span className="ml-1 font-medium">{Math.round(session.accuracy)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Frames:</span>
                        <span className="ml-1 font-medium">{session.totalFrames}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Buenos:</span>
                        <span className="ml-1 font-medium">{session.goodFrames}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Puntuación:</span>
                        <span className={`ml-1 font-medium ${getScoreColor(session.finalScore)}`}>
                          {Math.round(session.finalScore)}/100
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">No hay sesiones registradas</p>
                <p className="text-sm">Inicia una sesión de análisis para ver el historial</p>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 Consejos para mejores resultados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Configuración de cámara:</h4>
              <ul className="space-y-1">
                <li>• Asegúrate de tener buena iluminación</li>
                <li>• Mantén la cámara a la altura del pecho</li>
                <li>• Deja espacio suficiente para el movimiento completo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Durante el ejercicio:</h4>
              <ul className="space-y-1">
                <li>• Mantén todo tu cuerpo visible en cámara</li>
                <li>• Realiza movimientos controlados</li>
                <li>• Presta atención al feedback en tiempo real</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPage;