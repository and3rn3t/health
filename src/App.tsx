// 🚀 VitalSense App - Unified Navigation System
import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { SafeLogger } from '@/lib/errorHandling';

// Debug logging (only in development)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  SafeLogger.debug('App.tsx: Starting to load');
}

// Core components
import Footer from '@/components/Footer';
import NavigationHeader from '@/components/NavigationHeader';
import { DeviceHealthMonitor } from '@/components/health/DeviceHealthMonitor';
import { ErrorFallback } from '@/ErrorFallback';

// Mobile-optimized components
import { FloatingActionButton } from '@/components/nav/FloatingActionButton';
import { MobileBottomTabs } from '@/components/nav/MobileBottomTabs';
import { MobileHeader } from '@/components/nav/MobileHeader';

// Icons for navigation
import {
  AppleSidebarHeader,
  AppleSidebarItem,
  AppleSidebarList,
  AppleSidebarMain,
  AppleSidebarPanel,
  AppleSidebarProvider,
  AppleSidebarSection,
  useAppleSidebar,
} from '@/components/nav/AppleSidebar';
import { Button } from '@/components/ui/button';
import { useKV } from '@/hooks/useCloudflareKV';
import { useLiveRegion } from '@/hooks/useLiveRegion';
import { useThemeMode } from '@/hooks/useThemeMode';
import type { AllSettings } from '@/lib/settingsTypes';
import { cn } from '@/lib/utils';
import { createLazyNamedComponent } from '@/lib/lazyLoading';
import {
  createNavigationItems,
  FEATURE_TAB_MAP,
  type NavigationItem,
} from '@/lib/navigationHelpers';
import { HealthDataProvider, useHealthData } from '@/contexts/HealthDataContext';
// Optimized icon imports - individual imports reduce bundle size
import {
  Activity,
  AlertTriangle,
  Footprints,
  Scan,
  Settings as SettingsIcon,
  X,
} from '@/lib/icons';

// Lazy loaded components with fallbacks
const LandingPage = lazy(() => import('@/components/LandingPageOptimized'));

const LiveHealthMonitoring = createLazyNamedComponent(
  () => import('@/components/health/VitalSenseEnhancedDashboard'),
  'VitalSenseEnhancedDashboard',
  {
    title: 'VitalSense Live Monitoring',
    message: 'Real-time health monitoring dashboard loading...',
    icon: Activity,
  }
);

const FallDetection = lazy(() => import('@/components/health/FallDetection'));

// LiDAR AR / Gait Dashboard (named export -> default wrapper)
const GaitDashboard = createLazyNamedComponent(
  () => import('@/components/health/GaitDashboardClean'),
  'GaitDashboard',
  {
    title: 'Gait Dashboard',
    message: 'Gait analysis dashboard loading...',
    icon: Scan,
  }
);

// LiDAR Integration
const CompleteLiDARIntegration = lazy(
  () => import('@/components/health/lidar/CompleteLiDARIntegration')
);

const SettingsPanel = lazy(() => import('@/components/sections/SettingsPanel'));

// Navigation structure — focused on posture & gait metrics
const navigationItems: NavigationItem[] = createNavigationItems([
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Activity,
    component: LiveHealthMonitoring,
    priority: 1,
  },
  {
    id: 'gait-analysis',
    label: 'Gait Analysis',
    icon: Footprints,
    component: GaitDashboard,
    priority: 1,
  },
  {
    id: 'lidar-posture',
    label: 'LiDAR & Posture',
    icon: Scan,
    component: CompleteLiDARIntegration,
    priority: 1,
  },
  {
    id: 'fall-risk',
    label: 'Fall Risk',
    icon: AlertTriangle,
    component: FallDetection,
    priority: 1,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    component: SettingsPanel,
    priority: 2,
  },
]);

// Main VitalSense App Component (Inner content inside SidebarProvider)
function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  // User settings for dynamic type scale (read-only here)
  const [userSettings] = useKV<AllSettings | null>('user-settings', null);
  // Apply dynamic type scale to root element when settings change
  useEffect(() => {
    const scale = userSettings?.preferences?.dynamicTypeScale || 1;
    document.documentElement.style.setProperty(
      '--vs-dynamic-scale',
      String(scale)
    );
  }, [userSettings?.preferences?.dynamicTypeScale]);
  const { healthData, fallRiskScore, refreshData } = useHealthData();
  const [, startTransition] = useTransition();
  const { themeMode, toggleThemeMode } = useThemeMode();
  const { toggle: toggleSidebar, isMobile } = useAppleSidebar();
  const announce = useLiveRegion();

  // Find the active component (LandingPage handled separately via ternary)
  const activeComponent = useMemo(() => {
    const item = navigationItems.find((it) => it.id === activeTab);
    if (item?.id === 'dashboard') return undefined;
    return item?.component;
  }, [activeTab]);



  // Update document title to reflect the current section for better usability
  const activeLabel = useMemo(
    () =>
      navigationItems.find((item) => item.id === activeTab)?.label ??
      'VitalSense',
    [activeTab]
  );
  useEffect(() => {
    document.title = `${activeLabel} • VitalSense`;
    if (activeLabel) announce(`Viewing ${activeLabel}`);
  }, [activeLabel, announce]);

  // Handle tab changes
  const handleTabChange = useCallback(
    (tabId: string) => {
      startTransition(() => setActiveTab(tabId));
    },
    [startTransition]
  );

  // Mobile quick actions handler
  const handleQuickAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'quick-vitals':
          handleTabChange('dashboard');
          announce('Dashboard opened');
          break;
        default:
          break;
      }
    },
    [handleTabChange, announce]
  );

  // Listen for global navigation events
  useEffect(() => {
    const handleNavigate = ((event: CustomEvent<{ feature: string }>) => {
      const featureId = event.detail.feature;
      const target = FEATURE_TAB_MAP[featureId] ?? featureId;
      handleTabChange(target);
    }) as EventListener;

    if (globalThis.window !== undefined) {
      globalThis.window.addEventListener('navigate', handleNavigate);
      return () => {
        globalThis.window?.removeEventListener('navigate', handleNavigate);
      };
    }
  }, [handleTabChange]);

  // Prefetch lazy-loaded modules on hover for snappier navigation
  const preloadById = useCallback((id: string) => {
    switch (id) {
      case 'dashboard':
        return import('@/components/health/VitalSenseEnhancedDashboard');
      case 'gait-analysis':
        return import('@/components/health/GaitDashboardClean');
      case 'lidar-posture':
        return import('@/components/health/lidar/CompleteLiDARIntegration');
      case 'fall-risk':
        return import('@/components/health/FallDetection');
      case 'settings':
        return import('@/components/sections/SettingsPanel');
      default:
        return Promise.resolve();
    }
  }, []);

  const onNavItemClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (id) handleTabChange(id);
    },
    [handleTabChange]
  );

  const onNavItemHover = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (id) preloadById(id);
    },
    [preloadById]
  );

  return (
    <>
      {/* Mobile-specific overlays */}
      {isMobile && (
        <>
          {/* Mobile Bottom Navigation */}
          <MobileBottomTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            navigationItems={navigationItems}
          />

          {/* Floating Action Button */}
          <FloatingActionButton onQuickAction={handleQuickAction} />
        </>
      )}

      <div
        className={cn(
          'pt-safe-top pb-safe-bottom flex min-h-screen bg-background text-foreground',
          isMobile ? 'mobile-forced flex-col pb-20' : 'flex-row'
        )}
      >
        {/* Unified Sidebar (Apple HIG style) - hidden on mobile except for overflow */}
        <AppleSidebarPanel
          id="app-sidebar"
          side="left"
          collapsible="offcanvas"
          variant="inset"
          withSpacer={true}
          className={cn(isMobile && 'hidden')}
        >
          <AppleSidebarHeader>
            <div className="flex h-12 items-center justify-between px-3 py-2">
              <h2 className="text-sm font-semibold text-foreground">
                VitalSense
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="hover:bg-muted md:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AppleSidebarHeader>
          {/* Navigation */}
          <AppleSidebarSection>
            <AppleSidebarList>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <AppleSidebarItem
                    key={item.id}
                    active={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    data-id={item.id}
                    onClick={onNavItemClick}
                    onMouseEnter={onNavItemHover}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </AppleSidebarItem>
                );
              })}
            </AppleSidebarList>
          </AppleSidebarSection>
          <div className="mt-auto px-2 py-1.5 text-xs text-muted-foreground">
            © {new Date().getFullYear()} VitalSense
          </div>
        </AppleSidebarPanel>

        {/* Main Content Area within SidebarInset (must be immediate sibling of the peer sidebar) */}
        <AppleSidebarMain
          bumper="none"
          className={cn('flex flex-1 flex-col', isMobile && 'w-full')}
        >
          {isMobile ? (
            <MobileHeader
              activeTab={activeTab}
              activeLabel={activeLabel}
              themeMode={themeMode}
              onThemeToggle={toggleThemeMode}
              onMenuToggle={toggleSidebar}
              navigationItems={navigationItems}
              onNavigate={handleTabChange}
            />
          ) : (
            <div className="flex items-center gap-2 pr-3">
              <NavigationHeader
                onSidebarToggle={toggleSidebar}
                themeMode={themeMode}
                onThemeToggle={toggleThemeMode}
                onNavigate={handleTabChange}
              />
            </div>
          )}
          {/* Remove inner overflow to avoid double scroll; AppleSidebarMain is the scroll container */}
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            resetKeys={[activeTab]}
          >
            <main
              id="main-content"
              role="main"
              aria-label={activeLabel || 'Main content'}
              className="flex-1 bg-background px-4 pb-3 pt-2 md:px-6 md:pb-4 md:pt-3 lg:px-10 2xl:px-16"
            >
              <Suspense
                fallback={
                  <div className="flex h-64 items-center justify-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-600"></div>
                    <span className="text-muted-foreground">
                      Loading VitalSense...
                    </span>
                  </div>
                }
              >
                <div
                  key={activeTab}
                  className={cn('mx-auto max-w-[1600px] space-y-6')}
                  role="tabpanel"
                  data-state="active"
                >
                  <h1 className="sr-only" aria-live="polite">
                    {activeLabel}
                  </h1>
                  {activeTab === 'dashboard' ? (
                    <LandingPage
                      healthData={healthData}
                      fallRiskScore={fallRiskScore}
                      onRefreshData={refreshData}
                      onNavigateToFeature={(featureId) => {
                        handleTabChange(
                          FEATURE_TAB_MAP[featureId] ?? 'dashboard'
                        );
                      }}
                    />
                  ) : (
                    activeComponent
                      ? React.createElement(activeComponent)
                      : null
                  )}
                </div>
              </Suspense>
            </main>
          </ErrorBoundary>
          <Footer onNavigate={handleTabChange} />
          {/* Always mounted: monitors battery/disconnect alerts globally */}
          <DeviceHealthMonitor />
        </AppleSidebarMain>

        {/* AppleSidebar handles mobile overlay internally */}
      </div>
    </>
  );
}

export default function App() {
  return (
    <HealthDataProvider>
      <AppleSidebarProvider defaultOpen={false}>
        <AppContent />
      </AppleSidebarProvider>
    </HealthDataProvider>
  );
}
