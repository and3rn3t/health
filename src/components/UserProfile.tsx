import React from 'react';

const UserProfile: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-bold">User Profile</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Profile Information</h3>
          <p className="text-gray-600">
            Manage your personal information and preferences
          </p>
        </div>
        <div className="rounded-lg bg-gray-100 p-4">
          <p>User profile coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
