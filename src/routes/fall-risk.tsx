import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';

const FallDetection = lazy(
  () => import('@/components/health/FallDetection')
);

function FallRiskPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <FallDetection />
    </Suspense>
  );
}

export const Route = createFileRoute('/fall-risk')({
  component: FallRiskPage,
  context: () => ({ label: 'Fall Risk' }),
});
