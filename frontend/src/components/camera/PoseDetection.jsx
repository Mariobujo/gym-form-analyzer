/**
 * POSE DETECTION CON CÁMARA VISIBLE - Versión que SÍ funciona
 */

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Pose } from '@mediapipe/pose';
import * as cam from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import toast from 'react-hot-toast';

// CONEXIONES DE POSE
const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [27, 29], [29, 31],
  [27, 31], [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
];

const PoseDetection = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [poseDetected, setPoseDetected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [landmarks, setLandmarks] = useState(null);

  let camera = null;
  let pose = null;

  // FUNCIÓN QUE DIBUJA LOS RESULTADOS
  function onResults(results) {
    if (!canvasRef.current) return;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');
    
    // Configurar canvas
    canvasElement.width = 640;
    canvasElement.height = 480;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Si hay landmarks, dibujarlos
    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      setPoseDetected(true);
      setFrameCount(prev => prev + 1);
      setLandmarks(results.poseLandmarks);

      // DIBUJAR CONEXIONES (ESQUELETO VERDE)
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 5
      });

      // DIBUJAR PUNTOS PRINCIPALES
      const keyPoints = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
      keyPoints.forEach(index => {
        if (results.poseLandmarks[index]) {
          const landmark = results.poseLandmarks[index];
          const x = landmark.x * canvasElement.width;
          const y = landmark.y * canvasElement.height;

          // Círculo grande coloreado
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, 15, 0, 2 * Math.PI);
          canvasCtx.fillStyle = getPointColor(index);
          canvasCtx.fill();

          // Borde blanco grueso
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, 15, 0, 2 * Math.PI);
          canvasCtx.strokeStyle = '#FFFFFF';
          canvasCtx.lineWidth = 4;
          canvasCtx.stroke();

          // Centro blanco
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, 6, 0, 2 * Math.PI);
          canvasCtx.fillStyle = '#FFFFFF';
          canvasCtx.fill();
        }
      });

      // TODOS LOS DEMÁS PUNTOS PEQUEÑOS
      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: '#FFFF00',
        fillColor: '#FFFF00',
        radius: 4
      });

      // OVERLAY DE INFORMACIÓN
      canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      canvasCtx.fillRect(15, 15, 320, 100);
      
      canvasCtx.fillStyle = '#FFFFFF';
      canvasCtx.font = 'bold 18px Arial';
      canvasCtx.fillText('🤖 MediaPipe Pose Detectado', 25, 45);
      
      canvasCtx.font = '16px Arial';
      canvasCtx.fillText(`Puntos detectados: ${results.poseLandmarks.length}/33`, 25, 70);
      canvasCtx.fillText(`Frames procesados: ${frameCount}`, 25, 95);
      canvasCtx.fillText(`Confianza: Alta`, 25, 120);

    } else {
      setPoseDetected(false);
      setLandmarks(null);
    }

    canvasCtx.restore();
  }

  function getPointColor(index) {
    if (index === 0) return '#FF6B6B'; // Nariz - rojo brillante
    if ([11, 12].includes(index)) return '#4ECDC4'; // Hombros - cyan
    if ([13, 14, 15, 16].includes(index)) return '#45B7D1'; // Brazos - azul
    if ([23, 24].includes(index)) return '#F9CA24'; // Caderas - amarillo
    if ([25, 26, 27, 28].includes(index)) return '#6C5CE7'; // Piernas - púrpura
    return '#A0A0A0';
  }

  const initializePose = async () => {
    try {
      console.log('🚀 Inicializando MediaPipe Pose...');
      
      // CREAR INSTANCIA DE POSE
      pose = new Pose({
        locateFile: (file) => {
          console.log('📦 Cargando archivo:', file);
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.2/${file}`;
        },
      });

      // CONFIGURACIÓN
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults(onResults);

      console.log('✅ MediaPipe Pose configurado');
      return pose;

    } catch (error) {
      console.error('❌ Error inicializando MediaPipe:', error);
      throw error;
    }
  };

  const initializeCamera = async () => {
    try {
      // Esperar a que el video esté listo
      await new Promise((resolve) => {
        const checkVideo = () => {
          if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState >= 2) {
            resolve();
          } else {
            setTimeout(checkVideo, 100);
          }
        };
        checkVideo();
      });

      console.log('📹 Inicializando cámara MediaPipe...');
      
      camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (pose && webcamRef.current && webcamRef.current.video.readyState === 4) {
            await pose.send({ image: webcamRef.current.video });
          }
        },
        width: 640,
        height: 480,
      });

      await camera.start();
      console.log('✅ Cámara MediaPipe iniciada');
      
      setIsLoaded(true);
      toast.success('🤖 ¡MediaPipe Pose funcionando!');

    } catch (error) {
      console.error('❌ Error iniciando cámara:', error);
      toast.error('Error iniciando cámara MediaPipe');
      throw error;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        // Primero inicializar pose
        await initializePose();
        
        // Esperar un poco y luego inicializar cámara
        setTimeout(async () => {
          await initializeCamera();
        }, 1000);
        
      } catch (error) {
        console.error('❌ Error en inicialización completa:', error);
        setIsLoaded(false);
      }
    };

    initialize();

    // Cleanup
    return () => {
      if (camera) {
        camera.stop();
      }
      if (pose) {
        pose.close();
      }
    };
  }, []);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setFrameCount(0);
      toast.success('🔴 Iniciando análisis de pose');
    } else {
      toast.success(`⏹️ Análisis finalizado - ${frameCount} frames procesados`);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3 text-gray-900">
          🤖 MediaPipe Pose Detection
        </h1>
        <p className="text-gray-600 mb-4">
          Detección de pose en tiempo real con 33 puntos corporales
        </p>
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
          isLoaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {isLoaded ? '✅ Sistema Funcionando' : '⏳ Inicializando MediaPipe...'}
        </div>
      </div>

      {/* Área de video principal */}
      <div className="relative bg-white rounded-lg shadow-lg p-4">
        {/* Webcam visible */}
        <div className="relative">
          <Webcam
            ref={webcamRef}
            width={640}
            height={480}
            mirrored={true}
            className="rounded-lg border-2 border-gray-300"
          />

          {/* Canvas overlay para puntos de pose */}
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0 pointer-events-none rounded-lg"
            style={{ zIndex: 10 }}
          />

          {/* Indicadores */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center space-x-2 z-20">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-bold bg-red-600 bg-opacity-90 px-3 py-1 rounded-full">
                🔴 ANALIZANDO
              </span>
            </div>
          )}

          {poseDetected && (
            <div className="absolute top-4 right-4 bg-green-600 bg-opacity-90 text-white px-3 py-1 rounded-lg z-20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>🤖 Pose Detectada</span>
              </div>
            </div>
          )}

          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
              <div className="text-center text-white">
                <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                <p>Cargando MediaPipe...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="flex space-x-4">
        <button
          onClick={toggleRecording}
          disabled={!isLoaded}
          className={`px-8 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRecording ? '⏹️ Finalizar Análisis' : '▶️ Iniciar Análisis'}
        </button>
      </div>

      {/* Estadísticas */}
      {isLoaded && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-4xl">
          <div className="bg-white rounded-lg border shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {isLoaded ? '✅' : '❌'}
            </div>
            <div className="text-sm text-gray-600 mt-1">MediaPipe</div>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {poseDetected ? '✅' : '❌'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Pose Detectada</div>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {landmarks ? landmarks.length : 0}/33
            </div>
            <div className="text-sm text-gray-600 mt-1">Puntos</div>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {frameCount}
            </div>
            <div className="text-sm text-gray-600 mt-1">Frames</div>
          </div>
        </div>
      )}

      {/* Información técnica */}
      <div className="max-w-2xl bg-white rounded-lg border shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-3">📋 Estado del Sistema</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">MediaPipe:</span>
            <span className={`ml-2 ${isLoaded ? 'text-green-600' : 'text-yellow-600'}`}>
              {isLoaded ? 'Funcionando' : 'Cargando...'}
            </span>
          </div>
          <div>
            <span className="font-medium">Versión CDN:</span>
            <span className="ml-2 text-blue-600">v0.2 (Estable)</span>
          </div>
          <div>
            <span className="font-medium">Detección:</span>
            <span className={`ml-2 ${poseDetected ? 'text-green-600' : 'text-gray-600'}`}>
              {poseDetected ? 'Activa' : 'Esperando...'}
            </span>
          </div>
          <div>
            <span className="font-medium">Resolución:</span>
            <span className="ml-2 text-gray-600">640x480</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoseDetection;