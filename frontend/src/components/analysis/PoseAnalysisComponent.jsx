/**
 * GymForm Analyzer - Pose Analysis Component
 * Componente que integra cámara + detección de pose + análisis
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Activity, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import CameraCapture from '../camera/CameraCapture';
import { usePoseDetector } from '../../utils/PoseDetector';

const PoseAnalysisComponent = ({ exerciseType = 'general', onSessionComplete }) => {
  // Estados del análisis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPoseData, setCurrentPoseData] = useState(null);
  const [sessionData, setSessionData] = useState({
    startTime: null,
    endTime: null,
    totalFrames: 0,
    goodFrames: 0,
    averageScore: 0,
    angles: [],
    feedback: []
  });
  const [realTimeFeedback, setRealTimeFeedback] = useState([]);

  // Referencias
  const canvasRef = useRef(null);
  const analysisIntervalRef = useRef(null);
  const frameCountRef = useRef(0);

  // Hook del detector de pose
  const { detector, isLoading: detectorLoading, error: detectorError } = usePoseDetector({
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
  });

  // =====================================
  // EFECTOS
  // =====================================

  useEffect(() => {
    if (detector) {
      detector.onResults(handlePoseResults);
      detector.onError(handleDetectorError);
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [detector]);

  useEffect(() => {
    if (isAnalyzing) {
      // Iniciar análisis en tiempo real
      analysisIntervalRef.current = setInterval(() => {
        processCurrentFrame();
      }, 100); // 10 FPS para análisis
    } else {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [isAnalyzing]);

  // =====================================
  // MANEJO DE RESULTADOS DE POSE
  // =====================================

  const handlePoseResults = useCallback((poseData) => {
    setCurrentPoseData(poseData);
    
    if (isAnalyzing && poseData.detected) {
      frameCountRef.current++;
      
      // Actualizar datos de sesión
      setSessionData(prev => {
        const newAngles = [...prev.angles, poseData.angles];
        const newAverageScore = (prev.averageScore * prev.totalFrames + poseData.posture.score) / (prev.totalFrames + 1);
        
        return {
          ...prev,
          totalFrames: prev.totalFrames + 1,
          goodFrames: poseData.posture.score >= 70 ? prev.goodFrames + 1 : prev.goodFrames,
          averageScore: newAverageScore,
          angles: newAngles.slice(-100), // Mantener últimos 100 frames
        };
      });

      // Generar feedback en tiempo real
      generateRealTimeFeedback(poseData);
      
      // Dibujar pose en canvas
      drawPoseOverlay(poseData);
    }
  }, [isAnalyzing]);

  const handleDetectorError = useCallback((error) => {
    console.error('Error en detector:', error);
    toast.error('Error en detección de pose');
  }, []);

  // =====================================
  // PROCESAMIENTO DE FRAMES
  // =====================================

  const processCurrentFrame = useCallback(async () => {
    if (!detector || !isAnalyzing) return;

    const videoElement = document.querySelector('video');
    if (videoElement && videoElement.readyState >= 2) {
      try {
        await detector.processFrame(videoElement);
      } catch (error) {
        console.error('Error procesando frame:', error);
      }
    }
  }, [detector, isAnalyzing]);

  // =====================================
  // ANÁLISIS Y FEEDBACK
  // =====================================

  const generateRealTimeFeedback = (poseData) => {
    const feedback = [];
    const { posture, angles } = poseData;

    // Feedback específico por ejercicio
    switch (exerciseType) {
      case 'squat':
        feedback.push(...generateSquatFeedback(angles, posture));
        break;
      case 'pushup':
        feedback.push(...generatePushupFeedback(angles, posture));
        break;
      default:
        feedback.push(...generateGeneralFeedback(angles, posture));
    }

    setRealTimeFeedback(feedback);

    // Mostrar alertas importantes
    const criticalIssues = feedback.filter(f => f.severity === 'high');
    if (criticalIssues.length > 0) {
      toast.error(criticalIssues[0].message, { id: 'critical-pose' });
    }
  };

  const generateSquatFeedback = (angles, posture) => {
    const feedback = [];

    // Análisis de rodillas
    if (angles.leftKnee && angles.rightKnee) {
      const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
      
      if (avgKnee < 70) {
        feedback.push({
          type: 'depth',
          message: '¡Excelente profundidad!',
          severity: 'low',
          color: 'green'
        });
      } else if (avgKnee < 90) {
        feedback.push({
          type: 'depth',
          message: 'Buena profundidad, puedes bajar más',
          severity: 'medium',
          color: 'yellow'
        });
      } else {
        feedback.push({
          type: 'depth',
          message: 'Baja más para mejor profundidad',
          severity: 'medium',
          color: 'orange'
        });
      }

      // Simetría de rodillas
      const kneeDiff = Math.abs(angles.leftKnee - angles.rightKnee);
      if (kneeDiff > 15) {
        feedback.push({
          type: 'symmetry',
          message: 'Mantén ambas rodillas al mismo nivel',
          severity: 'high',
          color: 'red'
        });
      }
    }

    // Análisis de columna
    if (angles.spine > 20) {
      feedback.push({
        type: 'posture',
        message: 'Mantén la espalda más recta',
        severity: 'high',
        color: 'red'
      });
    }

    return feedback;
  };

  const generatePushupFeedback = (angles, posture) => {
    const feedback = [];

    // Análisis de codos
    if (angles.leftElbow && angles.rightElbow) {
      const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
      
      if (avgElbow < 45) {
        feedback.push({
          type: 'depth',
          message: '¡Excelente profundidad en flexión!',
          severity: 'low',
          color: 'green'
        });
      } else if (avgElbow < 90) {
        feedback.push({
          type: 'depth',
          message: 'Buena flexión, puedes bajar más',
          severity: 'medium',
          color: 'yellow'
        });
      }
    }

    // Análisis de columna (debe estar recta)
    if (angles.spine > 15) {
      feedback.push({
        type: 'posture',
        message: 'Mantén el cuerpo en línea recta',
        severity: 'high',
        color: 'red'
      });
    }

    return feedback;
  };

  const generateGeneralFeedback = (angles, posture) => {
    const feedback = [];

    if (posture.overall === 'excellent') {
      feedback.push({
        type: 'general',
        message: '¡Excelente postura!',
        severity: 'low',
        color: 'green'
      });
    } else if (posture.overall === 'poor') {
      feedback.push({
        type: 'general',
        message: 'Mejora tu postura',
        severity: 'high',
        color: 'red'
      });
    }

    return feedback;
  };

  // =====================================
  // VISUALIZACIÓN
  // =====================================

  const drawPoseOverlay = (poseData) => {
    const canvas = canvasRef.current;
    if (!canvas || !poseData.landmarks) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar esqueleto
    if (detector) {
      detector.drawPose(ctx, poseData.landmarks, canvas.width, canvas.height);
    }

    // Dibujar ángulos importantes
    drawAngles(ctx, poseData.angles, poseData.landmarks, canvas.width, canvas.height);
  };

  const drawAngles = (ctx, angles, landmarks, width, height) => {
    if (!angles || !landmarks) return;

    const anglesToShow = [
      { name: 'Rodilla I', value: angles.leftKnee, landmark: 25 },
      { name: 'Rodilla D', value: angles.rightKnee, landmark: 26 },
      { name: 'Codo I', value: angles.leftElbow, landmark: 13 },
      { name: 'Codo D', value: angles.rightElbow, landmark: 14 }
    ];

    anglesToShow.forEach(({ name, value, landmark }) => {
      if (value && landmarks[landmark]) {
        const x = landmarks[landmark].x * width;
        const y = landmarks[landmark].y * height;

        // Fondo del texto
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 25, y - 30, 50, 20);

        // Texto del ángulo
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${value}°`, x, y - 15);
      }
    });
  };

  // =====================================
  // MANEJO DE SESIÓN
  // =====================================

  const handleSessionStart = (sessionInfo) => {
    setSessionData(prev => ({
      ...prev,
      startTime: sessionInfo.timestamp,
      totalFrames: 0,
      goodFrames: 0,
      averageScore: 0,
      angles: [],
      feedback: []
    }));
    
    setIsAnalyzing(true);
    frameCountRef.current = 0;
    toast.success('Análisis de técnica iniciado');
  };

  const handleSessionStop = (sessionInfo) => {
    setIsAnalyzing(false);
    
    const finalData = {
      ...sessionData,
      endTime: sessionInfo.timestamp,
      duration: sessionInfo.duration,
      exerciseType,
      finalScore: sessionData.averageScore,
      accuracy: sessionData.totalFrames > 0 ? (sessionData.goodFrames / sessionData.totalFrames) * 100 : 0
    };

    setSessionData(finalData);
    
    if (onSessionComplete) {
      onSessionComplete(finalData);
    }

    toast.success(`Sesión completada - Puntuación: ${Math.round(finalData.finalScore)}`);
  };

  // =====================================
  // RENDER
  // =====================================

  if (detectorLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Cargando detector de pose...</p>
        </div>
      </div>
    );
  }

  if (detectorError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-red-800">
          <AlertTriangle size={20} />
          <span className="font-medium">Error cargando detector</span>
        </div>
        <p className="text-red-600 mt-2">{detectorError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Área principal de cámara */}
      <div className="relative">
        <CameraCapture
          onPoseData={handlePoseResults}
          onSessionData={(data) => {
            if (data.action === 'start') handleSessionStart(data);
            if (data.action === 'stop') handleSessionStop(data);
          }}
          isAnalyzing={isAnalyzing}
        />
        
        {/* Canvas overlay para pose */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          width={1280}
          height={720}
        />
      </div>

      {/* Panel de análisis en tiempo real */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Métricas en tiempo real */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="text-blue-600" size={20} />
            <h3 className="font-semibold">Métricas</h3>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Frames procesados:</span>
              <span className="font-medium">{sessionData.totalFrames}</span>
            </div>
            <div className="flex justify-between">
              <span>Técnica correcta:</span>
              <span className="font-medium">
                {sessionData.totalFrames > 0 
                  ? `${Math.round((sessionData.goodFrames / sessionData.totalFrames) * 100)}%`
                  : '0%'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span>Puntuación promedio:</span>
              <span className="font-medium">{Math.round(sessionData.averageScore)}</span>
            </div>
          </div>
        </div>

        {/* Ángulos actuales */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Target className="text-green-600" size={20} />
            <h3 className="font-semibold">Ángulos</h3>
          </div>
          
          {currentPoseData?.angles ? (
            <div className="space-y-2 text-sm">
              {Object.entries(currentPoseData.angles).map(([joint, angle]) => (
                angle && (
                  <div key={joint} className="flex justify-between">
                    <span className="capitalize">{joint.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-medium">{angle}°</span>
                  </div>
                )
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay datos de pose</p>
          )}
        </div>

        {/* Feedback en tiempo real */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="text-purple-600" size={20} />
            <h3 className="font-semibold">Feedback</h3>
          </div>
          
          <div className="space-y-2">
            {realTimeFeedback.length > 0 ? (
              realTimeFeedback.map((feedback, index) => (
                <div key={index} className={`text-sm p-2 rounded bg-${feedback.color}-50 text-${feedback.color}-800`}>
                  {feedback.message}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Sin feedback activo</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoseAnalysisComponent;