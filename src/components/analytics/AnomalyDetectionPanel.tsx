/**
 * Anomaly Detection Panel Component
 * Identifies and visualizes anomalies in health data
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useMemo } from 'react';
import type { ProcessedHealthData } from '@/lib/healthDataProcessor';
import type { AnomalyDetection, Anomaly } from '@/lib/analytics';
import { detectAnomalies, extractTimeSeries } from '@/lib/analytics';

interface AnomalyDetectionPanelProps {
  healthData: ProcessedHealthData;
  metric: 'steps' | 'heartRate' | 'walkingSteadiness' | 'sleepHours';
  threshold?: number;
}

export default function AnomalyDetectionPanel({
  healthData,
  metric,
  threshold = 2.5,
}: AnomalyDetectionPanelProps) {
  const anomalyDetection = useMemo(() => {
    const metricData = healthData.metrics[metric];
    if (!metricData) {
      return {
        anomalies: [],
        anomalyScore: 0,
        normalRange: { min: 0, max: 0 },
      };
    }

    const timeSeries = extractTimeSeries(metricData);
    return detectAnomalies(timeSeries, threshold);
  }, [healthData, metric, threshold]);

  const getSeverityColor = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: Anomaly['type']) => {
    switch (type) {
      case 'spike':
        return <TrendingUp className="h-4 w-4" />;
      case 'drop':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Anomaly Detection - {metric.replace(/([A-Z])/g, ' $1').trim()}
        </CardTitle>
        <CardDescription>
          Unusual patterns and outliers in your health data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold">
              {anomalyDetection.anomalies.length}
            </div>
            <div className="text-xs text-gray-500">Anomalies</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold">
              {(anomalyDetection.anomalyScore * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Anomaly Score</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-sm font-semibold">
              {anomalyDetection.normalRange.min.toFixed(1)} -{' '}
              {anomalyDetection.normalRange.max.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Normal Range</div>
          </div>
        </div>

        {/* Anomaly Score Indicator */}
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>Anomaly Score</span>
            <span>
              {anomalyDetection.anomalyScore < 0.2
                ? 'Low'
                : anomalyDetection.anomalyScore < 0.5
                  ? 'Moderate'
                  : 'High'}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full transition-all ${
                anomalyDetection.anomalyScore < 0.2
                  ? 'bg-green-500'
                  : anomalyDetection.anomalyScore < 0.5
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${anomalyDetection.anomalyScore * 100}%` }}
            />
          </div>
        </div>

        {/* Anomalies List */}
        {anomalyDetection.anomalies.length > 0 ? (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Detected Anomalies</h4>
            {anomalyDetection.anomalies
              .sort((a, b) => b.deviation - a.deviation)
              .slice(0, 10)
              .map((anomaly, i) => (
                <Alert
                  key={i}
                  className={`border ${
                    anomaly.severity === 'critical'
                      ? 'border-red-500 bg-red-50'
                      : anomaly.severity === 'high'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-yellow-500 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {getTypeIcon(anomaly.type)}
                        <span className="font-medium capitalize">
                          {anomaly.type} - {anomaly.severity}
                        </span>
                        <Badge
                          className={getSeverityColor(anomaly.severity)}
                          variant="default"
                        >
                          {anomaly.deviation.toFixed(1)}σ
                        </Badge>
                      </div>
                      <AlertDescription className="text-sm">
                        <div>
                          <strong>Date:</strong> {anomaly.date.toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Value:</strong> {anomaly.value.toFixed(1)} (expected{' '}
                          {anomaly.expectedValue.toFixed(1)})
                        </div>
                        <div className="mt-1 text-xs">{anomaly.explanation}</div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-green-50 p-4 text-center text-green-800">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
            <p className="font-medium">No anomalies detected</p>
            <p className="text-sm">
              Your {metric} data appears to be within normal ranges
            </p>
          </div>
        )}

        {/* Interpretation */}
        {anomalyDetection.anomalyScore > 0.3 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>High anomaly score detected.</strong> Consider reviewing these
              anomalies as they may indicate:
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                <li>Changes in activity patterns</li>
                <li>Health events or interventions</li>
                <li>Data quality issues</li>
                <li>Measurement errors</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
