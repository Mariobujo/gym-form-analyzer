/**
 * Camera Page - Versión Simple que Funciona
 */

import PoseDetection from '../components/camera/PoseDetection';

const CameraPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PoseDetection />
    </div>
  );
};

export default CameraPage;