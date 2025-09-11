/**
 * Caregiver Dashboard Component
 * Dashboard for caregivers to monitor patient health
 */
import { Heart, Phone, Shield, Users } from 'lucide-react';

export default function CaregiverDashboard() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <Users className="h-12 w-12 text-teal-600 mx-auto mb-4" />
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Caregiver Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor and manage patient health information and alerts
          </p>
        </div>

        <div className="md:grid-cols-2 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <Heart className="text-red-500 h-8 w-8" />
              <span className="text-green-600 text-sm font-semibold">
                Normal
              </span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Patient Status
            </h3>
            <p className="text-gray-600 text-sm">
              All vital signs within normal ranges
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <Shield className="text-teal-500 h-8 w-8" />
              <span className="text-sm text-gray-500">No alerts</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Emergency Alerts
            </h3>
            <p className="text-gray-600 text-sm">
              No active emergency situations
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <Phone className="text-blue-500 h-8 w-8" />
              <span className="text-sm text-gray-500">Available</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Emergency Contacts
            </h3>
            <p className="text-gray-600 text-sm">3 contacts configured</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <span className="text-gray-700">Last health data sync</span>
              <span className="text-sm text-gray-500">5 minutes ago</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <span className="text-gray-700">Medication reminder sent</span>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">Emergency drill completed</span>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
