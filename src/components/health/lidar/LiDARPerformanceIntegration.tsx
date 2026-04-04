/**
 * LiDAR Performance Integration Summary
 * Main integration point for performance-optimized LiDAR components
 */

import React, { useState } from 'react';
import LiDARPerformanceDemo from './LiDARPerformanceDemo';
import { PerformanceConfig } from './performance-integration';

export interface LiDARPerformanceIntegrationProps {
  mode?: 'demo' | 'summary' | 'metrics';
  className?: string;
  showAdvanced?: boolean;
}

export const LiDARPerformanceIntegration: React.FC<
  LiDARPerformanceIntegrationProps
> = ({ mode = 'summary', className = '', showAdvanced = false }) => {
  const [selectedConfig, setSelectedConfig] =
    useState<keyof typeof PerformanceConfig>('balanced');

  if (mode === 'demo') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-blue-50 border-blue-200 rounded-lg border p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-blue-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <div>
              <h3 className="text-blue-800 text-sm font-medium">
                Performance Optimization Active
              </h3>
              <p className="text-xs text-blue-600 mt-1">
                LiDAR components are running with advanced caching, batch
                processing, and memory optimization
              </p>
            </div>
          </div>
        </div>

        <LiDARPerformanceDemo />
      </div>
    );
  }

  if (mode === 'metrics') {
    return (
      <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Performance Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="performance-preset"
              className="text-gray-700 mb-2 block text-sm font-medium"
            >
              Performance Preset
            </label>
            <select
              id="performance-preset"
              value={selectedConfig}
              onChange={(e) =>
                setSelectedConfig(
                  e.target.value as keyof typeof PerformanceConfig
                )
              }
              className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md shadow-sm"
              title="Select performance preset configuration"
            >
              <option value="realTime">Real-time (High Performance)</option>
              <option value="balanced">Balanced (Recommended)</option>
              <option value="memoryOptimized">Memory Optimized</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-700 text-sm font-medium">Cache TTL</div>
              <div className="text-blue-600 text-lg font-bold">
                {PerformanceConfig[selectedConfig].cacheTTL / 1000}s
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-700 text-sm font-medium">
                Batch Size
              </div>
              <div className="text-green-600 text-lg font-bold">
                {PerformanceConfig[selectedConfig].batchSize}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-700 text-sm font-medium">
                Processing Delay
              </div>
              <div className="text-purple-600 text-lg font-bold">
                {PerformanceConfig[selectedConfig].processingDelay}ms
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-700 text-sm font-medium">Max Items</div>
              <div className="text-orange-600 text-lg font-bold">
                {PerformanceConfig[selectedConfig].maxItems}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default summary mode
  return (
    <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
      <div className="text-center">
        <div
          className="text-4xl mb-4"
          aria-label="Performance optimization icon"
        >
          ⚡
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          LiDAR Performance System Ready
        </h3>
        <p className="text-gray-600 mb-4 text-sm">
          Advanced performance optimizations are loaded and ready for LiDAR
          health monitoring components.
        </p>
        <div className="text-xs space-y-1 text-gray-500">
          <p>✅ Data caching with TTL management</p>
          <p>✅ Batch processing for high-throughput data</p>
          <p>✅ Memory optimization and cleanup</p>
          <p>✅ WebSocket connection pooling</p>
          <p>✅ Virtualized rendering for large datasets</p>
          <p>✅ Performance monitoring and metrics</p>
        </div>

        {showAdvanced && (
          <div className="border-gray-200 mt-6 border-t pt-4">
            <div className="space-y-2 text-left">
              <h4 className="text-sm font-medium text-gray-900">
                Performance Targets:
              </h4>
              <div className="text-xs grid grid-cols-2 gap-2">
                <div className="flex justify-between">
                  <span>Memory Reduction:</span>
                  <span className="text-green-600 font-semibold">30-40%</span>
                </div>
                <div className="flex justify-between">
                  <span>Load Time:</span>
                  <span className="text-blue-600 font-semibold">
                    60-70% faster
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span className="text-purple-600 font-semibold">
                    75% reduction
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ML Processing:</span>
                  <span className="text-orange-600 font-semibold">
                    90% faster
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiDARPerformanceIntegration;
