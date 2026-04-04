import EnhancedAnalyticsDashboard from '@/components/analytics/EnhancedAnalyticsDashboard';
import type { ProcessedHealthData } from '@/types';

interface HealthAnalyticsProps {
  healthData?: ProcessedHealthData | null;
}

export default function HealthAnalytics({ healthData = null }: HealthAnalyticsProps) {
  // Use the enhanced analytics dashboard
  return <EnhancedAnalyticsDashboard healthData={healthData} />;
}
