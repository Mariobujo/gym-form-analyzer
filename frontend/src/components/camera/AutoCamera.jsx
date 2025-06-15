/**
 * GymForm Analyzer - Auto Camera Component
 * Cámara que se activa automáticamente para pruebas
 */

import { useState, useRef, useEffect } from 'react';
import { Camera, Play, Pause, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const AutoCamera = ({ onSessionData }) => {
  // Estados
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Referencias
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sessionIntervalRef = useRef(null);

  // =====================================
  // EFECTO PRINCIPAL - AUTO INICIO
  // =====================================

  useEffect(() => {
    console.log('🚀 Iniciando cámara automáticamente...');
    startCameraDirectly();

    return () => {
      cleanup();
    };
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
  // FUNCIONES DE CÁMARA
  // =====================================

  const startCameraDirectly = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('📹 Solicitando acceso directo a cámara...');

      // Configuración simple pero efectiva
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Stream obtenido:', stream);

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Configurar evento cuando el video esté listo
        const handleVideoReady = () => {
          console.log('🎥 Video listo para reproducir');
          videoRef.current.play()
            .then(() => {
              setIsActive(true);
              setIsLoading(false);
              toast.success('🎥 ¡Cámara activada automáticamente!');
              console.log('📊 Video dimensions:', {
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight
              });
            })
            .catch(error => {
              console.error('Error reproduciendo:', error);
              setError('Error reproduciendo video');
              setIsLoading(false);
            });
        };

        videoRef.current.addEventListener('loadedmetadata', handleVideoReady);
        
        // Cleanup del event listener
        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener('loadedmetadata', handleVideoReady);
          }
        };
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
        case 'OverconstrainedError':
          errorMessage = 'No se pudo configurar la cámara con los parámetros solicitados.';
          break;
        default:
          errorMessage = `Error de cámara: ${error.message}`;
      }
      
      setError(errorMessage);
      toast.error('❌ Error activando cámara');
    }
  };

  const cleanup = () => {
    console.log('🧹 Limpiando recursos de cámara...');
    
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
    
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
    }
  };

  const restartCamera = () => {
    console.log('🔄 Reiniciando cámara...');
    cleanup();
    setIsActive(false);
    setError(null);
    startCameraDirectly();
  };

  // =====================================
  // FUNCIONES DE GRABACIÓN
  // =====================================

  const startRecording = () => {
    if (!isActive) {
      toast.error('❌ La cámara no está activa');
      return;
    }
    
    setIsRecording(true);
    setSessionTime(0);
    toast.success('🔴 Sesión iniciada');
    console.log('📹 Grabación iniciada');
    
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
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
    }
    
    toast.success(`✅ Sesión completada: ${formatTime(sessionTime)}`);
    console.log('🏁 Grabación finalizada, duración:', sessionTime, 'segundos');
    
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
        
        {/* Overlay de carga */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white">
              <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-medium mb-2">Activando cámara...</h3>
              <p className="text-gray-300">Solicitando acceso automático</p>
            </div>
          </div>
        )}

        {/* Overlay de error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90">
            <div className="text-center text-white max-w-md mx-auto px-4">
              <Camera size={64} className="mx-auto mb-4 opacity-75" />
              <h3 className="text-xl font-medium mb-3">Error de Cámara</h3>
              <p className="text-red-200 mb-6 text-sm">{error}</p>
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

            {/* Indicador de estado activo */}
            <div className="absolute top-4 right-4 bg-green-600 bg-opacity-80 text-white px-3 py-1 rounded-full text-sm font-medium">
              ✅ Cámara Activa
            </div>

            {/* Info de video */}
            {videoRef.current && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                {videoRef.current.videoWidth}x{videoRef.current.videoHeight}
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
                className={`flex items-center space-x-2 px-6 py-3 text-white rounded-lg transition-colors font-medium text-lg ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isRecording ? <Pause size={24} /> : <Play size={24} />}
                <span>{isRecording ? 'Finalizar Sesión' : 'Iniciar Sesión'}</span>
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
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
            >
              <Camera size={20} />
              <span>{isLoading ? 'Activando...' : 'Activar Cámara'}</span>
            </button>
          )}
        </div>

        {/* Información de estado */}
        <div className="mt-4 text-center text-sm text-gray-600">
          {isLoading && <span>⏳ Solicitando acceso a cámara...</span>}
          {isActive && !error && (
            <span className="text-green-600 font-medium">
              ✅ Cámara funcionando correctamente
              {isRecording && ` • Grabando: ${formatTime(sessionTime)}`}
            </span>
          )}
          {error && (
            <span className="text-red-600">
              ❌ Error: Revisa los permisos de cámara en tu navegador
            </span>
          )}
        </div>

        {/* Tips para solucionar problemas */}
        {error && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-yellow-800 font-medium text-sm mb-2">💡 Consejos:</h4>
            <ul className="text-yellow-700 text-xs space-y-1">
              <li>• Permite el acceso a la cámara cuando el navegador lo solicite</li>
              <li>• Verifica que ninguna otra aplicación esté usando la cámara</li>
              <li>• Recarga la página si es necesario</li>
              <li>• Prueba en Chrome si estás usando otro navegador</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoCamera;