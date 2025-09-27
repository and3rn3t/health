/**
 * Enhanced LiDAR Performance Integration
 * Complete integration of clean LiDAR components with performance optimization
 */

import { Activity, BarChart3, Database, Zap } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  CleanLiDARList,
  CleanLiDARPerformanceProvider,
  usePerformanceMetrics,
  type LiDARScanData,
} from './index';

// Performance-aware LiDAR dashboard
const EnhancedLiDARDashboard: React.FC = () => {
  const { metrics, cacheStats } = usePerformanceMetrics();
  const [selectedScan, setSelectedScan] = useState<LiDARScanData | null>(null);

  // Sample data for demonstration
  const sampleData: LiDARScanData[] = useMemo(
    () => [
      {
        id: 'scan-001',
        timestamp: Date.now() - 60000,
        points: [],
        metadata: {
          duration: 45,
          pointCount: 15420,
          accuracy: 0.98,
          roomId: 'living-room',
        },
      },
      {
        id: 'scan-002',
        timestamp: Date.now() - 30000,
        points: [],
        metadata: {
          duration: 52,
          pointCount: 18350,
          accuracy: 0.96,
          roomId: 'bedroom',
        },
      },
      {
        id: 'scan-003',
        timestamp: Date.now() - 10000,
        points: [],
        metadata: {
          duration: 38,
          pointCount: 12890,
          accuracy: 0.99,
          roomId: 'kitchen',
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6 p-6">
      {/* Performance Metrics Header */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center text-lg font-semibold text-gray-900">
            <Zap className="w-5 h-5 text-yellow-500 mr-2" />
            Performance Optimized LiDAR System
          </h2>
          <div className="text-sm text-gray-500">
            {metrics.renderTime.toFixed(1)}ms render time
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="md:grid-cols-4 grid grid-cols-1 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center">
              <Activity className="text-blue-600 mr-2 h-4 w-4" />
              <div>
                <div className="text-blue-900 text-sm font-medium">
                  Render Time
                </div>
                <div className="text-blue-700 text-lg font-bold">
                  {metrics.renderTime.toFixed(1)}ms
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center">
              <Database className="text-green-600 mr-2 h-4 w-4" />
              <div>
                <div className="text-green-900 text-sm font-medium">
                  Cache Hit Rate
                </div>
                <div className="text-green-700 text-lg font-bold">
                  {metrics.cacheHitRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center">
              <BarChart3 className="text-purple-600 mr-2 h-4 w-4" />
              <div>
                <div className="text-purple-900 text-sm font-medium">
                  Memory Usage
                </div>
                <div className="text-purple-700 text-lg font-bold">
                  {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center">
              <Database className="text-orange-600 mr-2 h-4 w-4" />
              <div>
                <div className="text-orange-900 text-sm font-medium">
                  Cache Requests
                </div>
                <div className="text-orange-700 text-lg font-bold">
                  {cacheStats.totalRequests}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LiDAR Data List */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b p-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent LiDAR Scans
          </h3>
          <p className="text-gray-600 mt-1 text-sm">
            Performance-optimized rendering with caching and batch processing
          </p>
        </div>

        <CleanLiDARList
          data={sampleData}
          onItemClick={setSelectedScan}
          maxItems={10}
          className="border-0"
        />
      </div>

      {/* Selected Scan Details */}
      {selectedScan && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">
            Scan Details: {selectedScan.id}
          </h3>
          <div className="md:grid-cols-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-700 font-medium">Duration:</span>
              <div className="text-gray-900">
                {selectedScan.metadata.duration}ms
              </div>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Points:</span>
              <div className="text-gray-900">
                {selectedScan.metadata.pointCount.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Accuracy:</span>
              <div className="text-gray-900">
                {(selectedScan.metadata.accuracy * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Room:</span>
              <div className="capitalize text-gray-900">
                {selectedScan.metadata.roomId || 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main export component with performance provider
export const EnhancedLiDARIntegration: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <CleanLiDARPerformanceProvider>
      <div className={className}>
        <EnhancedLiDARDashboard />
      </div>
    </CleanLiDARPerformanceProvider>
  );
};

export default EnhancedLiDARIntegration;
