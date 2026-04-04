/**
 * LiDAR Performance Integration
 * Type definitions and exports for performance-optimized LiDAR components
 */

// Export components for use in other parts of the app
export {
  LiDARDataSummary,
  LiDARPointCloudViewer,
  SimpleLiDARList,
} from './SimpleLiDARComponents';

export {
  PerformanceUtils,
  useBatchProcessor,
  useDebouncedUpdate,
  useOptimizedDataFetch,
  useOptimizedWebSocket,
  usePerformanceCache,
  usePerformanceMonitor,
  useVirtualization,
} from '../../../lib/performance/LiDARPerformanceHooks';

export { default as LiDARPerformanceDemo } from './LiDARPerformanceDemo';

// Performance configuration for different use cases
export const PerformanceConfig = {
  // High-performance config for real-time monitoring
  realTime: {
    cacheTTL: 60000, // 1 minute
    batchSize: 100,
    processingDelay: 50,
    maxItems: 50,
  },

  // Balanced config for general use
  balanced: {
    cacheTTL: 300000, // 5 minutes
    batchSize: 50,
    processingDelay: 100,
    maxItems: 100,
  },

  // Memory-optimized config for resource-constrained environments
  memoryOptimized: {
    cacheTTL: 180000, // 3 minutes
    batchSize: 25,
    processingDelay: 200,
    maxItems: 25,
  },
};

// Performance metrics thresholds
export const PerformanceThresholds = {
  renderTime: {
    good: 16, // Under 16ms (60 FPS)
    warning: 33, // Under 33ms (30 FPS)
    critical: 100, // Over 100ms
  },
  memoryUsage: {
    good: 50 * 1024 * 1024, // Under 50MB
    warning: 100 * 1024 * 1024, // Under 100MB
    critical: 200 * 1024 * 1024, // Over 200MB
  },
  processingTime: {
    good: 10, // Under 10ms
    warning: 50, // Under 50ms
    critical: 200, // Over 200ms
  },
};

// Type definitions
export type PerformanceStatus = 'good' | 'warning' | 'critical';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  dataProcessingTime: number;
  cacheHitRate: number;
}

export interface PerformanceConfigType {
  cacheTTL: number;
  batchSize: number;
  processingDelay: number;
  maxItems: number;
}

export interface PerformanceThresholdType {
  good: number;
  warning: number;
  critical: number;
}

// Utility functions
export const PerformanceAnalyzer = {
  /**
   * Analyze performance metrics and return status
   */
  analyzeMetrics: (metrics: PerformanceMetrics) => {
    let renderStatus: PerformanceStatus;
    if (metrics.renderTime <= PerformanceThresholds.renderTime.good) {
      renderStatus = 'good';
    } else if (metrics.renderTime <= PerformanceThresholds.renderTime.warning) {
      renderStatus = 'warning';
    } else {
      renderStatus = 'critical';
    }

    let memoryStatus: PerformanceStatus;
    if (metrics.memoryUsage <= PerformanceThresholds.memoryUsage.good) {
      memoryStatus = 'good';
    } else if (
      metrics.memoryUsage <= PerformanceThresholds.memoryUsage.warning
    ) {
      memoryStatus = 'warning';
    } else {
      memoryStatus = 'critical';
    }

    let processingStatus: PerformanceStatus;
    if (
      metrics.dataProcessingTime <= PerformanceThresholds.processingTime.good
    ) {
      processingStatus = 'good';
    } else if (
      metrics.dataProcessingTime <= PerformanceThresholds.processingTime.warning
    ) {
      processingStatus = 'warning';
    } else {
      processingStatus = 'critical';
    }

    const statuses = [renderStatus, memoryStatus, processingStatus];
    let overallStatus: PerformanceStatus;
    if (statuses.includes('critical')) {
      overallStatus = 'critical';
    } else if (statuses.includes('warning')) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'good';
    }

    return {
      overall: overallStatus,
      render: renderStatus,
      memory: memoryStatus,
      processing: processingStatus,
    };
  },

  /**
   * Get performance recommendations based on metrics
   */
  getRecommendations: (metrics: PerformanceMetrics): string[] => {
    const recommendations: string[] = [];

    if (metrics.renderTime > PerformanceThresholds.renderTime.warning) {
      recommendations.push(
        'Consider reducing component complexity or implementing virtualization'
      );
    }

    if (metrics.memoryUsage > PerformanceThresholds.memoryUsage.warning) {
      recommendations.push(
        'Implement more aggressive caching cleanup or reduce data retention'
      );
    }

    if (
      metrics.dataProcessingTime > PerformanceThresholds.processingTime.warning
    ) {
      recommendations.push(
        'Optimize data processing algorithms or increase batch sizes'
      );
    }

    if (metrics.cacheHitRate < 70) {
      recommendations.push(
        'Adjust cache TTL settings or improve cache key strategies'
      );
    }

    return recommendations;
  },

  /**
   * Format performance metrics for display
   */
  formatMetrics: (metrics: PerformanceMetrics) => ({
    renderTime: `${metrics.renderTime.toFixed(2)}ms`,
    memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
    dataProcessingTime: `${metrics.dataProcessingTime.toFixed(2)}ms`,
    cacheHitRate: `${metrics.cacheHitRate.toFixed(1)}%`,
  }),
};

export default {
  PerformanceConfig,
  PerformanceThresholds,
  PerformanceAnalyzer,
};
