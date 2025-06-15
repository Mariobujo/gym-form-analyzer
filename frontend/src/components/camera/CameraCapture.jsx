/**
 * GymForm Analyzer - Camera Capture Component
 * Componente completo para captura de video y análisis
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Square, Play, Pause, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const CameraCapture = ({ onPoseData, onSessionData, isAnalyzing = false }) => {
  // Estados del componente
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [devices, setDevices] = useState([]);
  const [sessionTime, setSessionTime] = useState(0);
  
  // Referencias
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const sessionIntervalRef = useRef(null);

  // Configuración de video
  const videoConstraints = {
    width: { ideal: 1280, min: 640 },
    height: { ideal: 720, min: 480 },
    frameRate: { ideal: 30, min: 15 },
    facingMode: 'user'
  };

  // =====================================
  // EFECTOS
  // =====================================

  useEffect(() => {
    checkPermissions();
    getAvailableDevices();
    
    return () => {
      stopCamera();
      clearInterval(sessionIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      sessionIntervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(sessionIntervalRef.current);
    }
    
    return () => clearInterval(sessionIntervalRef.current);
  }, [isRecording]);

  // =====================================
  // FUNCIONES DE PERMISOS Y DISPOSITIVOS
  // =====================================

  const checkPermissions = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' });
      setHasPermission(result.state === 'granted');
      
      result.addEventListener('change', () => {
        setHasPermission(result.state === 'granted');
      });
    } catch (error) {
      console.warn('No se pueden verificar permisos:', error);
    }
  };

  const getAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (videoDevices.length > 0 && !deviceId) {
        setDeviceId(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error obteniendo dispositivos:', error);
    }
  };

  // =====================================
  // FUNCIONES DE CÁMARA
  // =====================================

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      const constraints = {
        video: {
          ...videoConstraints,
          deviceId: deviceId ? { exact: deviceId } : undefined
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsActive(true);
        setHasPermission(true);
        toast.success('Cámara activada correctamente');
      }
    } catch (error) {
      console.error('Error iniciando cámara:', error);
      setError(error.message);
      setHasPermission(false);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Permiso de cámara denegado');
      } else if (error.name === 'NotFoundError') {
        toast.error('No se encontró cámara');
      } else {
        toast.error('Error al acceder a la cámara');
      }
    }
  }, [deviceId]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    setIsRecording(false);
    setSessionTime(0);
    clearInterval(sessionIntervalRef.current);
    toast.info('Cámara desactivada');
  }, []);

  // =====================================
  // FUNCIONES DE GRABACIÓN
  // =====================================

  const startRecording = () => {
    if (!isActive) {
      toast.error('Primero activa la cámara');
      return;
    }
    
    setIsRecording(true);
    setSessionTime(0);
    toast.success('Sesión de análisis iniciada');
    
    // Notificar al componente padre
    if (onSessionData) {
      onSessionData({
        action: 'start',
        timestamp: new Date(),
        sessionId: `session_${Date.now()}`
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    clearInterval(sessionIntervalRef.current);
    toast.success(`Sesión completada: ${formatTime(sessionTime)}`);
    
    // Notificar al componente padre
    if (onSessionData) {
      onSessionData({
        action: 'stop',
        timestamp: new Date(),
        duration: sessionTime
      });
    }
  };

  // =====================================
  // FUNCIONES DE CAPTURA
  // =====================================

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Ajustar tamaño del canvas al video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar frame actual
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Retornar datos del frame
    return {
      imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
      canvas: canvas,
      timestamp: Date.now(),
      width: canvas.width,
      height: canvas.height
    };
  }, [isActive]);

  // =====================================
  // UTILIDADES
  // =====================================

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const changeCamera = (newDeviceId) => {
    setDeviceId(newDeviceId);
    if (isActive) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {/* Video Container */}
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        {/* Canvas para captura (oculto) */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        {/* Overlay de estado */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="text-center text-white">
              <Camera size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Cámara desactivada</p>
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </div>
          </div>
        )}

        {/* Indicador de grabación */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
              REC {formatTime(sessionTime)}
            </span>
          </div>
        )}

        {/* Indicador de análisis */}
        {isAnalyzing && (
          <div className="absolute top-4 right-4">
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Analizando...
            </div>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="p-4 bg-gray-800 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Botón principal */}
            {!isActive ? (
              <button
                onClick={startCamera}
                disabled={hasPermission === false}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                <Camera size={20} />
                <span>Activar Cámara</span>
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <Square size={20} />
                <span>Detener</span>
              </button>
            )}

            {/* Botón de grabación */}
            {isActive && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isRecording ? <Pause size={20} /> : <Play size={20} />}
                <span>{isRecording ? 'Finalizar' : 'Iniciar'} Sesión</span>
              </button>
            )}
          </div>

          {/* Selector de cámara */}
          {devices.length > 1 && (
            <div className="flex items-center space-x-2">
              <Settings size={16} />
              <select
                value={deviceId || ''}
                onChange={(e) => changeCamera(e.target.value)}
                className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Cámara ${devices.indexOf(device) + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Estado de permisos */}
        {hasPermission === false && (
          <div className="text-amber-400 text-sm">
            ⚠️ Se requiere permiso de cámara para continuar
          </div>
        )}
      </div>
    </div>
  );
};

// Hook personalizado para usar el componente
export const useCameraCapture = () => {
  const [captureRef, setCaptureRef] = useState(null);
  
  const captureFrame = useCallback(() => {
    return captureRef?.captureFrame() || null;
  }, [captureRef]);
  
  return {
    captureFrame,
    setCaptureRef
  };
};

export default CameraCapture;