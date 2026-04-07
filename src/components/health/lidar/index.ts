/**
 * Clean LiDAR Components Index
 * Main entry point for production-ready, lint-compliant LiDAR components
 */

// Shared types, schemas, and helpers (used by LiDARGaitAnalyzerClean and sub-components)
export type {
  BadgeVariant,
  FallRiskLike,
  FusedRisk,
  LiDARGaitAnalyzerProps,
  LiDARGaitMetrics,
  LiDARPreferences,
  LiDARSession,
  ProtocolType,
  QualityGrade,
  RiskLevel,
  XRNavigator,
} from './lidar-types';
export {
  calcEffectiveDurationSec,
  computeQuality,
  detectWebxrSupport,
  formatTargetLabel,
  fuseRisks,
  getQualityBadgeVariant,
  getRiskBadgeVariant,
  getTargetLabel,
  lidarGaitMetricsSchema,
  lidarSessionSchema,
  renderChangeVsPrevious,
} from './lidar-types';

// Extracted sub-components
export { LiDARControls, type ControlsProps } from './LiDARControls';
export { LiDAROverview, type OverviewProps } from './LiDAROverview';
export { LiDARHistory, type HistoryProps } from './LiDARHistory';

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
