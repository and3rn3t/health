import React from 'react';

const GameCenter: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-bold">Game Center</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Health Gamification</h3>
          <p className="text-gray-600">
            Track your health achievements and rewards
          </p>
        </div>
        <div className="rounded-lg bg-gray-100 p-4">
          <p>Game center coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default GameCenter;
