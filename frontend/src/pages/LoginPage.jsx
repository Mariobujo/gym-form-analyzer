/**
 * GymForm Analyzer - Login Page
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, User, Lock, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LoginPage = ({ onLoginSuccess, systemInfo }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      console.log('🔑 Intentando login:', data.username);
      
      // Simulación de login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData = {
        id: 1,
        username: data.username,
        email: `${data.username}@gymform.com`,
        firstName: 'Usuario',
        lastName: 'Prueba'
      };
      
      localStorage.setItem('auth_token', 'fake-jwt-token-for-development');
      toast.success('¡Bienvenido a GymForm Analyzer!');
      onLoginSuccess(userData);
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      toast.error('Error de inicio de sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Activity size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            GymForm Analyzer
          </h1>
          <p className="mt-2 text-gray-600">
            Análisis de técnica de ejercicios con IA
          </p>
        </div>

        {/* Formulario de login */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Usuario */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Usuario
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={20} className="text-gray-400" />
                </div>
                <input
                  {...register('username', { 
                    required: 'El usuario es requerido',
                    minLength: { value: 3, message: 'Mínimo 3 caracteres' }
                  })}
                  type="text"
                  className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="test_user"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  {...register('password', { 
                    required: 'La contraseña es requerida',
                    minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="pl-10 pr-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="test123"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye size={20} className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              disabled={isLoading || !systemInfo?.allConnected}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <LoadingSpinner size="small" />
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Información adicional */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Versión de desarrollo</p>
            <p className="mt-1">
              Backend: {systemInfo?.allConnected ? 'Conectado' : 'Desconectado'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;