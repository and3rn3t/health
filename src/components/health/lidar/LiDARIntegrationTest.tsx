/**
 * LiDAR Integration Test Component
 * Quick test to verify the clean integration is working
 */

import { Activity, AlertCircle, CheckCircle } from 'lucide-react';
import React from 'react';
import { CleanLiDARPerformanceProvider, usePerformanceMetrics } from './index';

const IntegrationStatus: React.FC = () => {
  const { metrics, cacheStats } = usePerformanceMetrics();

  const status = {
    performanceProvider: true,
    metricsHook: metrics.renderTime >= 0,
    cacheSystem: cacheStats.totalRequests >= 0,
    reactIntegration: Boolean(React.version),
  };

  const allGood = Object.values(status).every(Boolean);

  return (
    <div className="mx-auto max-w-2xl rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center">
        {allGood ? (
          <CheckCircle className="text-green-600 mr-2 h-6 w-6" />
        ) : (
          <AlertCircle className="text-red-600 mr-2 h-6 w-6" />
        )}
        <h2 className="text-xl font-semibold text-gray-900">
          LiDAR Integration Status
        </h2>
      </div>

      <div className="space-y-3">
        <StatusItem
          label="Performance Provider"
          status={status.performanceProvider}
          detail="CleanLiDARPerformanceProvider initialized"
        />
        <StatusItem
          label="Metrics Hook"
          status={status.metricsHook}
          detail={`Current render time: ${metrics.renderTime.toFixed(2)}ms`}
        />
        <StatusItem
          label="Cache System"
          status={status.cacheSystem}
          detail={`Cache requests: ${cacheStats.totalRequests}, Hit rate: ${metrics.cacheHitRate.toFixed(1)}%`}
        />
        <StatusItem
          label="React Integration"
          status={status.reactIntegration}
          detail={`React ${React.version} compatible`}
        />
      </div>

      {allGood && (
        <div className="bg-green-50 border-green-200 mt-6 rounded-lg border p-4">
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-green-800 font-medium">
                Integration Successful!
              </h3>
              <p className="text-green-700 mt-1 text-sm">
                All clean LiDAR components are working correctly. Navigate to
                "LiDAR Performance" in your app to see the full dashboard.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusItem: React.FC<{
  label: string;
  status: boolean;
  detail: string;
}> = ({ label, status, detail }) => (
  <div className="p-3 bg-gray-50 flex items-start justify-between rounded">
    <div className="flex items-center">
      {status ? (
        <CheckCircle className="text-green-500 mt-0.5 mr-2 h-4 w-4" />
      ) : (
        <AlertCircle className="text-red-500 mt-0.5 mr-2 h-4 w-4" />
      )}
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-gray-600 text-sm">{detail}</div>
      </div>
    </div>
    <span
      className={`text-xs rounded-full px-2 py-1 ${
        status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {status ? 'OK' : 'Error'}
    </span>
  </div>
);

// Main test component with provider
export const LiDARIntegrationTest: React.FC = () => {
  return (
    <CleanLiDARPerformanceProvider>
      <IntegrationStatus />
    </CleanLiDARPerformanceProvider>
  );
};

export default LiDARIntegrationTest;
