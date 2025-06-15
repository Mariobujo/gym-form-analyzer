/**
 * GymForm Analyzer - Loading Spinner Component
 */

const LoadingSpinner = ({ size = 'medium', color = 'blue' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600',
    red: 'border-red-600',
    green: 'border-green-600'
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]}
          border-2 border-t-transparent rounded-full animate-spin
        `}
        role="status"
        aria-label="Cargando"
      >
        <span className="sr-only">Cargando...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;