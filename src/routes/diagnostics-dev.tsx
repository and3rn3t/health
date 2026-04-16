import { createFileRoute, Navigate } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';
import { isDev } from '@/lib/env';

const DiagnosticsPanel = lazy(
  () => import('@/components/sections/DiagnosticsPanel')
);

function DiagnosticsDevPage() {
  // Gate to dev environments only
  if (!isDev()) {
    return <Navigate to="/" />;
  }

  return (
    <PageLayout
      title="Developer Diagnostics"
      subtitle="System health, bindings, auth, and performance"
    >
      <Suspense fallback={<DashboardSkeleton />}>
        <DiagnosticsPanel />
      </Suspense>
    </PageLayout>
  );
}

export const Route = createFileRoute('/diagnostics-dev')({
  component: DiagnosticsDevPage,
  context: () => ({ label: 'Diagnostics' }),
});
