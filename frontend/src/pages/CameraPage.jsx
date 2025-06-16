/**
 * GymForm Analyzer - Camera Page con MediaPipe
 * Archivo: frontend/src/pages/CameraPage.jsx (REEMPLAZAR)
 */

import { useState } from 'react';
import { Activity, Target, BarChart3, Camera, Zap, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import EnhancedAutoCamera from '../components/camera/EnhancedAutoCamera';

const CameraPage = () => {
  const [selectedExercise, setSelectedExercise] = useState('general');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  // Ejercicios disponibles con configuración mejorada
  const exercises = [
    { 
      id: 'general', 
      name: 'General', 
      description: 'Análisis general de postura y movimiento', 
      emoji: '🧘',
      color: 'bg-gray-100 border-gray-300'
    },
    { 
      id: 'squat', 
      name: 'Sentadilla', 
      description: 'Análisis específico: profundidad, rodillas, columna', 
      emoji: '🏋️',
      color: 'bg-blue-100 border-blue-300'
    },
    { 
      id: 'pushup', 
      name: 'Flexión', 
      description: 'Análisis específico: alineación, profundidad, forma', 
      emoji: '💪',
      color: 'bg-green-100 border-green-300'
    },
    { 
      id: 'deadlift', 
      name: 'Peso Muerto', 
      description: 'Análisis específico: espalda, caderas, rodillas', 
      emoji: '🏃',
      color: 'bg-purple-100 border-purple-300'
    },
  ];

  // =====================================
  // MANEJO DE SESIONES CON IA
  // =====================================

  const handleSessionData = (sessionData) => {
    console.log('📊 Evento de sesión con IA:', sessionData);

    if (sessionData.action === 'start') {
      const newSession = {
        id: sessionData.sessionId,
        exerciseType: selectedExercise,
        startTime: sessionData.timestamp,
        isActive: true
      };
      
      setCurrentSession(newSession);
      
      const exerciseName = exercises.find(e => e.id === selectedExercise)?.name || selectedExercise;
      toast.success(`🤖 Análisis de IA iniciado para ${exerciseName}`);
      console.log('🎬 Nueva sesión con IA:', newSession);
    }

    if (sessionData.action === 'stop') {
      if (currentSession) {
        const completedSession = {
          ...currentSession,
          endTime: sessionData.timestamp,
          duration: sessionData.duration,
          // DATOS REALES de MediaPipe (no simulados)
          finalScore: sessionData.finalScore || 0,
          accuracy: sessionData.accuracy || 0,
          totalFrames: sessionData.totalFrames || 0,
          goodFrames: sessionData.goodFrames || 0,
          lastAngles: sessionData.lastAngles || null,
          createdAt: new Date().toISOString(),
          isActive: false,
          isAiAnalyzed: true // Marcador de que fue analizado por IA
        };

        setSessionHistory(prev => [completedSession, ...prev]);
        setCurrentSession(null);
        
        console.log('✅ Sesión con IA completada:', completedSession);
        
        // Toast mejorado con datos reales
        if (completedSession.finalScore > 0) {
          toast.success(
            `🎯 ¡Análisis completado! Puntuación: ${Math.round(completedSession.finalScore)}/100 | ` +
            `Precisión: ${Math.round(completedSession.accuracy)}%`
          );
        } else {
          toast.success(`✅ Sesión guardada - Duración: ${formatDuration(completedSession.duration)}`);
        }
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
    
    const avgScore = sessionHistory.reduce((sum, session) => sum + (session.finalScore || 0), 0) / sessionHistory.length;
    const totalDuration = sessionHistory.reduce((sum, session) => sum + session.duration, 0);
    const bestScore = Math.max(...sessionHistory.map(s => s.finalScore || 0));
    const aiSessions = sessionHistory.filter(s => s.isAiAnalyzed).length;
    
    return { avgScore, totalDuration, bestScore, aiSessions };
  };

  const stats = getSessionStats();

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header mejorado */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🤖 Análisis de Técnica con IA
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            MediaPipe + Análisis inteligente en tiempo real
          </p>
          
          {/* Estado del sistema mejorado */}
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl shadow-sm">
            <Brain className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm text-green-800 font-medium">
              🚀 Sistema de IA MediaPipe activado - Análisis en tiempo real
            </span>
          </div>
        </div>

        {/* Selector de ejercicio mejorado */}
        <div className="bg-white rounded-xl shadow-sm border mb-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Target className="mr-3" size={24} />
            Seleccionar Tipo de Análisis
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
                    : `border-gray-200 hover:border-blue-300 bg-white ${exercise.color}`
                }`}
              >
                <div className="text-3xl mb-3">{exercise.emoji}</div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{exercise.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{exercise.description}</p>
                {selectedExercise === exercise.id && (
                  <div className="flex items-center text-blue-600 font-medium text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    IA configurada para este ejercicio
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {currentSession?.isActive && (
            <div className="mt-6 flex items-center justify-center text-amber-700 bg-amber-50 rounded-lg p-4">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse mr-3"></div>
              <span className="font-medium">🤖 Análisis de IA activo - Finaliza la sesión para cambiar de ejercicio</span>
            </div>
          )}
        </div>

        {/* Cámara con IA */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Activity className="mr-3" size={24} />
                Análisis con IA: {exercises.find(e => e.id === selectedExercise)?.name}
                <span className="ml-2 text-2xl">{exercises.find(e => e.id === selectedExercise)?.emoji}</span>
                <span className="ml-3 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">MediaPipe</span>
              </h2>
              
              {currentSession?.isActive && (
                <div className="flex items-center space-x-3 bg-red-50 px-4 py-2 rounded-full border border-red-200">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-semibold">🤖 IA Analizando</span>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <EnhancedAutoCamera 
                onSessionData={handleSessionData} 
                exerciseType={selectedExercise}
              />
            </div>
          </div>
        </div>

        {/* Métricas en tiempo real actualizadas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="text-blue-600" size={24} />
              </div>
              <h3 className="font-semibold text-lg">IA Estado</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {currentSession?.isActive ? '🤖 Activa' : '⏸️ Standby'}
            </div>
            <div className="text-sm text-gray-600">
              {currentSession?.isActive ? 'Analizando en tiempo real' : 'Lista para iniciar'}
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
            <div className="text-sm text-gray-600">Algoritmo específico cargado</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold text-lg">Sesiones IA</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats?.aiSessions || 0} / {sessionHistory.length}
            </div>
            <div className="text-sm text-gray-600">Con análisis de IA</div>
          </div>

          {stats && (
            <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Camera className="text-yellow-600" size={24} />
                </div>
                <h3 className="font-semibold text-lg">Promedio IA</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{Math.round(stats.avgScore)}/100</div>
              <div className="text-sm text-gray-600">Puntuación media con IA</div>
            </div>
          )}
        </div>

        {/* Historial de sesiones mejorado */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="mr-3" size={24} />
                Historial de Análisis con IA
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
                        {session.isAiAnalyzed && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium border border-blue-200">
                            🤖 IA
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getScoreBadge(session.finalScore || 0)}`}>
                          {Math.round(session.finalScore || 0)} pts
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
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
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
                        <span className="text-gray-600 font-medium">Precisión IA:</span>
                        <span className="font-bold">{Math.round(session.accuracy || 0)}%</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-600 font-medium">Frames:</span>
                        <span className="font-bold">{session.totalFrames || 0}</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-600 font-medium">Buenos:</span>
                        <span className="font-bold">{session.goodFrames || 0}</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-600 font-medium">Puntuación:</span>
                        <span className={`font-bold ${getScoreColor(session.finalScore || 0)}`}>
                          {Math.round(session.finalScore || 0)}/100
                        </span>
                      </div>
                    </div>

                    {/* Mostrar ángulos si están disponibles */}
                    {session.lastAngles && (
                      <div className="mt-3 pt-3 border-t">
                        <details className="cursor-pointer">
                          <summary className="text-sm font-medium text-gray-600 hover:text-gray-800">
                            📐 Ver ángulos detectados por IA
                          </summary>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            {Object.entries(session.lastAngles).map(([joint, angle]) => (
                              angle && (
                                <div key={joint} className="bg-blue-50 rounded p-2">
                                  <span className="text-gray-600">{joint}:</span>
                                  <span className="font-medium ml-1">{angle}°</span>
                                </div>
                              )
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <div className="text-6xl mb-6">🤖</div>
                <p className="text-2xl font-medium mb-3">No hay sesiones con IA registradas</p>
                <p className="text-lg">El sistema MediaPipe está listo para analizar tu técnica</p>
                <p className="text-sm mt-2">Inicia una sesión para ver el análisis de IA aquí</p>
              </div>
            )}
          </div>
        </div>

        {/* Información del sistema de IA */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
            Sistema de Análisis de IA MediaPipe
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
                  Detección de pose MediaPipe en tiempo real
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Cálculo automático de ángulos de articulaciones
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Análisis específico por tipo de ejercicio
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Puntuación automática de técnica
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Feedback visual en tiempo real
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-4 text-lg flex items-center">
                <span className="text-blue-500 mr-2">🔄</span>
                Próximas Mejoras:
              </h4>
              <ul className="space-y-3 text-blue-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Guardado en base de datos MySQL
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Análisis de progreso histórico
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Recomendaciones personalizadas
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Exportación de datos de entrenamiento
                </li>
              </ul>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm">
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🎯</span>
              Cómo Funciona el Análisis de IA:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">1️⃣</div>
                <div className="font-medium text-blue-900">Detecta pose</div>
                <div className="text-blue-700 text-xs mt-1">33 puntos del cuerpo</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">2️⃣</div>
                <div className="font-medium text-blue-900">Calcula ángulos</div>
                <div className="text-blue-700 text-xs mt-1">Articulaciones clave</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">3️⃣</div>
                <div className="font-medium text-blue-900">Analiza técnica</div>
                <div className="text-blue-700 text-xs mt-1">Según ejercicio específico</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">4️⃣</div>
                <div className="font-medium text-blue-900">Genera puntuación</div>
                <div className="text-blue-700 text-xs mt-1">0-100 puntos automático</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">5️⃣</div>
                <div className="font-medium text-blue-900">Feedback visual</div>
                <div className="text-blue-700 text-xs mt-1">Esqueleto + ángulos</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPage;