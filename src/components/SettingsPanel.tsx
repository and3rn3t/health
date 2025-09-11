import React from 'react';

const SettingsPanel: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-bold">Settings</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">VitalSense Settings</h3>
          <p className="text-gray-600">
            Configure your health monitoring preferences
          </p>
        </div>
        <div className="rounded-lg bg-gray-100 p-4">
          <p>Settings panel coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
