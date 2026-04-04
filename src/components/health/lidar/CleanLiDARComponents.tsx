/**
 * Clean LiDAR Components
 * Lint-compliant, performance-optimized React components for LiDAR data
 */

import React, { memo, useCallback, useMemo } from 'react';
import { usePerformanceMetrics } from '../../../lib/performance/CleanLiDARPerformanceOptimizer';

// Types for LiDAR data structures
export interface LiDARDataPoint {
  id: string;
  timestamp: number;
  x: number;
  y: number;
  z: number;
  intensity: number;
  classification?: string;
  confidence?: number;
}

export interface LiDARScanData {
  id: string;
  timestamp: number;
  points: LiDARDataPoint[];
  metadata: {
    duration: number;
    pointCount: number;
    accuracy: number;
    roomId?: string;
  };
}

export interface CleanLiDARListProps {
  data: LiDARScanData[];
  onItemClick?: (item: LiDARScanData) => void;
  className?: string;
  maxItems?: number;
}

// Simple, performant LiDAR scan item component
const CleanLiDARScanItem = memo<{
  scan: LiDARScanData;
  index: number;
  onClick?: (scan: LiDARScanData) => void;
}>(({ scan, index, onClick }) => {
  const { measureRender } = usePerformanceMetrics();

  const formatTimestamp = useMemo(() => {
    return new Date(scan.timestamp).toLocaleTimeString();
  }, [scan.timestamp]);

  const formatDuration = useMemo(() => {
    return `${(scan.metadata.duration / 1000).toFixed(1)}s`;
  }, [scan.metadata.duration]);

  const accuracyColor = useMemo(() => {
    const accuracy = scan.metadata.accuracy;
    if (accuracy >= 0.9) return 'text-green-600';
    if (accuracy >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  }, [scan.metadata.accuracy]);

  const handleClick = useCallback(() => {
    measureRender(`LiDARScanItem-${scan.id}`, () => {
      onClick?.(scan);
    });
  }, [measureRender, scan, onClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <button
      type="button"
      className="border-gray-200 hover:bg-gray-50 flex w-full cursor-pointer items-center justify-between border-b p-4 text-left transition-colors duration-150"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`LiDAR scan ${scan.id} with ${scan.metadata.pointCount} points`}
    >
      <div className="min-w-0 flex-1">
        <div className="space-x-3 flex items-center">
          <div className="flex-shrink-0">
            <div className="bg-blue-100 flex h-8 w-8 items-center justify-center rounded-full">
              <span className="text-blue-600 text-sm font-medium">
                {index + 1}
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <p className="truncate text-sm font-medium text-gray-900">
                Scan {scan.id}
              </p>
              <span className={`text-xs font-medium ${accuracyColor}`}>
                {(scan.metadata.accuracy * 100).toFixed(1)}% accurate
              </span>
            </div>

            <div className="mt-1 flex items-center space-x-4">
              <p className="text-xs text-gray-500">{formatTimestamp}</p>
              <p className="text-xs text-gray-500">
                {scan.metadata.pointCount.toLocaleString()} points
              </p>
              <p className="text-xs text-gray-500">
                Duration: {formatDuration}
              </p>
              {scan.metadata.roomId && (
                <p className="text-xs text-blue-600">
                  Room: {scan.metadata.roomId}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="ml-4 flex-shrink-0">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
});

CleanLiDARScanItem.displayName = 'CleanLiDARScanItem';

// Simple list component without virtualization for better lint compliance
export const CleanLiDARList: React.FC<CleanLiDARListProps> = ({
  data,
  onItemClick,
  className = '',
  maxItems = 100,
}) => {
  const { recordMemoryUsage } = usePerformanceMetrics();

  // Limit items for performance
  const displayData = useMemo(() => {
    return data.slice(0, maxItems);
  }, [data, maxItems]);

  // Record memory usage periodically
  React.useEffect(() => {
    const interval = setInterval(recordMemoryUsage, 5000);
    return () => clearInterval(interval);
  }, [recordMemoryUsage]);

  if (data.length === 0) {
    return (
      <div className={`lidar-empty-state ${className}`}>
        <div>
          <svg
            className="h-12 w-12 text-gray-400 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No LiDAR scans
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Start a scan to see data appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-gray-300 overflow-hidden rounded-lg border ${className}`}
    >
      <ul>
        {displayData.map((item, index) => (
          <li key={item.id}>
            <CleanLiDARScanItem
              scan={item}
              index={index}
              onClick={onItemClick}
            />
          </li>
        ))}
      </ul>

      {data.length > maxItems && (
        <div className="border-t p-4 text-center text-sm text-gray-500">
          Showing {maxItems} of {data.length} scans.
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 ml-2"
            onClick={() => {
              // Could implement pagination or load more functionality
              console.log('Load more requested');
            }}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
};

// LiDAR data summary component
export const LiDARDataSummary: React.FC<{
  data: LiDARScanData[];
  className?: string;
}> = ({ data, className = '' }) => {
  const stats = useMemo(() => {
    if (data.length === 0) {
      return { totalScans: 0, totalPoints: 0, avgAccuracy: 0, avgDuration: 0 };
    }

    const totalPoints = data.reduce(
      (sum, scan) => sum + scan.metadata.pointCount,
      0
    );
    const avgAccuracy =
      data.reduce((sum, scan) => sum + scan.metadata.accuracy, 0) / data.length;
    const avgDuration =
      data.reduce((sum, scan) => sum + scan.metadata.duration, 0) / data.length;

    return {
      totalScans: data.length,
      totalPoints,
      avgAccuracy,
      avgDuration,
    };
  }, [data]);

  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm ${className}`}>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Data Summary</h3>
      <div className="md:grid-cols-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-blue-600 text-2xl font-bold">
            {stats.totalScans}
          </div>
          <div className="text-gray-600 text-sm">Total Scans</div>
        </div>
        <div className="text-center">
          <div className="text-green-600 text-2xl font-bold">
            {stats.totalPoints.toLocaleString()}
          </div>
          <div className="text-gray-600 text-sm">Total Points</div>
        </div>
        <div className="text-center">
          <div className="text-purple-600 text-2xl font-bold">
            {(stats.avgAccuracy * 100).toFixed(1)}%
          </div>
          <div className="text-gray-600 text-sm">Avg Accuracy</div>
        </div>
        <div className="text-center">
          <div className="text-orange-600 text-2xl font-bold">
            {stats.avgDuration.toFixed(1)}ms
          </div>
          <div className="text-gray-600 text-sm">Avg Duration</div>
        </div>
      </div>
    </div>
  );
};

export const LiDARPointCloudViewer: React.FC<{
  data: LiDARDataPoint[];
  width?: number;
  height?: number;
  className?: string;
}> = ({ data, width: _width = 800, height: _height = 600, className = '' }) => {
  const pointCount = data.length;

  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm ${className}`}>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Point Cloud Viewer
      </h3>
      <div className="h-96 flex w-full items-center justify-center rounded-lg border bg-gray-100">
        <div className="text-gray-600 text-center">
          <div className="text-lg font-medium">
            {pointCount.toLocaleString()} Points
          </div>
          <div className="text-sm">3D Visualization Coming Soon</div>
        </div>
      </div>
    </div>
  );
};

export default CleanLiDARList;
