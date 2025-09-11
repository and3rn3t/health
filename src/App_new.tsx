// 🚀 VitalSense App - Unified Navigation System
import { Suspense, lazy, useCallback, useMemo, useState } from 'react';
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
  Pill,
  Settings,
  Share,
  Shield,
  Smartphone,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';

// Lazy loaded components
const HealthDashboard = lazy(
  () => import('@/components/sections/HealthDashboard')
);
const GameCenter = lazy(() =>
  import('@/components/GameCenter').catch(() => ({
    default: () => (
      <div className="p-8 text-center">
        <h2 className="text-xl">Game Center - Coming Soon</h2>
      </div>
    ),
  }))
);
const SettingsPanel = lazy(() =>
  import('@/components/SettingsPanel').catch(() => ({
    default: () => (
      <div className="p-8 text-center">
        <h2 className="text-xl">Settings Panel - Coming Soon</h2>
      </div>
    ),
  }))
);
const UserProfile = lazy(() =>
  import('@/components/UserProfile').catch(() => ({
    default: () => (
      <div className="p-8 text-center">
        <h2 className="text-xl">User Profile - Coming Soon</h2>
      </div>
    ),
  }))
);

// Define unified navigation item structure
interface NavigationItem {
  id: string;
  label: string;
  shortLabel?: string; // For mobile/compact display
  icon: React.ElementType;
  priority: 'primary' | 'secondary' | 'tertiary'; // For responsive display
  category: string;
  badge?: string; // Optional badge text
}

// Create unified navigation configuration
const createUnifiedNavigation = (): NavigationItem[] => [
  // Primary Navigation - Always visible in top tabs
  {
    id: 'dashboard',
    label: 'Health Dashboard',
    shortLabel: 'Dashboard',
    icon: Activity,
    priority: 'primary',
    category: 'Main',
  },
  {
    id: 'live-monitoring',
    label: 'Live Monitoring',
    shortLabel: 'Live',
    icon: Monitor,
    priority: 'primary',
    category: 'Monitoring',
    badge: 'Live',
  },
  {
    id: 'health-analytics',
    label: 'Health Analytics',
    shortLabel: 'Analytics',
    icon: TrendingUp,
    priority: 'primary',
    category: 'Analytics',
  },
  {
    id: 'alerts',
    label: 'Health Alerts',
    shortLabel: 'Alerts',
    icon: AlertTriangle,
    priority: 'primary',
    category: 'Alerts',
  },
  {
    id: 'profile',
    label: 'User Profile',
    shortLabel: 'Profile',
    icon: Users,
    priority: 'primary',
    category: 'Profile',
  },

  // Secondary Navigation - Visible in extended tabs on larger screens
  {
    id: 'gait-analysis',
    label: 'Gait Analysis',
    icon: Activity,
    priority: 'secondary',
    category: 'Monitoring',
  },
  {
    id: 'fall-detection',
    label: 'Fall Detection',
    icon: Shield,
    priority: 'secondary',
    category: 'Monitoring',
  },
  {
    id: 'heart-health',
    label: 'Heart Health',
    icon: Heart,
    priority: 'secondary',
    category: 'Monitoring',
  },
  {
    id: 'ai-insights',
    label: 'AI Health Insights',
    icon: Brain,
    priority: 'secondary',
    category: 'AI & ML',
  },
  {
    id: 'games',
    label: 'Health Games',
    icon: Target,
    priority: 'secondary',
    category: 'Gamification',
  },

  // Tertiary Navigation - Sidebar only
  {
    id: 'ws-health-panel',
    label: 'Live Health Stream',
    icon: Activity,
    priority: 'tertiary',
    category: 'Advanced',
  },
  {
    id: 'real-time-scoring',
    label: 'Real-time Scoring',
    icon: TrendingUp,
    priority: 'tertiary',
    category: 'Advanced',
  },
  {
    id: 'predictive-alerts',
    label: 'Predictive Alerts',
    icon: Brain,
    priority: 'tertiary',
    category: 'AI & ML',
  },
  {
    id: 'smart-notifications',
    label: 'Smart Notifications',
    icon: Bell,
    priority: 'tertiary',
    category: 'AI & ML',
  },
  {
    id: 'apple-watch-guide',
    label: 'Apple Watch Setup',
    icon: Smartphone,
    priority: 'tertiary',
    category: 'Setup',
  },
  {
    id: 'comprehensive-healthkit',
    label: 'HealthKit Integration',
    icon: Heart,
    priority: 'tertiary',
    category: 'Setup',
  },
  {
    id: 'websocket-guide',
    label: 'WebSocket Architecture',
    icon: Share,
    priority: 'tertiary',
    category: 'Advanced',
  },
  {
    id: 'achievements',
    label: 'Achievements',
    icon: Target,
    priority: 'tertiary',
    category: 'Gamification',
  },
  {
    id: 'social',
    label: 'Social Features',
    icon: Users,
    priority: 'tertiary',
    category: 'Community',
  },
  {
    id: 'contacts',
    label: 'Emergency Contacts',
    icon: Users,
    priority: 'tertiary',
    category: 'Management',
  },
  {
    id: 'enhanced-upload',
    label: 'Enhanced Upload',
    icon: CloudUpload,
    priority: 'tertiary',
    category: 'Management',
  },
  {
    id: 'medications',
    label: 'Medications',
    icon: Pill,
    priority: 'tertiary',
    category: 'Management',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    priority: 'tertiary',
    category: 'Management',
  },
];

function App() {
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Create unified navigation
  const unifiedNavigation = useMemo(() => createUnifiedNavigation(), []);

  // Filter navigation by priority for different display contexts
  const primaryNavigation = useMemo(
    () => unifiedNavigation.filter((item) => item.priority === 'primary'),
    [unifiedNavigation]
  );

  const secondaryNavigation = useMemo(
    () => unifiedNavigation.filter((item) => item.priority === 'secondary'),
    [unifiedNavigation]
  );

  // Group sidebar navigation by category
  const sidebarNavigation = useMemo(() => {
    const categories: Record<string, NavigationItem[]> = {};
    unifiedNavigation.forEach((item) => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });
    return categories;
  }, [unifiedNavigation]);

  // Toggle functions
  const toggleSidebar = useCallback(() => {
    console.log('🎯 Hamburger menu clicked, current state:', sidebarOpen);
    setSidebarOpen((prev) => !prev);
  }, [sidebarOpen]);

  // Get current page details
  const getCurrentPageInfo = useCallback(() => {
    const currentItem = unifiedNavigation.find((item) => item.id === activeTab);
    return currentItem
      ? {
          label: currentItem.label,
          category: currentItem.category,
        }
      : { label: 'Dashboard', category: 'Main' };
  }, [activeTab, unifiedNavigation]);

  const currentPageInfo = getCurrentPageInfo();

  // Mock health data
  const effectiveHealthData = useMemo(
    () => ({
      healthScore: 87,
    }),
    []
  );

  // Render navigation item component
  const renderNavigationItem = useCallback(
    (item: NavigationItem) => {
      const isActive = item.id === activeTab;
      const IconComponent = item.icon;

      return (
        <button
          key={item.id}
          onClick={() => {
            setActiveTab(item.id);
            setSidebarOpen(false); // Close sidebar on mobile after selection
          }}
          className={`
          px-3 group flex w-full items-center rounded-lg py-2 text-sm font-medium transition-colors
          ${
            isActive
              ? 'bg-blue-100 text-blue-900 shadow-sm'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          }
        `}
          aria-current={isActive ? 'page' : undefined}
        >
          <IconComponent
            className={`mr-3 h-4 w-4 flex-shrink-0 ${
              isActive
                ? 'text-blue-600'
                : 'text-gray-400 group-hover:text-gray-600'
            }`}
          />
          <span className="truncate">{item.label}</span>
          {item.badge && (
            <span className="bg-blue-100 px-2.5 py-0.5 text-xs text-blue-800 ml-auto inline-flex items-center rounded-full font-medium">
              {item.badge}
            </span>
          )}
        </button>
      );
    },
    [activeTab]
  );

  // Render sidebar section
  const renderSidebarSection = useCallback(
    (title: string, items: NavigationItem[]) => (
      <div key={title} className="mb-6">
        <h3 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </h3>
        <div className="space-y-1">{items.map(renderNavigationItem)}</div>
      </div>
    ),
    [renderNavigationItem]
  );

  // Render main content based on active tab
  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <div className="text-lg">Loading Dashboard...</div>
              </div>
            }
          >
            <HealthDashboard />
          </Suspense>
        );
      case 'games':
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <div className="text-lg">Loading Games...</div>
              </div>
            }
          >
            <GameCenter />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <div className="text-lg">Loading Settings...</div>
              </div>
            }
          >
            <SettingsPanel />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <div className="text-lg">Loading Profile...</div>
              </div>
            }
          >
            <UserProfile />
          </Suspense>
        );
      default:
        return (
          <div className="p-8">
            <h2 className="mb-4 text-2xl font-bold">
              {getCurrentPageInfo().label}
            </h2>
            <p className="text-gray-600">
              This feature is coming soon. Category:{' '}
              {getCurrentPageInfo().category}
            </p>
          </div>
        );
    }
  };

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <div className="bg-gray-50 flex h-screen">
        {/* Sidebar */}
        <div
          className={`
            w-64 fixed inset-y-0 left-0 z-50 transform bg-white shadow-lg transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:relative lg:translate-x-0
          `}
        >
          {/* Sidebar Header */}
          <div className="h-16 border-gray-200 flex items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <Heart className="text-blue-600 h-6 w-6" />
              <span className="text-lg font-bold text-gray-900">
                VitalSense
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {Object.entries(sidebarNavigation).map(([category, items]) =>
              renderSidebarSection(category, items)
            )}
          </div>
        </div>

        {/* Overlay when sidebar is open */}
        {sidebarOpen && (
          <button
            className="bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-0">
          {/* Navigation Header */}
          <div className="border-gray-200 border-b bg-white">
            <NavigationHeader
              currentPageInfo={currentPageInfo}
              themeMode="light"
              onThemeToggle={() => {}}
              onNavigate={setActiveTab}
              onToggleSidebar={toggleSidebar}
              sidebarCollapsed={!sidebarOpen}
              healthScore={effectiveHealthData?.healthScore}
              hasAlerts={false}
            />
          </div>

          {/* Unified Tab Navigation */}
          <div className="top-16 sticky z-20 border-b border-gray-100 bg-white">
            <div className="px-4 lg:px-8">
              <div
                className="flex overflow-x-auto"
                role="tablist"
                aria-label="Main navigation"
              >
                {/* Primary Navigation - Always visible */}
                {primaryNavigation.map((tab) => {
                  const isActive = tab.id === activeTab;
                  const IconComponent = tab.icon;
                  const displayLabel = tab.shortLabel || tab.label;

                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={isActive ? 'true' : 'false'}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        py-3 flex items-center gap-2 whitespace-nowrap border-b-2 px-4 text-sm font-medium transition-colors
                        ${
                          isActive
                            ? 'border-blue-500 text-blue-600'
                            : 'hover:border-gray-300 hover:text-gray-700 border-transparent text-gray-500'
                        }
                      `}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="hidden sm:inline">{displayLabel}</span>
                      {tab.badge && (
                        <span className="bg-blue-100 text-xs text-blue-800 inline-flex items-center rounded-full px-2 py-1 font-medium">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Secondary Navigation - Visible on larger screens */}
                <div className="xl:flex hidden">
                  {secondaryNavigation.map((tab) => {
                    const isActive = tab.id === activeTab;
                    const IconComponent = tab.icon;

                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={isActive ? 'true' : 'false'}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          px-3 py-3 flex items-center gap-2 whitespace-nowrap border-b-2 text-sm font-medium transition-colors
                          ${
                            isActive
                              ? 'border-blue-500 text-blue-600'
                              : 'hover:border-gray-300 hover:text-gray-700 border-transparent text-gray-500'
                          }
                        `}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">{renderMainContent()}</main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
