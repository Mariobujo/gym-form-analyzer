/**
 * GymForm Analyzer - usePoseDetector Hook CORREGIDO
 * Versión robusta que garantiza la visualización de puntos
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Pose } from '@mediapipe/pose';

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
  const initAttemptRef = useRef(0);

  // Configuración por defecto
  const config = {
    modelComplexity: options.modelComplexity || 1,
    smoothLandmarks: options.smoothLandmarks !== false,
    enableSegmentation: false, // CRÍTICO: Siempre deshabilitado
    smoothSegmentation: false,
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

  // =====================================
  // INICIALIZACIÓN ULTRA ROBUSTA
  // =====================================

  const initializePose = useCallback(async () => {
    initAttemptRef.current += 1;
    const currentAttempt = initAttemptRef.current;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🤖 Intento ${currentAttempt}: Inicializando MediaPipe Pose...`);

      // Limpiar instancia anterior si existe
      if (poseRef.current) {
        try {
          poseRef.current.close();
        } catch (e) {
          console.warn('⚠️ Error cerrando instancia anterior:', e);
        }
        poseRef.current = null;
      }

      // Crear nueva instancia con CDN estable
      const pose = new Pose({
        locateFile: (file) => {
          console.log('📦 Descargando archivo MediaPipe:', file);
          // CDN que funciona de manera confiable
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1635989137/${file}`;
        }
      });

      console.log('⚙️ Aplicando configuración a MediaPipe...');

      // Configurar opciones de manera robusta
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout configurando MediaPipe'));
        }, 15000);

        try {
          pose.setOptions({
            ...config,
            // CRÍTICO: Deshabilitar segmentation completamente
            enableSegmentation: false,
            smoothSegmentation: false
          });
          
          console.log('✅ Configuración aplicada:', config);
          clearTimeout(timeout);
          resolve();
        } catch (err) {
          clearTimeout(timeout);
          reject(err);
        }
      });

      // Configurar callback de resultados con manejo de errores
      pose.onResults((results) => {
        try {
          handlePoseResults(results);
        } catch (err) {
          console.error('❌ Error en callback de resultados:', err);
        }
      });

      // Verificar que el modelo funciona con imagen de prueba
      console.log('🧪 Verificando modelo con imagen de prueba...');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout verificando modelo MediaPipe'));
        }, 20000);

        // Crear imagen de prueba simple
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 640;
        testCanvas.height = 480;
        const ctx = testCanvas.getContext('2d');
        
        // Fondo negro con punto blanco en el centro
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = 'white';
        ctx.fillRect(320, 240, 20, 20); // Punto central

        // Probar el detector
        pose.send({ image: testCanvas })
          .then(() => {
            clearTimeout(timeout);
            console.log('✅ Modelo MediaPipe verificado correctamente');
            resolve();
          })
          .catch((err) => {
            clearTimeout(timeout);
            console.error('❌ Error verificando modelo:', err);
            reject(new Error(`Error verificando modelo: ${err.message}`));
          });
      });

      // Solo asignar si este es el intento más reciente
      if (currentAttempt === initAttemptRef.current) {
        poseRef.current = pose;
        setIsInitialized(true);
        console.log('✅ MediaPipe Pose inicializado y verificado');
      }

    } catch (err) {
      console.error(`❌ Error en intento ${currentAttempt}:`, err);
      
      // Solo actualizar error si es el intento más reciente
      if (currentAttempt === initAttemptRef.current) {
        let errorMessage = err.message;
        
        // Mensajes específicos para errores conocidos
        if (err.message.includes('Module.arguments')) {
          errorMessage = 'Error de compatibilidad MediaPipe. Recarga la página.';
        } else if (err.message.includes('fetch')) {
          errorMessage = 'Error descargando modelo. Verifica tu conexión.';
        } else if (err.message.includes('timeout') || err.message.includes('Timeout')) {
          errorMessage = 'Timeout inicializando MediaPipe. Intenta recargar.';
        } else if (err.message.includes('WebAssembly')) {
          errorMessage = 'Tu navegador no soporta WebAssembly.';
        } else if (err.message.includes('locateFile')) {
          errorMessage = 'Error cargando archivos MediaPipe desde CDN.';
        }
        
        setError(errorMessage);
        
        if (callbacksRef.current.onError) {
          callbacksRef.current.onError(err);
        }
      }
    } finally {
      if (currentAttempt === initAttemptRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // =====================================
  // PROCESAMIENTO DE RESULTADOS MEJORADO
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

    try {
      if (results.poseLandmarks && results.poseLandmarks.length > 0) {
        processedData.detected = true;
        processedData.landmarks = results.poseLandmarks;
        processedData.worldLandmarks = results.poseLandmarks3D;
        processedData.confidence = calculateConfidence(results.poseLandmarks);
        processedData.angles = calculateAngles(results.poseLandmarks);
      }
    } catch (err) {
      console.warn('⚠️ Error procesando landmarks:', err);
      // Continuar con datos básicos sin fallar
    }

    setCurrentPose(processedData);

    // Llamar callback externo si existe
    if (callbacksRef.current.onResults) {
      try {
        callbacksRef.current.onResults(processedData);
      } catch (err) {
        console.error('❌ Error en callback externo:', err);
      }
    }
  }, []);

  // =====================================
  // CÁLCULO DE MÉTRICAS (Ultra Robusto)
  // =====================================

  const calculateConfidence = (landmarks) => {
    try {
      let totalVisibility = 0;
      let count = 0;

      landmarks.forEach(landmark => {
        if (landmark.visibility !== undefined && !isNaN(landmark.visibility)) {
          totalVisibility += landmark.visibility;
          count++;
        }
      });

      return count > 0 ? totalVisibility / count : 0;
    } catch (err) {
      console.warn('⚠️ Error calculando confianza:', err);
      return 0;
    }
  };

  const calculateAngles = (landmarks) => {
    const angles = {};

    try {
      // Verificar que tengamos los landmarks necesarios
      if (!landmarks || landmarks.length < 33) {
        return angles;
      }

      // Ángulos de brazos (con verificación de existencia)
      if (landmarks[POSE_LANDMARKS.LEFT_SHOULDER] && landmarks[POSE_LANDMARKS.LEFT_ELBOW] && landmarks[POSE_LANDMARKS.LEFT_WRIST]) {
        angles.leftElbow = calculateAngle(
          landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
          landmarks[POSE_LANDMARKS.LEFT_ELBOW],
          landmarks[POSE_LANDMARKS.LEFT_WRIST]
        );
      }

      if (landmarks[POSE_LANDMARKS.RIGHT_SHOULDER] && landmarks[POSE_LANDMARKS.RIGHT_ELBOW] && landmarks[POSE_LANDMARKS.RIGHT_WRIST]) {
        angles.rightElbow = calculateAngle(
          landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
          landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
          landmarks[POSE_LANDMARKS.RIGHT_WRIST]
        );
      }

      // Ángulos de piernas
      if (landmarks[POSE_LANDMARKS.LEFT_HIP] && landmarks[POSE_LANDMARKS.LEFT_KNEE] && landmarks[POSE_LANDMARKS.LEFT_ANKLE]) {
        angles.leftKnee = calculateAngle(
          landmarks[POSE_LANDMARKS.LEFT_HIP],
          landmarks[POSE_LANDMARKS.LEFT_KNEE],
          landmarks[POSE_LANDMARKS.LEFT_ANKLE]
        );
      }

      if (landmarks[POSE_LANDMARKS.RIGHT_HIP] && landmarks[POSE_LANDMARKS.RIGHT_KNEE] && landmarks[POSE_LANDMARKS.RIGHT_ANKLE]) {
        angles.rightKnee = calculateAngle(
          landmarks[POSE_LANDMARKS.RIGHT_HIP],
          landmarks[POSE_LANDMARKS.RIGHT_KNEE],
          landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
        );
      }

      // Ángulo de la columna (simplificado)
      angles.spine = calculateSpineAngle(landmarks);

    } catch (error) {
      console.warn('⚠️ Error calculando ángulos:', error);
    }

    return angles;
  };

  const calculateAngle = (point1, point2, point3) => {
    try {
      if (!point1 || !point2 || !point3) return null;
      if (isNaN(point1.x) || isNaN(point1.y) || isNaN(point2.x) || isNaN(point2.y) || isNaN(point3.x) || isNaN(point3.y)) return null;

      const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
                     Math.atan2(point1.y - point2.y, point1.x - point2.x);
      
      let angle = Math.abs(radians * 180.0 / Math.PI);
      
      if (angle > 180.0) {
        angle = 360 - angle;
      }
      
      return Math.round(angle);
    } catch (err) {
      console.warn('⚠️ Error calculando ángulo individual:', err);
      return null;
    }
  };

  const calculateSpineAngle = (landmarks) => {
    try {
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
    } catch (err) {
      console.warn('⚠️ Error calculando ángulo de columna:', err);
      return null;
    }
  };

  // =====================================
  // FUNCIONES PÚBLICAS ULTRA ROBUSTAS
  // =====================================

  const processFrame = useCallback(async (videoElement) => {
    if (!isInitialized || !poseRef.current) {
      return false;
    }

    // Verificar que el video esté listo
    if (!videoElement || videoElement.readyState < 2) {
      return false;
    }

    try {
      await poseRef.current.send({ image: videoElement });
      return true;
    } catch (error) {
      console.error('❌ Error procesando frame:', error);
      
      // Si hay error crítico, intentar reinicializar
      if (error.message.includes('Module.arguments') || error.message.includes('internal error')) {
        console.log('🔄 Error crítico detectado, reinicializando MediaPipe...');
        setIsInitialized(false);
        setTimeout(() => {
          initializePose();
        }, 2000);
      }
      
      if (callbacksRef.current.onError) {
        callbacksRef.current.onError(error);
      }
      return false;
    }
  }, [isInitialized, initializePose]);

  const setCallbacks = useCallback((callbacks) => {
    callbacksRef.current = { ...callbacksRef.current, ...callbacks };
  }, []);

  const drawPose = useCallback((ctx, landmarks, canvasWidth, canvasHeight) => {
    if (!landmarks || landmarks.length === 0) return;

    try {
      // Conexiones del esqueleto
      const connections = [
        [11, 12], // hombros
        [11, 13], [13, 15], // brazo izquierdo
        [12, 14], [14, 16], // brazo derecho
        [11, 23], [12, 24], // torso
        [23, 24], // caderas
        [23, 25], [25, 27], // pierna izquierda
        [24, 26], [26, 28] // pierna derecha
      ];

      // Dibujar conexiones
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#00FF41';
      
      connections.forEach(([startIdx, endIdx]) => {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];
        
        if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
          ctx.beginPath();
          ctx.moveTo(start.x * canvasWidth, start.y * canvasHeight);
          ctx.lineTo(end.x * canvasWidth, end.y * canvasHeight);
          ctx.stroke();
        }
      });

      // Dibujar puntos principales más grandes
      const keyLandmarks = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
      
      keyLandmarks.forEach((index) => {
        const landmark = landmarks[index];
        if (landmark && landmark.visibility > 0.5 && !isNaN(landmark.x) && !isNaN(landmark.y)) {
          const x = landmark.x * canvasWidth;
          const y = landmark.y * canvasHeight;
          
          // Círculo principal
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI);
          ctx.fillStyle = getPointColor(index);
          ctx.fill();
          
          // Borde blanco
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Centro blanco
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        }
      });

      // Dibujar puntos menores
      landmarks.forEach((landmark, index) => {
        if (!keyLandmarks.includes(index) && landmark.visibility > 0.3) {
          const x = landmark.x * canvasWidth;
          const y = landmark.y * canvasHeight;
          
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFFF00';
          ctx.fill();
        }
      });

    } catch (err) {
      console.warn('⚠️ Error dibujando pose:', err);
    }
  }, []);

  const getPointColor = (index) => {
    // Colores específicos para diferentes partes del cuerpo
    if (index === 0) return '#FF6B6B'; // Nariz - rojo
    if ([11, 12].includes(index)) return '#4ECDC4'; // Hombros - cyan
    if ([13, 14, 15, 16].includes(index)) return '#45B7D1'; // Brazos - azul
    if ([23, 24].includes(index)) return '#F9CA24'; // Caderas - amarillo
    if ([25, 26, 27, 28].includes(index)) return '#6C5CE7'; // Piernas - púrpura
    return '#A0A0A0'; // Otros - gris
  };

  // =====================================
  // EFECTOS CON MANEJO DE ERRORES
  // =====================================

  useEffect(() => {
    console.log('🚀 Hook usePoseDetector montado, iniciando...');
    initializePose();

    return () => {
      console.log('🧹 Hook usePoseDetector desmontando...');
      if (poseRef.current) {
        try {
          poseRef.current.close();
        } catch (err) {
          console.warn('⚠️ Error cerrando detector:', err);
        }
        poseRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [initializePose]);

  // Auto-reintentar en ciertos tipos de error
  useEffect(() => {
    if (error && initAttemptRef.current < 3) {
      if (error.includes('Module.arguments') || error.includes('timeout') || error.includes('Timeout')) {
        console.log('🔄 Auto-reintentando debido a error recuperable...');
        const timer = setTimeout(() => {
          initializePose();
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [error, initializePose]);

  // =====================================
  // RETURN DEL HOOK
  // =====================================

  return {
    // Estados principales
    isLoading,
    isInitialized,
    error,
    currentPose,
    
    // Funciones principales
    processFrame,
    setCallbacks,
    drawPose,
    
    // Datos calculados
    landmarks: currentPose?.landmarks,
    angles: currentPose?.angles,
    confidence: currentPose?.confidence || 0,
    detected: currentPose?.detected || false,
    
    // Referencias útiles
    POSE_LANDMARKS,
    
    // Función para reinicializar manualmente
    reinitialize: initializePose,
    
    // Información de debug
    attemptCount: initAttemptRef.current
  };
};