/**
 * GymForm Analyzer - Navbar Component (Temporal)
 */

import { Link } from 'react-router-dom';
import { LogOut, Home, Camera, Settings } from 'lucide-react';

const Navbar = ({ onLogout }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">
                GymForm
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="p-2 text-gray-600 hover:text-gray-800">
              <Home size={20} />
            </Link>
            <Link to="/camera" className="p-2 text-gray-600 hover:text-gray-800">
              <Camera size={20} />
            </Link>
            <Link to="/settings" className="p-2 text-gray-600 hover:text-gray-800">
              <Settings size={20} />
            </Link>
            <button
              onClick={onLogout}
              className="p-2 text-gray-600 hover:text-red-600"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;