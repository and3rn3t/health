import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';

const GaitDashboard = lazy(() =>
  import('@/components/health/GaitDashboardClean').then((m) => ({
    default: m.GaitDashboard,
  }))
);

function GaitAnalysisPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <GaitDashboard />
    </Suspense>
  );
}

export const Route = createFileRoute('/gait-analysis')({
  component: GaitAnalysisPage,
  context: () => ({ label: 'Gait Analysis' }),
});
