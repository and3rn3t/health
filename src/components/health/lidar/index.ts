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

// Advanced LiDAR System
export { AdvancedLiDARAnalytics } from './AdvancedLiDARAnalytics';
// Note: CompleteLiDARIntegration is dynamically imported in App.tsx for code splitting
export { RealDataLiDARIntegration } from './RealDataLiDARIntegration';
