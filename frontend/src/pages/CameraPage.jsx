/**
 * GymForm Analyzer - Camera Page con Interfaz Compacta
 * Diseño optimizado para mostrar todo sin scroll
 */

import { useState } from 'react';
import { Activity, Target, BarChart3, Camera, Zap, Brain, TrendingUp } from 'lucide-react';
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
      description: 'Análisis general', 
      emoji: '🧘',
      color: 'bg-gray-50 border-gray-300'
    },
    { 
      id: 'squat', 
      name: 'Sentadilla', 
      description: 'Profundidad y forma', 
      emoji: '🏋️',
      color: 'bg-blue-50 border-blue-300'
    },
    { 
      id: 'pushup', 
      name: 'Flexión', 
      description: 'Alineación y rango', 
      emoji: '💪',
      color: 'bg-green-50 border-green-300'
    },
    { 
      id: 'deadlift', 
      name: 'Peso Muerto', 
      description: 'Espalda y caderas', 
      emoji: '🏃',
      color: 'bg-purple-50 border-purple-300'
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
    }

    if (sessionData.action === 'stop') {
      if (currentSession) {
        const completedSession = {
          ...currentSession,
          endTime: sessionData.timestamp,
          duration: sessionData.duration,
          finalScore: sessionData.finalScore || 0,
          accuracy: sessionData.accuracy || 0,
          totalFrames: sessionData.totalFrames || 0,
          goodFrames: sessionData.goodFrames || 0,
          lastAngles: sessionData.lastAngles || null,
          createdAt: new Date().toISOString(),
          isActive: false,
          isAiAnalyzed: true
        };

        setSessionHistory(prev => [completedSession, ...prev.slice(0, 4)]); // Solo mantener las últimas 5
        setCurrentSession(null);
        
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
  // RENDER COMPACTO
  // =====================================

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Compacto */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🤖 Análisis de Técnica con IA
          </h1>
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg shadow-sm">
            <Brain className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm text-green-800 font-medium">
              Sistema MediaPipe activado
            </span>
          </div>
        </div>

        {/* Layout Principal - 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda - Cámara y Controles (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Selector de Ejercicio Compacto */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Target className="mr-2" size={20} />
                Tipo de Análisis
              </h2>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {exercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => setSelectedExercise(exercise.id)}
                    disabled={currentSession?.isActive}
                    className={`p-3 rounded-lg border-2 transition-all text-center hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedExercise === exercise.id
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md'
                        : `border-gray-200 hover:border-blue-300 bg-white ${exercise.color}`
                    }`}
                  >
                    <div className="text-2xl mb-1">{exercise.emoji}</div>
                    <h3 className="font-semibold text-sm text-gray-900">{exercise.name}</h3>
                    <p className="text-xs text-gray-600">{exercise.description}</p>
                    {selectedExercise === exercise.id && (
                      <div className="flex items-center justify-center text-blue-600 font-medium text-xs mt-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></div>
                        IA Activa
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {currentSession?.isActive && (
                <div className="mt-3 flex items-center justify-center text-amber-700 bg-amber-50 rounded-lg p-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-2"></div>
                  <span className="font-medium text-sm">🤖 Análisis de IA activo</span>
                </div>
              )}
            </div>

            {/* Cámara Compacta */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-gray-50 to-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Activity className="mr-2" size={20} />
                  {exercises.find(e => e.id === selectedExercise)?.name}
                  <span className="ml-2 text-xl">{exercises.find(e => e.id === selectedExercise)?.emoji}</span>
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">MediaPipe</span>
                </h2>
                
                {currentSession?.isActive && (
                  <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-700 font-semibold text-sm">🤖 IA Analizando</span>
                  </div>
                )}
              </div>
              
              {/* Cámara más pequeña */}
              <div className="p-3">
                <div className="max-w-2xl mx-auto">
                  <EnhancedAutoCamera 
                    onSessionData={handleSessionData} 
                    exerciseType={selectedExercise}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Estadísticas y Historial (1/3) */}
          <div className="space-y-4">
            
            {/* Métricas en Tiempo Real */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <TrendingUp className="mr-2" size={20} />
                Estado del Sistema
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Brain className="text-blue-600 mr-2" size={16} />
                    <span className="font-medium text-sm">IA Estado</span>
                  </div>
                  <span className="text-sm font-bold">
                    {currentSession?.isActive ? '🤖 Activa' : '⏸️ Standby'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Target className="text-green-600 mr-2" size={16} />
                    <span className="font-medium text-sm">Ejercicio</span>
                  </div>
                  <span className="text-sm font-bold">
                    {exercises.find(e => e.id === selectedExercise)?.emoji} {exercises.find(e => e.id === selectedExercise)?.name}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <BarChart3 className="text-purple-600 mr-2" size={16} />
                    <span className="font-medium text-sm">Sesiones IA</span>
                  </div>
                  <span className="text-sm font-bold">
                    {stats?.aiSessions || 0} / {sessionHistory.length}
                  </span>
                </div>

                {stats && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <Camera className="text-yellow-600 mr-2" size={16} />
                      <span className="font-medium text-sm">Promedio</span>
                    </div>
                    <span className="text-sm font-bold">{Math.round(stats.avgScore)}/100</span>
                  </div>
                )}
              </div>
            </div>

            {/* Historial Compacto */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BarChart3 className="mr-2" size={20} />
                    Historial IA
                  </h3>
                  {stats && (
                    <div className="text-xs text-gray-600">
                      Mejor: <span className="font-semibold text-green-600">{Math.round(stats.bestScore)}/100</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto">
                {sessionHistory.length > 0 ? (
                  <div className="space-y-3">
                    {sessionHistory.slice(0, 5).map((session, index) => (
                      <div key={session.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {session.isAiAnalyzed && (
                              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-medium">
                                🤖
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getScoreBadge(session.finalScore || 0)}`}>
                              {Math.round(session.finalScore || 0)}
                            </span>
                            <span className="text-lg">{exercises.find(e => e.id === session.exerciseType)?.emoji}</span>
                            {index === 0 && (
                              <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs font-medium">
                                Nuevo
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            {new Date(session.createdAt).toLocaleString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between bg-gray-50 rounded p-2">
                            <span className="text-gray-600">Precisión:</span>
                            <span className="font-bold">{Math.round(session.accuracy || 0)}%</span>
                          </div>
                          <div className="flex justify-between bg-gray-50 rounded p-2">
                            <span className="text-gray-600">Tiempo:</span>
                            <span className="font-bold">{formatDuration(session.duration)}</span>
                          </div>
                        </div>

                        {/* Mostrar ángulos si están disponibles */}
                        {session.lastAngles && (
                          <div className="mt-2 pt-2 border-t">
                            <details className="cursor-pointer">
                              <summary className="text-xs font-medium text-gray-600 hover:text-gray-800">
                                📐 Ángulos IA
                              </summary>
                              <div className="mt-1 grid grid-cols-2 gap-1 text-xs">
                                {Object.entries(session.lastAngles).slice(0, 4).map(([joint, angle]) => (
                                  angle && (
                                    <div key={joint} className="bg-blue-50 rounded p-1">
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
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-3">🤖</div>
                    <p className="text-sm font-medium mb-1">No hay sesiones IA</p>
                    <p className="text-xs">Inicia una sesión para ver análisis</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info del Sistema Compacta */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                Sistema MediaPipe
              </h4>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center text-green-700">
                  <span className="text-green-500 mr-2">✅</span>
                  Detección de pose en tiempo real
                </div>
                <div className="flex items-center text-green-700">
                  <span className="text-green-500 mr-2">✅</span>
                  Cálculo automático de ángulos
                </div>
                <div className="flex items-center text-green-700">
                  <span className="text-green-500 mr-2">✅</span>
                  Análisis específico por ejercicio
                </div>
                <div className="flex items-center text-green-700">
                  <span className="text-green-500 mr-2">✅</span>
                  Feedback visual en tiempo real
                </div>
              </div>
              
              <div className="mt-3 bg-white rounded-lg p-2 border border-blue-200">
                <div className="text-xs text-blue-900 font-medium mb-1">🎯 Proceso de IA:</div>
                <div className="grid grid-cols-5 gap-1 text-xs">
                  <div className="text-center p-1 bg-blue-50 rounded">
                    <div className="text-lg">1️⃣</div>
                    <div className="font-medium">Detecta</div>
                  </div>
                  <div className="text-center p-1 bg-blue-50 rounded">
                    <div className="text-lg">2️⃣</div>
                    <div className="font-medium">Calcula</div>
                  </div>
                  <div className="text-center p-1 bg-blue-50 rounded">
                    <div className="text-lg">3️⃣</div>
                    <div className="font-medium">Analiza</div>
                  </div>
                  <div className="text-center p-1 bg-blue-50 rounded">
                    <div className="text-lg">4️⃣</div>
                    <div className="font-medium">Puntúa</div>
                  </div>
                  <div className="text-center p-1 bg-blue-50 rounded">
                    <div className="text-lg">5️⃣</div>
                    <div className="font-medium">Muestra</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPage;