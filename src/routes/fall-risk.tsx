import { PageLayout } from '@/components/layout/PageLayout';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';
import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const FallDetection = lazy(() => import('@/components/health/FallDetection'));

function FallRiskPage() {
  return (
    <PageLayout
      title="Fall Risk Analysis"
      subtitle="AI-powered fall detection with automatic emergency alerts"
    >
      <Suspense fallback={<DashboardSkeleton />}>
        <FallDetection />
      </Suspense>
    </PageLayout>
  );
}

export const Route = createFileRoute('/fall-risk')({
  component: FallRiskPage,
  context: () => ({ label: 'Fall Risk' }),
});
