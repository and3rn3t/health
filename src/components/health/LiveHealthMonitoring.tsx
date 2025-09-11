/**
 * Live Health Monitoring Component
 * Real-time health data display and monitoring
 */
import { Activity, Heart, Zap } from 'lucide-react';

export default function LiveHealthMonitoring() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Activity className="mx-auto h-12 w-12 text-teal-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Live Health Monitoring
          </h1>
          <p className="text-gray-600">
            Real-time monitoring of your vital signs and health metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Heart className="h-8 w-8 text-red-500" />
              <span className="text-2xl font-bold text-gray-900">72</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Heart Rate</h3>
            <p className="text-sm text-gray-600">BPM - Normal</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Zap className="h-8 w-8 text-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">7,842</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Steps Today</h3>
            <p className="text-sm text-gray-600">Goal: 10,000 steps</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-8 w-8 text-teal-500" />
              <span className="text-2xl font-bold text-gray-900">85</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Score</h3>
            <p className="text-sm text-gray-600">Excellent</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Live Data Stream</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Last sync</span>
              <span className="text-sm text-gray-500">Just now</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Connection status</span>
              <span className="text-sm text-green-600 font-semibold">Connected</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">Next sync</span>
              <span className="text-sm text-gray-500">In 5 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
