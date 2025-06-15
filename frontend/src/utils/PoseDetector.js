/**
 * GymForm Analyzer - Pose Detection System
 * Sistema de detección de pose usando MediaPipe
 */

import { Pose } from '@mediapipe/pose';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';

class PoseDetector {
  constructor(options = {}) {
    this.pose = null;
    this.camera = null;
    this.isInitialized = false;
    this.callbacks = {
      onResults: null,
      onError: null
    };
    
    // Configuración
    this.config = {
      modelComplexity: options.modelComplexity || 1,
      smoothLandmarks: options.smoothLandmarks !== false,
      enableSegmentation: options.enableSegmentation || false,
      smoothSegmentation: options.smoothSegmentation || true,
      minDetectionConfidence: options.minDetectionConfidence || 0.5,
      minTrackingConfidence: options.minTrackingConfidence || 0.5,
      ...options
    };

    // Puntos clave de MediaPipe Pose
    this.POSE_LANDMARKS = {
      NOSE: 0,
      LEFT_EYE_INNER: 1,
      LEFT_EYE: 2,
      LEFT_EYE_OUTER: 3,
      RIGHT_EYE_INNER: 4,
      RIGHT_EYE: 5,
      RIGHT_EYE_OUTER: 6,
      LEFT_EAR: 7,
      RIGHT_EAR: 8,
      MOUTH_LEFT: 9,
      MOUTH_RIGHT: 10,
      LEFT_SHOULDER: 11,
      RIGHT_SHOULDER: 12,
      LEFT_ELBOW: 13,
      RIGHT_ELBOW: 14,
      LEFT_WRIST: 15,
      RIGHT_WRIST: 16,
      LEFT_PINKY: 17,
      RIGHT_PINKY: 18,
      LEFT_INDEX: 19,
      RIGHT_INDEX: 20,
      LEFT_THUMB: 21,
      RIGHT_THUMB: 22,
      LEFT_HIP: 23,
      RIGHT_HIP: 24,
      LEFT_KNEE: 25,
      RIGHT_KNEE: 26,
      LEFT_ANKLE: 27,
      RIGHT_ANKLE: 28,
      LEFT_HEEL: 29,
      RIGHT_HEEL: 30,
      LEFT_FOOT_INDEX: 31,
      RIGHT_FOOT_INDEX: 32
    };

    // Conexiones para dibujar skeleton
    this.POSE_CONNECTIONS = [
      [11, 12], // shoulders
      [11, 13], // left arm
      [13, 15], // left forearm
      [12, 14], // right arm
      [14, 16], // right forearm
      [11, 23], // left torso
      [12, 24], // right torso
      [23, 24], // hips
      [23, 25], // left thigh
      [25, 27], // left shin
      [24, 26], // right thigh
      [26, 28], // right shin
    ];
  }

  // =====================================
  // INICIALIZACIÓN
  // =====================================

  async initialize() {
    try {
      console.log('🤖 Inicializando detector de pose...');
      
      // Crear instancia de Pose
      this.pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      // Configurar opciones
      this.pose.setOptions(this.config);

      // Configurar callback de resultados
      this.pose.onResults((results) => {
        this.handleResults(results);
      });

      this.isInitialized = true;
      console.log('✅ Detector de pose inicializado');
      
      return true;
    } catch (error) {
      console.error('❌ Error inicializando detector:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      return false;
    }
  }

  // =====================================
  // PROCESAMIENTO
  // =====================================

  async processFrame(videoElement) {
    if (!this.isInitialized || !this.pose) {
      console.warn('⚠️ Detector no inicializado');
      return null;
    }

    try {
      await this.pose.send({ image: videoElement });
    } catch (error) {
      console.error('❌ Error procesando frame:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }
  }

  handleResults(results) {
    if (!results.poseLandmarks) {
      // No se detectó pose
      if (this.callbacks.onResults) {
        this.callbacks.onResults({
          landmarks: null,
          worldLandmarks: null,
          segmentationMask: null,
          confidence: 0,
          detected: false,
          timestamp: Date.now()
        });
      }
      return;
    }

    // Procesar landmarks
    const processedData = this.processLandmarks(results);
    
    if (this.callbacks.onResults) {
      this.callbacks.onResults(processedData);
    }
  }

  processLandmarks(results) {
    const landmarks = results.poseLandmarks;
    const worldLandmarks = results.poseLandmarks3D;

    // Calcular confianza promedio
    const avgConfidence = landmarks.reduce((sum, point) => 
      sum + (point.visibility || 0), 0) / landmarks.length;

    // Extraer puntos clave importantes
    const keyPoints = this.extractKeyPoints(landmarks);
    
    // Calcular ángulos importantes
    const angles = this.calculateAngles(landmarks);
    
    // Analizar postura
    const postureAnalysis = this.analyzePosture(landmarks, angles);

    return {
      landmarks: landmarks,
      worldLandmarks: worldLandmarks,
      keyPoints: keyPoints,
      angles: angles,
      posture: postureAnalysis,
      confidence: avgConfidence,
      detected: true,
      timestamp: Date.now(),
      segmentationMask: results.segmentationMask
    };
  }

  // =====================================
  // ANÁLISIS DE DATOS
  // =====================================

  extractKeyPoints(landmarks) {
    return {
      leftShoulder: landmarks[this.POSE_LANDMARKS.LEFT_SHOULDER],
      rightShoulder: landmarks[this.POSE_LANDMARKS.RIGHT_SHOULDER],
      leftElbow: landmarks[this.POSE_LANDMARKS.LEFT_ELBOW],
      rightElbow: landmarks[this.POSE_LANDMARKS.RIGHT_ELBOW],
      leftWrist: landmarks[this.POSE_LANDMARKS.LEFT_WRIST],
      rightWrist: landmarks[this.POSE_LANDMARKS.RIGHT_WRIST],
      leftHip: landmarks[this.POSE_LANDMARKS.LEFT_HIP],
      rightHip: landmarks[this.POSE_LANDMARKS.RIGHT_HIP],
      leftKnee: landmarks[this.POSE_LANDMARKS.LEFT_KNEE],
      rightKnee: landmarks[this.POSE_LANDMARKS.RIGHT_KNEE],
      leftAnkle: landmarks[this.POSE_LANDMARKS.LEFT_ANKLE],
      rightAnkle: landmarks[this.POSE_LANDMARKS.RIGHT_ANKLE],
      nose: landmarks[this.POSE_LANDMARKS.NOSE]
    };
  }

  calculateAngles(landmarks) {
    return {
      leftElbow: this.calculateAngle(
        landmarks[this.POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[this.POSE_LANDMARKS.LEFT_ELBOW],
        landmarks[this.POSE_LANDMARKS.LEFT_WRIST]
      ),
      rightElbow: this.calculateAngle(
        landmarks[this.POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[this.POSE_LANDMARKS.RIGHT_ELBOW],
        landmarks[this.POSE_LANDMARKS.RIGHT_WRIST]
      ),
      leftKnee: this.calculateAngle(
        landmarks[this.POSE_LANDMARKS.LEFT_HIP],
        landmarks[this.POSE_LANDMARKS.LEFT_KNEE],
        landmarks[this.POSE_LANDMARKS.LEFT_ANKLE]
      ),
      rightKnee: this.calculateAngle(
        landmarks[this.POSE_LANDMARKS.RIGHT_HIP],
        landmarks[this.POSE_LANDMARKS.RIGHT_KNEE],
        landmarks[this.POSE_LANDMARKS.RIGHT_ANKLE]
      ),
      leftShoulder: this.calculateAngle(
        landmarks[this.POSE_LANDMARKS.LEFT_ELBOW],
        landmarks[this.POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[this.POSE_LANDMARKS.LEFT_HIP]
      ),
      rightShoulder: this.calculateAngle(
        landmarks[this.POSE_LANDMARKS.RIGHT_ELBOW],
        landmarks[this.POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[this.POSE_LANDMARKS.RIGHT_HIP]
      ),
      spine: this.calculateSpineAngle(landmarks)
    };
  }

  calculateAngle(point1, point2, point3) {
    if (!point1 || !point2 || !point3) return null;

    const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
                   Math.atan2(point1.y - point2.y, point1.x - point2.x);
    
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    
    return Math.round(angle);
  }

  calculateSpineAngle(landmarks) {
    const leftShoulder = landmarks[this.POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[this.POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[this.POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[this.POSE_LANDMARKS.RIGHT_HIP];

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

    // Calcular ángulo de la columna respecto a la vertical
    const deltaY = shoulderMid.y - hipMid.y;
    const deltaX = shoulderMid.x - hipMid.x;
    
    const angle = Math.atan2(deltaX, deltaY) * 180 / Math.PI;
    return Math.round(Math.abs(angle));
  }

  analyzePosture(landmarks, angles) {
    const analysis = {
      overall: 'good',
      issues: [],
      score: 100,
      recommendations: []
    };

    // Analizar simetría de hombros
    const shoulderSymmetry = this.checkShoulderSymmetry(landmarks);
    if (!shoulderSymmetry.isSymmetric) {
      analysis.issues.push('shoulder_asymmetry');
      analysis.score -= 10;
      analysis.recommendations.push('Mantén los hombros nivelados');
    }

    // Analizar postura de la columna
    if (angles.spine > 15) {
      analysis.issues.push('spine_lean');
      analysis.score -= 15;
      analysis.recommendations.push('Mantén la espalda recta');
    }

    // Analizar posición de rodillas (para sentadillas)
    if (angles.leftKnee && angles.rightKnee) {
      const kneeDifference = Math.abs(angles.leftKnee - angles.rightKnee);
      if (kneeDifference > 20) {
        analysis.issues.push('knee_asymmetry');
        analysis.score -= 10;
        analysis.recommendations.push('Mantén ambas rodillas al mismo nivel');
      }
    }

    // Determinar calificación general
    if (analysis.score >= 90) analysis.overall = 'excellent';
    else if (analysis.score >= 75) analysis.overall = 'good';
    else if (analysis.score >= 60) analysis.overall = 'fair';
    else analysis.overall = 'poor';

    return analysis;
  }

  checkShoulderSymmetry(landmarks) {
    const leftShoulder = landmarks[this.POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[this.POSE_LANDMARKS.RIGHT_SHOULDER];

    if (!leftShoulder || !rightShoulder) {
      return { isSymmetric: true, difference: 0 };
    }

    const heightDifference = Math.abs(leftShoulder.y - rightShoulder.y);
    const threshold = 0.05; // 5% de diferencia permitida

    return {
      isSymmetric: heightDifference < threshold,
      difference: heightDifference
    };
  }

  // =====================================
  // VISUALIZACIÓN
  // =====================================

  drawPose(ctx, landmarks, canvasWidth, canvasHeight) {
    if (!landmarks) return;

    // Dibujar puntos
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * canvasWidth;
      const y = landmark.y * canvasHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = this.getPointColor(index, landmark.visibility);
      ctx.fill();
    });

    // Dibujar conexiones
    this.POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      
      if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(start.x * canvasWidth, start.y * canvasHeight);
        ctx.lineTo(end.x * canvasWidth, end.y * canvasHeight);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  }

  getPointColor(index, visibility) {
    if (visibility < 0.5) return 'rgba(255, 0, 0, 0.5)';
    
    // Diferentes colores para diferentes partes del cuerpo
    if (index <= 10) return '#ff6b6b'; // Cara
    if (index <= 22) return '#4ecdc4'; // Brazos
    if (index <= 24) return '#45b7d1'; // Torso
    return '#96ceb4'; // Piernas
  }

  // =====================================
  // CONFIGURACIÓN DE CALLBACKS
  // =====================================

  onResults(callback) {
    this.callbacks.onResults = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  // =====================================
  // LIMPIEZA
  // =====================================

  dispose() {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    
    this.isInitialized = false;
    console.log('🧹 Detector de pose limpiado');
  }
}

// Factory function para crear detector
export const createPoseDetector = (options = {}) => {
  return new PoseDetector(options);
};

// Hook de React para usar el detector
export const usePoseDetector = (options = {}) => {
  const [detector, setDetector] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initDetector = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const newDetector = createPoseDetector(options);
        const success = await newDetector.initialize();
        
        if (success) {
          setDetector(newDetector);
        } else {
          setError('Failed to initialize pose detector');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initDetector();

    return () => {
      if (detector) {
        detector.dispose();
      }
    };
  }, []);

  return { detector, isLoading, error };
};

export default PoseDetector;