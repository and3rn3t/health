import { createFileRoute } from '@tanstack/react-router';
import { VitalSenseEnhancedDashboard } from '@/components/health/VitalSenseEnhancedDashboard';

export const Route = createFileRoute('/')({
  component: VitalSenseEnhancedDashboard,
  context: () => ({ label: 'Dashboard' }),
});
