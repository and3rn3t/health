/**
 * Live Health Data Upload System
 * Enables real-time health data upload and simulation for development
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useKV } from '@/hooks/useCloudflareKV';
import type { ProcessedHealthData } from '@/types';
import {
  Activity,
  BarChart3,
  Clock,
  Database,
  Download,
  Heart,
  RefreshCw,
  Target,
  TrendingUp,
  Upload,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface LiveDataStream {
  isActive: boolean;
  interval: number; // milliseconds
  lastUpdate: string;
  metricsGenerated: number;
}

interface HealthDataUploadProps {
  onHealthDataUpdate?: (data: ProcessedHealthData) => void;
}

// Metric configuration for form inputs
const METRIC_CONFIGS = {
  steps: {
    label: 'Daily Steps',
    icon: Target,
    unit: 'steps',
    min: 0,
    max: 50000,
    defaultValue: 8000,
    realistic: { min: 2000, max: 20000 },
  },
  heartRate: {
    label: 'Heart Rate',
    icon: Heart,
    unit: 'bpm',
    min: 40,
    max: 200,
    defaultValue: 72,
    realistic: { min: 60, max: 100 },
  },
  sleepHours: {
    label: 'Sleep Hours',
    icon: Clock,
    unit: 'hours',
    min: 0,
    max: 24,
    defaultValue: 7.5,
    realistic: { min: 4, max: 12 },
  },
  walkingSteadiness: {
    label: 'Walking Steadiness',
    icon: Activity,
    unit: 'score',
    min: 0,
    max: 5,
    defaultValue: 3.2,
    realistic: { min: 1.5, max: 4.5 },
  },
  bodyWeight: {
    label: 'Body Weight',
    icon: BarChart3,
    unit: 'kg',
    min: 30,
    max: 300,
    defaultValue: 70,
    realistic: { min: 50, max: 120 },
  },
  distanceWalking: {
    label: 'Walking Distance',
    icon: TrendingUp,
    unit: 'km',
    min: 0,
    max: 50,
    defaultValue: 5.2,
    realistic: { min: 1, max: 15 },
  },
};

export function LiveHealthDataUpload({
  onHealthDataUpdate,
}: HealthDataUploadProps) {
  const [healthData, setHealthData] = useKV<ProcessedHealthData | null>(
    'health-data',
    null
  );
  const [liveStream, setLiveStream] = useState<LiveDataStream>({
    isActive: false,
    interval: 30000, // 30 seconds
    lastUpdate: '',
    metricsGenerated: 0,
  });

  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});
  const [selectedMetric, setSelectedMetric] =
    useState<keyof typeof METRIC_CONFIGS>('steps');
  const [bulkDataText, setBulkDataText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate realistic metric value with some variance
  const generateRealisticValue = useCallback(
    (metricType: keyof typeof METRIC_CONFIGS) => {
      const config = METRIC_CONFIGS[metricType];
      const { min, max } = config.realistic;
      const baseValue = min + Math.random() * (max - min);

      // Add some daily variance based on time of day
      const hour = new Date().getHours();
      let timeMultiplier = 1;

      switch (metricType) {
        case 'steps':
          // More steps during day hours
          timeMultiplier = hour >= 6 && hour <= 22 ? 1.2 : 0.3;
          break;
        case 'heartRate':
          // Slightly higher during day
          timeMultiplier = hour >= 7 && hour <= 23 ? 1.1 : 0.9;
          break;
        case 'sleepHours':
          // Sleep data typically recorded in morning
          timeMultiplier = hour >= 6 && hour <= 10 ? 1 : 0.1;
          break;
      }

      return Math.round(baseValue * timeMultiplier * 10) / 10;
    },
    []
  );

  // Update health data with new metric
  const updateHealthMetric = useCallback(
    (metricType: keyof ProcessedHealthData['metrics'], value: number) => {
      const timestamp = new Date().toISOString();

      setHealthData((prevData: ProcessedHealthData | null) => {
        const currentData = prevData || {
          healthScore: 75,
          lastUpdated: timestamp,
          dataQuality: {
            completeness: 85,
            consistency: 88,
            recency: 95,
            overall: 'good' as const,
          },
          metrics: {} as ProcessedHealthData['metrics'],
          insights: [] as string[],
          fallRiskFactors: [],
        };

        // Initialize metric if it doesn't exist
        if (!currentData.metrics[metricType]) {
          currentData.metrics[metricType] = {
            daily: [],
            weekly: [],
            monthly: [],
            average: value,
            lastValue: value,
            trend: 'stable' as const,
            variability: 5,
            reliability: 90,
            percentileRank: 50,
          };
        }

        // Update the metric
        const metric = currentData.metrics[metricType];
        const previousValue = metric.lastValue;

        // Determine trend
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (value > previousValue * 1.05) trend = 'increasing';
        else if (value < previousValue * 0.95) trend = 'decreasing';

        // Update daily data
        metric.daily.push({ date: timestamp, value });
        if (metric.daily.length > 30) metric.daily.shift(); // Keep last 30 days

        // Recalculate average
        const recentValues = metric.daily.slice(-7).map((d) => d.value); // Last 7 days
        metric.average =
          recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
        metric.lastValue = value;
        metric.trend = trend;

        // Update data quality based on frequency of updates
        const hoursAgo =
          (Date.now() - new Date(currentData.lastUpdated).getTime()) /
          (1000 * 60 * 60);
        const recency = Math.max(100 - hoursAgo * 2, 50); // Decrease 2 points per hour

        const updatedData = {
          ...currentData,
          healthScore: Math.round(
            (metric.average /
              METRIC_CONFIGS[metricType as keyof typeof METRIC_CONFIGS]
                ?.realistic.max) *
              100 || 75
          ),
          lastUpdated: timestamp,
          dataQuality: {
            ...currentData.dataQuality,
            recency: Math.round(recency),
            overall:
              recency > 90
                ? ('excellent' as const)
                : recency > 70
                  ? ('good' as const)
                  : ('fair' as const),
          },
          metrics: {
            ...currentData.metrics,
            [metricType]: metric,
          },
        };

        onHealthDataUpdate?.(updatedData);
        return updatedData;
      });

      toast.success(
        `${METRIC_CONFIGS[metricType as keyof typeof METRIC_CONFIGS]?.label} updated: ${value}${METRIC_CONFIGS[metricType as keyof typeof METRIC_CONFIGS]?.unit}`
      );
    },
    [setHealthData, onHealthDataUpdate]
  );

  // Live stream simulation
  useEffect(() => {
    if (!liveStream.isActive) return;

    const interval = setInterval(() => {
      // Randomly select a metric to update
      const metricTypes = Object.keys(METRIC_CONFIGS) as Array<
        keyof typeof METRIC_CONFIGS
      >;
      const randomMetric =
        metricTypes[Math.floor(Math.random() * metricTypes.length)];
      const value = generateRealisticValue(randomMetric);

      updateHealthMetric(randomMetric, value);

      setLiveStream((prev) => ({
        ...prev,
        lastUpdate: new Date().toISOString(),
        metricsGenerated: prev.metricsGenerated + 1,
      }));
    }, liveStream.interval);

    return () => clearInterval(interval);
  }, [
    liveStream.isActive,
    liveStream.interval,
    generateRealisticValue,
    updateHealthMetric,
  ]);

  // Manual metric submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(manualInputs[selectedMetric] || '0');

    if (isNaN(value) || value < 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    const config = METRIC_CONFIGS[selectedMetric];
    if (value < config.min || value > config.max) {
      toast.error(
        `Value must be between ${config.min} and ${config.max} ${config.unit}`
      );
      return;
    }

    updateHealthMetric(selectedMetric, value);
    setManualInputs((prev) => ({ ...prev, [selectedMetric]: '' }));
  };

  // Bulk data upload from JSON/CSV
  const handleBulkUpload = async () => {
    if (!bulkDataText.trim()) {
      toast.error('Please enter data to upload');
      return;
    }

    setIsProcessing(true);

    try {
      // Try to parse as JSON first
      let data;
      try {
        data = JSON.parse(bulkDataText);
      } catch {
        // If not JSON, try parsing as CSV
        const lines = bulkDataText.trim().split('\n');
        const headers = lines[0].split(',').map((h) => h.trim());

        if (!headers.includes('metric') || !headers.includes('value')) {
          throw new Error('CSV must include "metric" and "value" columns');
        }

        const metricIndex = headers.indexOf('metric');
        const valueIndex = headers.indexOf('value');

        data = lines.slice(1).map((line) => {
          const values = line.split(',').map((v) => v.trim());
          return {
            metric: values[metricIndex],
            value: parseFloat(values[valueIndex]),
            timestamp:
              values[headers.indexOf('timestamp')] || new Date().toISOString(),
          };
        });
      }

      // Process the data
      const metrics = Array.isArray(data) ? data : [data];
      let processed = 0;

      for (const metric of metrics) {
        if (metric.metric && typeof metric.value === 'number') {
          const metricType = metric.metric as keyof typeof METRIC_CONFIGS;
          if (METRIC_CONFIGS[metricType]) {
            updateHealthMetric(metricType, metric.value);
            processed++;

            // Small delay to prevent overwhelming the UI
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      }

      toast.success(`Successfully processed ${processed} health metrics`);
      setBulkDataText('');
    } catch (error) {
      toast.error(
        `Bulk upload failed: ${error instanceof Error ? error.message : 'Invalid format'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate sample data for testing
  const generateSampleData = () => {
    const sampleMetrics: Array<{
      metric: string;
      value: number;
      timestamp: string;
    }> = [];
    Object.keys(METRIC_CONFIGS).forEach((metricType) => {
      const value = generateRealisticValue(
        metricType as keyof typeof METRIC_CONFIGS
      );
      sampleMetrics.push({
        metric: metricType,
        value,
        timestamp: new Date().toISOString(),
      });
    });

    setBulkDataText(JSON.stringify(sampleMetrics, null, 2));
  };

  // Handle file upload for Apple Health exports and other formats
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const fileContent = await file.text();

      if (file.name.endsWith('.xml')) {
        // Apple Health XML file
        try {
          const { parseAppleHealthXML, convertAppleHealthToProcessedData } =
            await import('@/lib/appleHealthParser');
          const parsedData = parseAppleHealthXML(fileContent);
          const processedData = convertAppleHealthToProcessedData(parsedData);

          // Process the converted data
          let processed = 0;
          for (const [metric, data] of Object.entries(processedData.metrics)) {
            if (data.lastValue !== undefined) {
              const metricType = metric as keyof typeof METRIC_CONFIGS;
              if (METRIC_CONFIGS[metricType]) {
                updateHealthMetric(metricType, data.lastValue);
                processed++;
                // Small delay to prevent overwhelming the UI
                await new Promise((resolve) => setTimeout(resolve, 50));
              }
            }
          }

          toast.success(
            `Successfully imported ${processed} metrics from Apple Health export`
          );
        } catch (_error) {
          toast.error(
            "Failed to parse Apple Health XML. Please ensure it's a valid export file."
          );
        }
      } else if (file.name.endsWith('.json')) {
        // JSON file
        try {
          const data = JSON.parse(fileContent);
          setBulkDataText(JSON.stringify(data, null, 2));
          toast.success(
            'JSON file loaded successfully. Click "Upload Bulk Data" to process.'
          );
        } catch (_error) {
          toast.error('Invalid JSON format');
        }
      } else if (file.name.endsWith('.csv')) {
        // CSV file
        setBulkDataText(fileContent);
        toast.success(
          'CSV file loaded successfully. Click "Upload Bulk Data" to process.'
        );
      } else if (file.name.endsWith('.zip')) {
        toast.error(
          'ZIP files require manual extraction. Please extract the export.xml file and upload it directly.'
        );
      } else {
        toast.error(
          'Unsupported file format. Please upload XML, JSON, or CSV files.'
        );
      }
    } catch (error) {
      toast.error(
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsProcessing(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const toggleLiveStream = () => {
    setLiveStream((prev) => ({ ...prev, isActive: !prev.isActive }));
    toast.info(
      liveStream.isActive ? 'Live stream stopped' : 'Live stream started'
    );
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Live Health Data System
          </CardTitle>
          <CardDescription>
            Upload real health data or simulate live data streams for
            development and testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${healthData ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <div>
                <p className="text-sm font-medium">Data Status</p>
                <p className="text-muted-foreground text-xs">
                  {healthData ? 'Active dataset' : 'No data loaded'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${liveStream.isActive ? 'animate-pulse bg-blue-500' : 'bg-gray-300'}`}
              />
              <div>
                <p className="text-sm font-medium">Live Stream</p>
                <p className="text-muted-foreground text-xs">
                  {liveStream.isActive
                    ? `Active (${liveStream.metricsGenerated} updates)`
                    : 'Inactive'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Last Update</p>
                <p className="text-muted-foreground text-xs">
                  {healthData?.lastUpdated
                    ? new Date(healthData.lastUpdated).toLocaleTimeString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="live">Live Simulation</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
        </TabsList>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Manual Data Entry
              </CardTitle>
              <CardDescription>
                Enter individual health metrics manually for immediate
                processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Metric Type</Label>
                    <Select
                      value={selectedMetric}
                      onValueChange={(value: keyof typeof METRIC_CONFIGS) =>
                        setSelectedMetric(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(METRIC_CONFIGS).map(([key, config]) => {
                          const IconComponent = config.icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Value ({METRIC_CONFIGS[selectedMetric].unit})</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min={METRIC_CONFIGS[selectedMetric].min}
                      max={METRIC_CONFIGS[selectedMetric].max}
                      value={manualInputs[selectedMetric] || ''}
                      onChange={(e) =>
                        setManualInputs((prev) => ({
                          ...prev,
                          [selectedMetric]: e.target.value,
                        }))
                      }
                      placeholder={`Enter ${METRIC_CONFIGS[selectedMetric].label.toLowerCase()}`}
                    />
                    <p className="text-muted-foreground text-xs">
                      Range: {METRIC_CONFIGS[selectedMetric].realistic.min} -{' '}
                      {METRIC_CONFIGS[selectedMetric].realistic.max}{' '}
                      {METRIC_CONFIGS[selectedMetric].unit}
                    </p>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Metric
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Simulation Tab */}
        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Live Data Simulation
              </CardTitle>
              <CardDescription>
                Simulate continuous health data streams for testing real-time
                features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Live Stream</Label>
                  <p className="text-muted-foreground text-sm">
                    Automatically generate realistic health metrics every{' '}
                    {liveStream.interval / 1000} seconds
                  </p>
                </div>
                <Switch
                  checked={liveStream.isActive}
                  onCheckedChange={toggleLiveStream}
                />
              </div>

              {liveStream.isActive && (
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    Live simulation active • {liveStream.metricsGenerated}{' '}
                    metrics generated
                    {liveStream.lastUpdate &&
                      ` • Last update: ${new Date(liveStream.lastUpdate).toLocaleTimeString()}`}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Update Interval</Label>
                <Select
                  value={liveStream.interval.toString()}
                  onValueChange={(value) =>
                    setLiveStream((prev) => ({
                      ...prev,
                      interval: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5000">Every 5 seconds (Fast)</SelectItem>
                    <SelectItem value="15000">Every 15 seconds</SelectItem>
                    <SelectItem value="30000">
                      Every 30 seconds (Default)
                    </SelectItem>
                    <SelectItem value="60000">Every minute</SelectItem>
                    <SelectItem value="300000">
                      Every 5 minutes (Slow)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                {Object.entries(METRIC_CONFIGS).map(([key, config]) => {
                  const IconComponent = config.icon;
                  const lastValue =
                    healthData?.metrics[
                      key as keyof ProcessedHealthData['metrics']
                    ]?.lastValue;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm">{config.label}</span>
                      </div>
                      <Badge variant="outline">
                        {lastValue ? `${lastValue} ${config.unit}` : 'No data'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Upload Tab */}
        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Bulk Data Upload
              </CardTitle>
              <CardDescription>
                Upload health data via Apple Health exports, JSON, or CSV format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label
                      htmlFor="apple-health-upload"
                      className="text-sm font-medium text-red-700"
                    >
                      🍎 Apple Health Export
                    </Label>
                    <input
                      id="apple-health-upload"
                      type="file"
                      accept=".xml,.zip"
                      onChange={handleFileUpload}
                      title="Upload Apple Health export file"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:rounded file:border-0 file:bg-red-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-red-700 hover:file:bg-red-100"
                    />
                    <p className="text-xs text-gray-500">
                      XML or ZIP from Health app
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="json-upload"
                      className="text-sm font-medium text-blue-700"
                    >
                      📄 JSON File
                    </Label>
                    <input
                      id="json-upload"
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      title="Upload JSON health data file"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500">
                      Structured health data
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="csv-upload"
                      className="text-sm font-medium text-green-700"
                    >
                      📊 CSV File
                    </Label>
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      title="Upload CSV health data file"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:rounded file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-700 hover:file:bg-green-100"
                    />
                    <p className="text-xs text-gray-500">Tabular metric data</p>
                  </div>
                </div>
              </div>

              {/* Manual Text Entry Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Manual Data Entry (JSON or CSV)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateSampleData}
                  >
                    Generate Sample
                  </Button>
                </div>
                <Textarea
                  value={bulkDataText}
                  onChange={(e) => setBulkDataText(e.target.value)}
                  placeholder={`JSON format:
[{"metric": "steps", "value": 8500}, {"metric": "heartRate", "value": 72}]

CSV format:
metric,value,timestamp
steps,8500,2024-01-01T10:00:00Z
heartRate,72,2024-01-01T10:01:00Z`}
                  rows={8}
                />
              </div>

              <Button
                onClick={handleBulkUpload}
                disabled={isProcessing || !bulkDataText.trim()}
                className="w-full"
              >
                {isProcessing ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isProcessing ? 'Processing...' : 'Upload Bulk Data'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Current Data Summary */}
      {healthData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Current Health Data Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">Health Score</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={healthData.healthScore} className="flex-1" />
                  <span className="text-sm font-medium">
                    {healthData.healthScore}%
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Data Quality</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={
                      healthData.dataQuality.overall === 'excellent'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {healthData.dataQuality.overall}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {healthData.dataQuality.recency}% recent
                  </span>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-2">
              {Object.entries(healthData.metrics).map(([key, metric]) => {
                // Type assertion for metric structure
                const typedMetric = metric as {
                  lastValue: number;
                  trend: string;
                };
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">
                      {METRIC_CONFIGS[key as keyof typeof METRIC_CONFIGS]
                        ?.label || key}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {typedMetric.lastValue}{' '}
                        {
                          METRIC_CONFIGS[key as keyof typeof METRIC_CONFIGS]
                            ?.unit
                        }
                      </Badge>
                      <Badge
                        variant={
                          typedMetric.trend === 'increasing'
                            ? 'default'
                            : typedMetric.trend === 'decreasing'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {typedMetric.trend}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
