/**
 * Live Health Monitoring Component
 * Real-time health data display and monitoring
 */
import { Activity, Heart, Zap } from 'lucide-react';

export default function LiveHealthMonitoring() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <Activity className="h-12 w-12 text-teal-600 mx-auto mb-4" />
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Live Health Monitoring
          </h1>
          <p className="text-gray-600">
            Real-time monitoring of your vital signs and health metrics
          </p>
        </div>

        <div className="md:grid-cols-2 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <Heart className="text-red-500 h-8 w-8" />
              <span className="text-2xl font-bold text-gray-900">72</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Heart Rate
            </h3>
            <p className="text-gray-600 text-sm">BPM - Normal</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <Zap className="text-yellow-500 h-8 w-8" />
              <span className="text-2xl font-bold text-gray-900">7,842</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Steps Today
            </h3>
            <p className="text-gray-600 text-sm">Goal: 10,000 steps</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <Activity className="text-teal-500 h-8 w-8" />
              <span className="text-2xl font-bold text-gray-900">85</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Health Score
            </h3>
            <p className="text-gray-600 text-sm">Excellent</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Live Data Stream
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <span className="text-gray-700">Last sync</span>
              <span className="text-sm text-gray-500">Just now</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <span className="text-gray-700">Connection status</span>
              <span className="text-green-600 text-sm font-semibold">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">Next sync</span>
              <span className="text-sm text-gray-500">In 5 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
