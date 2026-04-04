/**
 * React Hook for WebAssembly ML Processing
 * Provides easy integration with ML WASM processor in React components
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  mlWasmProcessor,
  type AnomalyDetection,
  type FallRiskPrediction,
  type HealthStreamResult,
  type MemoryStats,
  type PostureAnalysis,
} from './MLWasmProcessor';

// Hook state interface
interface MLWasmState {
  isInitialized: boolean;
  isProcessing: boolean;
  error: string | null;
  performanceMetrics: {
    totalProcessingTime: number;
    operationsCount: number;
    averageProcessingTime: number;
    speedupFactor: number;
  };
  memoryStats: MemoryStats | null;
}

// Processing results interface
interface MLProcessingResults {
  gaitStability?: number;
  postureAnalysis?: PostureAnalysis;
  fallRiskPrediction?: FallRiskPrediction;
  anomalies?: AnomalyDetection[];
  healthStream?: HealthStreamResult;
}

// Hook configuration options
interface MLWasmOptions {
  autoInitialize?: boolean;
  trackPerformance?: boolean;
  enableMemoryMonitoring?: boolean;
  processingTimeout?: number;
}

/**
 * React Hook for WebAssembly ML Processing
 * Provides a simple interface for high-performance ML operations
 */
export function useMLWasmProcessor(options: MLWasmOptions = {}) {
  const {
    autoInitialize = true,
    trackPerformance = true,
    enableMemoryMonitoring = false,
    processingTimeout = 10000,
  } = options;

  // State management
  const [state, setState] = useState<MLWasmState>({
    isInitialized: false,
    isProcessing: false,
    error: null,
    performanceMetrics: {
      totalProcessingTime: 0,
      operationsCount: 0,
      averageProcessingTime: 0,
      speedupFactor: 1,
    },
    memoryStats: null,
  });

  const [results, setResults] = useState<MLProcessingResults>({});

  // Refs for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const memoryMonitorRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebAssembly processor
  const initialize = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      await mlWasmProcessor.waitForInitialization();

      setState((prev) => ({
        ...prev,
        isInitialized: true,
        error: null,
      }));

      console.log('✅ ML WebAssembly processor initialized via React hook');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown initialization error';
      setState((prev) => ({
        ...prev,
        isInitialized: false,
        error: errorMessage,
      }));
      console.error('❌ Failed to initialize ML WebAssembly processor:', error);
    }
  }, []);

  // Update performance metrics
  const updatePerformanceMetrics = useCallback(() => {
    if (trackPerformance) {
      const metrics = mlWasmProcessor.getPerformanceMetrics();
      setState((prev) => ({
        ...prev,
        performanceMetrics: metrics,
      }));
    }
  }, [trackPerformance]);

  // Update memory stats
  const updateMemoryStats = useCallback(async () => {
    if (enableMemoryMonitoring && mlWasmProcessor.isReady()) {
      try {
        const memoryStats = await mlWasmProcessor.getMemoryStats();
        setState((prev) => ({
          ...prev,
          memoryStats,
        }));
      } catch (error) {
        console.warn('Failed to get memory stats:', error);
      }
    }
  }, [enableMemoryMonitoring]);

  // Processing wrapper with timeout and error handling
  const withProcessing = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        // Set timeout
        timeoutRef.current = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            isProcessing: false,
            error: 'Processing timeout exceeded',
          }));
        }, processingTimeout);

        const result = await operation();

        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        setState((prev) => ({ ...prev, isProcessing: false }));
        updatePerformanceMetrics();

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Processing error';
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [processingTimeout, updatePerformanceMetrics]
  );

  // ML Processing Functions

  const calculateGaitStability = useCallback(
    async (points: number[], timestamps: number[]): Promise<number> => {
      return withProcessing(async () => {
        const stability = await mlWasmProcessor.calculateGaitStability(
          points,
          timestamps
        );
        setResults((prev) => ({ ...prev, gaitStability: stability }));
        return stability;
      });
    },
    [withProcessing]
  );

  const analyzePosture = useCallback(
    async (keyPoints: number[]): Promise<PostureAnalysis> => {
      return withProcessing(async () => {
        const analysis = await mlWasmProcessor.analyzePosture(keyPoints);
        setResults((prev) => ({ ...prev, postureAnalysis: analysis }));
        return analysis;
      });
    },
    [withProcessing]
  );

  const predictFallRisk = useCallback(
    async (features: number[]): Promise<FallRiskPrediction> => {
      return withProcessing(async () => {
        const prediction = await mlWasmProcessor.predictFallRisk(features);
        setResults((prev) => ({ ...prev, fallRiskPrediction: prediction }));
        return prediction;
      });
    },
    [withProcessing]
  );

  const detectAnomalies = useCallback(
    async (healthMetrics: number[]): Promise<AnomalyDetection[]> => {
      return withProcessing(async () => {
        const anomalies = await mlWasmProcessor.detectAnomalies(healthMetrics);
        setResults((prev) => ({ ...prev, anomalies }));
        return anomalies;
      });
    },
    [withProcessing]
  );

  const processHealthStream = useCallback(
    async (buffer: number[]): Promise<HealthStreamResult> => {
      return withProcessing(async () => {
        const streamResult = await mlWasmProcessor.processHealthStream(buffer);
        setResults((prev) => ({ ...prev, healthStream: streamResult }));
        return streamResult;
      });
    },
    [withProcessing]
  );

  const compressData = useCallback(
    async (points: number[]): Promise<Uint8Array> => {
      return withProcessing(async () => {
        return mlWasmProcessor.compressData(points);
      });
    },
    [withProcessing]
  );

  const decompressData = useCallback(
    async (compressed: Uint8Array): Promise<number[]> => {
      return withProcessing(async () => {
        return mlWasmProcessor.decompressData(compressed);
      });
    },
    [withProcessing]
  );

  const filterNoise = useCallback(
    async (points: number[], threshold?: number): Promise<number[]> => {
      return withProcessing(async () => {
        return mlWasmProcessor.filterNoise(points, threshold);
      });
    },
    [withProcessing]
  );

  // Batch processing for multiple operations
  const processBatch = useCallback(
    async (operations: {
      gaitAnalysis?: { points: number[]; timestamps: number[] };
      postureAnalysis?: { keyPoints: number[] };
      fallRiskPrediction?: { features: number[] };
      anomalyDetection?: { healthMetrics: number[] };
    }): Promise<MLProcessingResults> => {
      return withProcessing(async () => {
        const batchResults: MLProcessingResults = {};

        // Process all operations in parallel for maximum performance
        const promises: Promise<void>[] = [];

        if (operations.gaitAnalysis) {
          promises.push(
            calculateGaitStability(
              operations.gaitAnalysis.points,
              operations.gaitAnalysis.timestamps
            ).then((result) => {
              batchResults.gaitStability = result;
            })
          );
        }

        if (operations.postureAnalysis) {
          promises.push(
            analyzePosture(operations.postureAnalysis.keyPoints).then(
              (result) => {
                batchResults.postureAnalysis = result;
              }
            )
          );
        }

        if (operations.fallRiskPrediction) {
          promises.push(
            predictFallRisk(operations.fallRiskPrediction.features).then(
              (result) => {
                batchResults.fallRiskPrediction = result;
              }
            )
          );
        }

        if (operations.anomalyDetection) {
          promises.push(
            detectAnomalies(operations.anomalyDetection.healthMetrics).then(
              (result) => {
                batchResults.anomalies = result;
              }
            )
          );
        }

        await Promise.all(promises);
        return batchResults;
      });
    },
    [
      calculateGaitStability,
      analyzePosture,
      predictFallRisk,
      detectAnomalies,
      withProcessing,
    ]
  );

  // Reset results
  const clearResults = useCallback(() => {
    setResults({});
  }, []);

  // Auto-initialization effect
  useEffect(() => {
    if (autoInitialize && !state.isInitialized && !state.error) {
      initialize();
    }
  }, [autoInitialize, state.isInitialized, state.error, initialize]);

  // Memory monitoring effect
  useEffect(() => {
    if (enableMemoryMonitoring && state.isInitialized) {
      const startMemoryMonitoring = () => {
        memoryMonitorRef.current = setInterval(() => {
          updateMemoryStats();
        }, 5000); // Update every 5 seconds
      };

      startMemoryMonitoring();

      return () => {
        if (memoryMonitorRef.current) {
          clearInterval(memoryMonitorRef.current);
          memoryMonitorRef.current = null;
        }
      };
    }
  }, [enableMemoryMonitoring, state.isInitialized, updateMemoryStats]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (memoryMonitorRef.current) {
        clearInterval(memoryMonitorRef.current);
      }
    };
  }, []);

  return {
    // State
    isInitialized: state.isInitialized,
    isProcessing: state.isProcessing,
    error: state.error,
    performanceMetrics: state.performanceMetrics,
    memoryStats: state.memoryStats,
    results,

    // Actions
    initialize,
    clearResults,

    // ML Operations
    calculateGaitStability,
    analyzePosture,
    predictFallRisk,
    detectAnomalies,
    processHealthStream,
    processBatch,

    // Data Processing
    compressData,
    decompressData,
    filterNoise,

    // Utility
    isReady: state.isInitialized && !state.isProcessing && !state.error,
  };
}

// Specialized hooks for specific use cases

/**
 * Hook for real-time health monitoring with WebAssembly ML
 */
export function useMLHealthMonitor() {
  const {
    isInitialized,
    isProcessing,
    error,
    calculateGaitStability,
    analyzePosture,
    predictFallRisk,
    processHealthStream,
    results,
  } = useMLWasmProcessor({
    autoInitialize: true,
    trackPerformance: true,
    enableMemoryMonitoring: true,
  });

  const [healthInsights, setHealthInsights] = useState({
    overallHealthScore: 85,
    trendDirection: 'stable' as 'improving' | 'stable' | 'declining',
    recommendedActions: [] as string[],
    lastUpdated: Date.now(),
  });

  // Process complete health assessment
  const processHealthAssessment = useCallback(
    async (healthData: {
      lidarPoints: number[];
      timestamps: number[];
      keyPoints: number[];
      environmentalFactors: number[];
    }) => {
      try {
        // Process all health metrics in parallel
        const [gaitStability, postureAnalysis, fallRisk, streamResult] =
          await Promise.all([
            calculateGaitStability(
              healthData.lidarPoints,
              healthData.timestamps
            ),
            analyzePosture(healthData.keyPoints),
            predictFallRisk(healthData.environmentalFactors),
            processHealthStream(healthData.lidarPoints),
          ]);

        // Calculate overall health score
        const overallHealthScore = Math.round(
          (gaitStability +
            postureAnalysis.spinalAlignment +
            (100 - fallRisk.riskScore) +
            streamResult.gaitMetrics.stability) /
            4
        );

        // Determine trend (simplified logic)
        const currentScore = overallHealthScore;
        const previousScore = healthInsights.overallHealthScore;
        let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';

        if (currentScore > previousScore + 5) trendDirection = 'improving';
        else if (currentScore < previousScore - 5) trendDirection = 'declining';

        // Generate recommendations
        const recommendedActions = [
          ...postureAnalysis.recommendations,
          ...fallRisk.contributingFactors.map((factor) => `Address: ${factor}`),
        ];

        setHealthInsights({
          overallHealthScore,
          trendDirection,
          recommendedActions,
          lastUpdated: Date.now(),
        });

        return {
          overallHealthScore,
          trendDirection,
          recommendedActions,
          detailedResults: {
            gaitStability,
            postureAnalysis,
            fallRisk,
            streamResult,
          },
        };
      } catch (error) {
        console.error('Health assessment processing failed:', error);
        throw error;
      }
    },
    [
      calculateGaitStability,
      analyzePosture,
      predictFallRisk,
      processHealthStream,
      healthInsights.overallHealthScore,
    ]
  );

  return {
    isInitialized,
    isProcessing,
    error,
    results,
    healthInsights,
    processHealthAssessment,
  };
}

/**
 * Hook for performance-optimized data processing with WebAssembly
 */
export function useMLDataProcessor() {
  const {
    isInitialized,
    performanceMetrics,
    compressData,
    decompressData,
    filterNoise,
  } = useMLWasmProcessor({
    autoInitialize: true,
    trackPerformance: true,
  });

  const processLargeDataset = useCallback(
    async (dataset: number[]) => {
      console.log(
        `🚀 Processing large dataset with ${dataset.length} points using WebAssembly...`
      );

      const startTime = performance.now();

      // Step 1: Filter noise for cleaner data
      const filtered = await filterNoise(dataset, 0.1);
      console.log(
        `✅ Noise filtering complete: ${dataset.length} → ${filtered.length} points`
      );

      // Step 2: Compress for efficient storage/transmission
      const compressed = await compressData(filtered);
      console.log(
        `✅ Data compression complete: ${filtered.length * 4} bytes → ${compressed.length} bytes`
      );

      // Step 3: Decompress to verify integrity
      const decompressed = await decompressData(compressed);
      console.log(
        `✅ Data decompression complete: ${compressed.length} bytes → ${decompressed.length} points`
      );

      const totalTime = performance.now() - startTime;
      console.log(`⚡ Total processing time: ${totalTime.toFixed(2)}ms`);

      return {
        originalSize: dataset.length,
        filteredSize: filtered.length,
        compressedSize: compressed.length,
        decompressedSize: decompressed.length,
        processingTime: totalTime,
        compressionRatio: dataset.length / compressed.length,
        filtered,
        compressed,
        decompressed,
      };
    },
    [filterNoise, compressData, decompressData]
  );

  return {
    isInitialized,
    performanceMetrics,
    processLargeDataset,
    compressData,
    decompressData,
    filterNoise,
  };
}
