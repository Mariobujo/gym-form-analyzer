/**
 * GymForm Analyzer - Dashboard Page (Temporal)
 */

import { Activity, Camera, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏋️ Dashboard GymForm Analyzer
          </h1>
          <p className="text-xl text-gray-600">
            Bienvenido al análisis de técnica de ejercicios
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Cámara de análisis */}
          <Link to="/camera" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4 mx-auto">
              <Camera size={32} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Análisis en Vivo
            </h3>
            <p className="text-gray-600 text-center">
              Inicia una sesión de análisis de técnica con tu cámara
            </p>
          </Link>

          {/* Configuración */}
          <Link to="/settings" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-4 mx-auto">
              <Settings size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Configuración
            </h3>
            <p className="text-gray-600 text-center">
              Ajusta las preferencias de la aplicación
            </p>
          </Link>

          {/* Estadísticas */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-lg mb-4 mx-auto">
              <Activity size={32} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Estadísticas
            </h3>
            <p className="text-gray-600 text-center">
              Proximamente: Revisa tu progreso y métricas
            </p>
          </div>
        </div>

        {/* Estado del sistema */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Estado del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">✅</div>
              <div className="font-medium text-green-800">Frontend</div>
              <div className="text-sm text-green-600">Funcionando</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">✅</div>
              <div className="font-medium text-green-800">Backend</div>
              <div className="text-sm text-green-600">Conectado</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="font-medium text-yellow-800">IA</div>
              <div className="text-sm text-yellow-600">En desarrollo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;