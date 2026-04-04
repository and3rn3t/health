/**
 * Sensor Data Visualization Component
 * Real-time visualization of sensor data for fall detection monitoring
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Gauge, Heart, Navigation } from 'lucide-react';
import React from 'react';
import type { EnhancedSensorData } from '@/lib/enhanced-fall-detection-engine';

interface SensorDataVisualizationProps {
  sensorData: EnhancedSensorData;
  showHistory?: boolean;
  historyLength?: number;
}

interface SensorDataPoint {
  timestamp: number;
  data: EnhancedSensorData;
}

export default function SensorDataVisualization({
  sensorData,
  showHistory = false,
  historyLength = 50,
}: SensorDataVisualizationProps) {
  const [history, setHistory] = React.useState<SensorDataPoint[]>([]);

  // Update history when new sensor data arrives
  React.useEffect(() => {
    if (showHistory) {
      setHistory((prev) => {
        const newHistory = [
          { timestamp: sensorData.timestamp, data: sensorData },
          ...prev,
        ].slice(0, historyLength);
        return newHistory;
      });
    }
  }, [sensorData, showHistory, historyLength]);

  // Calculate derived metrics
  const metrics = React.useMemo(() => {
    const accel = sensorData.accelerometer;
    const gyro = sensorData.gyroscope;

    // Calculate motion intensity
    const motionIntensity = Math.sqrt(
      accel.magnitude ** 2 + gyro.magnitude ** 2
    );

    // Calculate stability score (lower is more stable)
    const stabilityScore = Math.abs(accel.x) + Math.abs(accel.y) + Math.abs(accel.z);

    // Detect potential fall indicators
    const impactDetected = accel.magnitude > 3.0; // High acceleration
    const orientationChange = gyro.magnitude > 2.0; // Rapid rotation
    const heartRateSpike = sensorData.heartRate > 100; // Elevated heart rate

    return {
      motionIntensity,
      stabilityScore,
      impactDetected,
      orientationChange,
      heartRateSpike,
      overallRisk: impactDetected && orientationChange ? 'high' :
                   impactDetected || orientationChange ? 'moderate' : 'low',
    };
  }, [sensorData]);

  // Render real-time gauge
  const renderGauge = (label: string, value: number, max: number, unit: string) => {
    const percentage = Math.min((value / max) * 100, 100);
    const color = percentage > 80 ? '#dc2626' : percentage > 60 ? '#ea580c' : '#16a34a';

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-gray-600">
            {value.toFixed(2)} {unit}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    );
  };

  // Render mini chart for history
  const renderMiniChart = (dataKey: keyof EnhancedSensorData, label: string) => {
    if (!showHistory || history.length === 0) return null;

    const width = 200;
    const height = 40;
    const padding = 5;

    let values: number[] = [];
    if (dataKey === 'accelerometer') {
      values = history.map((h) => h.data.accelerometer.magnitude);
    } else if (dataKey === 'gyroscope') {
      values = history.map((h) => h.data.gyroscope.magnitude);
    } else if (dataKey === 'heartRate') {
      values = history.map((h) => h.data.heartRate);
    }

    if (values.length === 0) return null;

    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const points = values.map((val, i) => {
      const x = padding + (i / (values.length - 1 || 1)) * (width - padding * 2);
      const y = padding + (height - padding * 2) - ((val - min) / range) * (height - padding * 2);
      return { x, y };
    });

    const pathData = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    return (
      <div className="space-y-1">
        <div className="text-xs text-gray-500">{label}</div>
        <svg width={width} height={height} className="w-full">
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Accelerometer Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="h-5 w-5" />
            Accelerometer
          </CardTitle>
          <CardDescription>Motion and impact detection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {sensorData.accelerometer.x.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">X-axis (g)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {sensorData.accelerometer.y.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Y-axis (g)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {sensorData.accelerometer.z.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Z-axis (g)</div>
            </div>
          </div>
          {renderGauge(
            'Magnitude',
            sensorData.accelerometer.magnitude,
            5.0,
            'g'
          )}
          {metrics.impactDetected && (
            <Badge variant="destructive" className="w-full justify-center">
              ⚠️ High Impact Detected
            </Badge>
          )}
          {showHistory && renderMiniChart('accelerometer', 'Acceleration History')}
        </CardContent>
      </Card>

      {/* Gyroscope Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Navigation className="h-5 w-5" />
            Gyroscope
          </CardTitle>
          <CardDescription>Rotation and orientation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {sensorData.gyroscope.x.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">X-axis (°/s)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {sensorData.gyroscope.y.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Y-axis (°/s)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {sensorData.gyroscope.z.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Z-axis (°/s)</div>
            </div>
          </div>
          {renderGauge(
            'Magnitude',
            sensorData.gyroscope.magnitude,
            5.0,
            '°/s'
          )}
          {metrics.orientationChange && (
            <Badge variant="destructive" className="w-full justify-center">
              ⚠️ Rapid Rotation Detected
            </Badge>
          )}
          {showHistory && renderMiniChart('gyroscope', 'Rotation History')}
        </CardContent>
      </Card>

      {/* Physiological Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5" />
            Physiological
          </CardTitle>
          <CardDescription>Heart rate and variability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {sensorData.heartRate}
              </div>
              <div className="text-xs text-gray-500">Heart Rate (bpm)</div>
              {metrics.heartRateSpike && (
                <Badge variant="destructive" className="mt-2">
                  Elevated
                </Badge>
              )}
            </div>
            {sensorData.heartRateVariability && (
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {sensorData.heartRateVariability.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">HRV (ms)</div>
              </div>
            )}
          </div>
          {showHistory && renderMiniChart('heartRate', 'Heart Rate History')}
        </CardContent>
      </Card>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Overall Status
          </CardTitle>
          <CardDescription>Current monitoring status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Motion Intensity</span>
                <span>{metrics.motionIntensity.toFixed(2)}</span>
              </div>
              {renderGauge('', metrics.motionIntensity, 10.0, '')}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Stability Score</span>
                <span>{metrics.stabilityScore.toFixed(2)}</span>
              </div>
              {renderGauge('', metrics.stabilityScore, 5.0, '')}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Sensor Confidence</span>
                <span>{Math.round(sensorData.confidence * 100)}%</span>
              </div>
              {renderGauge('', sensorData.confidence, 1.0, '')}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="mb-2 text-sm font-medium">Current Risk Level</div>
            <Badge
              variant={
                metrics.overallRisk === 'high'
                  ? 'destructive'
                  : metrics.overallRisk === 'moderate'
                    ? 'default'
                    : 'secondary'
              }
              className="w-full justify-center py-2"
            >
              {metrics.overallRisk.toUpperCase()}
            </Badge>
          </div>
          {sensorData.postureOrientation && (
            <div className="rounded-lg border p-3">
              <div className="mb-1 text-sm font-medium">Posture</div>
              <div className="text-lg capitalize">
                {sensorData.postureOrientation}
              </div>
            </div>
          )}
          {sensorData.activityType && (
            <div className="rounded-lg border p-3">
              <div className="mb-1 text-sm font-medium">Activity</div>
              <div className="text-lg capitalize">{sensorData.activityType}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
