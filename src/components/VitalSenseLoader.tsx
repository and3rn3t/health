import React from 'react';

const VitalSenseLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin border-blue-600 h-8 w-8 rounded-full border-b-2"></div>
      <span className="ml-3 text-gray-600">Loading VitalSense...</span>
    </div>
  );
};

export default VitalSenseLoader;
