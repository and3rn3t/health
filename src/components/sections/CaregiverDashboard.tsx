/**
 * Caregiver Dashboard Component
 * Dashboard for caregivers to monitor patient health
 */
import { Users, Heart, Shield, Phone } from 'lucide-react';

export default function CaregiverDashboard() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Users className="mx-auto h-12 w-12 text-teal-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Caregiver Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor and manage patient health information and alerts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Heart className="h-8 w-8 text-red-500" />
              <span className="text-sm text-green-600 font-semibold">Normal</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Status</h3>
            <p className="text-sm text-gray-600">All vital signs within normal ranges</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Shield className="h-8 w-8 text-teal-500" />
              <span className="text-sm text-gray-500">No alerts</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Emergency Alerts</h3>
            <p className="text-sm text-gray-600">No active emergency situations</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Phone className="h-8 w-8 text-blue-500" />
              <span className="text-sm text-gray-500">Available</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Emergency Contacts</h3>
            <p className="text-sm text-gray-600">3 contacts configured</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Last health data sync</span>
              <span className="text-sm text-gray-500">5 minutes ago</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Medication reminder sent</span>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">Emergency drill completed</span>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
