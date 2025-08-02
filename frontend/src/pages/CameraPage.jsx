/**
 * GymForm Analyzer - Camera Page con Puntos de Pose Visibles
 */

import { useState } from 'react';
import { Activity, Target, BarChart3, Camera, Zap, Brain, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import CameraWithPosePoints from '../components/camera/CameraWithPosePoints';

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
      toast.success(`🤖 Análisis de puntos iniciado para ${exerciseName}`);
    }

    if (sessionData.action === 'stop') {
      if (currentSession) {
        const completedSession = {
          ...currentSession,
          endTime: sessionData.timestamp,
          duration: sessionData.duration,
          frameCount: sessionData.frameCount || 0,
          poseDetected: sessionData.poseDetected || false,
          createdAt: new Date().toISOString(),
          isActive: false
        };

        setSessionHistory(prev => [completedSession, ...prev.slice(0, 9)]); // Solo mantener las últimas 10
        setCurrentSession(null);
        
        toast.success(
          `✅ Sesión completada - Duración: ${formatDuration(completedSession.duration)} | ` +
          `Frames: ${completedSession.frameCount}`
        );
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

  const getSessionStats = () => {
    if (sessionHistory.length === 0) return null;
    
    const totalDuration = sessionHistory.reduce((sum, session) => sum + session.duration, 0);
    const totalFrames = sessionHistory.reduce((sum, session) => sum + (session.frameCount || 0), 0);
    const successfulDetections = sessionHistory.filter(s => s.poseDetected).length;
    const avgDuration = totalDuration / sessionHistory.length;
    
    return { totalDuration, totalFrames, successfulDetections, avgDuration };
  };

  const stats = getSessionStats();

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🤖 Detección de Puntos de Pose MediaPipe
          </h1>
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg shadow-sm">
            <Zap className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm text-green-800 font-medium">
              Puntos de pose visibles en tiempo real
            </span>
          </div>
        </div>

        {/* Layout Principal - 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda - Cámara y Controles (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Selector de Ejercicio */}
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
                        Seleccionado
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {currentSession?.isActive && (
                <div className="mt-3 flex items-center justify-center text-amber-700 bg-amber-50 rounded-lg p-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-2"></div>
                  <span className="font-medium text-sm">🎥 Análisis activo</span>
                </div>
              )}
            </div>

            {/* Cámara con Puntos de Pose */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-gray-50 to-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Activity className="mr-2" size={20} />
                  {exercises.find(e => e.id === selectedExercise)?.name}
                  <span className="ml-2 text-xl">{exercises.find(e => e.id === selectedExercise)?.emoji}</span>
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">MediaPipe</span>
                </h2>
                
                {currentSession?.isActive && (
                  <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-700 font-semibold text-sm">🎥 Grabando</span>
                  </div>
                )}
              </div>
              
              {/* Cámara con puntos de pose */}
              <div className="p-3">
                <CameraWithPosePoints 
                  onSessionData={handleSessionData} 
                  exerciseType={selectedExercise}
                />
              </div>
            </div>

            {/* Información sobre los puntos */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <Zap className="mr-2" size={20} />
                Puntos de Pose MediaPipe
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2 text-blue-800">🎯 Puntos Principales:</h4>
                  <ul className="space-y-1 text-blue-700">
                    <li className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      Nariz (rojo)
                    </li>
                    <li className="flex items-center">
                      <div className="w-3 h-3 bg-teal-500 rounded-full mr-2"></div>
                      Hombros (cyan)
                    </li>
                    <li className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      Brazos (azul)
                    </li>
                    <li className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      Caderas (amarillo)
                    </li>
                    <li className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                      Piernas (púrpura)
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-blue-800">📊 Información:</h4>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Total de 33 puntos detectables</li>
                    <li>• Conexiones de esqueleto en verde</li>
                    <li>• Confianza en tiempo real</li>
                    <li>• Detección automática de pose</li>
                    <li>• Optimizado para ejercicios</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Estadísticas e Historial (1/3) */}
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
                    <span className="font-medium text-sm">MediaPipe</span>
                  </div>
                  <span className="text-sm font-bold">
                    {currentSession?.isActive ? '🤖 Activo' : '⏸️ Standby'}
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
                    <span className="font-medium text-sm">Sesiones</span>
                  </div>
                  <span className="text-sm font-bold">
                    {sessionHistory.length}
                  </span>
                </div>

                {stats && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <Camera className="text-yellow-600 mr-2" size={16} />
                      <span className="font-medium text-sm">Total Frames</span>
                    </div>
                    <span className="text-sm font-bold">{stats.totalFrames}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Historial de Sesiones */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BarChart3 className="mr-2" size={20} />
                    Historial
                  </h3>
                  {stats && (
                    <div className="text-xs text-gray-600">
                      Detecciones: <span className="font-semibold text-green-600">{stats.successfulDetections}/{sessionHistory.length}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto">
                {sessionHistory.length > 0 ? (
                  <div className="space-y-3">
                    {sessionHistory.slice(0, 8).map((session, index) => (
                      <div key={session.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{exercises.find(e => e.id === session.exerciseType)?.emoji}</span>
                            <span className="font-medium text-sm">{exercises.find(e => e.id === session.exerciseType)?.name}</span>
                            {session.poseDetected && (
                              <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs font-medium">
                                ✅ Detectado
                              </span>
                            )}
                            {index === 0 && (
                              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-medium">
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
                            <span className="text-gray-600">Duración:</span>
                            <span className="font-bold">{formatDuration(session.duration)}</span>
                          </div>
                          <div className="flex justify-between bg-gray-50 rounded p-2">
                            <span className="text-gray-600">Frames:</span>
                            <span className="font-bold">{session.frameCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-3">🎥</div>
                    <p className="text-sm font-medium mb-1">No hay sesiones</p>
                    <p className="text-xs">Inicia una sesión para ver el historial</p>
                  </div>
                )}
              </div>
            </div>

            {/* Guía de Colores */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3">🎨 Guía de Colores</h4>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Esqueleto</span>
                  </div>
                  <span className="text-gray-600">Conexiones</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span>Puntos menores</span>
                  </div>
                  <span className="text-gray-600">Landmarks</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-white border-2 border-gray-400 rounded-full mr-2"></div>
                    <span>Centro blanco</span>
                  </div>
                  <span className="text-gray-600">Precisión</span>
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