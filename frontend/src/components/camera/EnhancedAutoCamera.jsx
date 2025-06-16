/**
 * GymForm Analyzer - Enhanced AutoCamera con MediaPipe
 * Cámara automática con detección de pose en tiempo real
 */

import { useState, useRef, useEffect } from 'react';
import { Camera, Play, Pause, RefreshCw, Target, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePoseDetector } from '../..          v                                                                                                                                                                                                                                                                                                                              /hooks/usePoseDetector';

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
  // EFECTOS
  // =====================================

  useEffect(() => {
    console.log('🚀 Iniciando cámara con detección de pose...');
    startCameraDirectly();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      // Interval para tiempo de sesión
      sessionIntervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);

      // Interval para procesamiento de pose (solo si está inicializado)
      if (poseInitialized) {
        poseIntervalRef.current = setInterval(() => {
          processPoseFrame();
        }, 100); // 10 FPS para análisis
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
    console.log('🔄 Hook effect - Pose initialized:', poseInitialized, 'Active:', isActive);
    
    if (poseInitialized) {
      setCallbacks({
        onResults: handlePoseResults,
        onError: handlePoseError
      });

      // Procesar frames incluso si no está grabando (para ver el esqueleto)
      if (isActive) {
        console.log('▶️ Iniciando procesamiento de pose...');
        poseIntervalRef.current = setInterval(() => {
          processPoseFrame();
        }, 500); // Más lento para debug: 2 FPS
      }
    }

    return () => {
      if (poseIntervalRef.current) {
        console.log('⏹️ Deteniendo procesamiento de pose');
        clearInterval(poseIntervalRef.current);
      }
    };
  }, [poseInitialized, exerciseType, isActive]);

  // =====================================
  // FUNCIONES DE CÁMARA
  // =====================================

  const startCameraDirectly = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('📹 Solicitando acceso directo a cámara...');

      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        const handleVideoReady = () => {
          console.log('🎥 Video listo para análisis de pose');
          videoRef.current.play()
            .then(() => {
              setIsActive(true);
              setIsLoading(false);
              toast.success('🎥 Cámara + IA activada!');
            })
            .catch(error => {
              console.error('Error reproduciendo:', error);
              setError('Error reproduciendo video');
              setIsLoading(false);
            });
        };

        videoRef.current.addEventListener('loadedmetadata', handleVideoReady);
      }
    } catch (error) {
      console.error('❌ Error accediendo a cámara:', error);
      setIsLoading(false);
      
      let errorMessage = 'Error desconocido';
      
      switch (error.name) {
        case 'NotAllowedError':
          errorMessage = 'Permiso de cámara denegado. Permite el acceso y recarga la página.';
          break;
        case 'NotFoundError':
          errorMessage = 'No se encontró ninguna cámara en este dispositivo.';
          break;
        case 'NotReadableError':
          errorMessage = 'La cámara está siendo usada por otra aplicación.';
          break;
        default:
          errorMessage = `Error de cámara: ${error.message}`;
      }
      
      setError(errorMessage);
      toast.error('❌ Error activando cámara');
    }
  };

  const cleanup = () => {
    console.log('🧹 Limpiando recursos...');
    
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
    console.log('🔄 Reiniciando cámara...');
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
  // FUNCIONES DE POSE
  // =====================================

  const processPoseFrame = async () => {
    if (!videoRef.current || !poseInitialized) {
      console.log('⚠️ No se puede procesar frame - Video:', !!videoRef.current, 'Pose:', poseInitialized);
      return;
    }

    const video = videoRef.current;
    if (video.readyState >= 2) {
      try {
        console.log('📹 Procesando frame...', video.videoWidth, 'x', video.videoHeight);
        const result = await processFrame(video);
        console.log('📹 Frame procesado:', result);
      } catch (error) {
        console.error('❌ Error procesando frame de pose:', error);
      }
    } else {
      console.log('⚠️ Video no está listo:', video.readyState);
    }
  };

  const handlePoseResults = (poseData) => {
    console.log('🤖 Resultado de pose:', {
      detected: poseData.detected,
      landmarks: poseData.landmarks?.length,
      confidence: poseData.confidence
    });

    // Actualizar canvas SIEMPRE (incluso sin pose para mostrar texto)
    updatePoseCanvas(poseData);

    // Solo procesar métricas si estamos grabando Y hay pose
    if (isRecording && poseData.detected && poseData.confidence > 0.5) {
      const score = calculatePoseScore(poseData.angles, exerciseType);
      const feedback = generateFeedback(poseData.angles, exerciseType);
      
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
          feedback: feedback
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
    
    // Asegurar que el canvas tenga el mismo tamaño que el video
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Limpiar canvas completamente
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // DIBUJAR UN CÍRCULO DE PRUEBA SIEMPRE (para verificar que el canvas funciona)
    ctx.beginPath();
    ctx.arc(100, 100, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF0000';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Texto de prueba
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('CANVAS FUNCIONANDO', 150, 120);

    // SI HAY LANDMARKS, dibujarlos
    if (poseData.landmarks && poseData.landmarks.length > 0) {
      console.log('🎨 Dibujando pose con', poseData.landmarks.length, 'puntos');
      
      // Dibujar TODOS los puntos en rojo grande
      poseData.landmarks.forEach((landmark, index) => {
        if (landmark.visibility > 0.3) { // Umbral más bajo
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          
          // Punto rojo grande
          ctx.beginPath();
          ctx.arc(x, y, 15, 0, 2 * Math.PI);
          ctx.fillStyle = '#FF0000';
          ctx.fill();
          
          // Número del punto
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(index.toString(), x, y + 4);
        }
      });

      // Texto indicando detección
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('POSE DETECTADA!', 10, 50);
    } else {
      // Si no hay landmarks
      ctx.fillStyle = '#FF0000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('NO HAY POSE', 10, 50);
    }
  };

  const drawAngleOverlays = (ctx, angles, landmarks, width, height) => {
    if (!angles || !landmarks) return;

    const anglesToShow = getImportantAngles(exerciseType, angles);

    anglesToShow.forEach(({ name, value, landmarkIndex }) => {
      if (value && landmarks[landmarkIndex] && landmarks[landmarkIndex].visibility > 0.5) {
        const x = landmarks[landmarkIndex].x * width;
        const y = landmarks[landmarkIndex].y * height;

        // Fondo semi-transparente para el texto
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x - 35, y - 40, 70, 30);

        // Borde del fondo
        ctx.strokeStyle = getAngleColor(value, exerciseType);
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 35, y - 40, 70, 30);

        // Texto del ángulo
        ctx.fillStyle = getAngleColor(value, exerciseType);
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${value}°`, x, y - 20);
        
        // Etiqueta
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(name, x, y - 5);
      }
    });
  };

  // =====================================
  // ANÁLISIS ESPECÍFICO POR EJERCICIO
  // =====================================

  const calculatePoseScore = (angles, exercise) => {
    if (!angles) return 0;

    let score = 100;
    let penalties = [];

    switch (exercise) {
      case 'squat':
        penalties = analyzeSquat(angles);
        break;
      case 'pushup':
        penalties = analyzePushup(angles);
        break;
      case 'deadlift':
        penalties = analyzeDeadlift(angles);
        break;
      default:
        penalties = analyzeGeneral(angles);
    }

    // Aplicar penalizaciones
    penalties.forEach(penalty => {
      score -= penalty.points;
    });

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const analyzeSquat = (angles) => {
    const penalties = [];

    // Profundidad de sentadilla
    if (angles.leftKnee && angles.rightKnee) {
      const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
      if (avgKnee > 120) penalties.push({ type: 'depth', points: 15 });
      else if (avgKnee > 100) penalties.push({ type: 'depth', points: 5 });
    }

    // Simetría de rodillas
    if (angles.leftKnee && angles.rightKnee) {
      const kneeDiff = Math.abs(angles.leftKnee - angles.rightKnee);
      if (kneeDiff > 20) penalties.push({ type: 'symmetry', points: 10 });
    }

    // Postura de columna
    if (angles.spine > 20) penalties.push({ type: 'posture', points: 15 });

    return penalties;
  };

  const analyzePushup = (angles) => {
    const penalties = [];

    // Profundidad de flexión
    if (angles.leftElbow && angles.rightElbow) {
      const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
      if (avgElbow > 120) penalties.push({ type: 'depth', points: 15 });
    }

    // Alineación del cuerpo
    if (angles.spine > 15) penalties.push({ type: 'alignment', points: 20 });

    return penalties;
  };

  const analyzeDeadlift = (angles) => {
    const penalties = [];

    // Postura de espalda
    if (angles.spine > 25) penalties.push({ type: 'back', points: 25 });

    // Posición de rodillas
    if (angles.leftKnee && angles.rightKnee) {
      const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
      if (avgKnee < 140) penalties.push({ type: 'knees', points: 10 });
    }

    return penalties;
  };

  const analyzeGeneral = (angles) => {
    const penalties = [];
    
    // Postura general
    if (angles.spine > 20) penalties.push({ type: 'posture', points: 10 });

    return penalties;
  };

  const generateFeedback = (angles, exercise) => {
    const feedback = [];

    switch (exercise) {
      case 'squat':
        if (angles.leftKnee && angles.rightKnee) {
          const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
          if (avgKnee < 80) feedback.push('¡Excelente profundidad!');
          else if (avgKnee > 120) feedback.push('Baja más las caderas');
          
          const kneeDiff = Math.abs(angles.leftKnee - angles.rightKnee);
          if (kneeDiff > 15) feedback.push('Mantén rodillas simétricas');
        }
        break;
        
      case 'pushup':
        if (angles.leftElbow && angles.rightElbow) {
          const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
          if (avgElbow < 60) feedback.push('¡Buena profundidad!');
          else if (avgElbow > 120) feedback.push('Baja más el pecho');
        }
        break;
    }

    if (angles.spine > 20) feedback.push('Mantén la espalda recta');

    return feedback;
  };

  const getImportantAngles = (exercise, angles) => {
    switch (exercise) {
      case 'squat':
        return [
          { name: 'Rod I', value: angles.leftKnee, landmarkIndex: 25 },
          { name: 'Rod D', value: angles.rightKnee, landmarkIndex: 26 },
          { name: 'Cadera I', value: angles.leftHip, landmarkIndex: 23 },
          { name: 'Cadera D', value: angles.rightHip, landmarkIndex: 24 }
        ];
      case 'pushup':
        return [
          { name: 'Codo I', value: angles.leftElbow, landmarkIndex: 13 },
          { name: 'Codo D', value: angles.rightElbow, landmarkIndex: 14 },
          { name: 'Hombro I', value: angles.leftShoulder, landmarkIndex: 11 },
          { name: 'Hombro D', value: angles.rightShoulder, landmarkIndex: 12 }
        ];
      default:
        return [
          { name: 'Rod I', value: angles.leftKnee, landmarkIndex: 25 },
          { name: 'Rod D', value: angles.rightKnee, landmarkIndex: 26 },
          { name: 'Codo I', value: angles.leftElbow, landmarkIndex: 13 },
          { name: 'Codo D', value: angles.rightElbow, landmarkIndex: 14 }
        ];
    }
  };

  const getAngleColor = (angle, exercise) => {
    // Lógica básica de colores según el ejercicio
    switch (exercise) {
      case 'squat':
        return angle < 90 ? '#00ff00' : angle < 120 ? '#ffff00' : '#ff0000';
      case 'pushup':
        return angle < 90 ? '#00ff00' : angle < 120 ? '#ffff00' : '#ff0000';
      default:
        return '#ffffff';
    }
  };

  // =====================================
  // FUNCIONES DE GRABACIÓN
  // =====================================

  const startRecording = () => {
    if (!isActive) {
      toast.error('❌ La cámara no está activa');
      return;
    }
    
    if (!poseInitialized) {
      toast.error('❌ El detector de pose no está listo');
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
    console.log('📹 Sesión con IA iniciada');
    
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
    console.log('🏁 Sesión finalizada:', {
      duration: sessionTime,
      totalFrames: poseStats.totalFrames,
      goodFrames: poseStats.goodFrames,
      finalScore,
      accuracy
    });
    
    if (onSessionData) {
      onSessionData({
        action: 'stop',
        timestamp: new Date(),
        duration: sessionTime,
        // Datos reales de análisis de pose
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
    if (isActive && poseInitialized) return 'Cámara + IA lista';
    return 'Desactivado';
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Video Container */}
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        {/* Canvas overlay para pose - MÁS VISIBLE */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none border-2 border-red-500"
          style={{ 
            zIndex: 20,
            backgroundColor: 'transparent'
          }}
        />
        
        {/* Overlay de carga */}
        {(isLoading || poseLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white">
              <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-medium mb-2">
                {isLoading ? 'Activando cámara...' : 'Inicializando IA...'}
              </h3>
              <p className="text-gray-300">
                {isLoading ? 'Solicitando acceso automático' : 'Cargando detector de pose'}
              </p>
              {poseLoading && (
                <div className="mt-4 bg-blue-900 bg-opacity-50 rounded-lg p-3">
                  <p className="text-blue-200 text-sm">🤖 Descargando modelo de IA...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overlay de error */}
        {(error || poseError) && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90">
            <div className="text-center text-white max-w-md mx-auto px-4">
              <Camera size={64} className="mx-auto mb-4 opacity-75" />
              <h3 className="text-xl font-medium mb-3">Error del Sistema</h3>
              <p className="text-red-200 mb-6 text-sm">{error || poseError}</p>
              <button
                onClick={restartCamera}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors mx-auto"
              >
                <RefreshCw size={18} />
                <span>Reintentar</span>
              </button>
            </div>
          </div>
        )}

        {/* Indicadores cuando está activa */}
        {isActive && !error && !poseError && (
          <>
            {/* Indicador de grabación */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-bold bg-red-600 bg-opacity-80 px-3 py-1 rounded-full">
                  🔴 REC {formatTime(sessionTime)}
                </span>
              </div>
            )}

            {/* Estado del sistema MEJORADO */}
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
              getStatusColor() === 'green' ? 'bg-green-600 bg-opacity-80 text-white' :
              getStatusColor() === 'yellow' ? 'bg-yellow-600 bg-opacity-80 text-white' :
              'bg-red-600 bg-opacity-80 text-white'
            }`}>
              {getStatusMessage()}
            </div>

            {/* DEBUG INFO */}
            <div className="absolute top-20 right-4 bg-black bg-opacity-80 text-white p-2 rounded text-xs">
              <div>Video: {videoRef.current?.videoWidth}x{videoRef.current?.videoHeight}</div>
              <div>Canvas: {canvasRef.current?.width}x{canvasRef.current?.height}</div>
              <div>Pose Init: {poseInitialized ? '✅' : '❌'}</div>
              <div>Active: {isActive ? '✅' : '❌'}</div>
            </div>

            {/* Métricas de pose en tiempo real */}
            {isRecording && poseStats.totalFrames > 0 && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Frames: {poseStats.totalFrames}</div>
                  <div>Buenos: {poseStats.goodFrames}</div>
                  <div>Puntuación: {Math.round(poseStats.currentScore)}</div>
                  <div>Promedio: {Math.round(poseStats.averageScore)}</div>
                </div>
              </div>
            )}

            {/* Feedback en tiempo real */}
            {isRecording && poseStats.feedback.length > 0 && (
              <div className="absolute bottom-4 right-4 bg-blue-900 bg-opacity-80 text-white p-3 rounded-lg max-w-xs">
                <div className="text-xs space-y-1">
                  {poseStats.feedback.slice(-2).map((feedback, index) => (
                    <div key={index} className="flex items-center">
                      <Target size={12} className="mr-1" />
                      <span>{feedback}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Indicador de pose detectada MEJORADO */}
            {detected && confidence > 0 && (
              <div className="absolute top-16 right-4 bg-green-600 bg-opacity-90 text-white px-3 py-2 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-sm font-bold">IA Detectando</div>
                    <div className="text-xs">Confianza: {Math.round(confidence * 100)}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Esqueleto detectado indicator */}
            {detected && (
              <div className="absolute top-32 right-4 bg-blue-600 bg-opacity-90 text-white px-2 py-1 rounded text-xs">
                🦴 Esqueleto visible
              </div>
            )}

            {/* Info de video */}
            {videoRef.current && (
              <div className="absolute bottom-4 center bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                {videoRef.current.videoWidth}x{videoRef.current.videoHeight} • {exerciseType}
              </div>
            )}
          </>
        )}
      </div>

      {/* Panel de controles mejorado */}
      <div className="p-4 bg-gray-50">
        {/* Controles principales */}
        <div className="flex items-center justify-center space-x-4">
          {isActive && !error && !poseError ? (
            <>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!poseInitialized}
                className={`flex items-center space-x-2 px-6 py-3 text-white rounded-lg transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isRecording ? <Pause size={24} /> : <Play size={24} />}
                <span>{isRecording ? 'Finalizar Análisis' : 'Iniciar Análisis'}</span>
              </button>

              <button
                onClick={restartCamera}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw size={18} />
                <span>Reiniciar</span>
              </button>
            </>
          ) : (
            <button
              onClick={restartCamera}
              disabled={isLoading || poseLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
            >
              <Camera size={20} />
              <span>
                {isLoading ? 'Activando...' : 
                 poseLoading ? 'Cargando IA...' : 
                 'Activar Sistema'}
              </span>
            </button>
          )}
        </div>

        {/* Información de estado detallada */}
        <div className="mt-4 text-center text-sm">
          {isLoading && (
            <span className="text-yellow-600">⏳ Iniciando cámara...</span>
          )}
          {poseLoading && (
            <span className="text-blue-600">🤖 Descargando modelo de IA...</span>
          )}
          {isActive && poseInitialized && !error && !poseError && (
            <span className="text-green-600 font-medium">
              ✅ Sistema completo funcionando
              {isRecording && ` • Analizando: ${formatTime(sessionTime)}`}
              {detected && ` • Pose detectada`}
            </span>
          )}
          {(error || poseError) && (
            <span className="text-red-600">
              ❌ Error: {error || poseError}
            </span>
          )}
        </div>

        {/* Métricas de sesión */}
        {isRecording && poseStats.totalFrames > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="font-bold text-lg">{poseStats.totalFrames}</div>
              <div className="text-gray-600">Frames</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="font-bold text-lg text-green-600">{poseStats.goodFrames}</div>
              <div className="text-gray-600">Buenos</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="font-bold text-lg text-blue-600">{Math.round(poseStats.currentScore)}</div>
              <div className="text-gray-600">Actual</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="font-bold text-lg text-purple-600">{Math.round(poseStats.averageScore)}</div>
              <div className="text-gray-600">Promedio</div>
            </div>
          </div>
        )}

        {/* Tips mejorados */}
        {(error || poseError) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-yellow-800 font-medium text-sm mb-2">💡 Solución de problemas:</h4>
            <ul className="text-yellow-700 text-xs space-y-1">
              <li>• Permite el acceso a la cámara cuando el navegador lo solicite</li>
              <li>• Verifica que no haya otras aplicaciones usando la cámara</li>
              <li>• Asegúrate de tener buena conexión a internet (para descargar el modelo de IA)</li>
              <li>• Recarga la página si persisten los errores</li>
              <li>• Usa Chrome o Firefox para mejor compatibilidad</li>
            </ul>
          </div>
        )}

        {/* Info sobre IA */}
        {poseInitialized && !isRecording && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-blue-800 font-medium text-sm mb-2">🤖 Sistema de IA listo:</h4>
            <ul className="text-blue-700 text-xs space-y-1">
              <li>• Detección de pose con MediaPipe activada</li>
              <li>• Análisis específico para ejercicio: <strong>{exerciseType}</strong></li>
              <li>• Cálculo automático de ángulos y puntuación</li>
              <li>• Feedback en tiempo real habilitado</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAutoCamera;