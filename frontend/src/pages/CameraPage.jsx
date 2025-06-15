/**
 * GymForm Analyzer - Camera Page con AutoCamera
 */

import { useState } from 'react';
import { Activity, Target, BarChart3, Camera, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import AutoCamera from '../components/camera/AutoCamera';

const CameraPage = () => {
  const [selectedExercise, setSelectedExercise] = useState('general');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  // Ejercicios disponibles
  const exercises = [
    { id: 'general', name: 'General', description: 'Análisis general de postura', emoji: '🧘' },
    { id: 'squat', name: 'Sentadilla', description: 'Análisis específico para sentadillas', emoji: '🏋️' },
    { id: 'pushup', name: 'Flexión', description: 'Análisis específico para flexiones', emoji: '💪' },
    { id: 'deadlift', name: 'Peso Muerto', description: 'Análisis específico para peso muerto', emoji: '🏃' },
  ];

  // =====================================
  // MANEJO DE SESIONES
  // =====================================

  const handleSessionData = (sessionData) => {
    console.log('📊 Evento de sesión:', sessionData);

    if (sessionData.action === 'start') {
      const newSession = {
        id: sessionData.sessionId,
        exerciseType: selectedExercise,
        startTime: sessionData.timestamp,
        isActive: true
      };
      
      setCurrentSession(newSession);
      
      const exerciseName = exercises.find(e => e.id === selectedExercise)?.name || selectedExercise;
      toast.success(`🎯 Sesión de ${exerciseName} iniciada`);
      console.log('🎬 Nueva sesión iniciada:', newSession);
    }

    if (sessionData.action === 'stop') {
      if (currentSession) {
        const completedSession = {
          ...currentSession,
          endTime: sessionData.timestamp,
          duration: sessionData.duration,
          // Datos simulados mejorados (después reemplazaremos con análisis real)
          finalScore: Math.floor(Math.random() * 35) + 65, // 65-100
          accuracy: Math.floor(Math.random() * 25) + 75, // 75-100%
          totalFrames: Math.floor(sessionData.duration * 30), // 30 FPS
          goodFrames: Math.floor(sessionData.duration * 30 * (0.7 + Math.random() * 0.25)), // 70-95%
          createdAt: new Date().toISOString(),
          isActive: false
        };

        setSessionHistory(prev => [completedSession, ...prev]);
        setCurrentSession(null);
        
        console.log('✅ Sesión completada:', completedSession);
        toast.success(`✅ ¡Sesión completada! Puntuación: ${Math.round(completedSession.finalScore)}/100`);
      }
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
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 80) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getSessionStats = () => {
    if (sessionHistory.length === 0) return null;
    
    const avgScore = sessionHistory.reduce((sum, session) => sum + session.finalScore, 0) / sessionHistory.length;
    const totalDuration = sessionHistory.reduce((sum, session) => sum + session.duration, 0);
    const bestScore = Math.max(...sessionHistory.map(s => s.finalScore));
    
    return { avgScore, totalDuration, bestScore };
  };

  const stats = getSessionStats();

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            📹 Análisis de Técnica en Tiempo Real
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Mejora tu técnica con análisis de pose basado en IA
          </p>
          
          {/* Estado mejorado */}
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl shadow-sm">
            <Zap className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm text-green-800 font-medium">
              🚀 Cámara automática activada - Lista para usar
            </span>
          </div>
        </div>

        {/* Selector de ejercicio mejorado */}
        <div className="bg-white rounded-xl shadow-sm border mb-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Target className="mr-3" size={24} />
            Seleccionar Ejercicio
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => setSelectedExercise(exercise.id)}
                disabled={currentSession?.isActive}
                className={`p-6 rounded-xl border-2 transition-all text-left hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  selectedExercise === exercise.id
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="text-3xl mb-3">{exercise.emoji}</div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{exercise.name}</h3>
                <p className="text-sm text-gray-600">{exercise.description}</p>
                {selectedExercise === exercise.id && (
                  <div className="mt-3 flex items-center text-blue-600 font-medium text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Seleccionado
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {currentSession?.isActive && (
            <div className="mt-6 flex items-center justify-center text-amber-700 bg-amber-50 rounded-lg p-4">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse mr-3"></div>
              <span className="font-medium">Sesión activa - Finaliza la grabación para cambiar de ejercicio</span>
            </div>
          )}
        </div>

        {/* Cámara */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Activity className="mr-3" size={24} />
                Análisis: {exercises.find(e => e.id === selectedExercise)?.name}
                <span className="ml-2 text-2xl">{exercises.find(e => e.id === selectedExercise)?.emoji}</span>
              </h2>
              
              {currentSession?.isActive && (
                <div className="flex items-center space-x-3 bg-red-50 px-4 py-2 rounded-full border border-red-200">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-semibold">Sesión Activa</span>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <AutoCamera onSessionData={handleSessionData} />
            </div>
          </div>
        </div>

        {/* Métricas en tiempo real mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="text-blue-600" size={24} />
              </div>
              <h3 className="font-semibold text-lg">Estado</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {currentSession?.isActive ? '🔴 Grabando' : '⏸️ Listo'}
            </div>
            <div className="text-sm text-gray-600">
              {currentSession?.isActive ? 'Sesión en progreso' : 'Preparado para iniciar'}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="text-green-600" size={24} />
              </div>
              <h3 className="font-semibold text-lg">Ejercicio</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {exercises.find(e => e.id === selectedExercise)?.emoji} {exercises.find(e => e.id === selectedExercise)?.name}
            </div>
            <div className="text-sm text-gray-600">Análisis configurado</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold text-lg">Sesiones</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{sessionHistory.length}</div>
            <div className="text-sm text-gray-600">Completadas</div>
          </div>

          {stats && (
            <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Camera className="text-yellow-600" size={24} />
                </div>
                <h3 className="font-semibold text-lg">Promedio</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{Math.round(stats.avgScore)}/100</div>
              <div className="text-sm text-gray-600">Puntuación media</div>
            </div>
          )}
        </div>

        {/* Historial de sesiones mejorado */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="mr-3" size={24} />
                Historial de Sesiones
              </h2>
              {stats && (
                <div className="text-sm text-gray-600">
                  Mejor puntuación: <span className="font-semibold text-green-600">{Math.round(stats.bestScore)}/100</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {sessionHistory.length > 0 ? (
              <div className="space-y-4">
                {sessionHistory.map((session, index) => (
                  <div key={session.id} className="border rounded-xl p-5 hover:bg-gray-50 transition-colors hover:shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getScoreBadge(session.finalScore)}`}>
                          {Math.round(session.finalScore)} pts
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{exercises.find(e => e.id === session.exerciseType)?.emoji}</span>
                          <span className="font-semibold text-gray-900 capitalize">
                            {exercises.find(e => e.id === session.exerciseType)?.name}
                          </span>
                        </div>
                        <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                          ⏱️ {formatDuration(session.duration)}
                        </span>
                        {index === 0 && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            Más reciente
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {new Date(session.createdAt).toLocaleString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-600 font-medium">Precisión:</span>
                        <span className="font-bold">{Math.round(session.accuracy)}%</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-600 font-medium">Frames:</span>
                        <span className="font-bold">{session.totalFrames}</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-600 font-medium">Buenos:</span>
                        <span className="font-bold">{session.goodFrames}</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-600 font-medium">Puntuación:</span>
                        <span className={`font-bold ${getScoreColor(session.finalScore)}`}>
                          {Math.round(session.finalScore)}/100
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <div className="text-6xl mb-6">📊</div>
                <p className="text-2xl font-medium mb-3">No hay sesiones registradas</p>
                <p className="text-lg">La cámara se activará automáticamente al cargar la página</p>
                <p className="text-sm mt-2">Inicia una sesión para ver tu progreso aquí</p>
              </div>
            )}
          </div>
        </div>

        {/* Información mejorada */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
            Sistema de Análisis Activo
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div>
              <h4 className="font-semibold text-green-800 mb-4 text-lg flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Funcionando Ahora:
              </h4>
              <ul className="space-y-3 text-green-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Cámara automática sin permisos manuales
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Controles de grabación en tiempo real
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Historial completo de sesiones
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Métricas simuladas de rendimiento
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-4 text-lg flex items-center">
                <span className="text-blue-500 mr-2">🔄</span>
                Próximas Funciones:
              </h4>
              <ul className="space-y-3 text-blue-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Detección de pose con MediaPipe
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Cálculo automático de ángulos
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Feedback en tiempo real
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Guardado en base de datos
                </li>
              </ul>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm">
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">💡</span>
              Cómo Usar la Aplicación:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">1️⃣</div>
                <div className="font-medium text-blue-900">Carga la página</div>
                <div className="text-blue-700 text-xs mt-1">La cámara se activa automáticamente</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">2️⃣</div>
                <div className="font-medium text-blue-900">Selecciona ejercicio</div>
                <div className="text-blue-700 text-xs mt-1">Elige el tipo de análisis</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">3️⃣</div>
                <div className="font-medium text-blue-900">Inicia sesión</div>
                <div className="text-blue-700 text-xs mt-1">Haz clic en "Iniciar Sesión"</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">4️⃣</div>
                <div className="font-medium text-blue-900">Realiza ejercicio</div>
                <div className="text-blue-700 text-xs mt-1">Muévete frente a la cámara</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">5️⃣</div>
                <div className="font-medium text-blue-900">Ve resultados</div>
                <div className="text-blue-700 text-xs mt-1">Revisa tu puntuación</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPage;