import TelemetryPanel from '@/components/dev/TelemetryPanel';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@/hooks/useCloudflareKV';
import { recordTelemetry } from '@/lib/telemetry';
import { Contact, ProcessedHealthData } from '@/types';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Brain,
  Clock,
  CloudUpload,
  Heart,
  Home as House,
  Lightbulb,
  Menu as List,
  Monitor,
  Moon,
  Pill,
  Search,
  Settings,
  Share,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Trophy,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import ConnectedDevices from '@/components/health/ConnectedDevices';
import EmergencyContacts from '@/components/health/EmergencyContacts';
import EmergencyTrigger from '@/components/health/EmergencyTrigger';
import ExportData from '@/components/health/ExportData';
import FallHistory from '@/components/health/FallHistory';
import FallRiskWalkingManager from '@/components/health/FallRiskWalkingManager';
import HealthAnalytics from '@/components/health/HealthAnalytics';
import HealthDataImport from '@/components/health/HealthDataImport';
import HealthSettings from '@/components/health/HealthSettings';
// import FallMonitoringTooling from '@/components/health/FallMonitoringTooling'
import FamilyGameification from '@/components/gamification/FamilyGameification';
import HealthGameCenter from '@/components/gamification/HealthGameCenter';

// Enhanced UI Components
import Footer from '@/components/Footer';
import AIRecommendations from '@/components/health/AIRecommendations';
import CommunityShare from '@/components/health/CommunityShare';
import FamilyDashboard from '@/components/health/FamilyDashboard';
import HealthcarePortal from '@/components/health/HealthcarePortal';
import HealthSearch from '@/components/health/HealthSearch';
import HealthSystemIntegration from '@/components/health/HealthSystemIntegration';
import LiveHealthDataIntegration from '@/components/health/LiveHealthDataIntegration';
import MLPredictionsDashboard from '@/components/health/MLPredictionsDashboard';
import MovementPatternAnalysis from '@/components/health/MovementPatternAnalysis';
import RealTimeFallDetection from '@/components/health/RealTimeFallDetection';
import RealTimeMonitoringHub from '@/components/health/RealTimeMonitoringHub';
import LandingPage from '@/components/LandingPage';
import NavigationHeader from '@/components/NavigationHeader';
// import HealthInsightsDashboard from '@/components/health/HealthInsightsDashboard'
import AIUsagePredictions from '@/components/analytics/AIUsagePredictions';
import UsageAnalyticsDashboard from '@/components/analytics/UsageAnalyticsDashboard';
import UserProfile from '@/components/auth/UserProfile';
import AdvancedAppleWatchIntegration from '@/components/health/AdvancedAppleWatchIntegration';
import AppleWatchIntegrationChecklist from '@/components/health/AppleWatchIntegrationChecklist';
import ComprehensiveAppleHealthKitGuide from '@/components/health/ComprehensiveAppleHealthKitGuide';
import EmergencyTriggerButton from '@/components/health/EmergencyTriggerButton';
import { EnhancedHealthDataUpload } from '@/components/health/EnhancedHealthDataUpload';
import EnhancedHealthInsightsDashboard from '@/components/health/EnhancedHealthInsightsDashboard';
import HealthAlertsConfig from '@/components/health/HealthAlertsConfig';
import PredictiveHealthAlerts from '@/components/health/PredictiveHealthAlerts';
import RealTimeHealthScoring from '@/components/health/RealTimeHealthScoring';
import WebSocketArchitectureGuide from '@/components/health/WebSocketArchitectureGuide';
import WSHealthPanel from '@/components/health/WSHealthPanel';
import WSTokenSettings from '@/components/health/WSTokenSettings';
import SmartNotificationEngine from '@/components/notifications/SmartNotificationEngine';
import PersonalizedEngagementOptimizer from '@/components/recommendations/PersonalizedEngagementOptimizer';
import { VitalSenseBrandColors } from '@/components/vitalsense/BrandColors';
import SmartFeatureRecommendations from '@/components/recommendations/SmartFeatureRecommendations';

// Define navigation item structure
interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

// Define navigation items categories
interface NavigationItems {
  main: NavigationItem[];
  monitoring: NavigationItem[];
  ai: NavigationItem[];
  advanced: NavigationItem[];
  gamification: NavigationItem[];
  community: NavigationItem[];
  management: NavigationItem[];
  profile: NavigationItem[];
}

// Extract Sidebar component to reduce nesting
interface SidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  themeMode: string;
  toggleThemeMode: () => void;
  hasHealthData: boolean;
  navigationItems: NavigationItems;
}

const Sidebar = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  activeTab,
  setActiveTab,
  themeMode,
  toggleThemeMode,
  hasHealthData,
  navigationItems,
}: SidebarProps) => (
  <aside
    className={`
    bg-card fixed left-0 top-0 z-40 h-screen border-r border-border
    transition-all duration-300 ease-in-out
    ${sidebarCollapsed ? 'w-16' : 'w-64'}
    hidden lg:flex lg:flex-col
  `}
  >
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border p-4">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-vitalsense-primary">
                <Shield className="h-5 w-5 text-vitalsense-primary-contrast" />
              </div>
              <div>
                <h2 className="font-semibold text-vitalsense-text-primary">
                  VitalSense
                </h2>
                <p className="text-xs text-vitalsense-text-muted">
                  Health Monitor
                </p>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className="border-vitalsense-teal text-vitalsense-teal"
                  >
                    iOS ready
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 p-0"
          >
            {sidebarCollapsed ? (
              <List className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Main Features */}
        <div>
          {!sidebarCollapsed && (
            <h3 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
              Main Features
            </h3>
          )}
          <div className="space-y-1">
            {navigationItems.main.map((item: NavigationItem) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`
                    h-10 w-full justify-start
                    px-3
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                  onClick={() => setActiveTab(item.id)}
                >
                  <IconComponent className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="ml-3">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Monitoring */}
        <div>
          {!sidebarCollapsed && (
            <h3 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
              Monitoring & Alerts
            </h3>
          )}
          <div className="space-y-1">
            {navigationItems.monitoring.map((item: NavigationItem) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`
                    h-10 w-full justify-start
                    px-3
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                  onClick={() => setActiveTab(item.id)}
                >
                  <IconComponent className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="ml-3">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* AI & ML */}
        <div>
          {!sidebarCollapsed && (
            <h3 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
              AI & Machine Learning
            </h3>
          )}
          <div className="space-y-1">
            {navigationItems.ai.map((item: NavigationItem) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`
                    h-10 w-full justify-start
                    px-3
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                  onClick={() => setActiveTab(item.id)}
                >
                  <IconComponent className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="ml-3">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Advanced Features */}
        <div>
          {!sidebarCollapsed && (
            <h3 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
              Advanced Features
            </h3>
          )}
          <div className="space-y-1">
            {navigationItems.advanced.map((item: NavigationItem) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`
                    h-10 w-full justify-start
                    px-3
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                  onClick={() => setActiveTab(item.id)}
                >
                  <IconComponent className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="ml-3">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Gamification */}
        <div>
          {!sidebarCollapsed && (
            <h3 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
              Gamification
            </h3>
          )}
          <div className="space-y-1">
            {navigationItems.gamification.map((item: NavigationItem) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`
                    h-10 w-full justify-start
                    px-3
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                  onClick={() => setActiveTab(item.id)}
                >
                  <IconComponent className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="ml-3">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Community */}
        <div>
          {!sidebarCollapsed && (
            <h3 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
              Community & Care
            </h3>
          )}
          <div className="space-y-1">
            {navigationItems.community.map((item: NavigationItem) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`
                    h-10 w-full justify-start
                    px-3
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                  onClick={() => setActiveTab(item.id)}
                >
                  <IconComponent className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="ml-3">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Management */}
        <div>
          {!sidebarCollapsed && (
            <h3 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
              Management
            </h3>
          )}
          <div className="space-y-1">
            {navigationItems.management.map((item: NavigationItem) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`
                    h-10 w-full justify-start
                    px-3
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                  onClick={() => setActiveTab(item.id)}
                >
                  <IconComponent className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="ml-3">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Profile */}
        <div>
          {!sidebarCollapsed && (
            <h3 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
              User Profile
            </h3>
          )}
          <div className="space-y-1">
            {navigationItems.profile.map((item: NavigationItem) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`
                    h-10 w-full justify-start
                    px-3
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                  onClick={() => setActiveTab(item.id)}
                >
                  <IconComponent className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="ml-3">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Setup */}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        {/* Theme mode toggle */}
        <div className="mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleThemeMode}
            className={`
              hover:bg-muted h-8 w-full
              justify-start
              px-3
            `}
          >
            {themeMode === 'dark' && <Moon className="h-4 w-4 flex-shrink-0" />}
            {themeMode === 'light' && <Sun className="h-4 w-4 flex-shrink-0" />}
            {themeMode === 'system' && (
              <Monitor className="h-4 w-4 flex-shrink-0" />
            )}
            {!sidebarCollapsed && (
              <span className="ml-3">
                {themeMode === 'dark' && 'Dark Mode'}
                {themeMode === 'light' && 'Light Mode'}
                {themeMode === 'system' && 'Auto Mode'}
              </span>
            )}
          </Button>
        </div>

        {hasHealthData && !sidebarCollapsed && (
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="border-vitalsense-primary text-vitalsense-primary"
            >
              Data Connected
            </Badge>
          </div>
        )}

        {!hasHealthData && !sidebarCollapsed && (
          <div className="flex justify-center">
            <AlertTriangle className="text-destructive h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  </aside>
);

function App() {
  console.log('🚀 VitalSense App component loading...');

  // Restored KV persistence for production use
  const [healthData, setHealthData] = useKV<ProcessedHealthData | null>(
    'health-data',
    null
  );
  const [_fallRiskScore, _setFallRiskScore] = useKV<number>(
    'fall-risk-score',
    0
  );

  // Development mode: Load comprehensive test data
  useEffect(() => {
    if (import.meta.env.DEV && !healthData) {
      const testHealthData: ProcessedHealthData = {
        healthScore: 78,
        lastUpdated: new Date().toISOString(),
        dataQuality: {
          completeness: 92,
          consistency: 88,
          recency: 95,
          overall: 'excellent',
        },
        metrics: {
          steps: {
            daily: [],
            weekly: [],
            monthly: [],
            average: 8750,
            lastValue: 9234,
            trend: 'increasing',
            variability: 12.5,
            reliability: 94,
            percentileRank: 75,
          },
          heartRate: {
            daily: [],
            weekly: [],
            monthly: [],
            average: 72,
            lastValue: 68,
            trend: 'stable',
            variability: 8.2,
            reliability: 91,
            percentileRank: 82,
          },
          sleepHours: {
            daily: [],
            weekly: [],
            monthly: [],
            average: 7.2,
            lastValue: 7.8,
            trend: 'increasing',
            variability: 15.3,
            reliability: 87,
            percentileRank: 68,
          },
          walkingSteadiness: {
            daily: [],
            weekly: [],
            monthly: [],
            average: 3.2,
            lastValue: 3.4,
            trend: 'increasing',
            variability: 6.3,
            reliability: 89,
            percentileRank: 71,
          },
          bodyWeight: {
            daily: [],
            weekly: [],
            monthly: [],
            average: 165.3,
            lastValue: 164.8,
            trend: 'decreasing',
            variability: 2.1,
            reliability: 96,
            percentileRank: 58,
          },
        },
        fallRiskFactors: [
          {
            factor: 'Walking Speed',
            risk: 'low',
            impact: 15,
            recommendation: 'Walking speed is above safe threshold',
          },
          {
            factor: 'Balance Stability',
            risk: 'moderate',
            impact: 35,
            recommendation: 'Slight decrease in balance stability detected',
          },
          {
            factor: 'Medication Effects',
            risk: 'low',
            impact: 10,
            recommendation: 'Current medications have minimal fall risk impact',
          },
        ],
        insights: [
          'Your sleep quality has improved by 8% this week. Keep up the consistent bedtime routine!',
          'Recent balance stability readings suggest scheduling a balance assessment.',
          "You're exceeding your daily step goal by 12%. Great progress!",
          'Your resting heart rate has improved, indicating better cardiovascular fitness.',
        ],
      };

      console.log('🎯 Loading development test data...');
      setHealthData(testHealthData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthData]); // setHealthData is stable from useKV

  const [emergencyContacts, setEmergencyContacts] = useKV<Contact[]>(
    'emergency-contacts',
    []
  );

  // Development mode: Load test emergency contacts
  useEffect(() => {
    if (
      import.meta.env.DEV &&
      (!emergencyContacts || emergencyContacts.length === 0)
    ) {
      const testContacts: Contact[] = [
        {
          id: '1',
          name: 'Dr. Sarah Johnson',
          relationship: 'Primary Care Physician',
          phone: '(555) 123-4567',
          email: 'dr.johnson@healthcenter.com',
          isPrimary: true,
        },
        {
          id: '2',
          name: 'Michael Chen',
          relationship: 'Adult Child',
          phone: '(555) 987-6543',
          email: 'michael.chen@email.com',
          isPrimary: false,
        },
        {
          id: '3',
          name: 'Lisa Thompson',
          relationship: 'Neighbor & Emergency Contact',
          phone: '(555) 456-7890',
          email: 'lisa.thompson@email.com',
          isPrimary: false,
        },
        {
          id: '4',
          name: 'VitalSense Emergency Line',
          relationship: 'Healthcare Service',
          phone: '(800) 911-VITAL',
          email: 'emergency@vitalsense.com',
          isPrimary: false,
        },
      ];

      console.log('👥 Loading development emergency contacts...');
      setEmergencyContacts(testContacts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emergencyContacts]); // setEmergencyContacts is stable from useKV

  const [activeTab, setActiveTab] = useState('dashboard');

  const [sidebarCollapsed, setSidebarCollapsed] = useKV<boolean>(
    'sidebar-collapsed',
    false
  );

  const [themeMode, setThemeMode] = useKV<'light' | 'dark' | 'system'>(
    'theme-mode',
    'system'
  );

  // Apply theme based on mode and system preference using [data-appearance]
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      // Cleanup any legacy class usage
      root.classList.remove('dark');

      if (themeMode === 'system') {
        const systemPrefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        root.setAttribute(
          'data-appearance',
          systemPrefersDark ? 'dark' : 'light'
        );
      } else if (themeMode === 'dark') {
        root.setAttribute('data-appearance', 'dark');
      } else {
        root.setAttribute('data-appearance', 'light');
      }
    };

    applyTheme();

    // Listen for system theme changes when in system mode
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  const toggleThemeMode = () => {
    const modes: Array<'light' | 'dark' | 'system'> = [
      'light',
      'dark',
      'system',
    ];
    const currentIndex = modes.indexOf(themeMode || 'system');
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setThemeMode(nextMode);

    const modeLabels = {
      light: 'Light mode',
      dark: 'Dark mode',
      system: 'System preference',
    };
    toast.success(`Switched to ${modeLabels[nextMode]}`);
  };

  // Helper to get current effective theme
  // const getEffectiveTheme = () => {
  //   if (themeMode === 'system') {
  //     return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  //   }
  //   return themeMode
  // }

  const hasHealthData =
    healthData?.metrics && Object.keys(healthData.metrics).length > 0;
  const isHighRisk =
    hasHealthData &&
    ((healthData.healthScore || 0) < 60 ||
      healthData.fallRiskFactors?.some((factor) => factor.risk === 'high'));

  // Dev-only telemetry panel state (persisted)
  const [showTelemetry, setShowTelemetry] = useKV<boolean>(
    'dev-telemetry-open',
    false
  );

  // Define navigation structure with categories
  const navigationItems = {
    main: [
      { id: 'dashboard', label: 'Dashboard', icon: Heart },
      { id: 'vitalsense-brand', label: 'Brand Colors', icon: Sparkles },
      { id: 'insights', label: 'Insights', icon: TrendingUp },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'usage-analytics', label: 'Usage Analytics', icon: Brain },
      { id: 'usage-predictions', label: 'Usage Predictions', icon: Sparkles },
      { id: 'fall-risk', label: 'Fall Risk & Walking', icon: Shield },
      { id: 'emergency', label: 'Emergency Alert', icon: AlertTriangle },
      { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
      {
        id: 'engagement-optimizer',
        label: 'Engagement Optimizer',
        icon: Target,
      },
      { id: 'smart-notifications', label: 'Smart Notifications', icon: Bell },
      { id: 'search', label: 'Search', icon: Search },
    ],
    monitoring: [
      { id: 'realtime-scoring', label: 'Live Health Score', icon: Heart },
      { id: 'alerts', label: 'Health Alerts', icon: Bell },
      { id: 'predictive-alerts', label: 'Predictive Alerts', icon: Brain },
      { id: 'history', label: 'History', icon: Clock },
    ],
    ai: [
      { id: 'ai-recommendations', label: 'AI Recommendations', icon: Activity },
      { id: 'ml-predictions', label: 'ML Predictions', icon: Activity },
      { id: 'movement-patterns', label: 'Movement Analysis', icon: Activity },
      { id: 'realtime', label: 'Fall Detection', icon: Activity },
    ],
    advanced: [
      {
        id: 'enhanced-health-system',
        label: 'Enhanced Health System',
        icon: Brain,
      },
      { id: 'monitoring-hub', label: 'Monitoring Hub', icon: Activity },
      { id: 'live-integration', label: 'Live Integration', icon: CloudUpload },
      { id: 'advanced-Watch', label: 'Watch Integration', icon: Activity },
    ],
    gamification: [
      { id: 'game-center', label: 'Game Center', icon: Trophy },
      { id: 'family-challenges', label: 'Family Challenges', icon: Target },
    ],
    community: [
      { id: 'family', label: 'Family Dashboard', icon: Users },
      { id: 'community', label: 'Community Share', icon: Share },
      { id: 'healthcare', label: 'Healthcare Portal', icon: Heart },
    ],
    management: [
      { id: 'contacts', label: 'Emergency Contacts', icon: Users },
      { id: 'enhanced-upload', label: 'Enhanced Upload', icon: CloudUpload },
      { id: 'import', label: 'Import Data', icon: Upload },
      { id: 'export', label: 'Export Data', icon: Upload },
      { id: 'devices', label: 'Connected Devices', icon: Smartphone },
      { id: 'medications', label: 'Medications', icon: Pill },
      { id: 'workouts', label: 'Workouts', icon: Activity },
      { id: 'settings', label: 'Health Settings', icon: Settings },
    ],
    profile: [{ id: 'user-profile', label: 'User Profile', icon: Users }],
  };

  // Get current page details for breadcrumb
  const getCurrentPageInfo = () => {
    const allItems = [
      ...navigationItems.main,
      ...navigationItems.monitoring,
      ...navigationItems.ai,
      ...navigationItems.advanced,
      ...navigationItems.gamification,
      ...navigationItems.community,
      ...navigationItems.management,
      ...navigationItems.profile,
    ];
    const currentItem = allItems.find((item) => item.id === activeTab);

    if (!currentItem) return { label: 'Dashboard', category: 'Main' };

    let category = 'Main';
    if (navigationItems.monitoring.find((item) => item.id === activeTab))
      category = 'Monitoring';
    if (navigationItems.ai.find((item) => item.id === activeTab))
      category = 'AI & ML';
    if (navigationItems.advanced.find((item) => item.id === activeTab))
      category = 'Advanced';
    if (navigationItems.gamification.find((item) => item.id === activeTab))
      category = 'Gamification';
    if (navigationItems.community.find((item) => item.id === activeTab))
      category = 'Community';
    if (navigationItems.management.find((item) => item.id === activeTab))
      category = 'Management';
    if (navigationItems.profile.find((item) => item.id === activeTab))
      category = 'Profile';

    return { label: currentItem.label, category };
  };

  const currentPageInfo = getCurrentPageInfo();
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for larger screens */}
      <Sidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        themeMode={themeMode}
        toggleThemeMode={toggleThemeMode}
        hasHealthData={hasHealthData || false}
        navigationItems={navigationItems}
      />

      {/* Main layout with responsive margin */}
      <div
        className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
      >
        {/* Header */}
        <header className="bg-card border-b lg:hidden">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
                  <Shield className="text-primary-foreground h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    VitalSense
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Apple Health Insights & Fall Risk Monitor
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {hasHealthData && (
                  <Badge
                    variant="outline"
                    className="text-primary border-primary"
                  >
                    Health Score: {healthData.healthScore || 0}/100
                  </Badge>
                )}
                {isHighRisk && (
                  <Badge
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    High Fall Risk
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleThemeMode}
                  className="h-8 w-8 p-0"
                >
                  {themeMode === 'dark' && <Moon className="h-4 w-4" />}
                  {themeMode === 'light' && <Sun className="h-4 w-4" />}
                  {themeMode === 'system' && <Monitor className="h-4 w-4" />}
                </Button>
                <EmergencyTriggerButton size="sm" />
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Navigation Header */}
        <NavigationHeader
          currentPageInfo={currentPageInfo}
          onNavigate={setActiveTab}
          onThemeToggle={toggleThemeMode}
          themeMode={themeMode || 'system'}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed || false}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {!hasHealthData ? (
            <div className="mx-auto max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Get Started with Your Health Data
                  </CardTitle>
                  <CardDescription>
                    Import your Apple Health data to unlock comprehensive
                    insights and fall risk monitoring.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HealthDataImport onDataImported={setHealthData} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Breadcrumb Navigation - Mobile Only */}
              <div className="lg:hidden">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        onClick={() => setActiveTab('dashboard')}
                        className="flex cursor-pointer items-center gap-1"
                      >
                        <House className="h-4 w-4" />
                        VitalSense
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        onClick={() => setActiveTab('dashboard')}
                        className="cursor-pointer"
                      >
                        {currentPageInfo.category}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{currentPageInfo.label}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              {/* Mobile Navigation */}
              <div className="lg:hidden">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="space-y-4"
                >
                  {/* Primary Navigation - Main Features */}
                  <div>
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-3">
                      {navigationItems.main.slice(0, 6).map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <TabsTrigger
                            key={item.id}
                            value={item.id}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex min-h-12 flex-col items-center gap-1 px-1 py-2 text-xs"
                          >
                            <IconComponent className="h-4 w-4" />
                            <span className="text-center text-xs leading-tight">
                              {item.label}
                            </span>
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </div>

                  {/* Compact Feature Categories */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-muted-foreground text-sm font-medium">
                        More Features
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {navigationItems.main.slice(7).length +
                          navigationItems.monitoring.length +
                          navigationItems.ai.length +
                          navigationItems.advanced.length +
                          navigationItems.gamification.length +
                          navigationItems.community.length +
                          navigationItems.management.length +
                          navigationItems.profile.length}{' '}
                        more
                      </Badge>
                    </div>

                    {/* Horizontal scrollable categories */}
                    <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
                      {/* Core Features */}
                      <div className="min-w-[140px] flex-shrink-0 space-y-2">
                        <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                          Core Features
                        </h4>
                        <div className="space-y-1">
                          {navigationItems.main.slice(7).map((item) => {
                            const IconComponent = item.icon;
                            return (
                              <Button
                                key={item.id}
                                variant={
                                  activeTab === item.id ? 'default' : 'ghost'
                                }
                                size="sm"
                                onClick={() => setActiveTab(item.id)}
                                className="h-7 w-full justify-start px-2 text-xs"
                              >
                                <IconComponent className="mr-2 h-3 w-3" />
                                <span className="truncate">{item.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Monitoring */}
                      <div className="min-w-[140px] flex-shrink-0 space-y-2">
                        <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                          Monitoring
                        </h4>
                        <div className="space-y-1">
                          {navigationItems.monitoring
                            .slice(0, 3)
                            .map((item) => {
                              const IconComponent = item.icon;
                              return (
                                <Button
                                  key={item.id}
                                  variant={
                                    activeTab === item.id ? 'default' : 'ghost'
                                  }
                                  size="sm"
                                  onClick={() => setActiveTab(item.id)}
                                  className="h-7 w-full justify-start px-2 text-xs"
                                >
                                  <IconComponent className="mr-2 h-3 w-3" />
                                  <span className="truncate">{item.label}</span>
                                </Button>
                              );
                            })}
                        </div>
                      </div>

                      {/* AI & ML */}
                      <div className="min-w-[140px] flex-shrink-0 space-y-2">
                        <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                          AI & ML
                        </h4>
                        <div className="space-y-1">
                          {navigationItems.ai.slice(0, 3).map((item) => {
                            const IconComponent = item.icon;
                            return (
                              <Button
                                key={item.id}
                                variant={
                                  activeTab === item.id ? 'default' : 'ghost'
                                }
                                size="sm"
                                onClick={() => setActiveTab(item.id)}
                                className="h-7 w-full justify-start px-2 text-xs"
                              >
                                <IconComponent className="mr-2 h-3 w-3" />
                                <span className="truncate">{item.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Advanced */}
                      <div className="min-w-[140px] flex-shrink-0 space-y-2">
                        <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                          Advanced
                        </h4>
                        <div className="space-y-1">
                          {navigationItems.advanced.map((item) => {
                            const IconComponent = item.icon;
                            return (
                              <Button
                                key={item.id}
                                variant={
                                  activeTab === item.id ? 'default' : 'ghost'
                                }
                                size="sm"
                                onClick={() => setActiveTab(item.id)}
                                className="h-7 w-full justify-start px-2 text-xs"
                              >
                                <IconComponent className="mr-2 h-3 w-3" />
                                <span className="truncate">{item.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Community */}
                      <div className="min-w-[140px] flex-shrink-0 space-y-2">
                        <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                          Community
                        </h4>
                        <div className="space-y-1">
                          {[
                            ...navigationItems.gamification,
                            ...navigationItems.community,
                          ].map((item) => {
                            const IconComponent = item.icon;
                            return (
                              <Button
                                key={item.id}
                                variant={
                                  activeTab === item.id ? 'default' : 'ghost'
                                }
                                size="sm"
                                onClick={() => setActiveTab(item.id)}
                                className="h-7 w-full justify-start px-2 text-xs"
                              >
                                <IconComponent className="mr-2 h-3 w-3" />
                                <span className="truncate">{item.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Management */}
                      <div className="min-w-[140px] flex-shrink-0 space-y-2">
                        <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                          Management
                        </h4>
                        <div className="space-y-1">
                          {navigationItems.management.map((item) => {
                            const IconComponent = item.icon;
                            return (
                              <Button
                                key={item.id}
                                variant={
                                  activeTab === item.id ? 'default' : 'ghost'
                                }
                                size="sm"
                                onClick={() => setActiveTab(item.id)}
                                className="h-7 w-full justify-start px-2 text-xs"
                              >
                                <IconComponent className="mr-2 h-3 w-3" />
                                <span className="truncate">{item.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Tabs>
              </div>

              {/* Content Area */}
              <div className="space-y-6">
                {activeTab === 'dashboard' && healthData && (
                  <LandingPage
                    healthData={healthData}
                    onNavigateToFeature={setActiveTab}
                    fallRiskScore={75} // This would normally come from health data processing
                  />
                )}
                {activeTab === 'vitalsense-brand' && <VitalSenseBrandColors />}
                {activeTab === 'user-profile' && <UserProfile />}
                {/* Removed VitalSenseBrandShowcase (component not found) */}
                {activeTab === 'insights' && healthData && (
                  <EnhancedHealthInsightsDashboard healthData={healthData} />
                )}
                {activeTab === 'usage-analytics' && healthData && (
                  <UsageAnalyticsDashboard />
                )}
                {activeTab === 'usage-predictions' && healthData && (
                  <AIUsagePredictions healthData={healthData} />
                )}
                {activeTab === 'recommendations' && healthData && (
                  <SmartFeatureRecommendations />
                )}
                {activeTab === 'engagement-optimizer' && healthData && (
                  <PersonalizedEngagementOptimizer
                    healthData={healthData}
                    onNavigateToFeature={setActiveTab}
                  />
                )}
                {activeTab === 'smart-notifications' && healthData && (
                  <SmartNotificationEngine healthData={healthData} />
                )}
                {activeTab === 'realtime-scoring' && <RealTimeHealthScoring />}
                {activeTab === 'analytics' && healthData && (
                  <HealthAnalytics healthData={healthData} />
                )}
                {activeTab === 'fall-risk' && (
                  <FallRiskWalkingManager healthData={healthData} />
                )}
                {activeTab === 'emergency' && <EmergencyTrigger />}
                {activeTab === 'alerts' && healthData && (
                  <HealthAlertsConfig healthData={healthData} />
                )}
                {activeTab === 'predictive-alerts' && healthData && (
                  <PredictiveHealthAlerts healthData={healthData} />
                )}
                {activeTab === 'search' && healthData && (
                  <HealthSearch
                    healthData={healthData}
                    onNavigateToInsight={(tab, metric) => {
                      setActiveTab(tab);
                      if (metric) {
                        toast.success(`Navigated to ${metric} in ${tab}`);
                      }
                    }}
                  />
                )}
                {activeTab === 'ai-recommendations' && healthData && (
                  <AIRecommendations healthData={healthData} />
                )}
                {activeTab === 'ml-predictions' && healthData && (
                  <MLPredictionsDashboard healthData={healthData} />
                )}
                {activeTab === 'movement-patterns' && healthData && (
                  <MovementPatternAnalysis healthData={healthData} />
                )}
                {activeTab === 'realtime' && <RealTimeFallDetection />}
                {activeTab === 'enhanced-health-system' && (
                  <HealthSystemIntegration
                    userId="demo-user"
                    initialData={healthData ? [healthData] : undefined}
                  />
                )}
                {activeTab === 'monitoring-hub' && healthData && (
                  <RealTimeMonitoringHub healthData={healthData} />
                )}
                {activeTab === 'live-integration' && (
                  <LiveHealthDataIntegration />
                )}
                {activeTab === 'advanced-Watch' && (
                  <AdvancedAppleWatchIntegration />
                )}
                {activeTab === 'history' && <FallHistory />}
                {activeTab === 'game-center' && healthData && (
                  <HealthGameCenter healthData={healthData} />
                )}
                {activeTab === 'family-challenges' && <FamilyGameification />}
                {activeTab === 'family' && healthData && (
                  <FamilyDashboard healthData={healthData} />
                )}
                {activeTab === 'community' && healthData && (
                  <CommunityShare healthData={healthData} />
                )}
                {activeTab === 'healthcare' && healthData && (
                  <HealthcarePortal healthData={healthData} />
                )}
                {activeTab === 'contacts' && (
                  <EmergencyContacts
                    contacts={emergencyContacts || []}
                    setContacts={setEmergencyContacts}
                  />
                )}
                {activeTab === 'enhanced-upload' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Enhanced Health Data Processing</CardTitle>
                      <CardDescription>
                        Submit health metrics for advanced analytics, trend
                        analysis, and anomaly detection.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <EnhancedHealthDataUpload />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'import' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Import Additional Health Data</CardTitle>
                      <CardDescription>
                        Update your health data to keep insights current and
                        accurate.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <HealthDataImport onDataImported={setHealthData} />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'export' && (
                  <ExportData healthData={healthData} />
                )}
                {activeTab === 'devices' && <ConnectedDevices />}
                {/* MedicationTracker / WorkoutTracker components not present; placeholders removed */}
                {activeTab === 'settings' && <HealthSettings />}
                {activeTab === 'healthkit-guide' && (
                  <ComprehensiveAppleHealthKitGuide />
                )}
                {activeTab === 'websocket-guide' && (
                  <WebSocketArchitectureGuide />
                )}
                {activeTab === 'integration-checklist' && (
                  <AppleWatchIntegrationChecklist />
                )}
              </div>
            </div>
          )}
        </main>

        {/* Enhanced Footer */}
        <Footer
          healthScore={healthData?.healthScore}
          lastSync={
            healthData?.lastUpdated
              ? new Date(healthData.lastUpdated)
              : undefined
          }
          connectionStatus="connected"
          onNavigate={setActiveTab}
        />
      </div>
      <WSTokenSettings />
      {import.meta.env.DEV && <WSHealthPanel />}
      {import.meta.env.DEV && (
        <>
          <button
            type="button"
            onClick={() => {
              const next = !showTelemetry;
              setShowTelemetry(next);
              recordTelemetry('ui_toggle', {
                target: 'telemetry_panel',
                state: next ? 'open' : 'closed',
              });
            }}
            className="fixed bottom-4 right-4 z-50 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-lg px-4 py-2 text-xs font-semibold hover:opacity-90 transition"
          >
            {showTelemetry ? 'Close Telemetry' : 'Telemetry'}
          </button>
          {showTelemetry && (
            <div className="fixed bottom-16 right-4 z-50 w-[380px] max-h-[70vh] overflow-hidden rounded-lg border border-border bg-background shadow-xl">
              <div className="h-full overflow-y-auto p-2">
                {/* Import dynamically to avoid impacting initial bundle size if desired */}
                <TelemetryPanel showNormalizationStats limit={120} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
