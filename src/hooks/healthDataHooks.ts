// Centralized public hooks for health data context
// Keeps provider file component-only to satisfy fast refresh rules.
import {
  useConnectionStatus,
  useHealthData,
  useHealthMetrics,
  useMLInsights,
  useRawHealthData,
  useRealTimeStream,
} from './optimizedHealthDataCore';

export {
  useConnectionStatus,
  useHealthData,
  useHealthMetrics,
  useMLInsights,
  useRawHealthData,
  useRealTimeStream,
};
