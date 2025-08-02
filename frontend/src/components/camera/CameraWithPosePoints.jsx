/**
 * GymForm Analyzer - Cámara con Puntos de Pose Visibles
 * Versión simplificada para mostrar los puntos de MediaPipe claramente
 */

import { useState, useRef, useEffect } from 'react';
import { Camera, Play, Pause, RefreshCw, Activity, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Pose } from '@mediapipe/pose';

const CameraWithPosePoints = ({ onSessionData, exerciseType = 'general' }) => {
  // Estados de cámara
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de pose
  const [poseInitialized, setPoseInitialized] = useState(false);
  const [poseDetected, setPoseDetected] = useState(false);
  const [currentLandmarks, setCurrentLandmarks] = useState(null);
  const [poseConfidence, setPoseConfidence] = useState(0);
  const [frameCount, setFrameCount] = useState(0);

  // Referencias
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const poseRef = useRef(null);
  const sessionIntervalRef = useRef(null);
  const animationRef = useRef(null);

  // Puntos clave de MediaPipe Pose
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

  // Conexiones para dibujar el esqueleto
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

  useEffect(() => {
    initializeEverything();
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (isRecording) {
      sessionIntervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }
    }
    
    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }
    };
  }, [isRecording]);

  // =====================================
  // FUNCIONES DE INICIALIZACIÓN
  // =====================================

  const initializeEverything = async () => {
    console.log('🚀 Iniciando cámara + MediaPipe...');
    setIsLoading(true);
    setError(null);

    try {
      // 1. Inicializar MediaPipe primero
      await initializePose();
      
      // 2. Inicializar cámara
      await initializeCamera();
      
      // 3. Iniciar loop de procesamiento
      startProcessingLoop();
      
      setIsLoading(false);
      toast.success('🤖 Sistema de detección de pose activado!');
      
    } catch (error) {
      console.error('❌ Error en inicialización:', error);
      setError(error.message);
      setIsLoading(false);
      toast.error('❌ Error inicializando sistema');
    }
  };

  const initializePose = async () => {
    return new Promise((resolve, reject) => {
      try {
        console.log('🤖 Inicializando MediaPipe Pose...');
        
        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.3.1621277220/${file}`;
          }
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults((results) => {
          handlePoseResults(results);
        });

        poseRef.current = pose;
        setPoseInitialized(true);
        console.log('✅ MediaPipe Pose inicializado');
        resolve();
        
      } catch (error) {
        console.error('❌ Error inicializando MediaPipe:', error);
        reject(error);
      }
    });
  };

  const initializeCamera = async () => {
    try {
      console.log('📹 Iniciando cámara...');
      
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
        
        return new Promise((resolve) => {
          const handleVideoReady = () => {
            videoRef.current.play()
              .then(() => {
                setIsActive(true);
                console.log('✅ Cámara activa');
                resolve();
              })
              .catch(reject);
          };

          videoRef.current.addEventListener('loadedmetadata', handleVideoReady);
        });
      }
    } catch (error) {
      throw new Error(`Error activando cámara: ${error.message}`);
    }
  };

  // =====================================
  // PROCESAMIENTO DE POSE
  // =====================================

  const startProcessingLoop = () => {
    const processFrame = async () => {
      if (poseRef.current && videoRef.current && videoRef.current.readyState >= 2) {
        try {
          await poseRef.current.send({ image: videoRef.current });
          setFrameCount(prev => prev + 1);
        } catch (error) {
          console.warn('⚠️ Error procesando frame:', error);
        }
      }

      if (isActive) {
        animationRef.current = requestAnimationFrame(processFrame);
      }
    };

    processFrame();
  };

  const handlePoseResults = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    
    // Ajustar tamaño del canvas al video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      const landmarks = results.poseLandmarks;
      
      // Actualizar estados
      setPoseDetected(true);
      setCurrentLandmarks(landmarks);
      setPoseConfidence(calculateConfidence(landmarks));
      
      // Dibujar el esqueleto
      drawPoseLandmarks(ctx, landmarks, canvas.width, canvas.height);
      
    } else {
      setPoseDetected(false);
      setCurrentLandmarks(null);
      setPoseConfidence(0);
    }
  };

  const calculateConfidence = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return 0;
    
    let totalVisibility = 0;
    let count = 0;

    landmarks.forEach(landmark => {
      if (landmark.visibility !== undefined) {
        totalVisibility += landmark.visibility;
        count++;
      }
    });

    return count > 0 ? (totalVisibility / count) * 100 : 0;
  };

  // =====================================
  // FUNCIONES DE DIBUJO
  // =====================================

  const drawPoseLandmarks = (ctx, landmarks, width, height) => {
    // 1. Dibujar conexiones (esqueleto)
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#00ff41';
    
    POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      
      if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(start.x * width, start.y * height);
        ctx.lineTo(end.x * width, end.y * height);
        ctx.stroke();
      }
    });

    // 2. Dibujar puntos importantes más grandes
    const importantPoints = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    
    importantPoints.forEach(index => {
      const landmark = landmarks[index];
      if (landmark && landmark.visibility > 0.5) {
        const x = landmark.x * width;
        const y = landmark.y * height;
        
        // Círculo principal
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = getPointColor(index);
        ctx.fill();
        
        // Borde blanco
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Punto central más pequeño
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    });

    // 3. Dibujar todos los demás puntos más pequeños
    landmarks.forEach((landmark, index) => {
      if (!importantPoints.includes(index) && landmark.visibility > 0.3) {
        const x = landmark.x * width;
        const y = landmark.y * height;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffff00';
        ctx.fill();
      }
    });

    // 4. Información en pantalla
    drawInfoOverlay(ctx, width, height);
  };

  const getPointColor = (index) => {
    // Colores específicos para diferentes partes del cuerpo
    if (index === 0) return '#ff6b6b'; // Nariz - rojo
    if ([11, 12].includes(index)) return '#4ecdc4'; // Hombros - cyan
    if ([13, 14, 15, 16].includes(index)) return '#45b7d1'; // Brazos - azul
    if ([23, 24].includes(index)) return '#f9ca24'; // Caderas - amarillo
    if ([25, 26, 27, 28].includes(index)) return '#6c5ce7'; // Piernas - púrpura
    return '#a0a0a0'; // Otros - gris
  };

  const drawInfoOverlay = (ctx, width, height) => {
    // Fondo semi-transparente para el texto
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 250, 80);
    
    // Texto de información
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    
    ctx.fillText('🤖 MediaPipe Pose Detection', 20, 30);
    ctx.fillText(`Puntos detectados: ${currentLandmarks ? currentLandmarks.length : 0}`, 20, 50);
    ctx.fillText(`Confianza: ${Math.round(poseConfidence)}%`, 20, 70);
    
    if (poseDetected) {
      ctx.fillStyle = '#00ff41';
      ctx.fillText('✅ POSE DETECTADA', 20, 90);
    } else {
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText('❌ Sin detección', 20, 90);
    }
  };

  // =====================================
  // FUNCIONES DE CONTROL
  // =====================================

  const cleanup = () => {
    console.log('🧹 Limpiando recursos...');
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (poseRef.current) {
      try {
        poseRef.current.close();
      } catch (e) {
        console.warn('Error cerrando MediaPipe:', e);
      }
      poseRef.current = null;
    }
    
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
    }
  };

  const restartSystem = () => {
    cleanup();
    setIsActive(false);
    setError(null);
    setPoseInitialized(false);
    setPoseDetected(false);
    setCurrentLandmarks(null);
    setFrameCount(0);
    
    setTimeout(() => {
      initializeEverything();
    }, 1000);
  };

  const startRecording = () => {
    if (!isActive || !poseInitialized) {
      toast.error('❌ Sistema no está listo');
      return;
    }
    
    setIsRecording(true);
    setSessionTime(0);
    toast.success('🔴 Sesión de análisis iniciada');
    
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
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
    }
    
    toast.success(`✅ Sesión completada: ${formatTime(sessionTime)}`);
    
    if (onSessionData) {
      onSessionData({
        action: 'stop',
        timestamp: new Date(),
        duration: sessionTime,
        exerciseType: exerciseType,
        frameCount: frameCount,
        poseDetected: poseDetected
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
    if (isLoading) return 'yellow';
    if (error) return 'red';
    if (isActive && poseInitialized) return 'green';
    return 'gray';
  };

  const getStatusMessage = () => {
    if (isLoading) return 'Inicializando sistema...';
    if (error) return `Error: ${error}`;
    if (isActive && poseInitialized) return 'Sistema listo';
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
        
        {/* Canvas overlay para pose */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 20 }}
        />
        
        {/* Overlay de carga */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white">
              <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-medium mb-2">Inicializando Sistema</h3>
              <p className="text-gray-300">Cargando MediaPipe + Cámara...</p>
            </div>
          </div>
        )}

        {/* Overlay de error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90">
            <div className="text-center text-white max-w-md mx-auto px-4">
              <Camera size={64} className="mx-auto mb-4 opacity-75" />
              <h3 className="text-xl font-medium mb-3">Error del Sistema</h3>
              <p className="text-red-200 mb-6 text-sm">{error}</p>
              <button
                onClick={restartSystem}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors mx-auto"
              >
                <RefreshCw size={18} />
                <span>Reintentar</span>
              </button>
            </div>
          </div>
        )}

        {/* Indicadores cuando está activa */}
        {isActive && !error && (
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

            {/* Estado del sistema */}
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
              getStatusColor() === 'green' ? 'bg-green-600 bg-opacity-80 text-white' :
              getStatusColor() === 'yellow' ? 'bg-yellow-600 bg-opacity-80 text-white' :
              'bg-red-600 bg-opacity-80 text-white'
            }`}>
              {getStatusMessage()}
            </div>

            {/* Contador de frames */}
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm">
              Frames: {frameCount}
            </div>

            {/* Indicador de detección */}
            {poseDetected && (
              <div className="absolute bottom-4 left-4 bg-green-600 bg-opacity-90 text-white px-3 py-1 rounded-lg text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>🤖 Pose Detectada ({Math.round(poseConfidence)}%)</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Panel de controles */}
      <div className="p-4 bg-gray-50">
        {/* Controles principales */}
        <div className="flex items-center justify-center space-x-4">
          {isActive && !error ? (
            <>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!poseInitialized}
                className={`flex items-center space-x-2 px-6 py-3 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isRecording ? <Pause size={20} /> : <Play size={20} />}
                <span>{isRecording ? 'Finalizar Análisis' : 'Iniciar Análisis'}</span>
              </button>

              <button
                onClick={restartSystem}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw size={18} />
                <span>Reiniciar</span>
              </button>
            </>
          ) : (
            <button
              onClick={restartSystem}
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
            >
              <Camera size={20} />
              <span>{isLoading ? 'Inicializando...' : 'Activar Sistema'}</span>
            </button>
          )}
        </div>

        {/* Información de estado */}
        <div className="mt-4 text-center text-sm">
          {isActive && poseInitialized && !error && (
            <div className="space-y-2">
              <span className="text-green-600 font-medium">
                ✅ Sistema MediaPipe funcionando
                {isRecording && ` • Grabando: ${formatTime(sessionTime)}`}
              </span>
              
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="bg-white rounded p-2 border">
                  <div className="font-bold text-sm">{frameCount}</div>
                  <div className="text-gray-600">Frames</div>
                </div>
                <div className="bg-white rounded p-2 border">
                  <div className="font-bold text-sm text-green-600">
                    {poseDetected ? 'SÍ' : 'NO'}
                  </div>
                  <div className="text-gray-600">Detectado</div>
                </div>
                <div className="bg-white rounded p-2 border">
                  <div className="font-bold text-sm text-blue-600">
                    {Math.round(poseConfidence)}%
                  </div>
                  <div className="text-gray-600">Confianza</div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <span className="text-red-600">
              ❌ Error del sistema - Reinicia para continuar
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraWithPosePoints;