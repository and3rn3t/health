import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';

const SettingsPanel = lazy(
  () => import('@/components/sections/SettingsPanel')
);

function SettingsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <SettingsPanel />
    </Suspense>
  );
}

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
  context: () => ({ label: 'Settings' }),
});
