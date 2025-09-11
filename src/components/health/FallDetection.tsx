/**
 * Fall Detection Component
 * AI-powered fall detection system
 */

import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, Shield, Smartphone } from 'lucide-react';

export default function FallDetection() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Fall Detection System
        </h1>
        <p className="text-gray-600">
          AI-powered fall detection with automatic emergency alerts
        </p>
      </div>

      {/* Status Overview */}
      <div className="md:grid-cols-3 mb-8 grid grid-cols-1 gap-6">
        <div className="rounded-lg border bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">System Status</p>
              <p className="text-green-600 text-2xl font-bold">Active</p>
            </div>
            <Shield className="text-green-500 h-8 w-8" />
          </div>
          <p className="text-xs mt-2 text-gray-500">24/7 Monitoring Enabled</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Last Check</p>
              <p className="text-blue-600 text-2xl font-bold">2m ago</p>
            </div>
            <Activity className="text-blue-500 h-8 w-8" />
          </div>
          <p className="text-xs mt-2 text-gray-500">Movement Analysis</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Risk Level</p>
              <p className="text-yellow-600 text-2xl font-bold">Low</p>
            </div>
            <AlertTriangle className="text-yellow-500 h-8 w-8" />
          </div>
          <p className="text-xs mt-2 text-gray-500">Based on Activity</p>
        </div>
      </div>

      {/* Detection Settings */}
      <div className="mb-8 rounded-lg border bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Detection Settings</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Automatic Detection</h3>
              <p className="text-gray-600 text-sm">
                Monitor movement patterns for fall detection
              </p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Emergency Alerts</h3>
              <p className="text-gray-600 text-sm">
                Send alerts to emergency contacts
              </p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Apple Watch Integration</h3>
              <p className="text-gray-600 text-sm">
                Use Watch fall detection sensors
              </p>
            </div>
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>

        <div className="space-y-3">
          <div className="space-x-3 p-3 bg-green-50 flex items-center rounded">
            <Shield className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">Normal Activity Detected</p>
              <p className="text-xs text-gray-500">Today at 10:30 AM</p>
            </div>
          </div>

          <div className="space-x-3 p-3 bg-blue-50 flex items-center rounded">
            <Activity className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">Exercise Session Started</p>
              <p className="text-xs text-gray-500">Today at 9:15 AM</p>
            </div>
          </div>

          <div className="space-x-3 p-3 bg-gray-50 flex items-center rounded">
            <Smartphone className="h-5 w-5 text-gray-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">System Check Completed</p>
              <p className="text-xs text-gray-500">Today at 8:00 AM</p>
            </div>
          </div>
        </div>

        <div className="space-x-3 mt-6 flex">
          <Button variant="outline" size="sm">
            Test Alert System
          </Button>
          <Button variant="outline" size="sm">
            Configure Contacts
          </Button>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-orange-50 border-orange-200 mt-8 rounded-lg border p-4">
        <p className="text-orange-800 text-sm">
          🚧 <strong>Advanced AI Fall Detection Coming Soon</strong> - Machine
          learning algorithms for improved accuracy and predictive fall risk
          assessment.
        </p>
      </div>
    </div>
  );
}
