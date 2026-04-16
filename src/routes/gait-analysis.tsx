import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';

const GaitDashboard = lazy(() =>
  import('@/components/health/GaitDashboardClean').then((m) => ({
    default: m.GaitDashboard,
  }))
);

function GaitAnalysisPage() {
  return (
    <PageLayout
      title="Gait Analysis"
      subtitle="Walking pattern analysis using advanced sensors and real-time tracking"
      actions={<Badge variant="outline" className="text-xs">Advanced Analytics</Badge>}
    >
      <Suspense fallback={<DashboardSkeleton />}>
        <GaitDashboard />
      </Suspense>
    </PageLayout>
  );
}

export const Route = createFileRoute('/gait-analysis')({
  component: GaitAnalysisPage,
  context: () => ({ label: 'Gait Analysis' }),
});
