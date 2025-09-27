/**
 * Clean LiDAR Components Index
 * Main entry point for production-ready, lint-compliant LiDAR components
 */

// Performance optimization system
export {
  CleanLiDARPerformanceProvider,
  useCleanLiDARPerformance,
  useDebouncedProcessing,
  usePerformanceMetrics,
} from '../../../lib/performance/CleanLiDARPerformanceOptimizer';

// Clean UI Components
export {
  default as CleanLiDARList,
  LiDARDataSummary,
  LiDARPointCloudViewer,
  type CleanLiDARListProps,
  type LiDARDataPoint,
  type LiDARScanData,
} from './CleanLiDARComponents';

// Integration Components
export { default as EnhancedLiDARIntegration } from './EnhancedLiDARIntegration';
export { default as LiDARPerformanceDemo } from './LiDARPerformanceDemo';
export { LiDARPerformanceIntegration } from './LiDARPerformanceIntegration';

// Next Steps Implementation - Advanced LiDAR System
export { AdvancedLiDARAnalytics } from './AdvancedLiDARAnalytics';
export { default as CompleteLiDARIntegration } from './CompleteLiDARIntegration';
export { RealDataLiDARIntegration } from './RealDataLiDARIntegration';

// Re-export performance config
export { PerformanceConfig } from './performance-integration';
