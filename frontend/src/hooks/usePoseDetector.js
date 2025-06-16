/**
 * GymForm Analyzer - usePoseDetector Hook
 * Hook personalizado para detección de pose con MediaPipe
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Pose } from '@mediapipe/pose';
// Eliminamos las importaciones que no se usan por ahora
// import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

export const usePoseDetector = (options = {}) => {
  // Estados
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [currentPose, setCurrentPose] = useState(null);

  // Referencias
  const poseRef = useRef(null);
  const callbacksRef = useRef({
    onResults: null,
    onError: null
  });

  // Configuración por defecto
  const config = {
    modelComplexity: options.modelComplexity || 1,
    smoothLandmarks: options.smoothLandmarks !== false,
    enableSegmentation: options.enableSegmentation || false,
    smoothSegmentation: options.smoothSegmentation || true,
    minDetectionConfidence: options.minDetectionConfidence || 0.5,
    minTrackingConfidence: options.minTrackingConfidence || 0.5,
    ...options
  };

  // Landmarks importantes para ejercicios
  const POSE_LANDMARKS = {
    NOSE: 0,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
  };

  // Conexiones para el esqueleto
  const POSE_CONNECTIONS = [
    [11, 12], // hombros
    [11, 13], [13, 15], // brazo izquierdo
    [12, 14], [14, 16], // brazo derecho
    [11, 23], [12, 24], // torso
    [23, 24], // caderas
    [23, 25], [25, 27], // pierna izquierda
    [24, 26], [26, 28], // pierna derecha
  ];

  // =====================================
  // INICIALIZACIÓN
  // =====================================

  const initializePose = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🤖 Inicializando detector de pose MediaPipe...');

      // Crear instancia de Pose
      const pose = new Pose({
        locateFile: (file) => {
          console.log('📦 Descargando:', file);
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      // Configurar opciones
      pose.setOptions(config);
      console.log('⚙️ Configuración aplicada:', config);

      // Configurar callback de resultados
      pose.onResults((results) => {
        handlePoseResults(results);
      });

      poseRef.current = pose;
      setIsInitialized(true);
      console.log('✅ Detector de pose inicializado correctamente');

    } catch (err) {
      console.error('❌ Error inicializando pose:', err);
      setError(err.message);
      if (callbacksRef.current.onError) {
        callbacksRef.current.onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =====================================
  // PROCESAMIENTO DE RESULTADOS
  // =====================================

  const handlePoseResults = useCallback((results) => {
    const processedData = {
      detected: false,
      landmarks: null,
      worldLandmarks: null,
      angles: null,
      confidence: 0,
      timestamp: Date.now()
    };

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      processedData.detected = true;
      processedData.landmarks = results.poseLandmarks;
      processedData.worldLandmarks = results.poseLandmarks3D;
      processedData.confidence = calculateConfidence(results.poseLandmarks);
      processedData.angles = calculateAngles(results.poseLandmarks);
    }

    setCurrentPose(processedData);

    // Llamar callback externo si existe
    if (callbacksRef.current.onResults) {
      callbacksRef.current.onResults(processedData);
    }
  }, []);

  // =====================================
  // CÁLCULO DE MÉTRICAS
  // =====================================

  const calculateConfidence = (landmarks) => {
    let totalVisibility = 0;
    let count = 0;

    landmarks.forEach(landmark => {
      if (landmark.visibility !== undefined) {
        totalVisibility += landmark.visibility;
        count++;
      }
    });

    return count > 0 ? totalVisibility / count : 0;
  };

  const calculateAngles = (landmarks) => {
    const angles = {};

    try {
      // Ángulos de brazos
      angles.leftElbow = calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_ELBOW],
        landmarks[POSE_LANDMARKS.LEFT_WRIST]
      );

      angles.rightElbow = calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
        landmarks[POSE_LANDMARKS.RIGHT_WRIST]
      );

      // Ángulos de piernas
      angles.leftKnee = calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_HIP],
        landmarks[POSE_LANDMARKS.LEFT_KNEE],
        landmarks[POSE_LANDMARKS.LEFT_ANKLE]
      );

      angles.rightKnee = calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_HIP],
        landmarks[POSE_LANDMARKS.RIGHT_KNEE],
        landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
      );

      // Ángulos de hombros
      angles.leftShoulder = calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_ELBOW],
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_HIP]
      );

      angles.rightShoulder = calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
        landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[POSE_LANDMARKS.RIGHT_HIP]
      );

      // Ángulos de caderas
      angles.leftHip = calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_KNEE],
        landmarks[POSE_LANDMARKS.LEFT_HIP],
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER]
      );

      angles.rightHip = calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_KNEE],
        landmarks[POSE_LANDMARKS.RIGHT_HIP],
        landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
      );

      // Ángulo de la columna
      angles.spine = calculateSpineAngle(landmarks);

    } catch (error) {
      console.warn('⚠️ Error calculando ángulos:', error);
    }

    return angles;
  };

  const calculateAngle = (point1, point2, point3) => {
    if (!point1 || !point2 || !point3) return null;

    const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
                   Math.atan2(point1.y - point2.y, point1.x - point2.x);
    
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    
    return Math.round(angle);
  };

  const calculateSpineAngle = (landmarks) => {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

    // Calcular punto medio de hombros y caderas
    const shoulderMid = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    
    const hipMid = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };

    // Calcular ángulo de inclinación
    const deltaY = shoulderMid.y - hipMid.y;
    const deltaX = shoulderMid.x - hipMid.x;
    
    const angle = Math.atan2(deltaX, deltaY) * 180 / Math.PI;
    return Math.round(Math.abs(angle));
  };

  // =====================================
  // FUNCIONES PÚBLICAS
  // =====================================

  const processFrame = useCallback(async (videoElement) => {
    if (!isInitialized || !poseRef.current) {
      console.warn('⚠️ Detector no inicializado');
      return false;
    }

    try {
      await poseRef.current.send({ image: videoElement });
      return true;
    } catch (error) {
      console.error('❌ Error procesando frame:', error);
      if (callbacksRef.current.onError) {
        callbacksRef.current.onError(error);
      }
      return false;
    }
  }, [isInitialized]);

  const setCallbacks = useCallback((callbacks) => {
    callbacksRef.current = { ...callbacksRef.current, ...callbacks };
  }, []);

  const drawPose = useCallback((ctx, landmarks, canvasWidth, canvasHeight) => {
    if (!landmarks || landmarks.length === 0) return;

    // Convertir coordenadas normalizadas a píxeles
    const scaledLandmarks = landmarks.map(landmark => ({
      x: landmark.x * canvasWidth,
      y: landmark.y * canvasHeight,
      visibility: landmark.visibility
    }));

    // Dibujar conexiones del esqueleto con grosor variable
    POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = scaledLandmarks[startIdx];
      const end = scaledLandmarks[endIdx];
      
      if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        
        // Color del esqueleto más brillante
        ctx.strokeStyle = '#00FF41';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        
        // Sombra para mejor visibilidad
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.stroke();
        
        // Resetear sombra
        ctx.shadowBlur = 0;
      }
    });

    // Dibujar puntos clave más grandes y visibles
    scaledLandmarks.forEach((landmark, index) => {
      if (landmark.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc(landmark.x, landmark.y, 10, 0, 2 * Math.PI);
        
        // Color del punto
        ctx.fillStyle = getPointColor(index);
        ctx.fill();
        
        // Borde blanco para contraste
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Sombra para los puntos
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(landmark.x, landmark.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  }, []);

  const getPointColor = (index) => {
    // Colores más vibrantes y diferenciados para mejor visibilidad
    if (index === 0) return '#FF1744'; // Nariz - rojo brillante
    if ([11, 12].includes(index)) return '#00E676'; // Hombros - verde brillante
    if ([13, 14, 15, 16].includes(index)) return '#2196F3'; // Brazos - azul brillante
    if ([23, 24].includes(index)) return '#FF9800'; // Caderas - naranja brillante
    if ([25, 26, 27, 28].includes(index)) return '#9C27B0'; // Piernas - morado brillante
    if ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(index)) return '#FFEB3B'; // Cara - amarillo
    return '#E0E0E0'; // Otros - gris claro
  };

  // =====================================
  // EFECTOS
  // =====================================

  useEffect(() => {
    initializePose();

    return () => {
      if (poseRef.current) {
        console.log('🧹 Limpiando detector de pose...');
        poseRef.current.close();
        poseRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [initializePose]);

  // =====================================
  // RETURN
  // =====================================

  return {
    // Estados
    isLoading,
    isInitialized,
    error,
    currentPose,
    
    // Funciones
    processFrame,
    setCallbacks,
    drawPose,
    
    // Datos calculados
    landmarks: currentPose?.landmarks,
    angles: currentPose?.angles,
    confidence: currentPose?.confidence || 0,
    detected: currentPose?.detected || false,
    
    // Referencias útiles
    POSE_LANDMARKS
  };
};