/**
 * Live Health Monitoring Component
 * Real-time health data streaming and monitoring
 */

import { Button } from '@/components/ui/button';
import { Activity, Heart, TrendingUp, Zap } from 'lucide-react';

export default function LiveHealthMonitoring() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Live Health Monitoring
        </h1>
        <p className="text-gray-600">
          Real-time health data streaming from your connected devices
        </p>
      </div>

      {/* Live Status Cards */}
      <div className="md:grid-cols-2 mb-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Heart Rate</p>
              <p className="text-red-600 text-2xl font-bold">72 BPM</p>
            </div>
            <Heart className="text-red-500 h-8 w-8" />
          </div>
          <p className="text-xs mt-2 text-gray-500">Live • Just now</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Activity Level
              </p>
              <p className="text-green-600 text-2xl font-bold">Moderate</p>
            </div>
            <Activity className="text-green-500 h-8 w-8" />
          </div>
          <p className="text-xs mt-2 text-gray-500">Live • 30s ago</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Steps Today</p>
              <p className="text-blue-600 text-2xl font-bold">8,432</p>
            </div>
            <TrendingUp className="text-blue-500 h-8 w-8" />
          </div>
          <p className="text-xs mt-2 text-gray-500">Live • 1m ago</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Energy Level</p>
              <p className="text-yellow-600 text-2xl font-bold">High</p>
            </div>
            <Zap className="text-yellow-500 h-8 w-8" />
          </div>
          <p className="text-xs mt-2 text-gray-500">Live • 2m ago</p>
        </div>
      </div>

      {/* Live Stream Status */}
      <div className="rounded-lg border bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Live Data Stream</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 animate-pulse rounded-full"></div>
            <span className="text-green-600 text-sm font-medium">
              Connected
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-gray-50 flex items-center justify-between rounded">
            <span className="text-sm">Apple Watch</span>
            <span className="text-xs text-gray-500">Last sync: 15s ago</span>
          </div>
          <div className="p-3 bg-gray-50 flex items-center justify-between rounded">
            <span className="text-sm">iPhone Health</span>
            <span className="text-xs text-gray-500">Last sync: 30s ago</span>
          </div>
          <div className="p-3 bg-gray-50 flex items-center justify-between rounded">
            <span className="text-sm">WebSocket Stream</span>
            <span className="text-xs text-gray-500">Connected</span>
          </div>
        </div>

        <div className="space-x-3 mt-6 flex">
          <Button variant="outline" size="sm">
            Pause Monitoring
          </Button>
          <Button variant="outline" size="sm">
            Settings
          </Button>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-blue-50 border-blue-200 mt-8 rounded-lg border p-4">
        <p className="text-blue-800 text-sm">
          🚧 <strong>Advanced Live Monitoring Coming Soon</strong> - Real-time
          health analytics, predictive alerts, and AI-powered health insights
          are currently in development.
        </p>
      </div>
    </div>
  );
}
