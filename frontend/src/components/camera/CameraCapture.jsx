/**
 * GymForm Analyzer - Camera Page (Versión Limpia)
 */

import { useState } from 'react';
import { Activity, Target, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

const CameraPage = () => {
  const [selectedExercise, setSelectedExercise] = useState('general');
  const [sessionHistory, setSessionHistory] = useState([]);

  // Ejercicios disponibles
  const exercises = [
    { id: 'general', name: 'General', description: 'Análisis general de postura' },
    { id: 'squat', name: 'Sentadilla', description: 'Análisis específico para sentadillas' },
    { id: 'pushup', name: 'Flexión', description: 'Análisis específico para flexiones' },
    { id: 'deadlift', name: 'Peso Muerto', description: 'Análisis específico para peso muerto' },
  ];

  // =====================================
  // COMPONENTE TEMPORAL DE CÁMARA
  // =====================================
  const SimpleCameraComponent = () => {
    const [isActive, setIsActive] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const startCamera = () => {
      setIsActive(true);
      toast.success('Cámara simulada activada');
    };

    const stopCamera = () => {
      setIsActive(false);
      setIsRecording(false);
      toast.info('Cámara desactivada');
    };

    const toggleRecording = () => {
      if (isRecording) {
        setIsRecording(false);
        toast.success('Sesión completada');
        // Simular datos de sesión
        handleSessionComplete({
          exerciseType: selectedExercise,
          duration: Math.floor(Math.random() * 120) + 30, // 30-150 segundos
          finalScore: Math.floor(Math.random() * 40) + 60, // 60-100 puntos
          accuracy: Math.floor(Math.random() * 30) + 70, // 70-100%
          totalFrames: Math.floor(Math.random() * 200) + 100,
          goodFrames: Math.floor(Math.random() * 100) + 80
        });
      } else {
        setIsRecording(true);
        toast.success('Sesión iniciada');
      }
    };

    return (
      <div className="relative bg-gray-800 rounded-lg overflow-hidden">
        <div className="aspect-video flex items-center justify-center">
          {isActive ? (
            <div className="text-white text-center">
              <div className="text-6xl mb-4">📹</div>
              <p className="text-lg">Cámara activa - Modo de desarrollo</p>
              {isRecording && (
                <div className="flex items-center justify-center mt-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span>Grabando...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-white text-center">
              <div className="text-6xl mb-4 opacity-50">📷</div>
              <p className="text-lg">Cámara desactivada</p>
              <p className="text-sm text-gray-400 mt-2">Haz clic en "Activar Cámara" para comenzar</p>
            </div>
          )}
        </div>
        
        {/* Controles */}
        <div className="p-4 bg-gray-900 text-white">
          <div className="flex items-center justify-center space-x-4">
            {!isActive ? (
              <button
                onClick={startCamera}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
              >
                <Activity size={20} />
                <span>Activar Cámara</span>
              </button>
            ) : (
              <>
                <button
                  onClick={stopCamera}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  <span>🛑 Detener Cámara</span>
                </button>
                <button
                  onClick={toggleRecording}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors font-medium ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <span>{isRecording ? '⏹️ Finalizar Sesión' : '▶️ Iniciar Sesión'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =====================================
  // MANEJO DE SESIONES
  // =====================================

  const handleSessionComplete = (sessionData) => {
    console.log('Sesión completada:', sessionData);
    
    // Agregar a historial local
    const newSession = {
      id: Date.now(),
      ...sessionData,
      createdAt: new Date().toISOString()
    };
    
    setSessionHistory(prev => [newSession, ...prev]);
    toast.success('Sesión guardada en historial local');
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
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-blue-800 font-medium">Modo de desarrollo activo</span>
          </div>
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
                className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                  selectedExercise === exercise.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <h3 className="font-medium text-gray-900">{exercise.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
                {selectedExercise === exercise.id && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">✓ Seleccionado</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Componente de cámara */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="mr-2" size={20} />
              Análisis: {exercises.find(e => e.id === selectedExercise)?.name}
            </h2>
          </div>
          
          <div className="p-6">
            <SimpleCameraComponent />
          </div>
        </div>

        {/* Métricas en tiempo real */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Activity className="text-blue-600" size={24} />
              <h3 className="font-semibold text-lg">Estado del Sistema</h3>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">Funcionando</div>
            <div className="text-sm text-gray-600">Sistema de análisis en desarrollo</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Target className="text-green-600" size={24} />
              <h3 className="font-semibold text-lg">Ejercicio Actual</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1 capitalize">{selectedExercise}</div>
            <div className="text-sm text-gray-600">Listo para análisis</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-3">
              <BarChart3 className="text-purple-600" size={24} />
              <h3 className="font-semibold text-lg">Sesiones</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{sessionHistory.length}</div>
            <div className="text-sm text-gray-600">Sesiones completadas</div>
          </div>
        </div>

        {/* Historial de sesiones */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="mr-2" size={20} />
              Historial de Sesiones
            </h2>
          </div>
          
          <div className="p-6">
            {sessionHistory.length > 0 ? (
              <div className="space-y-4">
                {sessionHistory.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBadge(session.finalScore)}`}>
                          {Math.round(session.finalScore)} pts
                        </span>
                        <span className="font-medium text-gray-900 capitalize">
                          {session.exerciseType}
                        </span>
                        <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded text-sm">
                          {formatDuration(session.duration)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {new Date(session.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Precisión:</span>
                        <span className="font-medium">{Math.round(session.accuracy)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frames:</span>
                        <span className="font-medium">{session.totalFrames}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Buenos:</span>
                        <span className="font-medium">{session.goodFrames}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Puntuación:</span>
                        <span className={`font-medium ${getScoreColor(session.finalScore)}`}>
                          {Math.round(session.finalScore)}/100
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-xl font-medium mb-2">No hay sesiones registradas</p>
                <p className="text-sm">Inicia una sesión de análisis para ver el historial aquí</p>
              </div>
            )}
          </div>
        </div>

        {/* Información de desarrollo */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            Estado de Desarrollo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-3 text-green-800">✅ Completado:</h4>
              <ul className="space-y-2 text-green-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Interfaz básica de cámara
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Selector de ejercicios
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Historial de sesiones
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Backend con endpoints
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-orange-800">🔄 En desarrollo:</h4>
              <ul className="space-y-2 text-orange-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Integración con MediaPipe
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Análisis de pose en tiempo real
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Feedback automático
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Cálculo de ángulos
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPage;