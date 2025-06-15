/**
 * GymForm Analyzer - Main App Component
 * Aplicación principal con rutas y estado global
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';

// Importar páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CameraPage from './pages/CameraPage';
import SettingsPage from './pages/SettingsPage';

// Importar componentes
import Navbar from './components/common/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Importar servicios
import { checkBackendStatus, getSystemInfo } from './services/api';

function App() {
  // Estados globales
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);

  // =====================================
  // EFECTOS
  // =====================================

  useEffect(() => {
    initializeApp();
  }, []);

  // =====================================
  // FUNCIONES DE INICIALIZACIÓN
  // =====================================

  /**
   * Inicializar la aplicación
   */
  const initializeApp = async () => {
    console.log('🚀 Inicializando GymForm Analyzer...');
    
    try {
      // 1. Verificar estado del backend
      const backendAvailable = await checkBackendStatus();
      setBackendStatus(backendAvailable);
      
      if (backendAvailable) {
        // 2. Obtener información completa del sistema
        const info = await getSystemInfo();
        setSystemInfo(info);
        console.log('📊 Sistema:', info);
      }
      
      // 3. Verificar autenticación (implementar después)
      // Por ahora, simulamos que no está autenticado
      const token = localStorage.getItem('auth_token');
      if (token) {
        // TODO: Verificar token con el backend
        setIsAuthenticated(true);
      }
      
      console.log('✅ Aplicación inicializada');
    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar login exitoso
   */
  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    console.log('✅ Login exitoso:', userData);
  };

  /**
   * Manejar logout
   */
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    console.log('👋 Logout realizado');
  };

  // =====================================
  // RENDER
  // =====================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <h1 className="text-2xl font-bold text-gray-800 mt-4">
            GymForm Analyzer
          </h1>
          <p className="text-gray-600 mt-2">
            Inicializando aplicación...
          </p>
          
          {/* Mostrar estado del backend */}
          <div className="mt-4 text-sm">
            {backendStatus === null && (
              <span className="text-yellow-600">🔍 Verificando backend...</span>
            )}
            {backendStatus === true && (
              <span className="text-green-600">✅ Backend conectado</span>
            )}
            {backendStatus === false && (
              <span className="text-red-600">❌ Backend no disponible</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si el backend no está disponible
  if (!backendStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Backend No Disponible
          </h1>
          <p className="text-gray-600 mb-6">
            No se puede conectar con el servidor backend en{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">
              http://localhost:8000
            </code>
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              ✅ Asegúrate de que el backend esté funcionando
            </p>
            <p className="text-sm text-gray-500">
              ✅ Verifica que esté en el puerto 8000
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Reintentar Conexión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />

        {/* Navbar (solo si está autenticado) */}
        {isAuthenticated && (
          <Navbar 
            onLogout={handleLogout}
            systemInfo={systemInfo}
          />
        )}

        {/* Rutas principales */}
        <main className={isAuthenticated ? 'pt-16' : ''}>
          <Routes>
            {/* Ruta pública - Login */}
            <Route
              path="/login"
              element={
                !isAuthenticated ? (
                  <LoginPage
                    onLoginSuccess={handleLoginSuccess}
                    systemInfo={systemInfo}
                  />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />

            {/* Rutas privadas */}
            {isAuthenticated ? (
              <>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/camera" element={<CameraPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </main>

        {/* Footer de información del sistema (solo en desarrollo) */}
        {import.meta.env.DEV && systemInfo && (
          <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white text-xs p-2">
            <div className="container mx-auto flex justify-between items-center">
              <span>
                🔗 Backend: {systemInfo.allConnected ? '✅' : '❌'} •
                DB: {systemInfo.database?.status === 'success' ? '✅' : '❌'}
              </span>
              <span>
                GymForm Analyzer v1.0.0 - Desarrollo
              </span>
            </div>
          </footer>
        )}
      </div>
    </Router>
  );
}

export default App;