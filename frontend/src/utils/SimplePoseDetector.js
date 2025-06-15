/**
 * GymForm Analyzer - Simple Pose Detector
 * Versión simplificada de detección de pose con MediaPipe
 */

import { Pose } from '@mediapipe/pose';

class SimplePoseDetector {
  constructor(options = {}) {
    this.pose = null;
    this.isInitialized = false;
    this.onResultsCallback = null;
    this.onErrorCallback = null;
    
    // Configuración básica
    this.config = {
      modelComplexity: options.modelComplexity || 1,
      smoothLandmarks: options.smoothLandmarks !== false,
      enableSegmentation: false, // Deshabilitado para mejor rendimiento
      minDetectionConfidence: options.minDetectionConfidence || 0.5,
      minTrackingConfidence: options.minTrackingConfidence || 0.5,
    };

    // Puntos clave principales que usaremos
    this.POSE_LANDMARKS = {
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

    // Conexiones para dibujar esqueleto
    this.CONNECTIONS = [
      [11, 12], // hombros
      [11, 13], // brazo izquierdo
      [13, 15], // antebrazo izquierdo
      [12, 14], // brazo derecho
      [14, 16], // antebrazo derecho
      [11, 23], // torso izquierdo
      [12, 24], // torso derecho
      [23, 24], // caderas
      [23, 25], // muslo izquierdo
      [25, 27], // pantorrilla izquierda
      [24, 26], // muslo derecho
      [26, 28], // pantorrilla derecha
    ];
  }

  // =====================================
  // INICIALIZACIÓN
  // =====================================

  async initialize() {
    try {
      console.log('🤖 Inicializando detector de pose...');
      
      this.pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      this.pose.setOptions(this.config);

      this.pose.onResults((results) => {
        this.handleResults(results);
      });

      this.isInitialized = true;
      console.log('✅ Detector de pose inicializado correctamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error inicializando detector:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
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
      return false;
    }

    try {
      await this.pose.send({ image: videoElement });
      return true;
    } catch (error) {
      console.error('❌ Error procesando frame:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      return false;
    }
  }

  handleResults(results) {
    const processedData = {
      detected: false,
      landmarks: null,
      angles: null,
      confidence: 0,
      timestamp: Date.now()
    };

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      processedData.detected = true;
      processedData.landmarks = results.poseLandmarks;
      processedData.confidence = this.calculateConfidence(results.poseLandmarks);
      processedData.angles = this.calculateBasicAngles(results.poseLandmarks);
    }

    if (this.onResultsCallback) {
      this.onResultsCallback(processedData);
    }
  }

  // =====================================
  // CÁLCULOS BÁSICOS
  // =====================================

  calculateConfidence(landmarks) {
    // Calcular confianza promedio basada en visibility
    let totalVisibility = 0;
    let count = 0;

    landmarks.forEach(landmark => {
      if (landmark.visibility !== undefined) {
        totalVisibility += landmark.visibility;
        count++;
      }
    });

    return count > 0 ? totalVisibility / count : 0;
  }

  calculateBasicAngles(landmarks) {
    const angles = {};

    try {
      // Ángulo del codo izquierdo
      angles.leftElbow = this.calculateAngle(
        landmarks[this.POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[this.POSE_LANDMARKS.LEFT_ELBOW],
        landmarks[this.POSE_LANDMARKS.LEFT_WRIST]
      );

      // Ángulo del codo derecho
      angles.rightElbow = this.calculateAngle(
        landmarks[this.POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[this.POSE_LANDMARKS.RIGHT_ELBOW],
        landmarks[this.POSE_LANDMARKS.RIGHT_WRIST]
      );

      // Ángulo de la rodilla izquierda
      angles.leftKnee = this.calculateAngle(
        landmarks[this.POSE_LANDMARKS.LEFT_HIP],
        landmarks[this.POSE_LANDMARKS.LEFT_KNEE],
        landmarks[this.POSE_LANDMARKS.LEFT_ANKLE]
      );

      // Ángulo de la rodilla derecha
      angles.rightKnee = this.calculateAngle(
        landmarks[this.POSE_LANDMARKS.RIGHT_HIP],
        landmarks[this.POSE_LANDMARKS.RIGHT_KNEE],
        landmarks[this.POSE_LANDMARKS.RIGHT_ANKLE]
      );

      // Ángulo de la columna (simplificado)
      angles.spine = this.calculateSpineAngle(landmarks);

    } catch (error) {
      console.warn('Error calculando ángulos:', error);
    }

    return angles;
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

    // Punto medio de hombros y caderas
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
  }

  // =====================================
  // VISUALIZACIÓN
  // =====================================

  drawPose(ctx, landmarks, canvasWidth, canvasHeight) {
    if (!landmarks) return;

    // Dibujar conexiones
    this.CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      
      if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(start.x * canvasWidth, start.y * canvasHeight);
        ctx.lineTo(end.x * canvasWidth, end.y * canvasHeight);
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });

    // Dibujar puntos clave
    landmarks.forEach((landmark, index) => {
      if (landmark.visibility > 0.5) {
        const x = landmark.x * canvasWidth;
        const y = landmark.y * canvasHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = this.getPointColor(index);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }

  getPointColor(index) {
    // Colores diferentes para diferentes partes del cuerpo
    if (index === 0) return '#ff6b6b'; // Nariz
    if ([11, 12].includes(index)) return '#4ecdc4'; // Hombros
    if ([13, 14, 15, 16].includes(index)) return '#45b7d1'; // Brazos
    if ([23, 24].includes(index)) return '#f9ca24'; // Caderas
    if ([25, 26, 27, 28].includes(index)) return '#6c5ce7'; // Piernas
    return '#a0a0a0'; // Otros
  }

  // =====================================
  // CALLBACKS
  // =====================================

  onResults(callback) {
    this.onResultsCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  // =====================================
  // LIMPIEZA
  // =====================================

  dispose() {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    this.isInitialized = false;
    console.log('🧹 Detector de pose limpiado');
  }
}

export default SimplePoseDetector;