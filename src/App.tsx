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
import { useKV } from '@/hooks/useCloudflareKV';
import { recordTelemetry } from '@/lib/telemetry';
import { Contact, ProcessedHealthData } from '@/types';
import {
  Activity,
  AlertTriangle,
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
  Sun,
  Target,
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
import { EnhancedGaitAnalyzer } from '@/components/health/EnhancedGaitAnalyzer';
import FamilyDashboard from '@/components/health/FamilyDashboard';
import { GaitDashboard } from '@/components/health/GaitDashboardClean';
import HealthcarePortal from '@/components/health/HealthcarePortal';
import HealthSearch from '@/components/health/HealthSearch';
import HealthSystemIntegration from '@/components/health/HealthSystemIntegration';
import MLPredictionsDashboard from '@/components/health/MLPredictionsDashboard';
import MovementPatternAnalysis from '@/components/health/MovementPatternAnalysis';
import RealTimeFallDetection from '@/components/health/RealTimeFallDetection';
import RealTimeMonitoringHub from '@/components/health/RealTimeMonitoringHub';
import LandingPage from '@/components/LandingPage';
import LiveConnectionDashboard from '@/components/live/LiveConnectionDashboard';
import NavigationHeader from '@/components/NavigationHeader';
// import HealthInsightsDashboard from '@/components/health/HealthInsightsDashboard'
import AIUsagePredictions from '@/components/analytics/AIUsagePredictions';
import UsageAnalyticsDashboard from '@/components/analytics/UsageAnalyticsDashboard';
import UserProfile from '@/components/auth/UserProfile';
import AdvancedAppleWatchIntegration from '@/components/health/AdvancedAppleWatchIntegration';
import AppleWatchIntegrationChecklist from '@/components/health/AppleWatchIntegrationChecklist';
import ComprehensiveAppleHealthKitGuide from '@/components/health/ComprehensiveAppleHealthKitGuide';
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
}: SidebarProps) => {
  console.log(
    '🔧 Sidebar render - sidebarCollapsed:',
    sidebarCollapsed,
    'width will be:',
    sidebarCollapsed ? '64px' : '256px'
  );

  return (
    <div
      className="bg-card fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border transition-all duration-300 ease-in-out"
      style={{ width: sidebarCollapsed ? '64px' : '256px' }}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border p-3">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-vitalsense-primary">
                  <Shield className="h-4 w-4 text-vitalsense-primary-contrast" />
                </div>
                <div>
                  <h2 className="font-semibold text-vitalsense-text-primary">
                    VitalSense
                  </h2>
                  <p className="text-xs text-vitalsense-text-muted">
                    Health Monitor
                  </p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log(
                  '🔄 Sidebar toggle clicked! Current state:',
                  sidebarCollapsed
                );
                setSidebarCollapsed(!sidebarCollapsed);
                console.log('🔄 New state should be:', !sidebarCollapsed);
              }}
              className="vitalsense-ghost-button h-8 w-8 p-0"
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
        <nav
          className={`no-scrollbar flex-1 space-y-6 overflow-y-auto ${sidebarCollapsed ? 'px-2 py-4' : 'p-4'}`}
        >
          {/* Main Features */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-vitalsense-text-muted">
                Main Features
              </h3>
            )}
            <div
              className={`space-y-1 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}
            >
              {navigationItems.main.map((item: NavigationItem) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                    h-10
                    ${sidebarCollapsed ? 'w-10 justify-center px-0' : 'w-full justify-start px-3'}
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                    style={
                      sidebarCollapsed
                        ? {
                            width: '2.5rem',
                            height: '2.5rem',
                            padding: '0 !important',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }
                        : {}
                    }
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
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-vitalsense-text-muted">
                Monitoring & Alerts
              </h3>
            )}
            <div
              className={`space-y-1 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}
            >
              {navigationItems.monitoring.map((item: NavigationItem) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                    h-10
                    ${sidebarCollapsed ? 'w-10 justify-center px-0' : 'w-full justify-start px-3'}
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                    style={
                      sidebarCollapsed
                        ? {
                            width: '2.5rem',
                            height: '2.5rem',
                            padding: '0 !important',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }
                        : {}
                    }
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
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-vitalsense-text-muted">
                AI & Machine Learning
              </h3>
            )}
            <div
              className={`space-y-1 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}
            >
              {navigationItems.ai.map((item: NavigationItem) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                    h-10
                    ${sidebarCollapsed ? 'w-10 justify-center px-0' : 'w-full justify-start px-3'}
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                    style={
                      sidebarCollapsed
                        ? {
                            width: '2.5rem',
                            height: '2.5rem',
                            padding: '0 !important',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }
                        : {}
                    }
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
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-vitalsense-text-muted">
                Advanced Features
              </h3>
            )}
            <div
              className={`space-y-1 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}
            >
              {navigationItems.advanced.map((item: NavigationItem) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                    h-10
                    ${sidebarCollapsed ? 'w-10 justify-center px-0' : 'w-full justify-start px-3'}
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                    style={
                      sidebarCollapsed
                        ? {
                            width: '2.5rem',
                            height: '2.5rem',
                            padding: '0 !important',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }
                        : {}
                    }
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
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-vitalsense-text-muted">
                Gamification
              </h3>
            )}
            <div
              className={`space-y-1 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}
            >
              {navigationItems.gamification.map((item: NavigationItem) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                    h-10
                    ${sidebarCollapsed ? 'w-10 justify-center px-0' : 'w-full justify-start px-3'}
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                    style={
                      sidebarCollapsed
                        ? {
                            width: '2.5rem',
                            height: '2.5rem',
                            padding: '0 !important',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }
                        : {}
                    }
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
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-vitalsense-text-muted">
                Community & Care
              </h3>
            )}
            <div
              className={`space-y-1 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}
            >
              {navigationItems.community.map((item: NavigationItem) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                    h-10
                    ${sidebarCollapsed ? 'w-10 justify-center px-0' : 'w-full justify-start px-3'}
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                    style={
                      sidebarCollapsed
                        ? {
                            width: '2.5rem',
                            height: '2.5rem',
                            padding: '0 !important',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }
                        : {}
                    }
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
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-vitalsense-text-muted">
                Management
              </h3>
            )}
            <div
              className={`space-y-1 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}
            >
              {navigationItems.management.map((item: NavigationItem) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                    h-10
                    ${sidebarCollapsed ? 'w-10 justify-center px-0' : 'w-full justify-start px-3'}
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                    style={
                      sidebarCollapsed
                        ? {
                            width: '2.5rem',
                            height: '2.5rem',
                            padding: '0 !important',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }
                        : {}
                    }
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
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-vitalsense-text-muted">
                User Profile
              </h3>
            )}
            <div
              className={`space-y-1 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}
            >
              {navigationItems.profile.map((item: NavigationItem) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                    h-10
                    ${sidebarCollapsed ? 'w-10 justify-center px-0' : 'w-full justify-start px-3'}
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-muted'}
                  `}
                    style={
                      sidebarCollapsed
                        ? {
                            width: '2.5rem',
                            height: '2.5rem',
                            padding: '0 !important',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }
                        : {}
                    }
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
              {themeMode === 'dark' && (
                <Moon className="h-4 w-4 flex-shrink-0" />
              )}
              {themeMode === 'light' && (
                <Sun className="h-4 w-4 flex-shrink-0" />
              )}
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
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
    if (import.meta.env.DEV) {
      console.log('🔍 DEV mode detected, healthData state:', healthData);
      if (!healthData) {
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
              recommendation:
                'Current medications have minimal fall risk impact',
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

  // Always show content for testing and debugging
  const hasHealthData = true;

  // Create minimal test data when healthData is null with complete ProcessedHealthData structure
  const effectiveHealthData: ProcessedHealthData = healthData || {
    healthScore: 75,
    lastUpdated: new Date().toISOString(),
    dataQuality: {
      completeness: 85,
      consistency: 90,
      recency: 95,
      overall: 'good',
    },
    metrics: {
      steps: {
        daily: [],
        weekly: [],
        monthly: [],
        average: 8500,
        trend: 'stable',
        variability: 12,
        reliability: 85,
        lastValue: 8500,
        percentileRank: 75,
      },
      heartRate: {
        daily: [],
        weekly: [],
        monthly: [],
        average: 68,
        trend: 'stable',
        variability: 8,
        reliability: 90,
        lastValue: 68,
        percentileRank: 65,
      },
      walkingSteadiness: {
        daily: [],
        weekly: [],
        monthly: [],
        average: 78,
        trend: 'stable',
        variability: 5,
        reliability: 88,
        lastValue: 78,
        percentileRank: 70,
      },
      sleepHours: {
        daily: [],
        weekly: [],
        monthly: [],
        average: 7.5,
        trend: 'stable',
        variability: 1.2,
        reliability: 82,
        lastValue: 7.5,
        percentileRank: 60,
      },
    },
    insights: [
      'Your daily activity levels are within healthy ranges.',
      'Walking steadiness shows good stability.',
      'Heart rate patterns indicate good cardiovascular health.',
    ],
    fallRiskFactors: [],
  };

  // Dev-only telemetry panel state (persisted)
  const [showTelemetry, setShowTelemetry] = useKV<boolean>(
    'dev-telemetry-open',
    false
  );

  // Define navigation structure with categories
  const navigationItems = {
    main: [
      { id: 'dashboard', label: 'VitalSense Dashboard', icon: Heart },
      { id: 'health-overview', label: 'Health Overview', icon: Monitor },
      { id: 'fall-detection', label: 'Fall Risk Monitor', icon: Shield },
      { id: 'posture-analysis', label: 'Posture Analysis', icon: Activity },
      { id: 'walking-patterns', label: 'Walking Patterns', icon: Activity },
      { id: 'gait-analysis', label: 'Gait Analysis', icon: Target },
      {
        id: 'real-sensor-gait',
        label: 'Real Sensor Analysis',
        icon: Smartphone,
      },
      { id: 'emergency', label: 'Emergency Alert', icon: AlertTriangle },
      { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
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

      {/* Main content area */}
      <div
        className="transition-all duration-300"
        style={{
          minHeight: '100vh',
          marginLeft: sidebarCollapsed ? '64px' : '256px',
        }}
      >
        {/* Mobile Header - only show when sidebar would be hidden */}
        <header className="bg-card block border-b lg:hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="h-8 w-8 p-0 lg:hidden"
                >
                  <List className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-vitalsense-primary">
                    <Shield className="h-4 w-4 text-vitalsense-primary-contrast" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-vitalsense-text-primary">
                      VitalSense
                    </h1>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasHealthData && (
                  <Badge
                    variant="outline"
                    className="border-vitalsense-primary text-xs text-vitalsense-primary"
                  >
                    {effectiveHealthData?.healthScore || 0}/100
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
              </div>
            </div>
          </div>
        </header>

        {/* Desktop Navigation Header - only show on larger screens */}
        <div className="hidden lg:block">
          <NavigationHeader
            currentPageInfo={currentPageInfo}
            onNavigate={setActiveTab}
            onThemeToggle={toggleThemeMode}
            themeMode={themeMode || 'system'}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            sidebarCollapsed={sidebarCollapsed || false}
          />
        </div>

        {/* Main Content */}
        <main
          id="main-content"
          className="thin-scrollbar flex-1 overflow-y-auto px-6 pb-6 pt-6"
          style={{ paddingTop: '2rem' }}
        >
          {!hasHealthData ? (
            <div
              className="mx-auto mt-6 max-w-2xl"
              style={{ marginTop: '1.5rem' }}
            >
              <Card>
                <CardHeader style={{ paddingTop: '2rem' }}>
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
                <div className="space-y-4">
                  {/* TEST BUTTON - Simple tab switching test */}
                  <Button
                    variant={activeTab === 'test' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('test')}
                    className="w-full"
                  >
                    🧪 TEST TAB (Click to test tab switching)
                  </Button>

                  {/* Primary Navigation - Main Features */}
                  <div>
                    <div className="bg-muted grid h-auto w-full grid-cols-2 gap-1 rounded-lg p-1 sm:grid-cols-3">
                      {navigationItems.main.slice(0, 6).map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <Button
                            key={item.id}
                            variant={
                              activeTab === item.id ? 'default' : 'ghost'
                            }
                            onClick={() => setActiveTab(item.id)}
                            className="flex min-h-12 flex-col items-center gap-1 px-1 py-2 text-xs"
                          >
                            <IconComponent className="h-4 w-4" />
                            <span className="text-center text-xs leading-tight">
                              {item.label}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Compact Feature Categories */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-vitalsense-text-muted">
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
                        <h4 className="text-xs font-medium uppercase tracking-wider text-vitalsense-text-muted">
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
                        <h4 className="text-xs font-medium uppercase tracking-wider text-vitalsense-text-muted">
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
                        <h4 className="text-xs font-medium uppercase tracking-wider text-vitalsense-text-muted">
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
                        <h4 className="text-xs font-medium uppercase tracking-wider text-vitalsense-text-muted">
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
                        <h4 className="text-xs font-medium uppercase tracking-wider text-vitalsense-text-muted">
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
                        <h4 className="text-xs font-medium uppercase tracking-wider text-vitalsense-text-muted">
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
                </div>
              </div>

              {/* Content Area */}
              <div className="space-y-6">
                {/* Simple tab indicator - always visible */}
                <div className="rounded-lg bg-blue-100 p-3 font-mono text-sm">
                  Current Tab: <strong>{activeTab}</strong>
                </div>

                {activeTab === 'dashboard' && (
                  <LandingPage
                    healthData={effectiveHealthData}
                    onNavigateToFeature={setActiveTab}
                    fallRiskScore={75} // This would normally come from health data processing
                  />
                )}
                {activeTab === 'user-profile' && <UserProfile />}
                {/* TEST TAB - Simple content that should always work */}
                {activeTab === 'test' && (
                  <div className="rounded-lg bg-green-100 p-8">
                    <h2 className="text-2xl font-bold">Test Tab Working!</h2>
                    <p>If you see this, tab switching is working.</p>
                  </div>
                )}
                {/* Removed VitalSenseBrandShowcase (component not found) */}
                {activeTab === 'insights' && (
                  <EnhancedHealthInsightsDashboard
                    healthData={effectiveHealthData}
                  />
                )}
                {activeTab === 'usage-analytics' && <UsageAnalyticsDashboard />}
                {activeTab === 'usage-predictions' && (
                  <AIUsagePredictions healthData={effectiveHealthData} />
                )}
                {activeTab === 'recommendations' && (
                  <SmartFeatureRecommendations />
                )}
                {activeTab === 'engagement-optimizer' && (
                  <PersonalizedEngagementOptimizer
                    healthData={effectiveHealthData}
                    onNavigateToFeature={setActiveTab}
                  />
                )}
                {activeTab === 'smart-notifications' && (
                  <SmartNotificationEngine healthData={effectiveHealthData} />
                )}
                {activeTab === 'realtime-scoring' && <RealTimeHealthScoring />}
                {activeTab === 'analytics' && (
                  <HealthAnalytics healthData={effectiveHealthData} />
                )}
                {activeTab === 'fall-risk' && (
                  <FallRiskWalkingManager healthData={effectiveHealthData} />
                )}
                {activeTab === 'emergency' && <EmergencyTrigger />}
                {activeTab === 'alerts' && (
                  <HealthAlertsConfig healthData={effectiveHealthData} />
                )}
                {activeTab === 'predictive-alerts' && (
                  <PredictiveHealthAlerts healthData={effectiveHealthData} />
                )}
                {activeTab === 'search' && (
                  <HealthSearch
                    healthData={effectiveHealthData}
                    onNavigateToInsight={(tab, metric) => {
                      setActiveTab(tab);
                      if (metric) {
                        toast.success(`Navigated to ${metric} in ${tab}`);
                      }
                    }}
                  />
                )}
                {activeTab === 'ai-recommendations' && (
                  <AIRecommendations healthData={effectiveHealthData} />
                )}
                {activeTab === 'ml-predictions' && (
                  <MLPredictionsDashboard healthData={effectiveHealthData} />
                )}
                {activeTab === 'movement-patterns' && (
                  <MovementPatternAnalysis healthData={effectiveHealthData} />
                )}
                {activeTab === 'gait-analysis' && <GaitDashboard />}
                {activeTab === 'real-sensor-gait' && <EnhancedGaitAnalyzer />}
                {activeTab === 'realtime' && <RealTimeFallDetection />}
                {activeTab === 'enhanced-health-system' && (
                  <HealthSystemIntegration
                    userId="demo-user"
                    initialData={healthData ? [healthData] : undefined}
                  />
                )}
                {activeTab === 'monitoring-hub' && (
                  <RealTimeMonitoringHub healthData={effectiveHealthData} />
                )}
                {activeTab === 'live-integration' && (
                  <LiveConnectionDashboard />
                )}
                {activeTab === 'advanced-Watch' && (
                  <AdvancedAppleWatchIntegration />
                )}
                {activeTab === 'history' && <FallHistory />}
                {activeTab === 'game-center' && (
                  <HealthGameCenter healthData={effectiveHealthData} />
                )}
                {activeTab === 'family-challenges' && <FamilyGameification />}
                {activeTab === 'family' && (
                  <FamilyDashboard healthData={effectiveHealthData} />
                )}
                {activeTab === 'community' && (
                  <CommunityShare healthData={effectiveHealthData} />
                )}
                {activeTab === 'healthcare' && (
                  <HealthcarePortal healthData={effectiveHealthData} />
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
                  <ExportData healthData={healthData || undefined} />
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

                {/* Debug fallback - temporary */}
                {![
                  'dashboard',
                  'user-profile',
                  'insights',
                  'usage-analytics',
                  'usage-predictions',
                  'recommendations',
                  'engagement-optimizer',
                  'smart-notifications',
                  'realtime-scoring',
                  'analytics',
                  'fall-risk',
                  'emergency',
                  'alerts',
                  'predictive-alerts',
                  'search',
                  'ai-recommendations',
                  'ml-predictions',
                  'movement-patterns',
                  'gait-analysis',
                  'real-sensor-gait',
                  'realtime',
                  'enhanced-health-system',
                  'monitoring-hub',
                  'live-integration',
                  'advanced-Watch',
                  'history',
                  'game-center',
                  'family-challenges',
                  'family',
                  'community',
                  'upload',
                  'import',
                  'export',
                  'settings',
                  'healthkit-guide',
                  'websocket-guide',
                  'integration-checklist',
                ].includes(activeTab) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Debug Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>
                        Active tab: <code>{activeTab}</code>
                      </p>
                      <p>
                        Has health data:{' '}
                        <code>{healthData ? 'true' : 'false'}</code>
                      </p>
                      <p>
                        Dev mode: <code>{String(import.meta.env.DEV)}</code>
                      </p>
                      <p>
                        If you see this, the tab '{activeTab}' is not rendering
                        any content.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Enhanced Footer */}
        <div style={{ marginTop: '2rem' }}>
          <Footer
            healthScore={effectiveHealthData?.healthScore}
            lastSync={
              effectiveHealthData?.lastUpdated
                ? new Date(effectiveHealthData.lastUpdated)
                : undefined
            }
            connectionStatus="connected"
            onNavigate={setActiveTab}
          />
        </div>
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
            className="fixed bottom-4 right-4 z-50 rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-[var(--color-accent-foreground)] shadow-lg transition hover:opacity-90"
          >
            {showTelemetry ? 'Close Telemetry' : 'Telemetry'}
          </button>
          {showTelemetry && (
            <div className="fixed bottom-16 right-4 z-50 max-h-[70vh] w-[380px] overflow-hidden rounded-lg border border-border bg-background shadow-xl">
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
