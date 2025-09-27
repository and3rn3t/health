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

// Core components
import { AnalyticsVersionBadge } from '@/components/analytics/AnalyticsVersionBadge';
import Footer from '@/components/Footer';
import NavigationHeader from '@/components/NavigationHeader';
import { ErrorFallback } from '@/ErrorFallback';

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
import { useLiveRegion } from '@/hooks/useLiveRegion';
import { useNavUsage } from '@/hooks/useNavUsage';
import { useThemeMode } from '@/hooks/useThemeMode';
import { HealthDataProcessor } from '@/lib/healthDataProcessor';
import type { AllSettings } from '@/lib/settingsTypes';
import type { ProcessedHealthData } from '@/types';
import { useKV } from '@github/spark/hooks';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Brain,
  Bug,
  Monitor,
  Scan,
  Settings as SettingsIcon,
  Share,
  Shield,
  Smartphone,
  TrendingUp,
  Users,
  Wrench,
  X,
} from 'lucide-react';

// Lazy loaded components with fallbacks
const LandingPage = lazy(() => import('@/components/LandingPage'));
const OnboardingFlow = lazy(
  () => import('@/components/onboarding/OnboardingFlow')
);

const LiveHealthMonitoring = lazy(() =>
  import('@/components/health/VitalSenseEnhancedDashboard')
    .then((module) => ({
      default: module.VitalSenseEnhancedDashboard,
    }))
    .catch(() => ({
      default: () => (
        <div className="p-8 text-center">
          <Activity className="h-12 w-12 text-vitalsense-teal mx-auto mb-4" />
          <h2 className="text-foreground mb-2 text-2xl font-bold">
            VitalSense Live Monitoring
          </h2>
          <p className="text-muted-foreground">
            Real-time health monitoring dashboard loading...
          </p>
        </div>
      ),
    }))
);

const FallDetection = lazy(() => import('@/components/health/FallDetection'));
const EnhancedFallRiskSystem = lazy(
  () => import('@/components/health/EnhancedFallRiskSystem')
);
const HealthAnalytics = lazy(
  () => import('@/components/health/HealthAnalytics')
);

// Newly wired feature pages
const ConnectedDevices = lazy(
  () => import('@/components/health/ConnectedDevices')
);
const ExportData = lazy(() => import('@/components/health/ExportData'));
const EmergencyContactsPage = lazy(
  () => import('@/components/health/EmergencyContactsPage')
);
const CognitiveHealth = lazy(
  () => import('@/components/health/CognitiveHealth')
);

// LiDAR AR / Gait Dashboard (named export -> default wrapper)
const GaitDashboard = lazy(() =>
  import('@/components/health/GaitDashboardClean').then((m) => ({
    default: m.GaitDashboard,
  }))
);

// Enhanced LiDAR Performance Integration
const EnhancedLiDARDashboard = lazy(
  () => import('@/components/health/lidar/EnhancedLiDARIntegration')
);

// Complete LiDAR Advanced System (Next Steps Implementation)
const CompleteLiDARIntegration = lazy(
  () => import('@/components/health/lidar/CompleteLiDARIntegration')
);

const NotificationCenter = lazy(() =>
  import('@/components/sections/NotificationCenter').catch(() => ({
    default: () => (
      <div className="p-8 text-center">
        <Bell className="h-12 w-12 text-vitalsense-teal mx-auto mb-4" />
        <h2 className="text-foreground mb-2 text-2xl font-bold">
          Notification Center
        </h2>
        <p className="text-muted-foreground">
          Notification management coming soon.
        </p>
      </div>
    ),
  }))
);

const CaregiverDashboard = lazy(() =>
  import('@/components/sections/CaregiverDashboard').catch(() => ({
    default: () => (
      <div className="p-8 text-center">
        <Users className="h-12 w-12 text-vitalsense-teal mx-auto mb-4" />
        <h2 className="text-foreground mb-2 text-2xl font-bold">
          Caregiver Dashboard
        </h2>
        <p className="text-muted-foreground">Caregiver portal coming soon.</p>
      </div>
    ),
  }))
);

const SettingsPanel = lazy(() => import('@/components/sections/SettingsPanel'));
const DeveloperTools = lazy(
  () => import('@/components/sections/DeveloperTools')
);
const AdvancedAnalytics = lazy(
  () => import('@/components/sections/AdvancedAnalytics')
);
const DevDiagnostics = lazy(
  () => import('@/components/sections/DevDiagnostics')
);

const PrivacyControls = lazy(() =>
  import('@/components/sections/PrivacyControls').catch(() => ({
    default: () => (
      <div className="p-8 text-center">
        <Shield className="h-12 w-12 text-vitalsense-teal mx-auto mb-4" />
        <h2 className="text-foreground mb-2 text-2xl font-bold">
          Privacy Controls
        </h2>
        <p className="text-muted-foreground">Privacy settings coming soon.</p>
      </div>
    ),
  }))
);

// Navigation structure with priority levels
const navigationItems = [
  // PRIMARY - Always visible in tabs (top 5)
  {
    id: 'dashboard',
    label: 'VitalSense Dashboard',
    icon: Activity,
    component: LiveHealthMonitoring,
    priority: 1,
  },
  {
    id: 'live-monitoring',
    label: 'Live Monitoring',
    icon: Monitor,
    component: LiveHealthMonitoring,
    priority: 1,
  },
  {
    id: 'fall-detection',
    label: 'Fall Detection',
    icon: Shield,
    component: FallDetection,
    priority: 1,
  },
  {
    id: 'enhanced-fall-risk',
    label: 'Enhanced Fall Risk',
    icon: AlertTriangle,
    component: EnhancedFallRiskSystem,
    priority: 1,
  },
  {
    id: 'analytics',
    label: 'Health Analytics',
    icon: TrendingUp,
    component: HealthAnalytics,
    priority: 1,
  },
  {
    id: 'advanced-analytics',
    label: 'Advanced Analytics',
    icon: BarChart3,
    component: AdvancedAnalytics,
    priority: 2,
  },

  // SECONDARY - Extended tabs on larger screens (next 5)
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    component: NotificationCenter,
    priority: 2,
  },
  {
    id: 'caregiver',
    label: 'Caregiver Portal',
    icon: Users,
    component: CaregiverDashboard,
    priority: 2,
  },
  {
    id: 'brain-health',
    label: 'Cognitive Health',
    icon: Brain,
    component: CognitiveHealth,
    priority: 2,
  },
  {
    id: 'lidar-ar',
    label: 'LiDAR AR',
    icon: Scan,
    component: GaitDashboard,
    priority: 2,
  },
  {
    id: 'lidar-performance',
    label: 'LiDAR Performance',
    icon: Activity,
    component: EnhancedLiDARDashboard,
    priority: 2,
  },
  {
    id: 'lidar-advanced',
    label: 'LiDAR Advanced',
    icon: Brain,
    component: CompleteLiDARIntegration,
    priority: 2,
  },
  {
    id: 'emergency-contacts',
    label: 'Emergency Contacts',
    icon: AlertTriangle,
    component: EmergencyContactsPage,
    priority: 2,
  },

  // TERTIARY - Sidebar-only items (remainder)
  {
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    component: SettingsPanel,
    priority: 3,
  },
  {
    id: 'privacy',
    label: 'Privacy Controls',
    icon: Shield,
    component: PrivacyControls,
    priority: 3,
  },
  {
    id: 'device-sync',
    label: 'Device Sync',
    icon: Smartphone,
    component: ConnectedDevices,
    priority: 3,
  },
  {
    id: 'export-data',
    label: 'Export Data',
    icon: Share,
    component: ExportData,
    priority: 3,
  },
  {
    id: 'developer-tools',
    label: 'Developer Tools',
    icon: Wrench,
    component: DeveloperTools,
    priority: 3,
  },
  {
    id: 'dev-diagnostics',
    label: 'Dev Diagnostics',
    icon: Bug,
    component: DevDiagnostics,
    priority: 3,
  },
];

// Main VitalSense App Component (Inner content inside SidebarProvider)
function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  // User preference: lock navigation order (disables Quick Access reordering)
  const [lockNavOrder, setLockNavOrder] = useKV<boolean>(
    'pref-lock-nav-order',
    false
  );
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
  // Persisted health data shared across pages and onboarding
  const [healthData, setHealthData] = useKV<ProcessedHealthData | null>(
    'health-data',
    null
  );
  const [_isPending, startTransition] = useTransition();
  const { themeMode, toggleThemeMode } = useThemeMode();
  const {
    toggle: toggleSidebar,
    isMobile: _isMobile,
    setOpen: _setOpen,
    setOpenMobile: _setOpenMobile,
  } = useAppleSidebar();
  // Respect default sidebar behavior; do not force-open on mount.
  const { recordUse, sortByUsage, hasAnyUsage } = useNavUsage();
  const announce = useLiveRegion();

  const quickAccessIds = React.useMemo(() => {
    if (lockNavOrder || !hasAnyUsage) return new Set<string>();
    return new Set(
      sortByUsage(navigationItems)
        .slice(0, 4)
        .map((i) => i.id)
    );
  }, [hasAnyUsage, sortByUsage, lockNavOrder]);

  // Navigation item organization
  const primaryTabs = useMemo(
    () => navigationItems.filter((item) => item.priority === 1),
    []
  );
  const secondaryTabs = useMemo(
    () => navigationItems.filter((item) => item.priority === 2),
    []
  );

  // Find the active component
  const activeComponent = useMemo(() => {
    const item = navigationItems.find((it) => it.id === activeTab);
    // For the dashboard, prefer LandingPage if available to guide users
    if (item?.id === 'dashboard')
      return LandingPage as unknown as typeof item.component;
    return item?.component;
  }, [activeTab]);

  // Derive a lightweight fall risk score (0..4) from walking steadiness as a simple proxy
  const derivedFallRiskScore = useMemo(() => {
    const ws = healthData?.metrics.walkingSteadiness?.average;
    if (ws == null) return 0;
    const score = (100 - ws) / 25; // 100% steadiness -> 0 risk, 0% -> 4
    return Math.max(0, Math.min(4, Math.round(score * 10) / 10));
  }, [healthData?.metrics.walkingSteadiness?.average]);

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
      // Sidebar component handles its own sheet/overlay state; no manual close needed
      recordUse(tabId);
    },
    [recordUse, startTransition]
  );

  // Prefetch lazy-loaded modules on hover for snappier navigation
  const preloadById = useCallback((id: string) => {
    switch (id) {
      case 'dashboard':
        return import('@/components/sections/HealthDashboard');
      case 'live-monitoring':
        return import('@/components/health/EnhancedVitalSenseDashboard');
      case 'fall-detection':
        return import('@/components/health/FallDetection');
      case 'analytics':
        return import('@/components/health/HealthAnalytics');
      case 'advanced-analytics':
        return import('@/components/sections/AdvancedAnalytics');
      case 'notifications':
        return import('@/components/sections/NotificationCenter');
      case 'caregiver':
        return import('@/components/sections/CaregiverDashboard');
      case 'brain-health':
        return import('@/components/health/CognitiveHealth');
      case 'lidar-ar':
        return import('@/components/health/GaitDashboardClean');
      case 'lidar-performance':
        return import('@/components/health/lidar/EnhancedLiDARIntegration');
      case 'lidar-advanced':
        return import('@/components/health/lidar/CompleteLiDARIntegration');
      case 'emergency-contacts':
        return import('@/components/health/EmergencyContactsPage');
      case 'settings':
        return import('@/components/sections/SettingsPanel');
      case 'privacy':
        return import('@/components/sections/PrivacyControls');
      case 'device-sync':
        return import('@/components/health/ConnectedDevices');
      case 'export-data':
        return import('@/components/health/ExportData');
      case 'developer-tools':
        return import('@/components/sections/DeveloperTools');
      case 'dev-diagnostics':
        return import('@/components/sections/DevDiagnostics');
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
    <div className="bg-background text-foreground pt-safe-top pb-safe-bottom flex h-screen">
      {/* Unified Sidebar (Apple HIG style) */}
      <AppleSidebarPanel
        id="app-sidebar"
        side="left"
        collapsible="offcanvas"
        variant="inset"
        withSpacer={true}
      >
        <AppleSidebarHeader>
          <div className="h-12 px-3 flex items-center justify-between py-2">
            <h2 className="text-foreground text-sm font-semibold">
              VitalSense
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AppleSidebarHeader>
        {/* Quick Access */}
        {hasAnyUsage && !lockNavOrder && (
          <AppleSidebarSection>
            <div className="text-xs text-muted-foreground px-2 pb-2 font-medium">
              Quick Access
            </div>
            <AppleSidebarList>
              {sortByUsage(navigationItems)
                .slice(0, 4)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <AppleSidebarItem
                      key={`qa-${item.id}`}
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
        )}
        {/* Primary */}
        <AppleSidebarSection>
          <div className="text-xs text-muted-foreground px-2 pb-2 font-medium">
            Primary
          </div>
          <AppleSidebarList>
            {primaryTabs
              .filter((i) => !quickAccessIds.has(i.id))
              .map((item) => {
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
        {/* Secondary */}
        <AppleSidebarSection>
          <div className="text-xs text-muted-foreground px-2 pb-2 font-medium">
            More
          </div>
          <AppleSidebarList>
            {secondaryTabs
              .filter((i) => !quickAccessIds.has(i.id))
              .map((item) => {
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
        {/* Tertiary */}
        <AppleSidebarSection>
          <div className="text-xs text-muted-foreground px-2 pb-2 font-medium">
            Settings
          </div>
          <AppleSidebarList>
            {navigationItems
              .filter((i) => i.priority === 3 && !quickAccessIds.has(i.id))
              .map((item) => {
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
            <AppleSidebarItem
              data-id="__lock-nav-order"
              active={false}
              onClick={() => setLockNavOrder((v) => !v)}
              aria-pressed={lockNavOrder}
              className="text-xs h-auto min-h-[36px] justify-start py-1"
            >
              {lockNavOrder
                ? 'Unlock Navigation Order'
                : 'Lock Navigation Order'}
            </AppleSidebarItem>
          </AppleSidebarList>
        </AppleSidebarSection>
        <div className="py-1.5 text-xs text-muted-foreground mt-auto px-2">
          © {new Date().getFullYear()} VitalSense
        </div>
      </AppleSidebarPanel>

      {/* Main Content Area within SidebarInset (must be immediate sibling of the peer sidebar) */}
      <AppleSidebarMain bumper="none" className="flex flex-1 flex-col">
        <div className="pr-3 flex items-center gap-2">
          <NavigationHeader
            onSidebarToggle={toggleSidebar}
            themeMode={themeMode}
            onThemeToggle={toggleThemeMode}
            onNavigate={handleTabChange}
          />
          <AnalyticsVersionBadge />
        </div>
        {/* Remove inner overflow to avoid double scroll; AppleSidebarMain is the scroll container */}
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          resetKeys={[activeTab]}
        >
          <main
            id="main-content"
            role="main"
            aria-label={activeLabel || 'Main content'}
            className="bg-background md:px-6 md:pt-3 pb-3 md:pb-4 flex-1 px-4 pt-2"
          >
            {/* Lightweight onboarding banner on dashboard only */}
            {activeTab === 'dashboard' && (
              <Suspense fallback={null}>
                <OnboardingFlow
                  onNavigate={handleTabChange}
                  onHealthDataImported={(d) => setHealthData(d)}
                />
              </Suspense>
            )}
            <Suspense
              fallback={
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin border-teal-600 h-8 w-8 rounded-full border-b-2"></div>
                  <span className="ml-3 text-muted-foreground">
                    Loading VitalSense...
                  </span>
                </div>
              }
            >
              <div className="mx-auto max-w-7xl space-y-6">
                <h1 className="sr-only" aria-live="polite">
                  {activeLabel}
                </h1>
                {activeTab === 'dashboard' ? (
                  <LandingPage
                    healthData={healthData ?? null}
                    fallRiskScore={derivedFallRiskScore}
                    onRefreshData={async () => {
                      const data =
                        await HealthDataProcessor.processHealthData();
                      setHealthData(data);
                    }}
                    onNavigateToFeature={(featureId) => {
                      const map: Record<string, string> = {
                        insights: 'analytics',
                        analytics: 'analytics',
                        'fall-risk': 'fall-detection',
                        'ai-recommendations': 'advanced-analytics',
                        'realtime-scoring': 'live-monitoring',
                        family: 'caregiver',
                        emergency: 'emergency-contacts',
                        import: 'dashboard',
                        'healthkit-guide': 'device-sync',
                        'system-status': 'dev-diagnostics',
                      };
                      const target = map[featureId] ?? 'dashboard';
                      handleTabChange(target);
                    }}
                  />
                ) : (
                  (() => {
                    type WithOptionalHealthData = {
                      healthData?: unknown;
                    };
                    const ActiveComponent = activeComponent as unknown as
                      | React.ComponentType<WithOptionalHealthData>
                      | undefined;
                    return ActiveComponent ? (
                      // Provide shared healthData to components that can consume it.
                      <ActiveComponent healthData={healthData} />
                    ) : null;
                  })()
                )}
              </div>
            </Suspense>
          </main>
        </ErrorBoundary>
        <Footer onNavigate={handleTabChange} />
      </AppleSidebarMain>

      {/* AppleSidebar handles mobile overlay internally */}
    </div>
  );
}

export default function App() {
  return (
    <AppleSidebarProvider defaultOpen={false}>
      <AppContent />
    </AppleSidebarProvider>
  );
}
