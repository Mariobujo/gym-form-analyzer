/**
 * GymForm Analyzer - Enhanced AutoCamera Compacto
 * Versión optimizada para interfaz compacta
 */

import { useState, useRef, useEffect } from 'react';
import { Camera, Play, Pause, RefreshCw, Target, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePoseDetector } from '../../hooks/usePoseDetector';

const EnhancedAutoCamera = ({ onSessionData, exerciseType = 'general' }) => {
  // Estados de cámara
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de pose
  const [poseStats, setPoseStats] = useState({
    totalFrames: 0,
    goodFrames: 0,
    currentScore: 0,
    averageScore: 0,
    angles: null,
    feedback: []
  });

  // Referencias
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const sessionIntervalRef = useRef(null);
  const poseIntervalRef = useRef(null);

  // Hook de detección de pose
  const {
    isLoading: poseLoading,
    isInitialized: poseInitialized,
    error: poseError,
    processFrame,
    setCallbacks,
    drawPose,
    currentPose,
    angles,
    confidence,
    detected
  } = usePoseDetector({
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
  });

  // =====================================
  // EFECTOS (Misma lógica, código reducido para brevedad)
  // =====================================

  useEffect(() => {
    console.log('🚀 Iniciando cámara con detección de pose...');
    startCameraDirectly();
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (isRecording) {
      sessionIntervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);

      if (poseInitialized) {
        poseIntervalRef.current = setInterval(() => {
          processPoseFrame();
        }, 100);
      }
    } else {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
      if (poseIntervalRef.current) clearInterval(poseIntervalRef.current);
    }
    
    return () => {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
      if (poseIntervalRef.current) clearInterval(poseIntervalRef.current);
    };
  }, [isRecording, poseInitialized]);

  useEffect(() => {
    if (poseInitialized) {
      setCallbacks({
        onResults: handlePoseResults,
        onError: handlePoseError
      });

      if (isActive) {
        poseIntervalRef.current = setInterval(() => {
          processPoseFrame();
        }, 500);
      }
    }

    return () => {
      if (poseIntervalRef.current) {
        clearInterval(poseIntervalRef.current);
      }
    };
  }, [poseInitialized, exerciseType, isActive]);

  // =====================================
  // FUNCIONES DE CÁMARA (Simplificadas)
  // =====================================

  const startCameraDirectly = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const constraints = {
        video: {
          width: { ideal: 640 }, // Resolución más pequeña para interfaz compacta
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        const handleVideoReady = () => {
          videoRef.current.play()
            .then(() => {
              setIsActive(true);
              setIsLoading(false);
              toast.success('🎥 Cámara + IA activada!');
            })
            .catch(error => {
              setError('Error reproduciendo video');
              setIsLoading(false);
            });
        };

        videoRef.current.addEventListener('loadedmetadata', handleVideoReady);
      }
    } catch (error) {
      setIsLoading(false);
      setError('Error accediendo a cámara');
      toast.error('❌ Error activando cámara');
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    if (poseIntervalRef.current) clearInterval(poseIntervalRef.current);
  };

  const restartCamera = () => {
    cleanup();
    setIsActive(false);
    setError(null);
    setPoseStats({
      totalFrames: 0,
      goodFrames: 0,
      currentScore: 0,
      averageScore: 0,
      angles: null,
      feedback: []
    });
    startCameraDirectly();
  };

  // =====================================
  // FUNCIONES DE POSE (Simplificadas)
  // =====================================

  const processPoseFrame = async () => {
    if (!videoRef.current || !poseInitialized) return;

    const video = videoRef.current;
    if (video.readyState >= 2) {
      try {
        await processFrame(video);
      } catch (error) {
        console.error('❌ Error procesando frame de pose:', error);
      }
    }
  };

  const handlePoseResults = (poseData) => {
    updatePoseCanvas(poseData);

    if (isRecording && poseData.detected && poseData.confidence > 0.5) {
      const score = calculatePoseScore(poseData.angles, exerciseType);
      
      setPoseStats(prev => {
        const newTotalFrames = prev.totalFrames + 1;
        const newGoodFrames = score >= 70 ? prev.goodFrames + 1 : prev.goodFrames;
        const newAverageScore = (prev.averageScore * prev.totalFrames + score) / newTotalFrames;
        
        return {
          totalFrames: newTotalFrames,
          goodFrames: newGoodFrames,
          currentScore: score,
          averageScore: newAverageScore,
          angles: poseData.angles,
          feedback: []
        };
      });
    }
  };

  const handlePoseError = (error) => {
    console.error('Error en detección de pose:', error);
  };

  const updatePoseCanvas = (poseData) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (poseData.landmarks && poseData.landmarks.length > 0) {
      // Dibujar esqueleto más simple para interfaz compacta
      poseData.landmarks.forEach((landmark, index) => {
        if (landmark.visibility > 0.3) {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          
          // Puntos más pequeños para interfaz compacta
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#00FF41';
          ctx.fill();
        }
      });

      // Texto indicando detección compacto
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('IA DETECTANDO', 10, 25);
    }
  };

  // =====================================
  // ANÁLISIS ESPECÍFICO POR EJERCICIO (Simplificado)
  // =====================================

  const calculatePoseScore = (angles, exercise) => {
    if (!angles) return 0;

    let score = 100;
    let penalties = [];

    switch (exercise) {
      case 'squat':
        if (angles.leftKnee && angles.rightKnee) {
          const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
          if (avgKnee > 120) penalties.push({ points: 15 });
          const kneeDiff = Math.abs(angles.leftKnee - angles.rightKnee);
          if (kneeDiff > 20) penalties.push({ points: 10 });
        }
        if (angles.spine > 20) penalties.push({ points: 15 });
        break;
      case 'pushup':
        if (angles.leftElbow && angles.rightElbow) {
          const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
          if (avgElbow > 120) penalties.push({ points: 15 });
        }
        if (angles.spine > 15) penalties.push({ points: 20 });
        break;
      default:
        if (angles.spine > 20) penalties.push({ points: 10 });
    }

    penalties.forEach(penalty => score -= penalty.points);
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  // =====================================
  // FUNCIONES DE GRABACIÓN
  // =====================================

  const startRecording = () => {
    if (!isActive || !poseInitialized) {
      toast.error('❌ Sistema no está listo');
      return;
    }
    
    setIsRecording(true);
    setSessionTime(0);
    setPoseStats({
      totalFrames: 0,
      goodFrames: 0,
      currentScore: 0,
      averageScore: 0,
      angles: null,
      feedback: []
    });
    
    toast.success('🔴 Análisis de pose iniciado');
    
    if (onSessionData) {
      onSessionData({
        action: 'start',
        timestamp: new Date(),
        sessionId: `pose_session_${Date.now()}`,
        exerciseType
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    if (poseIntervalRef.current) clearInterval(poseIntervalRef.current);
    
    const finalScore = poseStats.averageScore;
    const accuracy = poseStats.totalFrames > 0 ? (poseStats.goodFrames / poseStats.totalFrames) * 100 : 0;
    
    toast.success(`✅ Análisis completado - Puntuación: ${Math.round(finalScore)}/100`);
    
    if (onSessionData) {
      onSessionData({
        action: 'stop',
        timestamp: new Date(),
        duration: sessionTime,
        finalScore: finalScore,
        accuracy: accuracy,
        totalFrames: poseStats.totalFrames,
        goodFrames: poseStats.goodFrames,
        exerciseType: exerciseType,
        lastAngles: poseStats.angles
      });
    }
  };

  // =====================================
  // UTILIDADES
  // =====================================

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (poseLoading || isLoading) return 'yellow';
    if (error || poseError) return 'red';
    if (isActive && poseInitialized) return 'green';
    return 'gray';
  };

  const getStatusMessage = () => {
    if (poseLoading || isLoading) return 'Inicializando IA...';
    if (error) return `Error: ${error}`;
    if (poseError) return `Error IA: ${poseError}`;
    if (isActive && poseInitialized) return 'IA Lista';
    return 'Desactivado';
  };

  // =====================================
  // RENDER COMPACTO
  // =====================================

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Video Container Compacto */}
      <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        {/* Canvas overlay para pose */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 20 }}
        />
        
        {/* Overlay de carga */}
        {(isLoading || poseLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white">
              <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-3"></div>
              <h3 className="text-lg font-medium mb-1">
                {isLoading ? 'Activando cámara...' : 'Inicializando IA...'}
              </h3>
              <p className="text-gray-300 text-sm">
                {isLoading ? 'Acceso automático' : 'Cargando MediaPipe'}
              </p>
            </div>
          </div>
        )}

        {/* Overlay de error */}
        {(error || poseError) && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90">
            <div className="text-center text-white max-w-sm mx-auto px-4">
              <Camera size={48} className="mx-auto mb-3 opacity-75" />
              <h3 className="text-lg font-medium mb-2">Error del Sistema</h3>
              <p className="text-red-200 mb-4 text-sm">{error || poseError}</p>
              <button
                onClick={restartCamera}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors mx-auto text-sm"
              >
                <RefreshCw size={16} />
                <span>Reintentar</span>
              </button>
            </div>
          </div>
        )}

        {/* Indicadores compactos cuando está activa */}
        {isActive && !error && !poseError && (
          <>
            {/* Indicador de grabación */}
            {isRecording && (
              <div className="absolute top-2 left-2 flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-bold bg-red-600 bg-opacity-80 px-2 py-1 rounded-full text-xs">
                  🔴 {formatTime(sessionTime)}
                </span>
              </div>
            )}

            {/* Estado del sistema */}
            <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
              getStatusColor() === 'green' ? 'bg-green-600 bg-opacity-80 text-white' :
              getStatusColor() === 'yellow' ? 'bg-yellow-600 bg-opacity-80 text-white' :
              'bg-red-600 bg-opacity-80 text-white'
            }`}>
              {getStatusMessage()}
            </div>

            {/* Métricas de pose en tiempo real (compactas) */}
            {isRecording && poseStats.totalFrames > 0 && (
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-80 text-white p-2 rounded-lg text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>Frames: {poseStats.totalFrames}</div>
                  <div>Buenos: {poseStats.goodFrames}</div>
                  <div>Actual: {Math.round(poseStats.currentScore)}</div>
                  <div>Promedio: {Math.round(poseStats.averageScore)}</div>
                </div>
              </div>
            )}

            {/* Indicador de pose detectada */}
            {detected && confidence > 0 && (
              <div className="absolute bottom-2 right-2 bg-green-600 bg-opacity-90 text-white px-2 py-1 rounded-lg text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>IA: {Math.round(confidence * 100)}%</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Panel de controles compacto */}
      <div className="p-3 bg-gray-50">
        {/* Controles principales */}
        <div className="flex items-center justify-center space-x-3">
          {isActive && !error && !poseError ? (
            <>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!poseInitialized}
                className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isRecording ? <Pause size={18} /> : <Play size={18} />}
                <span>{isRecording ? 'Finalizar' : 'Iniciar'}</span>
              </button>

              <button
                onClick={restartCamera}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              >
                <RefreshCw size={16} />
                <span>Reset</span>
              </button>
            </>
          ) : (
            <button
              onClick={restartCamera}
              disabled={isLoading || poseLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
            >
              <Camera size={18} />
              <span>
                {isLoading ? 'Activando...' : 
                 poseLoading ? 'Cargando IA...' : 
                 'Activar Sistema'}
              </span>
            </button>
          )}
        </div>

        {/* Información de estado compacta */}
        <div className="mt-2 text-center text-xs">
          {isActive && poseInitialized && !error && !poseError && (
            <span className="text-green-600 font-medium">
              ✅ Sistema IA funcionando
              {isRecording && ` • ${formatTime(sessionTime)}`}
              {detected && ` • Pose detectada`}
            </span>
          )}
          {(error || poseError) && (
            <span className="text-red-600">
              ❌ Error del sistema
            </span>
          )}
        </div>

        {/* Métricas de sesión compactas */}
        {isRecording && poseStats.totalFrames > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-1 text-xs">
            <div className="bg-white rounded p-1 text-center border">
              <div className="font-bold text-sm">{poseStats.totalFrames}</div>
              <div className="text-gray-600">Frames</div>
            </div>
            <div className="bg-white rounded p-1 text-center border">
              <div className="font-bold text-sm text-green-600">{poseStats.goodFrames}</div>
              <div className="text-gray-600">Buenos</div>
            </div>
            <div className="bg-white rounded p-1 text-center border">
              <div className="font-bold text-sm text-blue-600">{Math.round(poseStats.currentScore)}</div>
              <div className="text-gray-600">Actual</div>
            </div>
            <div className="bg-white rounded p-1 text-center border">
              <div className="font-bold text-sm text-purple-600">{Math.round(poseStats.averageScore)}</div>
              <div className="text-gray-600">Promedio</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAutoCamera;