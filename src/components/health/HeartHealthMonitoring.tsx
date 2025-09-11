/**
 * Heart Health Monitoring Component
 * Comprehensive cardiovascular health tracking
 */

import { Button } from '@/components/ui/button';
import { Activity, AlertCircle, Heart, TrendingUp } from 'lucide-react';

export default function HeartHealthMonitoring() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Heart Health Monitoring
        </h1>
        <p className="text-gray-600">
          Comprehensive cardiovascular health tracking and analysis
        </p>
      </div>

      {/* Heart Rate Overview */}
      <div className="md:grid-cols-2 mb-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Current HR</p>
              <p className="text-red-600 text-2xl font-bold">72 BPM</p>
            </div>
            <Heart className="text-red-500 h-8 w-8" />
          </div>
          <p className="text-xs text-green-600 mt-2">↓ 3 BPM from avg</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Resting HR</p>
              <p className="text-blue-600 text-2xl font-bold">65 BPM</p>
            </div>
            <Activity className="text-blue-500 h-8 w-8" />
          </div>
          <p className="text-xs mt-2 text-gray-500">7-day average</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">HRV</p>
              <p className="text-green-600 text-2xl font-bold">42 ms</p>
            </div>
            <TrendingUp className="text-green-500 h-8 w-8" />
          </div>
          <p className="text-xs text-green-600 mt-2">↑ Good variability</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Health Score</p>
              <p className="text-purple-600 text-2xl font-bold">87/100</p>
            </div>
            <AlertCircle className="text-purple-500 h-8 w-8" />
          </div>
          <p className="text-xs text-purple-600 mt-2">Excellent</p>
        </div>
      </div>

      {/* Heart Rate Zones */}
      <div className="mb-8 rounded-lg border bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Heart Rate Zones</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-x-3 flex items-center">
              <div className="bg-gray-400 h-4 w-4 rounded"></div>
              <span className="text-sm font-medium">Resting Zone</span>
              <span className="text-xs text-gray-500">&lt;65 BPM</span>
            </div>
            <span className="text-gray-600 text-sm">2h 15m today</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-x-3 flex items-center">
              <div className="bg-blue-500 h-4 w-4 rounded"></div>
              <span className="text-sm font-medium">Fat Burn Zone</span>
              <span className="text-xs text-gray-500">65-92 BPM</span>
            </div>
            <span className="text-gray-600 text-sm">45m today</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-x-3 flex items-center">
              <div className="bg-green-500 h-4 w-4 rounded"></div>
              <span className="text-sm font-medium">Cardio Zone</span>
              <span className="text-xs text-gray-500">92-119 BPM</span>
            </div>
            <span className="text-gray-600 text-sm">30m today</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-x-3 flex items-center">
              <div className="bg-yellow-500 h-4 w-4 rounded"></div>
              <span className="text-sm font-medium">Peak Zone</span>
              <span className="text-xs text-gray-500">&gt;119 BPM</span>
            </div>
            <span className="text-gray-600 text-sm">15m today</span>
          </div>
        </div>
      </div>

      {/* Health Insights */}
      <div className="mb-8 rounded-lg border bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Health Insights</h2>

        <div className="space-y-3">
          <div className="space-x-3 p-3 bg-green-50 flex items-center rounded">
            <Heart className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Excellent cardiovascular fitness
              </p>
              <p className="text-xs text-gray-500">
                Your resting heart rate is in the optimal range
              </p>
            </div>
          </div>

          <div className="space-x-3 p-3 bg-blue-50 flex items-center rounded">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Heart rate variability improving
              </p>
              <p className="text-xs text-gray-500">
                7% increase over the past month
              </p>
            </div>
          </div>

          <div className="space-x-3 p-3 bg-yellow-50 flex items-center rounded">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Consider more cardio exercise
              </p>
              <p className="text-xs text-gray-500">
                To maintain your excellent heart health
              </p>
            </div>
          </div>
        </div>

        <div className="space-x-3 mt-6 flex">
          <Button variant="outline" size="sm">
            View Detailed Report
          </Button>
          <Button variant="outline" size="sm">
            Set HR Alerts
          </Button>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-red-50 border-red-200 mt-8 rounded-lg border p-4">
        <p className="text-red-800 text-sm">
          🚧 <strong>Advanced Cardiac Analysis Coming Soon</strong> - ECG
          analysis, atrial fibrillation detection, and predictive cardiovascular
          risk assessment.
        </p>
      </div>
    </div>
  );
}
