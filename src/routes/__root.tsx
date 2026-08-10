import { Suspense, useEffect } from 'react';
import {
  createRootRoute,
  Outlet,
  useMatches,
  useRouterState,
} from '@tanstack/react-router';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '@/ErrorFallback';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';
import { HealthDataProvider } from '@/contexts/HealthDataContext';
import {
  AppleSidebarProvider,
  AppleSidebarPanel,
  useAppleSidebar,
} from '@/components/nav/AppleSidebar';
import NavigationHeader from '@/components/NavigationHeader';
import { MobileHeader } from '@/components/nav/MobileHeader';
import { MobileBottomTabs } from '@/components/nav/MobileBottomTabs';
import { useKV } from '@/hooks/useLocalKV';
import type { AllSettings } from '@/lib/settingsTypes';
import { NAV_ITEMS } from '@/lib/navigation';
import { APP_NAME, formatPageTitle } from '@/lib/branding';

/** Resolve current page label from router state + NAV_ITEMS */
function usePageLabel(): string {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const matches = useMatches();
  // Prefer route context label, fall back to NAV_ITEMS lookup
  const lastMatch = matches[matches.length - 1];
  const ctx = lastMatch?.context as { label?: string } | undefined;
  if (ctx?.label) return ctx.label;

  const navItem = NAV_ITEMS.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
  );
  return navItem?.label ?? APP_NAME;
}

function RootLayout() {
  const pageLabel = usePageLabel();

  // Apply dynamic type scale from user settings
  const [userSettings] = useKV<AllSettings | null>('user-settings', null);
  useEffect(() => {
    const scale = userSettings?.preferences?.dynamicTypeScale || 1;
    document.documentElement.style.setProperty(
      '--vs-dynamic-scale',
      String(scale)
    );
  }, [userSettings?.preferences?.dynamicTypeScale]);

  // Update document title on route change
  useEffect(() => {
    document.title = formatPageTitle(pageLabel);
  }, [pageLabel]);

  return (
    <HealthDataProvider>
      <AppleSidebarProvider defaultOpen>
        <AppShell pageLabel={pageLabel} />
      </AppleSidebarProvider>
    </HealthDataProvider>
  );
}

function AppShell({ pageLabel }: { pageLabel: string }) {
  const { isMobile } = useAppleSidebar();

  if (isMobile) {
    return (
      <div className="flex min-h-svh w-screen flex-col overflow-x-hidden bg-background text-foreground">
        <MobileHeader />
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <main
            id="main-content"
            role="main"
            aria-label={pageLabel}
            tabIndex={-1}
            className="flex-1 overflow-x-hidden px-4 pb-20 pt-2"
          >
            <Suspense fallback={<DashboardSkeleton />}>
              <Outlet />
            </Suspense>
          </main>
        </ErrorBoundary>
        <MobileBottomTabs />
      </div>
    );
  }

  // Desktop layout: Sidebar | Header + Content
  return (
    <>
      <AppleSidebarPanel />
      <div className="flex min-h-svh min-w-0 flex-1 flex-col overflow-x-hidden bg-background text-foreground">
        <NavigationHeader />
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <main
            id="main-content"
            role="main"
            aria-label={pageLabel}
            tabIndex={-1}
            className="flex-1 px-6 pb-4 pt-3 lg:px-10 2xl:px-16"
          >
            <Suspense fallback={<DashboardSkeleton />}>
              <div className="mx-auto max-w-[1600px] space-y-6">
                <Outlet />
              </div>
            </Suspense>
          </main>
        </ErrorBoundary>
      </div>
    </>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
