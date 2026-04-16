import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';

const CompleteLiDARIntegration = lazy(
  () => import('@/components/health/lidar/CompleteLiDARIntegration')
);

function LidarPosturePage() {
  return (
    <PageLayout
      title="LiDAR & Posture"
      subtitle="3D posture assessment and gait analysis using LiDAR depth sensing"
    >
      <Suspense fallback={<DashboardSkeleton />}>
        <CompleteLiDARIntegration />
      </Suspense>
    </PageLayout>
  );
}

export const Route = createFileRoute('/lidar-posture')({
  component: LidarPosturePage,
  context: () => ({ label: 'LiDAR & Posture' }),
});
