/**
 * Enhanced Health Data Upload Component
 * Demonstrates the new processing capabilities with real-time analytics
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type {
  HealthMetric,
  HealthMetricType,
  ProcessedHealthData,
} from '@/schemas/health';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Heart,
  Shield,
  Target,
  TrendingUp,
  Upload,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface AnalyticsResponse {
  ok: boolean;
  analytics: {
    totalDataPoints: number;
    last24Hours: number;
    last7Days: number;
    averageHealthScore: number;
    alerts: {
      critical: number;
      warning: number;
      total: number;
    };
    fallRiskDistribution: {
      low: number;
      moderate: number;
      high: number;
      critical: number;
    };
    metricTypes: string[];
    dataQualityScore: number;
    lastUpdated: string | null;
  } | null;
}

interface ProcessingResponse {
  ok: boolean;
  data: ProcessedHealthData;
  analytics: {
    healthScore?: number;
    fallRisk?: string;
    anomalyScore?: number;
    dataQuality?: {
      completeness: number;
      accuracy: number;
      timeliness: number;
      consistency: number;
    };
    alert?: {
      level: string;
      message: string;
      actionRequired?: boolean;
    } | null;
  };
}

const METRIC_TYPES: {
  value: HealthMetricType;
  label: string;
  icon: React.ReactNode;
  unit: string;
}[] = [
  {
    value: 'heart_rate',
    label: 'Heart Rate',
    icon: <Heart className="h-4 w-4" />,
    unit: 'bpm',
  },
  {
    value: 'walking_steadiness',
    label: 'Walking Steadiness',
    icon: <Activity className="h-4 w-4" />,
    unit: '%',
  },
  {
    value: 'steps',
    label: 'Steps',
    icon: <Target className="h-4 w-4" />,
    unit: 'count',
  },
  {
    value: 'oxygen_saturation',
    label: 'Oxygen Saturation',
    icon: <Activity className="h-4 w-4" />,
    unit: '%',
  },
  {
    value: 'sleep_hours',
    label: 'Sleep Hours',
    icon: <Clock className="h-4 w-4" />,
    unit: 'hours',
  },
  {
    value: 'body_weight',
    label: 'Body Weight',
    icon: <BarChart3 className="h-4 w-4" />,
    unit: 'kg',
  },
];

export function EnhancedHealthDataUpload() {
  const [selectedMetric, setSelectedMetric] =
    useState<HealthMetricType>('heart_rate');
  const [metricValue, setMetricValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessed, setLastProcessed] = useState<ProcessingResponse | null>(
    null
  );

  // Get user analytics
  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['health-analytics', 'test-user-123'],
    queryFn: async (): Promise<AnalyticsResponse> => {
      const response = await fetch('/api/health-data/analytics/test-user-123');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Process single health metric
  const processMutation = useMutation({
    mutationFn: async (metric: HealthMetric): Promise<ProcessingResponse> => {
      const response = await fetch('/api/health-data/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
      if (!response.ok) throw new Error('Processing failed');
      return response.json();
    },
    onSuccess: (data) => {
      setLastProcessed(data);
      refetchAnalytics();
      toast.success('Health metric processed successfully!');
    },
    onError: (error) => {
      toast.error(`Processing failed: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricValue.trim()) return;

    const selectedMetricConfig = METRIC_TYPES.find(
      (m) => m.value === selectedMetric
    );
    const value = parseFloat(metricValue);

    if (isNaN(value)) {
      toast.error('Please enter a valid number');
      return;
    }

    setIsProcessing(true);

    const metric: HealthMetric = {
      type: selectedMetric,
      value,
      unit: selectedMetricConfig?.unit || '',
      timestamp: new Date().toISOString(),
      deviceId: 'demo-device-001',
      userId: 'test-user-123',
      source: 'Manual Entry',
      confidence: 0.95,
    };

    try {
      await processMutation.mutateAsync(metric);
      setMetricValue('');
    } finally {
      setIsProcessing(false);
    }
  };

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-200';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getFallRiskColor = (risk?: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertColor = (level?: string) => {
    switch (level) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'emergency':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Submit Health Data
            </CardTitle>
            <CardDescription>
              Enter health metrics for enhanced processing and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metric-type">Metric Type</Label>
                <Select
                  value={selectedMetric}
                  onValueChange={(value) =>
                    setSelectedMetric(value as HealthMetricType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric type" />
                  </SelectTrigger>
                  <SelectContent>
                    {METRIC_TYPES.map((metric) => (
                      <SelectItem key={metric.value} value={metric.value}>
                        <div className="flex items-center gap-2">
                          {metric.icon}
                          {metric.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metric-value">
                  Value (
                  {METRIC_TYPES.find((m) => m.value === selectedMetric)?.unit})
                </Label>
                <Input
                  id="metric-value"
                  type="number"
                  step="0.1"
                  value={metricValue}
                  onChange={(e) => setMetricValue(e.target.value)}
                  placeholder="Enter value"
                  disabled={isProcessing}
                />
              </div>

              <Button
                type="submit"
                disabled={isProcessing || !metricValue.trim()}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Process Health Data'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Real-time Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Health Analytics
            </CardTitle>
            <CardDescription>
              Real-time insights from your health data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.analytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      {analytics.analytics.totalDataPoints}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Total Data Points
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      {analytics.analytics.last24Hours}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Last 24 Hours
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Health Score</span>
                    <span className="text-sm">
                      {analytics.analytics.averageHealthScore}/100
                    </span>
                  </div>
                  <Progress
                    value={analytics.analytics.averageHealthScore}
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Quality</span>
                    <span className="text-sm">
                      {analytics.analytics.dataQualityScore}/100
                    </span>
                  </div>
                  <Progress
                    value={analytics.analytics.dataQualityScore}
                    className="h-2"
                  />
                </div>

                {analytics.analytics.alerts.total > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {analytics.analytics.alerts.critical} critical,{' '}
                      {analytics.analytics.alerts.warning} warning alerts
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap gap-1">
                  {analytics.analytics.metricTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                No analytics data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Processing Results */}
      {lastProcessed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Latest Processing Results
            </CardTitle>
            <CardDescription>
              Enhanced analytics for the most recent submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Health Score */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Health Score</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {lastProcessed.analytics.healthScore || 'N/A'}
                  </div>
                  <Progress
                    value={lastProcessed.analytics.healthScore || 0}
                    className={`h-2 ${getHealthScoreColor(lastProcessed.analytics.healthScore)}`}
                  />
                </div>
              </div>

              {/* Fall Risk */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Fall Risk</span>
                </div>
                <Badge
                  className={getFallRiskColor(lastProcessed.analytics.fallRisk)}
                >
                  {lastProcessed.analytics.fallRisk || 'Unknown'}
                </Badge>
              </div>

              {/* Anomaly Score */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Anomaly Score</span>
                </div>
                <div className="text-2xl font-bold">
                  {lastProcessed.analytics.anomalyScore
                    ? (lastProcessed.analytics.anomalyScore * 100).toFixed(1) +
                      '%'
                    : 'N/A'}
                </div>
              </div>
            </div>

            {/* Data Quality Breakdown */}
            {lastProcessed.analytics.dataQuality && (
              <div className="mt-6">
                <h4 className="mb-3 font-medium">Data Quality Assessment</h4>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {Object.entries(lastProcessed.analytics.dataQuality).map(
                    ([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="text-sm font-medium capitalize">
                          {key}
                        </div>
                        <div className="text-lg font-bold">{value}%</div>
                        <Progress value={value} className="h-1" />
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Alert */}
            {lastProcessed.analytics.alert && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <Badge
                    className={getAlertColor(
                      lastProcessed.analytics.alert.level
                    )}
                  >
                    {lastProcessed.analytics.alert.level}
                  </Badge>
                  <span className="ml-2">
                    {lastProcessed.analytics.alert.message}
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
