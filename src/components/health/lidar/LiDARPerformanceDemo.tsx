/**
 * LiDAR Performance Demo
 * Demonstrates all performance optimization features working together
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  PerformanceUtils,
  useBatchProcessor,
  useOptimizedDataFetch,
  useOptimizedWebSocket,
  usePerformanceCache,
  usePerformanceMonitor,
} from '../../../lib/performance/LiDARPerformanceHooks';
import type { LiDARDataPoint, LiDARScanData } from './SimpleLiDARComponents';
import {
  LiDARDataSummary,
  LiDARPointCloudViewer,
  SimpleLiDARList,
} from './SimpleLiDARComponents';

// Mock data generator for demonstration
const generateMockLiDARData = (count: number): LiDARScanData[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `scan-${i + 1}`,
    timestamp: Date.now() - i * 60000, // One scan per minute
    points: Array.from(
      { length: Math.floor(Math.random() * 1000) + 500 },
      (_, j) => ({
        id: `point-${i}-${j}`,
        timestamp: Date.now(),
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10,
        z: Math.random() * 3,
        intensity: Math.random() * 255,
        classification: ['floor', 'wall', 'furniture', 'person'][
          Math.floor(Math.random() * 4)
        ],
        confidence: 0.7 + Math.random() * 0.3,
      })
    ),
    metadata: {
      duration: 2000 + Math.random() * 3000,
      pointCount: Math.floor(Math.random() * 1000) + 500,
      accuracy: 0.6 + Math.random() * 0.4,
      roomId: ['living-room', 'bedroom', 'kitchen'][
        Math.floor(Math.random() * 3)
      ],
    },
  }));
};

export const LiDARPerformanceDemo: React.FC = () => {
  const [scanData, setScanData] = useState<LiDARScanData[]>([]);
  const [selectedScan, setSelectedScan] = useState<LiDARScanData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Performance monitoring
  const { metrics, measureRender, recordMemoryUsage, recordProcessingTime } =
    usePerformanceMonitor();

  // Data caching with 5-minute TTL
  const dataCache = usePerformanceCache<LiDARScanData[]>(300000);

  // Batch processing for high-throughput data
  const { addToBatch, queueLength } = useBatchProcessor<
    LiDARDataPoint,
    LiDARDataPoint
  >(
    (batch) => {
      // Mock processing - in real app, this would be actual data processing
      const startTime = performance.now();
      const processed = batch.map((point) => ({
        ...point,
        processed: true,
      }));
      const processingTime = performance.now() - startTime;
      recordProcessingTime(processingTime);
      return processed as LiDARDataPoint[];
    },
    { batchSize: 100, processingDelay: 50 }
  );

  // Optimized data fetching
  const {
    data: remoteData,
    loading,
    refetch,
  } = useOptimizedDataFetch('lidar-scans', async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return generateMockLiDARData(25);
  });

  // WebSocket for real-time updates (mock connection)
  const { connectionState, send } = useOptimizedWebSocket(
    'ws://localhost:3001/lidar',
    {
      onMessage: (data) => {
        console.log('Received LiDAR update:', data);
        // In real app, would update scan data here
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
      },
    }
  );

  // Initialize data
  useEffect(() => {
    const cached = dataCache.get('initial-data');
    if (cached) {
      setScanData(cached);
    } else if (remoteData) {
      setScanData(remoteData);
      dataCache.set('initial-data', remoteData);
    }
  }, [remoteData, dataCache]);

  // Simulate real-time data processing
  useEffect(() => {
    if (scanData.length > 0 && !isProcessing) {
      setIsProcessing(true);

      // Add points to batch processor
      const allPoints = scanData.flatMap((scan) => scan.points);
      addToBatch(allPoints.slice(0, 500), (processed) => {
        console.log(`Processed ${processed.length} points`);
        setIsProcessing(false);
      });
    }
  }, [scanData, isProcessing, addToBatch]);

  // Record memory usage periodically
  useEffect(() => {
    const interval = setInterval(recordMemoryUsage, 10000);
    return () => clearInterval(interval);
  }, [recordMemoryUsage]);

  // Handle scan selection with performance measurement
  const handleScanClick = PerformanceUtils.measureFunction(
    (scan: LiDARScanData) => {
      setSelectedScan(scan);
      send({ type: 'scan_selected', scanId: scan.id });
    },
    'handleScanClick'
  );

  // Memoized components for performance
  const performanceStats = useMemo(
    () => (
      <div className="bg-gray-50 mb-6 rounded-lg p-4">
        <h3 className="mb-3 text-lg font-medium text-gray-900">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
          <div>
            <div className="text-gray-600 font-medium">Render Time</div>
            <div className="text-blue-600 text-lg font-bold">
              {metrics.renderTime.toFixed(2)}ms
            </div>
          </div>
          <div>
            <div className="text-gray-600 font-medium">Memory Usage</div>
            <div className="text-green-600 text-lg font-bold">
              {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
            </div>
          </div>
          <div>
            <div className="text-gray-600 font-medium">Processing Time</div>
            <div className="text-purple-600 text-lg font-bold">
              {metrics.dataProcessingTime.toFixed(2)}ms
            </div>
          </div>
          <div>
            <div className="text-gray-600 font-medium">Cache Hit Rate</div>
            <div className="text-orange-600 text-lg font-bold">
              {metrics.cacheHitRate.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-gray-200 border-t">
          <div className="text-xs text-gray-600 flex items-center justify-between">
            <span>WebSocket: {connectionState}</span>
            <span>Processing Queue: {queueLength} items</span>
            <span>Cache Status: Active</span>
          </div>
        </div>
      </div>
    ),
    [metrics, connectionState, queueLength]
  );

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin border-blue-600 mx-auto h-8 w-8 rounded-full border-b-2"></div>
          <p className="text-gray-600 mt-2 text-sm">Loading LiDAR data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          LiDAR Performance Optimization Demo
        </h2>
        <div className="space-x-3 flex">
          <button
            type="button"
            onClick={refetch}
            className="bg-blue-600 hover:bg-blue-700 rounded-md px-4 py-2 text-sm text-white transition-colors"
          >
            Refresh Data
          </button>
          <button
            type="button"
            onClick={() => {
              measureRender('generateNewData', () => {
                const newData = generateMockLiDARData(10);
                setScanData((prev) => [...newData, ...prev].slice(0, 50));
                dataCache.set('initial-data', scanData);
              });
            }}
            className="bg-green-600 hover:bg-green-700 rounded-md px-4 py-2 text-sm text-white transition-colors"
          >
            Generate New Scans
          </button>
        </div>
      </div>

      {performanceStats}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <LiDARDataSummary data={scanData} />

          <div className="mt-6">
            <h3 className="mb-3 text-lg font-medium text-gray-900">
              Recent Scans ({scanData.length})
            </h3>
            <SimpleLiDARList
              data={scanData}
              onItemClick={handleScanClick}
              maxItems={20}
              className="h-96"
            />
          </div>
        </div>

        <div>
          {selectedScan ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-white p-4 shadow">
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Selected Scan: {selectedScan.id}
                </h3>
                <div className="text-gray-600 space-y-1 text-sm">
                  <p>
                    Points: {selectedScan.metadata.pointCount.toLocaleString()}
                  </p>
                  <p>
                    Accuracy:{' '}
                    {(selectedScan.metadata.accuracy * 100).toFixed(1)}%
                  </p>
                  <p>
                    Duration:{' '}
                    {(selectedScan.metadata.duration / 1000).toFixed(1)}s
                  </p>
                  <p>
                    Time: {new Date(selectedScan.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <LiDARPointCloudViewer
                data={selectedScan.points}
                className="w-full"
              />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-gray-400 text-4xl mb-2">📊</div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Select a Scan
              </h3>
              <p className="text-gray-600 text-sm">
                Click on a scan from the list to view details and 3D
                visualization
              </p>
            </div>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="bg-blue-50 border-blue-200 rounded-lg border p-4">
          <div className="flex items-center">
            <div className="animate-spin border-blue-600 mr-3 h-4 w-4 rounded-full border-b-2"></div>
            <span className="text-blue-800 text-sm">
              Processing LiDAR data in batches... Queue: {queueLength} items
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiDARPerformanceDemo;
