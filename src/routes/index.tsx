import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';
import { useHealthData } from '@/contexts/HealthDataContext';

const LandingPage = lazy(() => import('@/components/LandingPageOptimized'));

function DashboardPage() {
  const { healthData, fallRiskScore, refreshData } = useHealthData();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <LandingPage
        healthData={healthData}
        fallRiskScore={fallRiskScore}
        onRefreshData={refreshData}
        onNavigateToFeature={() => {
          // Navigation is now handled by TanStack Router <Link> in LandingPage
        }}
      />
    </Suspense>
  );
}

export const Route = createFileRoute('/')({
  component: DashboardPage,
  context: () => ({ label: 'Dashboard' }),
});
