// 🚀 VitalSense App - Unified Navigation System
import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Core components
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
import { useNavUsage } from '@/hooks/useNavUsage';
import { useThemeMode } from '@/hooks/useThemeMode';
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  CloudUpload,
  FlaskConical,
  Monitor,
  Scan,
  Settings as SettingsIcon,
  Share,
  Shield,
  Smartphone,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';

// Lazy loaded components with fallbacks
const HealthDashboard = lazy(
  () => import('@/components/sections/HealthDashboard')
);

const LiveHealthMonitoring = lazy(() =>
  import('@/components/health/LiveHealthMonitoring').catch(() => ({
    default: () => (
      <div className="p-8 text-center">
        <Activity className="h-12 w-12 text-vitalsense-teal mx-auto mb-4" />
        <h2 className="text-foreground mb-2 text-2xl font-bold">
          Live Health Monitoring
        </h2>
        <p className="text-muted-foreground">
          Real-time health monitoring dashboard coming soon.
        </p>
      </div>
    ),
  }))
);

const FallDetection = lazy(() => import('@/components/health/FallDetection'));
// const HeartHealthMonitoring = lazy(
//   () => import('@/components/health/HeartHealthMonitoring')
// );
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
const FamilyGameification = lazy(
  () => import('@/components/gamification/FamilyGameification')
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

const HealthRecords = lazy(() =>
  import('@/components/sections/HealthRecords').catch(() => ({
    default: () => (
      <div className="p-8 text-center">
        <CloudUpload className="h-12 w-12 text-vitalsense-teal mx-auto mb-4" />
        <h2 className="text-foreground mb-2 text-2xl font-bold">
          Health Records
        </h2>
        <p className="text-muted-foreground">
          Health records management coming soon.
        </p>
      </div>
    ),
  }))
);

const SettingsPanel = lazy(() => import('@/components/sections/SettingsPanel'));
const ShowcaseLabs = lazy(() => import('@/components/sections/ShowcaseLabs'));

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
    component: HealthDashboard,
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
    id: 'analytics',
    label: 'Health Analytics',
    icon: TrendingUp,
    component: HealthAnalytics,
    priority: 1,
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
    id: 'records',
    label: 'Health Records',
    icon: CloudUpload,
    component: HealthRecords,
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
    id: 'health-goals',
    label: 'Health Goals',
    icon: Target,
    component: FamilyGameification,
    priority: 3,
  },
  {
    id: 'labs',
    label: 'Labs / Showcase',
    icon: FlaskConical,
    component: ShowcaseLabs,
    priority: 3,
  },
];

// Main VitalSense App Component (Inner content inside SidebarProvider)
function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { themeMode, toggleThemeMode } = useThemeMode();
  const {
    toggle: toggleSidebar,
    isMobile: _isMobile,
    setOpen: _setOpen,
    setOpenMobile: _setOpenMobile,
  } = useAppleSidebar();
  // Respect default sidebar behavior; do not force-open on mount.
  const { recordUse, sortByUsage, hasAnyUsage } = useNavUsage();

  const quickAccessIds = React.useMemo(() => {
    if (!hasAnyUsage) return new Set<string>();
    return new Set(
      sortByUsage(navigationItems)
        .slice(0, 4)
        .map((i) => i.id)
    );
  }, [hasAnyUsage, sortByUsage]);

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
  const activeComponent = useMemo(
    () => navigationItems.find((item) => item.id === activeTab)?.component,
    [activeTab]
  );

  // Handle tab changes
  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      // Sidebar component handles its own sheet/overlay state; no manual close needed
      recordUse(tabId);
    },
    [recordUse]
  );

  return (
    <div className="bg-background text-foreground flex h-screen">
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
        {hasAnyUsage && (
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
                      onClick={() => handleTabChange(item.id)}
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
                    onClick={() => handleTabChange(item.id)}
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
                    onClick={() => handleTabChange(item.id)}
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
                    onClick={() => handleTabChange(item.id)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </AppleSidebarItem>
                );
              })}
          </AppleSidebarList>
        </AppleSidebarSection>
        <div className="py-1.5 text-xs text-muted-foreground mt-auto px-2">
          © {new Date().getFullYear()} VitalSense
        </div>
      </AppleSidebarPanel>

      {/* Main Content Area within SidebarInset (must be immediate sibling of the peer sidebar) */}
      <AppleSidebarMain bumper="none" className="flex flex-1 flex-col">
        <NavigationHeader
          onSidebarToggle={toggleSidebar}
          themeMode={themeMode}
          onThemeToggle={toggleThemeMode}
          onNavigate={handleTabChange}
        />
        <div className="border-border bg-card border-b" />
        {/* Remove inner overflow to avoid double scroll; AppleSidebarMain is the scroll container */}
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => window.location.reload()}
        >
          <main className="md:p-8 bg-background flex-1 p-6">
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
                {(() => {
                  type WithOptionalHealthData = {
                    healthData?: unknown;
                  };
                  const ActiveComponent = activeComponent as unknown as
                    | React.ComponentType<WithOptionalHealthData>
                    | undefined;
                  return ActiveComponent ? (
                    // Provide a neutral prop for components that expect healthData; others will ignore it.
                    <ActiveComponent healthData={null} />
                  ) : null;
                })()}
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
