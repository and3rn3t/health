// 🚀 VitalSense App - Unified Navigation System
import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Core components
import Footer from '@/components/Footer';
import NavigationHeader from '@/components/NavigationHeader';
import { ErrorFallback } from '@/ErrorFallback';

// Icons for navigation
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  CloudUpload,
  Heart,
  Monitor,
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
        <Activity className="h-12 w-12 text-teal-600 mx-auto mb-4" />
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Live Health Monitoring
        </h2>
        <p className="text-gray-600">
          Real-time health monitoring dashboard coming soon.
        </p>
      </div>
    ),
  }))
);

const FallDetection = lazy(() => import('@/components/health/FallDetection'));
const HeartHealthMonitoring = lazy(
  () => import('@/components/health/HeartHealthMonitoring')
);
const HealthAnalytics = lazy(
  () => import('@/components/health/HealthAnalytics')
);

const NotificationCenter = lazy(() =>
  import('@/components/sections/NotificationCenter').catch(() => ({
    default: () => (
      <div className="p-8 text-center">
        <Bell className="h-12 w-12 text-teal-600 mx-auto mb-4" />
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Notification Center
        </h2>
        <p className="text-gray-600">Notification management coming soon.</p>
      </div>
    ),
  }))
);

const CaregiverDashboard = lazy(() =>
  import('@/components/sections/CaregiverDashboard').catch(() => ({
    default: () => (
      <div className="p-8 text-center">
        <Users className="h-12 w-12 text-teal-600 mx-auto mb-4" />
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Caregiver Dashboard
        </h2>
        <p className="text-gray-600">Caregiver portal coming soon.</p>
      </div>
    ),
  }))
);

const HealthRecords = lazy(() =>
  import('@/components/sections/HealthRecords').catch(() => ({
    default: () => (
      <div className="p-8 text-center">
        <CloudUpload className="h-12 w-12 text-teal-600 mx-auto mb-4" />
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Health Records
        </h2>
        <p className="text-gray-600">Health records management coming soon.</p>
      </div>
    ),
  }))
);

const SettingsPanel = lazy(() => import('@/components/sections/SettingsPanel'));

const PrivacyControls = lazy(() =>
  import('@/components/sections/PrivacyControls').catch(() => ({
    default: () => (
      <div className="p-8 text-center">
        <Shield className="h-12 w-12 text-teal-600 mx-auto mb-4" />
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Privacy Controls
        </h2>
        <p className="text-gray-600">Privacy settings coming soon.</p>
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
    id: 'heart-health',
    label: 'Heart Health',
    icon: Heart,
    component: HeartHealthMonitoring,
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
    component: () => (
      <div className="p-8 text-center">
        <Brain className="h-12 w-12 text-teal-600 mx-auto mb-4" />
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Cognitive Health Coming Soon
        </h2>
        <p className="text-gray-600">
          Advanced brain health monitoring features will be available in a
          future update.
        </p>
      </div>
    ),
    priority: 2,
  },
  {
    id: 'emergency-contacts',
    label: 'Emergency Contacts',
    icon: AlertTriangle,
    component: () => (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Emergency Contacts
        </h2>
        <p className="text-gray-600">
          Manage your emergency contacts and alert preferences.
        </p>
      </div>
    ),
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
    component: () => (
      <div className="p-8 text-center">
        <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Device Sync</h2>
        <p className="text-gray-600">
          Connect and sync your health devices and wearables.
        </p>
      </div>
    ),
    priority: 3,
  },
  {
    id: 'export-data',
    label: 'Export Data',
    icon: Share,
    component: () => (
      <div className="p-8 text-center">
        <Share className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Export Data</h2>
        <p className="text-gray-600">
          Export your health data for personal records or sharing with
          healthcare providers.
        </p>
      </div>
    ),
    priority: 3,
  },
  {
    id: 'health-goals',
    label: 'Health Goals',
    icon: Target,
    component: () => (
      <div className="p-8 text-center">
        <Target className="h-12 w-12 text-purple-600 mx-auto mb-4" />
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Health Goals</h2>
        <p className="text-gray-600">
          Set and track your personal health and wellness goals.
        </p>
      </div>
    ),
    priority: 3,
  },
];

// Main VitalSense App Component
function App() {
  console.log('🏠 App component rendering...');

  const [activeTab, setActiveTab] = useState('dashboard');
  // Sidebar state - open by default for better UX
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Adjust sidebar for mobile screens
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobile = window.innerWidth < 1024; // below lg breakpoint
      if (isMobile) {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    checkScreenSize();

    // Listen for resize
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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

  // Toggle sidebar function with debug logging
  const toggleSidebar = useCallback(() => {
    console.log(
      '🍔 App: Hamburger menu clicked - toggleSidebar function called!'
    );
    setSidebarOpen((prev) => {
      const newState = !prev;
      console.log('🔄 App: Sidebar state changing from', prev, 'to', newState);
      return newState;
    });
  }, []);

  // Handle tab changes
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setSidebarOpen(false); // Close sidebar on tab change
  }, []);

  console.log(
    '🔍 Current sidebar state:',
    sidebarOpen,
    'Active tab:',
    activeTab
  );

  // Debug the sidebar classes
  const sidebarClasses = `bg-white w-64 fixed inset-y-0 left-0 z-50 flex flex-col shadow-xl transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`;
  console.log('🎨 Sidebar classes:', sidebarClasses);

  return (
    <div className="bg-gray-50 flex h-screen">
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => window.location.reload()}
      >
        {/* Sidebar - Mobile: overlay, Desktop: static */}
        <div
          className={`w-64 fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Sidebar Header */}
          <div className="border-gray-200 flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold text-gray-900">
              VitalSense Menu
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Sidebar Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <nav className="space-y-2 p-4">
              {/* All Navigation Items in Sidebar */}
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`space-x-3 px-3 flex w-full items-center rounded-lg py-2 text-left transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 border-teal-500 border-l-4'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Overlay - only visible on mobile when sidebar is open */}
        {sidebarOpen && (
          <button
            className="bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden"
            onClick={toggleSidebar}
            onKeyDown={(e) => e.key === 'Escape' && toggleSidebar()}
            aria-label="Close sidebar"
          />
        )}

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <NavigationHeader
            onSidebarToggle={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />

          {/* Tab Navigation */}
          <div className="border-gray-200 border-b bg-white">
            {/* Primary Tabs - Always visible */}
            <div className="flex overflow-x-auto">
              {primaryTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`py-3 flex flex-shrink-0 items-center space-x-2 border-b-2 px-4 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-teal-500 text-teal-600'
                        : 'hover:text-gray-700 hover:border-gray-300 border-transparent text-gray-500'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Secondary Tabs - Hidden on mobile, shown on tablet+ */}
            <div className="md:flex hidden border-t border-gray-100">
              {secondaryTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-3 text-xs flex items-center space-x-2 py-2 font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Suspense
                fallback={
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin border-teal-600 h-8 w-8 rounded-full border-b-2"></div>
                    <span className="ml-3 text-gray-600">
                      Loading VitalSense...
                    </span>
                  </div>
                }
              >
                {activeComponent && React.createElement(activeComponent)}
              </Suspense>
            </ErrorBoundary>
          </main>

          <Footer onNavigate={handleTabChange} />
        </div>
      </ErrorBoundary>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <button
          className="bg-opacity-50 fixed inset-0 z-40 h-full w-full border-0 bg-black p-0 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
    </div>
  );
}

export default App;
