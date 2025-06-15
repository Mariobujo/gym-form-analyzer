/**
 * GymForm Analyzer - Basic Camera Component
 * Cámara real sin análisis de pose (paso 1)
 */

import { useState, useRef, useEffect } from 'react';
import { Camera, Square, Play, Pause, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const BasicCamera = ({ onSessionData }) => {
  // Estados
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');

  // Referencias
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sessionIntervalRef = useRef(null);

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
  // PERMISOS Y DISPOSITIVOS
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
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error obteniendo dispositivos:', error);
    }
  };

  // =====================================
  // FUNCIONES DE CÁMARA
  // =====================================

  const startCamera = async () => {
    try {
      setError(null);
      
      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: 'user',
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined
        },
        audio: false
      };

      console.log('🎥 Solicitando acceso a cámara...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Esperar a que el video esté listo
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsActive(true);
          setHasPermission(true);
          toast.success('🎥 Cámara activada correctamente');
          
          // Log de información del stream
          const track = stream.getVideoTracks()[0];
          const settings = track.getSettings();
          console.log('📊 Configuración de cámara:', settings);
        };
      }
    } catch (error) {
      console.error('❌ Error iniciando cámara:', error);
      setError(error.message);
      setHasPermission(false);
      
      // Mensajes de error específicos
      if (error.name === 'NotAllowedError') {
        toast.error('❌ Permiso de cámara denegado');
      } else if (error.name === 'NotFoundError') {
        toast.error('❌ No se encontró cámara');
      } else if (error.name === 'NotReadableError') {
        toast.error('❌ Cámara en uso por otra aplicación');
      } else {
        toast.error('❌ Error al acceder a la cámara');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Track detenido:', track.kind);
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    setIsRecording(false);
    setSessionTime(0);
    clearInterval(sessionIntervalRef.current);
    toast.info('📹 Cámara desactivada');
  };

  const changeCamera = async (deviceId) => {
    setSelectedDevice(deviceId);
    if (isActive) {
      stopCamera();
      // Pequeña pausa antes de reiniciar
      setTimeout(() => {
        startCamera();
      }, 500);
    }
  };

  // =====================================
  // SESIONES DE GRABACIÓN
  // =====================================

  const startRecording = () => {
    if (!isActive) {
      toast.error('❌ Primero activa la cámara');
      return;
    }
    
    setIsRecording(true);
    setSessionTime(0);
    toast.success('🔴 Sesión de análisis iniciada');
    
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
    toast.success(`✅ Sesión completada: ${formatTime(sessionTime)}`);
    
    if (onSessionData) {
      onSessionData({
        action: 'stop',
        timestamp: new Date(),
        duration: sessionTime
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

  const getVideoInfo = () => {
    if (!videoRef.current) return null;
    
    const video = videoRef.current;
    return {
      width: video.videoWidth,
      height: video.videoHeight,
      readyState: video.readyState
    };
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
        
        {/* Overlay cuando no está activa */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
            <div className="text-center text-white">
              <Camera size={80} className="mx-auto mb-4 opacity-60" />
              <h3 className="text-xl font-medium mb-2">Cámara desactivada</h3>
              <p className="text-gray-300 mb-4">Haz clic en "Activar Cámara" para comenzar</p>
              {error && (
                <div className="bg-red-900 bg-opacity-50 rounded-lg p-3 max-w-md mx-auto">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
              {hasPermission === false && (
                <div className="bg-yellow-900 bg-opacity-50 rounded-lg p-3 max-w-md mx-auto mt-2">
                  <p className="text-yellow-200 text-sm">
                    ⚠️ Se requiere permiso de cámara para continuar
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Indicadores de estado */}
        {isActive && (
          <>
            {/* Indicador de grabación */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-medium bg-black bg-opacity-60 px-3 py-1 rounded-full text-sm">
                  REC {formatTime(sessionTime)}
                </span>
              </div>
            )}

            {/* Información de video */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-xs">
              {getVideoInfo() && `${getVideoInfo().width}x${getVideoInfo().height}`}
            </div>

            {/* Estado de conexión */}
            <div className="absolute bottom-4 right-4 flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-white text-xs bg-black bg-opacity-60 px-2 py-1 rounded">
                Conectado
              </span>
            </div>
          </>
        )}
      </div>

      {/* Panel de controles */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between">
          {/* Controles principales */}
          <div className="flex items-center space-x-3">
            {!isActive ? (
              <button
                onClick={startCamera}
                disabled={hasPermission === false}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                <Camera size={18} />
                <span>Activar Cámara</span>
              </button>
            ) : (
              <>
                <button
                  onClick={stopCamera}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Square size={18} />
                  <span>Detener</span>
                </button>

                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors font-medium ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isRecording ? <Pause size={18} /> : <Play size={18} />}
                  <span>{isRecording ? 'Finalizar Sesión' : 'Iniciar Sesión'}</span>
                </button>
              </>
            )}
          </div>

          {/* Selector de dispositivo */}
          {devices.length > 1 && (
            <div className="flex items-center space-x-2">
              <Settings size={16} className="text-gray-600" />
              <select
                value={selectedDevice}
                onChange={(e) => changeCamera(e.target.value)}
                className="text-sm border rounded px-2 py-1 bg-white"
              >
                {devices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Cámara ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Información de estado */}
        {isActive && (
          <div className="mt-3 pt-3 border-t text-xs text-gray-600 flex justify-between">
            <span>
              Estado: <span className="text-green-600 font-medium">Activa</span>
            </span>
            <span>
              Dispositivos disponibles: <span className="font-medium">{devices.length}</span>
            </span>
            {isRecording && (
              <span>
                Duración: <span className="font-medium">{formatTime(sessionTime)}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicCamera;