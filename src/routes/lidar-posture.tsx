import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';

const CompleteLiDARIntegration = lazy(
  () => import('@/components/health/lidar/CompleteLiDARIntegration')
);

function LidarPosturePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <CompleteLiDARIntegration />
    </Suspense>
  );
}

export const Route = createFileRoute('/lidar-posture')({
  component: LidarPosturePage,
  context: () => ({ label: 'LiDAR & Posture' }),
});
