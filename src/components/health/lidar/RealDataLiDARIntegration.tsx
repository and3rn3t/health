/**
 * Real LiDAR Data Integration System
 * Connects actual sensor data to the clean LiDAR components
 */

import React, { useEffect, useState } from 'react';
import { WS_TIMING } from '@/lib/motion-tokens';
import type { LiDARScanData } from './CleanLiDARComponents';
import { useCleanLiDARPerformance } from './index';

// Connection status type
export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

// Real data stream interface
export interface RealLiDARDataStream {
  deviceId: string;
  timestamp: number;
  sensorType: 'iPhone_14_Pro' | 'iPad_Pro_M2' | 'external_lidar';
  rawPointCloud: Float32Array;
  processedMetrics: HealthMetrics;
  accuracy: number;
  environmentalContext: string;
}

export interface HealthMetrics {
  gaitStability: number;
  postureScore: number;
  fallRiskLevel: 'low' | 'medium' | 'high';
  movementConfidence: number;
  environmentalSafety: number;
}

// WebSocket connection for real-time data
class RealLiDARDataManager {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = WS_TIMING.reconnectDelay;

  constructor(
    private onDataReceived: (data: RealLiDARDataStream) => void,
    private onStatusChange: (status: ConnectionStatus) => void
  ) {}

  connect(endpoint = 'ws://localhost:3001/lidar-stream'): void {
    try {
      this.socket = new WebSocket(endpoint);

      this.socket.onopen = () => {
        console.log('✅ Real LiDAR data stream connected');
        this.onStatusChange('connected');
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data: RealLiDARDataStream = JSON.parse(event.data);
          this.validateData(data);
          this.onDataReceived(data);
        } catch (error) {
          console.error('❌ Invalid LiDAR data received:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('🔌 LiDAR data stream disconnected');
        this.onStatusChange('disconnected');
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('❌ LiDAR WebSocket error:', error);
        this.onStatusChange('error');
      };
    } catch (error) {
      console.error('❌ Failed to connect to LiDAR stream:', error);
      this.onStatusChange('error');
    }
  }

  private validateData(data: RealLiDARDataStream): void {
    if (!data.deviceId || !data.timestamp || !data.rawPointCloud) {
      throw new Error('Invalid LiDAR data structure');
    }

    if (data.accuracy < 0.5) {
      console.warn('⚠️ Low accuracy LiDAR data:', data.accuracy);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting... attempt ${this.reconnectAttempts}`);

      setTimeout(
        () => {
          this.connect();
        },
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      );
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// Convert real data to our clean component format
const convertToLiDARScanData = (
  realData: RealLiDARDataStream
): LiDARScanData => {
  return {
    id: `real-${realData.deviceId}-${realData.timestamp}`,
    timestamp: realData.timestamp,
    points: [], // Would convert rawPointCloud to our point format
    metadata: {
      duration: 50, // Estimated from real processing
      pointCount: realData.rawPointCloud.length / 3, // 3 values per point (x,y,z)
      accuracy: realData.accuracy,
      roomId: realData.environmentalContext,
    },
  };
};

// Enhanced LiDAR integration with real data support
export const RealDataLiDARIntegration: React.FC<{
  enableRealData?: boolean;
  fallbackToMock?: boolean;
  className?: string;
}> = ({ enableRealData = true, fallbackToMock = true, className = '' }) => {
  const { measureRender } = useCleanLiDARPerformance();
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const [realDataStream, setRealDataStream] =
    useState<RealLiDARDataStream | null>(null);
  const [scanHistory, setScanHistory] = useState<LiDARScanData[]>([]);
  const [dataSource, setDataSource] = useState<'real' | 'mock'>('mock');

  // Real data manager
  const [dataManager] = useState(
    () =>
      new RealLiDARDataManager((data: RealLiDARDataStream) => {
        measureRender('real-data-processing', () => {
          setRealDataStream(data);
          const scanData = convertToLiDARScanData(data);
          setScanHistory((prev) => [scanData, ...prev.slice(0, 9)]); // Keep last 10
          setDataSource('real');
        });
      }, setConnectionStatus)
  );

  // Connect to real data stream
  useEffect(() => {
    if (enableRealData) {
      dataManager.connect();
      return () => dataManager.disconnect();
    }
  }, [enableRealData, dataManager]);

  // Fallback to mock data if real data unavailable
  useEffect(() => {
    if (fallbackToMock && connectionStatus !== 'connected') {
      const interval = setInterval(() => {
        const mockData: RealLiDARDataStream = {
          deviceId: 'mock-device-001',
          timestamp: Date.now(),
          sensorType: 'iPhone_14_Pro',
          rawPointCloud: new Float32Array(15000), // Mock point cloud
          processedMetrics: { // NOSONAR: Mock fallback data - Math.random() acceptable
            gaitStability: 0.85 + Math.random() * 0.1, // NOSONAR
            postureScore: 0.82 + Math.random() * 0.15, // NOSONAR
            fallRiskLevel: Math.random() > 0.8 ? 'medium' : 'low', // NOSONAR
            movementConfidence: 0.9 + Math.random() * 0.1, // NOSONAR
            environmentalSafety: 0.95,
          },
          accuracy: 0.95 + Math.random() * 0.05, // NOSONAR
          environmentalContext: 'living-room',
        };

        const scanData = convertToLiDARScanData(mockData);
        setScanHistory((prev) => [scanData, ...prev.slice(0, 9)]);
        setDataSource('mock');
      }, 3000); // Update every 3 seconds

      return () => clearInterval(interval);
    }
  }, [fallbackToMock, connectionStatus]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Data Source Status</h3>
          <div className="flex items-center space-x-4">
            <ConnectionStatusBadge status={connectionStatus} />
            <div className="text-gray-600 text-sm">
              Source: {dataSource === 'real' ? 'Live Sensors' : 'Mock Data'}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Health Metrics */}
      {realDataStream && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">
            Real-time Health Metrics
          </h3>
          <div className="md:grid-cols-5 grid grid-cols-2 gap-4">
            <MetricCard
              label="Gait Stability"
              value={realDataStream.processedMetrics.gaitStability}
              format="percentage"
            />
            <MetricCard
              label="Posture Score"
              value={realDataStream.processedMetrics.postureScore}
              format="percentage"
            />
            <MetricCard
              label="Fall Risk"
              value={realDataStream.processedMetrics.fallRiskLevel}
              format="risk"
            />
            <MetricCard
              label="Movement Confidence"
              value={realDataStream.processedMetrics.movementConfidence}
              format="percentage"
            />
            <MetricCard
              label="Data Accuracy"
              value={realDataStream.accuracy}
              format="percentage"
            />
          </div>
        </div>
      )}

      {/* Recent Scans */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">
          Recent Scans ({scanHistory.length})
        </h3>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {scanHistory.map((scan, index) => (
            <div
              key={scan.id}
              className="p-3 bg-gray-50 flex items-center justify-between rounded"
            >
              <div>
                <div className="text-sm font-medium">
                  {new Date(scan.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-xs text-gray-600">
                  {scan.metadata.pointCount.toLocaleString()} points •{' '}
                  {scan.metadata.accuracy * 100}% accuracy
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {index === 0 && dataSource === 'real' ? '🔴 LIVE' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Quality Indicators */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Data Quality</h3>
        <div className="md:grid-cols-3 grid grid-cols-1 gap-4">
          <div className="text-center">
            <div className="text-blue-600 text-2xl font-bold">
              {connectionStatus === 'connected' ? '✓' : '⚠'}
            </div>
            <div className="text-gray-600 text-sm">Connection</div>
          </div>
          <div className="text-center">
            <div className="text-green-600 text-2xl font-bold">
              {scanHistory.length}
            </div>
            <div className="text-gray-600 text-sm">Scans Collected</div>
          </div>
          <div className="text-center">
            <div className="text-purple-600 text-2xl font-bold">
              {realDataStream
                ? (realDataStream.accuracy * 100).toFixed(1) + '%'
                : 'N/A'}
            </div>
            <div className="text-gray-600 text-sm">Average Accuracy</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for connection status
const ConnectionStatusBadge: React.FC<{
  status: ConnectionStatus;
}> = ({ status }) => {
  const getStatusStyles = () => {
    if (status === 'connected')
      return {
        bg: 'bg-green-100 text-green-800',
        dot: 'bg-green-500',
        text: 'Real Data',
      };
    if (status === 'error')
      return {
        bg: 'bg-red-100 text-red-800',
        dot: 'bg-red-500',
        text: 'Connection Error',
      };
    return {
      bg: 'bg-yellow-100 text-yellow-800',
      dot: 'bg-yellow-500',
      text: 'Disconnected',
    };
  };

  const styles = getStatusStyles();

  return (
    <div
      className={`px-3 flex items-center rounded-full py-1 text-sm ${styles.bg}`}
    >
      <div className={`mr-2 h-2 w-2 rounded-full ${styles.dot}`} />
      {styles.text}
    </div>
  );
};

// Helper component for metric display
const MetricCard: React.FC<{
  label: string;
  value: number | string;
  format: 'percentage' | 'risk';
}> = ({ label, value, format }) => {
  const displayValue =
    format === 'percentage' && typeof value === 'number'
      ? `${(value * 100).toFixed(1)}%`
      : value;

  const getRiskColor = (risk: string) => {
    if (risk === 'low') return 'text-green-600';
    if (risk === 'medium') return 'text-yellow-600';
    return 'text-red-600';
  };

  const colorClass =
    format === 'risk' ? getRiskColor(value as string) : 'text-blue-600';

  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${colorClass}`}>{displayValue}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
};

export default RealDataLiDARIntegration;
