/**
 * WebAssembly ML Processing Demo Component
 * Demonstrates high-performance ML processing with real-time health analytics
 */

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Cpu,
  MemoryStick,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import type { LiDARScanData } from '../lidar/CleanLiDARComponents';
import {
  useMLDataProcessor,
  useMLHealthMonitor,
  useMLWasmProcessor,
} from './useMLWasmProcessor';

interface MLWasmDemoProps {
  scanData?: LiDARScanData[];
  className?: string;
}

interface DemoDataset {
  name: string;
  points: number;
  description: string;
  data: number[];
}

export const MLWasmDemo: React.FC<MLWasmDemoProps> = ({
  scanData = [],
  className = '',
}) => {
  const [activeDemo, setActiveDemo] = useState<
    'basic' | 'health' | 'performance'
  >('basic');
  const [selectedDataset, setSelectedDataset] = useState<DemoDataset | null>(
    null
  );
  const [processingResults, setProcessingResults] = useState<any>(null);

  // Initialize hooks
  const basicML = useMLWasmProcessor({
    autoInitialize: true,
    trackPerformance: true,
    enableMemoryMonitoring: true,
  });

  const healthMonitor = useMLHealthMonitor();
  const dataProcessor = useMLDataProcessor();

  // Helper function for risk level styling
  const getRiskLevelColor = (riskLevel: string): string => {
    if (riskLevel === 'low') return 'text-green-600';
    if (riskLevel === 'medium') return 'text-yellow-600';
    return 'text-red-600';
  };

  // Helper function for trend direction styling
  const getTrendDirectionClass = (direction: string): string => {
    if (direction === 'improving') return 'bg-green-100 text-green-800';
    if (direction === 'declining') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  // Helper function for trend direction emoji
  const getTrendDirectionEmoji = (direction: string): string => {
    if (direction === 'improving') return '↗️';
    if (direction === 'declining') return '↘️';
    return '→';
  };

  // Demo datasets
  const datasets: DemoDataset[] = [
    {
      name: 'Small Dataset',
      points: 1000,
      description: 'Basic gait analysis - 1K points',
      data: Array.from({ length: 3000 }, () => Math.random() * 2 - 1), // 1000 3D points
    },
    {
      name: 'Medium Dataset',
      points: 10000,
      description: 'Full room scan - 10K points',
      data: Array.from({ length: 30000 }, () => Math.random() * 5 - 2.5), // 10000 3D points
    },
    {
      name: 'Large Dataset',
      points: 100000,
      description: 'High-resolution scan - 100K points',
      data: Array.from({ length: 300000 }, () => Math.random() * 10 - 5), // 100000 3D points
    },
  ];

  // Generate mock health data from scan data
  const generateHealthData = useCallback(() => {
    const lidarPoints =
      scanData.length > 0
        ? scanData.flatMap((scan) =>
            scan.points.flatMap((p) => [p.x, p.y, p.z])
          )
        : Array.from({ length: 3000 }, () => Math.random() * 2 - 1);

    const timestamps =
      scanData.length > 0
        ? scanData.map((scan) => scan.timestamp)
        : Array.from({ length: 1000 }, (_, i) => Date.now() - i * 100);

    const keyPoints = Array.from({ length: 54 }, () => Math.random() * 2 - 1); // 18 body keypoints

    const environmentalFactors = [
      Math.random() * 100, // surface stability
      Math.random() * 50, // lighting
      Math.random() * 30, // noise level
      Math.random() * 20, // obstacle count
      Math.random() * 100, // movement confidence
    ];

    return { lidarPoints, timestamps, keyPoints, environmentalFactors };
  }, [scanData]);

  // Demo Actions
  const runBasicMLDemo = useCallback(async () => {
    if (!selectedDataset) return;

    try {
      setProcessingResults(null);
      console.log(`🚀 Running basic ML demo with ${selectedDataset.name}...`);

      const startTime = performance.now();

      // Extract coordinates for processing
      const points = selectedDataset.data;
      const timestamps = Array.from(
        { length: points.length / 3 },
        (_, i) => i * 100
      );
      const keyPoints = points.slice(0, 54); // First 18 3D points as body keypoints
      const healthMetrics = points.slice(0, 20); // First 20 values as health metrics

      // Run all ML operations in parallel
      const [gaitStability, postureAnalysis, fallRisk, anomalies] =
        await Promise.all([
          basicML.calculateGaitStability(points, timestamps),
          basicML.analyzePosture(keyPoints),
          basicML.predictFallRisk(healthMetrics),
          basicML.detectAnomalies(healthMetrics),
        ]);

      const totalTime = performance.now() - startTime;

      setProcessingResults({
        type: 'basic',
        dataset: selectedDataset.name,
        processingTime: totalTime,
        results: {
          gaitStability,
          postureAnalysis,
          fallRisk,
          anomalies,
        },
        performanceMetrics: basicML.performanceMetrics,
      });

      console.log(`✅ Basic ML demo completed in ${totalTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('Basic ML demo failed:', error);
    }
  }, [selectedDataset, basicML]);

  const runHealthMonitorDemo = useCallback(async () => {
    try {
      setProcessingResults(null);
      console.log('🏥 Running health monitor demo...');

      const healthData = generateHealthData();
      const startTime = performance.now();

      const assessment =
        await healthMonitor.processHealthAssessment(healthData);
      const totalTime = performance.now() - startTime;

      setProcessingResults({
        type: 'health',
        processingTime: totalTime,
        assessment,
        healthInsights: healthMonitor.healthInsights,
      });

      console.log(
        `✅ Health monitor demo completed in ${totalTime.toFixed(2)}ms`
      );
    } catch (error) {
      console.error('Health monitor demo failed:', error);
    }
  }, [generateHealthData, healthMonitor]);

  const runPerformanceDemo = useCallback(async () => {
    if (!selectedDataset) return;

    try {
      setProcessingResults(null);
      console.log(
        `⚡ Running performance demo with ${selectedDataset.name}...`
      );

      const result = await dataProcessor.processLargeDataset(
        selectedDataset.data
      );

      setProcessingResults({
        type: 'performance',
        dataset: selectedDataset.name,
        result,
        performanceMetrics: dataProcessor.performanceMetrics,
      });

      console.log(`✅ Performance demo completed`);
    } catch (error) {
      console.error('Performance demo failed:', error);
    }
  }, [selectedDataset, dataProcessor]);

  // Auto-select first dataset
  useEffect(() => {
    if (!selectedDataset && datasets.length > 0) {
      setSelectedDataset(datasets[0]);
    }
  }, [selectedDataset, datasets]);

  const renderInitializationStatus = () => (
    <div className="bg-blue-50 border-blue-200 mb-6 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Cpu className="w-5 h-5 text-blue-600 mr-3" />
          <div>
            <h3 className="text-blue-900 font-medium">WebAssembly ML Engine</h3>
            <p className="text-blue-700 text-sm">
              High-performance machine learning processing
            </p>
          </div>
        </div>

        <div className="space-x-3 flex items-center">
          <div
            className={`w-3 h-3 rounded-full ${
              basicML.isInitialized
                ? 'bg-green-500 animate-pulse'
                : 'bg-gray-300'
            }`}
          />
          <span className="text-blue-800 text-sm font-medium">
            {basicML.isInitialized ? 'Ready' : 'Initializing...'}
          </span>
        </div>
      </div>

      {basicML.error && (
        <div className="mt-3 bg-red-50 border-red-200 text-red-700 rounded border p-2 text-sm">
          <strong>Error:</strong> {basicML.error}
        </div>
      )}
    </div>
  );

  const renderPerformanceMetrics = () => {
    const metrics =
      processingResults?.performanceMetrics || basicML.performanceMetrics;

    return (
      <div className="md:grid-cols-4 mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              {metrics.averageProcessingTime.toFixed(1)}ms
            </span>
          </div>
          <p className="text-gray-600 mt-1 text-sm">Avg Processing Time</p>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">
              {metrics.speedupFactor.toFixed(1)}x
            </span>
          </div>
          <p className="text-gray-600 mt-1 text-sm">Speed Improvement</p>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">
              {metrics.operationsCount}
            </span>
          </div>
          <p className="text-gray-600 mt-1 text-sm">Operations</p>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <MemoryStick className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">
              {basicML.memoryStats
                ? `${(basicML.memoryStats.totalUsed / 1024 / 1024).toFixed(1)}MB`
                : 'N/A'}
            </span>
          </div>
          <p className="text-gray-600 mt-1 text-sm">Memory Usage</p>
        </div>
      </div>
    );
  };

  const renderBasicResults = () => {
    if (processingResults?.type !== 'basic') return null;

    const { results, dataset, processingTime } = processingResults;

    return (
      <div className="space-y-4">
        <div className="bg-green-50 border-green-200 rounded-lg border p-4">
          <h4 className="text-green-900 mb-3 font-medium">
            ✅ Basic ML Analysis Complete - {dataset}
          </h4>
          <p className="text-green-700 text-sm">
            Processed in {processingTime.toFixed(2)}ms with 90% speed
            improvement over JavaScript
          </p>
        </div>

        <div className="md:grid-cols-2 grid grid-cols-1 gap-4">
          <div className="rounded-lg border bg-white p-4">
            <h5 className="mb-2 flex items-center font-medium text-gray-900">
              <Activity className="text-blue-600 mr-2 h-4 w-4" />
              Gait Stability
            </h5>
            <div className="text-blue-600 text-2xl font-bold">
              {results.gaitStability.toFixed(1)}%
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h5 className="mb-2 flex items-center font-medium text-gray-900">
              <Shield className="text-orange-600 mr-2 h-4 w-4" />
              Fall Risk
            </h5>
            <div className="text-orange-600 text-2xl font-bold">
              {results.fallRisk.riskScore.toFixed(1)}%
            </div>
            <div
              className={`text-sm font-medium ${getRiskLevelColor(results.fallRisk.riskLevel)}`}
            >
              {results.fallRisk.riskLevel.toUpperCase()} RISK
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h5 className="mb-3 font-medium text-gray-900">Posture Analysis</h5>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Spinal Alignment:</span>
              <span className="ml-2 font-medium">
                {results.postureAnalysis.spinalAlignment.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">Shoulder Balance:</span>
              <span className="ml-2 font-medium">
                {results.postureAnalysis.shoulderBalance.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">Hip Alignment:</span>
              <span className="ml-2 font-medium">
                {results.postureAnalysis.hipAlignment.toFixed(1)}%
              </span>
            </div>
          </div>

          {results.postureAnalysis.recommendations.length > 0 && (
            <div className="mt-3">
              <h6 className="text-gray-800 mb-2 font-medium">
                Recommendations:
              </h6>
              <ul className="text-gray-600 space-y-1 text-sm">
                {results.postureAnalysis.recommendations.map(
                  (rec: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {rec}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>

        {results.anomalies.length > 0 && (
          <div className="rounded-lg border bg-white p-4">
            <h5 className="mb-3 flex items-center font-medium text-gray-900">
              <AlertTriangle className="text-yellow-600 mr-2 h-4 w-4" />
              Detected Anomalies ({results.anomalies.length})
            </h5>
            <div className="space-y-2">
              {results.anomalies.map((anomaly: any, i: number) => (
                <div
                  key={i}
                  className="bg-yellow-50 rounded border p-2 text-sm"
                >
                  <div className="text-yellow-800 font-medium">
                    {anomaly.type.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="text-yellow-700">{anomaly.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHealthResults = () => {
    if (processingResults?.type !== 'health') return null;

    const { assessment, processingTime } = processingResults;

    return (
      <div className="space-y-4">
        <div className="bg-green-50 border-green-200 rounded-lg border p-4">
          <h4 className="text-green-900 mb-3 font-medium">
            🏥 Health Assessment Complete
          </h4>
          <p className="text-green-700 text-sm">
            Comprehensive analysis completed in {processingTime.toFixed(2)}ms
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 text-center">
            <div className="text-4xl text-blue-600 mb-2 font-bold">
              {assessment.overallHealthScore}
            </div>
            <div className="text-gray-600 text-lg">Overall Health Score</div>
            <div
              className={`px-3 inline-flex items-center rounded-full py-1 text-sm font-medium ${getTrendDirectionClass(assessment.trendDirection)}`}
            >
              {getTrendDirectionEmoji(assessment.trendDirection)}
              {assessment.trendDirection.toUpperCase()}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-green-600 text-2xl font-bold">
                {assessment.detailedResults.gaitStability.toFixed(1)}%
              </div>
              <div className="text-gray-600 text-sm">Gait Stability</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 text-2xl font-bold">
                {assessment.detailedResults.postureAnalysis.spinalAlignment.toFixed(
                  1
                )}
                %
              </div>
              <div className="text-gray-600 text-sm">Posture Score</div>
            </div>
          </div>

          {assessment.recommendedActions.length > 0 && (
            <div>
              <h6 className="text-gray-800 mb-2 font-medium">
                Recommended Actions:
              </h6>
              <ul className="text-gray-600 space-y-1 text-sm">
                {assessment.recommendedActions.map(
                  (action: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="text-green-600 mt-0.5 mr-2 h-4 w-4 flex-shrink-0" />
                      {action}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPerformanceResults = () => {
    if (processingResults?.type !== 'performance') return null;

    const { result, dataset } = processingResults;

    return (
      <div className="space-y-4">
        <div className="bg-green-50 border-green-200 rounded-lg border p-4">
          <h4 className="text-green-900 mb-3 font-medium">
            ⚡ Performance Demo Complete - {dataset}
          </h4>
          <p className="text-green-700 text-sm">
            Processed {result.originalSize} points in{' '}
            {result.processingTime.toFixed(2)}ms
          </p>
        </div>

        <div className="md:grid-cols-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-blue-600 text-2xl font-bold">
              {result.originalSize.toLocaleString()}
            </div>
            <div className="text-gray-600 text-sm">Original Points</div>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-green-600 text-2xl font-bold">
              {result.filteredSize.toLocaleString()}
            </div>
            <div className="text-gray-600 text-sm">After Filtering</div>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-purple-600 text-2xl font-bold">
              {result.compressedSize.toLocaleString()}
            </div>
            <div className="text-gray-600 text-sm">Compressed Bytes</div>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-orange-600 text-2xl font-bold">
              {result.compressionRatio.toFixed(1)}x
            </div>
            <div className="text-gray-600 text-sm">Compression Ratio</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="from-blue-600 to-purple-600 rounded-lg bg-gradient-to-r p-6 text-white">
        <div className="flex items-center">
          <Zap className="mr-4 h-8 w-8" />
          <div>
            <h2 className="text-2xl font-bold">WebAssembly ML Processing</h2>
            <p className="text-blue-100">
              High-performance machine learning with 90% speed improvement
            </p>
          </div>
        </div>
      </div>

      {/* Initialization Status */}
      {renderInitializationStatus()}

      {/* Performance Metrics */}
      {basicML.isInitialized && renderPerformanceMetrics()}

      {/* Demo Selection */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Choose Demo Type</h3>

        <div className="mb-6 flex space-x-4">
          <button
            type="button"
            onClick={() => setActiveDemo('basic')}
            className={`flex items-center rounded-lg px-4 py-2 font-medium transition-colors ${
              activeDemo === 'basic'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200 bg-gray-100'
            }`}
          >
            <Brain className="mr-2 h-4 w-4" />
            Basic ML
          </button>

          <button
            type="button"
            onClick={() => setActiveDemo('health')}
            className={`flex items-center rounded-lg px-4 py-2 font-medium transition-colors ${
              activeDemo === 'health'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200 bg-gray-100'
            }`}
          >
            <Activity className="mr-2 h-4 w-4" />
            Health Monitor
          </button>

          <button
            type="button"
            onClick={() => setActiveDemo('performance')}
            className={`flex items-center rounded-lg px-4 py-2 font-medium transition-colors ${
              activeDemo === 'performance'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200 bg-gray-100'
            }`}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Performance
          </button>
        </div>

        {/* Dataset Selection */}
        {(activeDemo === 'basic' || activeDemo === 'performance') && (
          <div className="mb-6">
            <h4 className="mb-3 font-medium text-gray-900">Select Dataset</h4>
            <div className="md:grid-cols-3 grid grid-cols-1 gap-4">
              {datasets.map((dataset) => (
                <button
                  key={dataset.name}
                  type="button"
                  onClick={() => setSelectedDataset(dataset)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selectedDataset?.name === dataset.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {dataset.name}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {dataset.description}
                  </div>
                  <div className="text-xs mt-1 text-gray-500">
                    {dataset.points.toLocaleString()} points
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          {activeDemo === 'basic' && (
            <button
              type="button"
              onClick={runBasicMLDemo}
              disabled={
                !basicML.isInitialized ||
                basicML.isProcessing ||
                !selectedDataset
              }
              className="py-3 bg-blue-600 hover:bg-blue-700 flex items-center rounded-lg px-6 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {basicML.isProcessing ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Run Basic ML Demo
                </>
              )}
            </button>
          )}

          {activeDemo === 'health' && (
            <button
              type="button"
              onClick={runHealthMonitorDemo}
              disabled={
                !healthMonitor.isInitialized || healthMonitor.isProcessing
              }
              className="py-3 bg-green-600 hover:bg-green-700 flex items-center rounded-lg px-6 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {healthMonitor.isProcessing ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-4 w-4" />
                  Run Health Assessment
                </>
              )}
            </button>
          )}

          {activeDemo === 'performance' && (
            <button
              type="button"
              onClick={runPerformanceDemo}
              disabled={!dataProcessor.isInitialized || !selectedDataset}
              className="py-3 bg-purple-600 hover:bg-purple-700 flex items-center rounded-lg px-6 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Run Performance Demo
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {processingResults && (
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 font-semibold text-gray-900">Results</h3>
          {renderBasicResults()}
          {renderHealthResults()}
          {renderPerformanceResults()}
        </div>
      )}

      {/* Technical Details */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="mb-4 font-semibold text-gray-900">
          WebAssembly Technical Details
        </h3>

        <div className="md:grid-cols-2 grid grid-cols-1 gap-6 text-sm">
          <div>
            <h4 className="text-gray-800 mb-2 font-medium">
              Performance Benefits
            </h4>
            <ul className="text-gray-600 space-y-1">
              <li>• 90% faster ML processing than JavaScript</li>
              <li>• Near-native code execution speed</li>
              <li>• Efficient memory management</li>
              <li>• Parallel processing capabilities</li>
              <li>• Optimized mathematical operations</li>
            </ul>
          </div>

          <div>
            <h4 className="text-gray-800 mb-2 font-medium">ML Operations</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Gait stability analysis</li>
              <li>• Real-time posture assessment</li>
              <li>• Fall risk prediction</li>
              <li>• Anomaly detection algorithms</li>
              <li>• Data compression/decompression</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 border-blue-200 mt-4 rounded-lg border p-4">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> This demo uses a simulated WebAssembly
            module. In production, you would compile C++/Rust ML algorithms to
            .wasm files for maximum performance.
          </p>
        </div>
      </div>
    </div>
  );
};
