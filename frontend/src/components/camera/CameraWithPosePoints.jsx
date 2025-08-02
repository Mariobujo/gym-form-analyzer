/**
 * GymForm Analyzer - Cámara con MediaPipe usando CDN
 * Versión que funciona sin problemas de dependencias
 */

import { useState, useRef, useEffect } from 'react';
import { Camera, Play, Pause, RefreshCw, Activity, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const processingRef = useRef(false);

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

  // Conexiones para esqueleto
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
  // INICIALIZACIÓN CON CDN
  // =====================================

  useEffect(() => {
    console.log('🚀 Iniciando sistema con MediaPipe CDN...');
    loadMediaPipeFromCDN();
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
  // CARGA DE MEDIAPIPE DESDE CDN
  // =====================================

  const loadMediaPipeFromCDN = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('📦 Cargando MediaPipe desde CDN...');

      // Verificar si ya está cargado
      if (window.Pose) {
        console.log('✅ MediaPipe ya está disponible');
        await initializeAfterLoad();
        return;
      }

      // Cargar scripts desde CDN
      await Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js'),
        loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils@0.6/control_utils.js'),
        loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js'),
        loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/pose.js')
      ]);

      console.log('✅ Scripts de MediaPipe cargados desde CDN');
      
      // Esperar un poco para que se inicialicen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (window.Pose) {
        await initializeAfterLoad();
      } else {
        throw new Error('MediaPipe no se cargó correctamente desde CDN');
      }

    } catch (error) {
      console.error('❌ Error cargando MediaPipe:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      // Verificar si ya existe
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        console.log(`✅ Cargado: ${src}`);
        resolve();
      };
      script.onerror = () => {
        console.error(`❌ Error cargando: ${src}`);
        reject(new Error(`Error cargando ${src}`));
      };
      document.head.appendChild(script);
    });
  };

  const initializeAfterLoad = async () => {
    try {
      console.log('🎯 Paso 1: Inicializando MediaPipe...');
      await initializePose();
      
      console.log('🎯 Paso 2: Inicializando cámara...');
      await initializeCamera();
      
      console.log('🎯 Paso 3: Iniciando procesamiento...');
      startProcessingLoop();
      
      setIsLoading(false);
      toast.success('🤖 ¡Sistema MediaPipe completamente funcional!');
      
    } catch (error) {
      console.error('❌ Error en inicialización:', error);
      setError(error.message);
      setIsLoading(false);
      toast.error('❌ Error inicializando sistema');
    }
  };

  // =====================================
  // INICIALIZACIÓN DE POSE
  // =====================================

  const initializePose = async () => {
    return new Promise((resolve, reject) => {
      try {
        console.log('🤖 Creando instancia MediaPipe Pose...');
        
        if (!window.Pose) {
          throw new Error('MediaPipe Pose no está disponible');
        }

        const pose = new window.Pose({
          locateFile: (file) => {
            console.log('📦 Cargando archivo:', file);
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`;
          }
        });

        // Configuración optimizada
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        console.log('⚙️ Configuración aplicada a MediaPipe');

        // Configurar callback
        pose.onResults((results) => {
          try {
            handlePoseResults(results);
          } catch (err) {
            console.warn('⚠️ Error en callback:', err);
          }
        });

        // Verificar con imagen de prueba
        console.log('🧪 Verificando MediaPipe...');
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 640;
        testCanvas.height = 480;
        const ctx = testCanvas.getContext('2d');
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 640, 480);

        pose.send({ image: testCanvas })
          .then(() => {
            console.log('✅ MediaPipe verificado');
            poseRef.current = pose;
            setPoseInitialized(true);
            resolve();
          })
          .catch((error) => {
            console.error('❌ Error verificando:', error);
            reject(new Error(`Error verificando MediaPipe: ${error.message}`));
          });
        
      } catch (error) {
        console.error('❌ Error creando MediaPipe:', error);
        reject(error);
      }
    });
  };

  const initializeCamera = async () => {
    try {
      console.log('📹 Solicitando acceso a cámara...');
      
      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        return new Promise((resolve, reject) => {
          const handleVideoReady = () => {
            console.log('🎥 Video metadata cargada');
            videoRef.current.play()
              .then(() => {
                setIsActive(true);
                console.log('✅ Cámara reproduciendo');
                resolve();
              })
              .catch(reject);
          };

          videoRef.current.addEventListener('loadedmetadata', handleVideoReady, { once: true });
          
          setTimeout(() => {
            reject(new Error('Timeout esperando video'));
          }, 10000);
        });
      }
    } catch (error) {
      let errorMessage = error.message;
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permiso de cámara denegado. Permite el acceso y recarga.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No se encontró cámara en este dispositivo.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Cámara en uso por otra aplicación.';
      }
      
      throw new Error(errorMessage);
    }
  };

  // =====================================
  // PROCESAMIENTO DE POSE
  // =====================================

  const startProcessingLoop = () => {
    const processFrame = async () => {
      if (poseRef.current && videoRef.current && videoRef.current.readyState >= 2 && !processingRef.current) {
        try {
          processingRef.current = true;
          await poseRef.current.send({ image: videoRef.current });
          setFrameCount(prev => prev + 1);
        } catch (error) {
          console.warn('⚠️ Error procesando frame:', error);
        } finally {
          processingRef.current = false;
        }
      }

      if (isActive || poseInitialized) {
        animationRef.current = requestAnimationFrame(processFrame);
      }
    };

    animationRef.current = requestAnimationFrame(processFrame);
  };

  const handlePoseResults = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const videoRect = video.getBoundingClientRect();
    canvas.width = video.videoWidth || videoRect.width;
    canvas.height = video.videoHeight || videoRect.height;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      const landmarks = results.poseLandmarks;
      
      setPoseDetected(true);
      setCurrentLandmarks(landmarks);
      setPoseConfidence(calculateConfidence(landmarks));
      
      // DIBUJAR POSE
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
    // 1. DIBUJAR ESQUELETO
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#00FF41';
    ctx.lineCap = 'round';
    
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

    // 2. PUNTOS PRINCIPALES
    const importantPoints = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    
    importantPoints.forEach(index => {
      const landmark = landmarks[index];
      if (landmark && landmark.visibility > 0.5) {
        const x = landmark.x * width;
        const y = landmark.y * height;
        
        // Círculo principal
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2 * Math.PI);
        ctx.fillStyle = getPointColor(index);
        ctx.fill();
        
        // Borde blanco grueso
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2 * Math.PI);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Centro blanco
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
    });

    // 3. PUNTOS MENORES
    landmarks.forEach((landmark, index) => {
      if (!importantPoints.includes(index) && landmark.visibility > 0.3) {
        const x = landmark.x * width;
        const y = landmark.y * height;
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFF00';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // 4. INFO OVERLAY
    drawInfoOverlay(ctx, width, height);
  };

  const getPointColor = (index) => {
    if (index === 0) return '#FF6B6B'; // Nariz - rojo
    if ([11, 12].includes(index)) return '#4ECDC4'; // Hombros - cyan
    if ([13, 14, 15, 16].includes(index)) return '#45B7D1'; // Brazos - azul
    if ([23, 24].includes(index)) return '#F9CA24'; // Caderas - amarillo
    if ([25, 26, 27, 28].includes(index)) return '#6C5CE7'; // Piernas - púrpura
    return '#A0A0A0';
  };

  const drawInfoOverlay = (ctx, width, height) => {
    // Fondo para texto
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(15, 15, 320, 120);
    
    // Texto
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    
    ctx.fillText('🤖 MediaPipe Pose (CDN)', 25, 45);
    
    ctx.font = '16px Arial';
    ctx.fillText(`Puntos: ${currentLandmarks ? currentLandmarks.length : 0}/33`, 25, 70);
    ctx.fillText(`Confianza: ${Math.round(poseConfidence)}%`, 25, 95);
    ctx.fillText(`Frames: ${frameCount}`, 25, 120);
    
    if (poseDetected) {
      ctx.fillStyle = '#00FF41';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('✅ POSE DETECTADA', 25, 145);
    } else {
      ctx.fillStyle = '#FF6B6B';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('❌ Buscando pose...', 25, 145);
    }
  };

  // =====================================
  // CONTROL Y LIMPIEZA
  // =====================================

  const cleanup = () => {
    console.log('🧹 Limpiando recursos...');
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (poseRef.current) {
      try {
        poseRef.current.close();
      } catch (e) {
        console.warn('⚠️ Error cerrando MediaPipe:', e);
      }
      poseRef.current = null;
    }
    
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
    }
  };

  const restartSystem = () => {
    console.log('🔄 Reiniciando sistema...');
    cleanup();
    setIsActive(false);
    setError(null);
    setPoseInitialized(false);
    setPoseDetected(false);
    setCurrentLandmarks(null);
    setFrameCount(0);
    setPoseConfidence(0);
    
    setTimeout(() => {
      loadMediaPipeFromCDN();
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusMessage = () => {
    if (isLoading) return 'Cargando desde CDN...';
    if (error) return `Error: ${error}`;
    if (isActive && poseInitialized) return 'Sistema Listo (CDN)';
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
        
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 20 }}
        />
        
        {/* Overlays */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-30">
            <div className="text-center text-white">
              <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-medium mb-2">Cargando MediaPipe desde CDN</h3>
              <p className="text-gray-300">Descargando librerías desde jsdelivr...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90 z-30">
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

        {/* Indicadores */}
        {isActive && !error && (
          <>
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center space-x-2 z-25">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-bold bg-red-600 bg-opacity-90 px-3 py-1 rounded-full">
                  🔴 REC {formatTime(sessionTime)}
                </span>
              </div>
            )}

            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium z-25 bg-green-600 bg-opacity-90 text-white">
              {getStatusMessage()}
            </div>

            <div className="absolute bottom-4 right-4 bg-black bg-opacity-80 text-white px-3 py-1 rounded-lg text-sm z-25">
              Frames: {frameCount}
            </div>

            {poseDetected && (
              <div className="absolute bottom-4 left-4 bg-green-600 bg-opacity-90 text-white px-3 py-1 rounded-lg text-sm z-25">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>🤖 Pose: {Math.round(poseConfidence)}%</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controles */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center justify-center space-x-4">
          {isActive && !error ? (
            <>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!poseInitialized}
                className={`flex items-center space-x-2 px-6 py-3 text-white rounded-lg transition-colors font-medium disabled:opacity-50 ${
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
              <span>{isLoading ? 'Cargando CDN...' : 'Activar Sistema'}</span>
            </button>
          )}
        </div>

        {/* Estado */}
        <div className="mt-4 text-center text-sm">
          {isActive && poseInitialized && !error && (
            <div className="space-y-2">
              <span className="text-green-600 font-medium">
                ✅ MediaPipe CDN funcionando
                {isRecording && ` • Grabando: ${formatTime(sessionTime)}`}
              </span>
              
              <div className="grid grid-cols-4 gap-4 text-xs">
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
                <div className="bg-white rounded p-2 border">
                  <div className="font-bold text-sm text-purple-600">
                    {currentLandmarks ? currentLandmarks.length : 0}/33
                  </div>
                  <div className="text-gray-600">Puntos</div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <span className="text-red-600">
              ❌ Error - Reinicia para continuar
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraWithPosePoints;