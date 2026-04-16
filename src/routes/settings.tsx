import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';

const SettingsPanel = lazy(
  () => import('@/components/sections/SettingsPanel')
);

function SettingsPage() {
  return (
    <PageLayout
      title="Settings"
      subtitle="Customize your VitalSense experience"
    >
      <Suspense fallback={<DashboardSkeleton />}>
        <SettingsPanel />
      </Suspense>
    </PageLayout>
  );
}

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
  context: () => ({ label: 'Settings' }),
});
