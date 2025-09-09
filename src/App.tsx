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
import { isDev } from '@/lib/env';
import { Contact, ProcessedHealthData } from '@/types';
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  Clock,
  CloudUpload,
  Code,
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
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import ConnectedDevices from '@/components/health/ConnectedDevices';
import EmergencyContacts from '@/components/health/EmergencyContacts';
import EmergencyTrigger from '@/components/health/EmergencyTrigger';
import EnhancedHealthAnalytics from '@/components/health/EnhancedHealthAnalytics';
import EnhancedHealthDataImport from '@/components/health/EnhancedHealthDataImport';
import ExportData from '@/components/health/ExportData';
import FallHistory from '@/components/health/FallHistory';
import FallRiskMonitor from '@/components/health/FallRiskMonitor';
import FallRiskWalkingManager from '@/components/health/FallRiskWalkingManager';
import GaitAnalysis from '@/components/health/GaitAnalysis';
import HealthAnalytics from '@/components/health/HealthAnalytics';
import HealthDataImport from '@/components/health/HealthDataImport';
import HealthOverview from '@/components/health/HealthOverview';
import HealthSettings from '@/components/health/HealthSettings';
import PostureAnalysis from '@/components/health/PostureAnalysis';
import WalkingPatternsAnalysis from '@/components/health/WalkingPatternsAnalysis';
// import FallMonitoringTooling from '@/components/health/FallMonitoringTooling'
import FamilyGameification from '@/components/gamification/FamilyGameification';
import HealthGameCenter from '@/components/gamification/HealthGameCenter';

// Enhanced UI Components
import VitalSenseMainDashboard from '@/components/dashboard/VitalSenseMainDashboard';
import Footer from '@/components/Footer';
import AIRecommendations from '@/components/health/AIRecommendations';
import { BasicRecommendations } from '@/components/health/BasicRecommendations';
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
import NavigationHeader from '@/components/NavigationHeader';

import AIUsagePredictions from '@/components/analytics/AIUsagePredictions';
import UsageAnalyticsDashboard from '@/components/analytics/UsageAnalyticsDashboard';
import UserProfile from '@/components/auth/UserProfile';
import DeveloperTools from '@/components/developer/DeveloperTools';
import AdvancedAppleWatchIntegration from '@/components/health/AdvancedAppleWatchIntegration';
import AppleWatchIntegrationChecklist from '@/components/health/AppleWatchIntegrationChecklist';
import ComprehensiveAppleHealthKitGuide from '@/components/health/ComprehensiveAppleHealthKitGuide';
import EnhancedHealthInsightsDashboard from '@/components/health/EnhancedHealthInsightsDashboard';
import HealthAlertsConfig from '@/components/health/HealthAlertsConfig';
import PredictiveHealthAlerts from '@/components/health/PredictiveHealthAlerts';
import RealTimeHealthScoring from '@/components/health/RealTimeHealthScoring';
import WebSocketArchitectureGuide from '@/components/health/WebSocketArchitectureGuide';
import WSTokenSettings from '@/components/health/WSTokenSettings';
import SmartNotificationEngine from '@/components/notifications/SmartNotificationEngine';
import PersonalizedEngagementOptimizer from '@/components/recommendations/PersonalizedEngagementOptimizer';
import SmartFeatureRecommendations from '@/components/recommendations/SmartFeatureRecommendations';
import { ErrorBoundary } from 'react-error-boundary';

// Define navigation items categories
interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface NavigationItems {
  main: NavigationItem[];
  monitoring: NavigationItem[];
  ai: NavigationItem[];
  advanced: NavigationItem[];
  gamification: NavigationItem[];
  community: NavigationItem[];
  management: NavigationItem[];
  profile: NavigationItem[];
  developer: NavigationItem[];
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
      className="vitalsense-sidebar fixed left-0 top-0 z-50 flex h-screen flex-col border-r transition-all duration-300 ease-in-out"
      style={{ width: sidebarCollapsed ? '64px' : '256px' }}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex-shrink-0 border-b p-3"
          style={{ borderColor: 'var(--color-sidebar-border)' }}
        >
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-vitalsense-primary">
                  <Shield className="h-4 w-4 text-vitalsense-primary-contrast" />
                </div>
                <div>
                  <h2
                    className="font-semibold"
                    style={{ color: 'var(--color-nav-text)' }}
                  >
                    VitalSense
                  </h2>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--color-vitalsense-text-muted)' }}
                  >
                    Health Monitor
                  </p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                console.log(
                  '🔄 Sidebar toggle clicked! Current state:',
                  sidebarCollapsed
                );
                setSidebarCollapsed(!sidebarCollapsed);
                console.log('🔄 New state should be:', !sidebarCollapsed);
              }}
              className="vitalsense-ghost-button"
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
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-slate-100'}
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
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-slate-100'}
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
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-slate-100'}
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
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-slate-100'}
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
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-slate-100'}
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
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-slate-100'}
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
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-slate-100'}
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
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-slate-100'}
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

          {/* Developer Tools */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-vitalsense-text-muted">
                Developer
              </h3>
            )}
            <div
              className={`space-y-1 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}
            >
              {navigationItems.developer.map((item: NavigationItem) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                    h-10
                    ${sidebarCollapsed ? 'w-10 justify-center px-0' : 'w-full justify-start px-3'}
                    ${isActive ? 'bg-vitalsense-primary text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light' : 'hover:bg-slate-100'}
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
        <div className="border-t border-slate-200 p-4">
          {/* Theme mode toggle */}
          <div className="mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleThemeMode}
              className={`
              h-8 w-full justify-start
              px-3
              hover:bg-slate-100
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
    if (isDev() && !healthData) {
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
    if (isDev() && (!emergencyContacts || emergencyContacts.length === 0)) {
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

    // Debug log
    console.log('Theme toggle:', themeMode, '->', nextMode);

    const modeLabels = {
      light: 'Light mode',
      dark: 'Dark mode',
      system: 'System preference',
    };

    // Temporarily comment out toast to test if it's causing issues
    try {
      toast.success(`Switched to ${modeLabels[nextMode]}`);
    } catch (error) {
      console.log('Toast error:', error);
    }
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

  // Define navigation structure with categories
  const navigationItems = {
    main: [
      { id: 'dashboard', label: 'VitalSense Dashboard', icon: Heart },
      { id: 'health-overview', label: 'Health Overview', icon: Monitor },
      { id: 'fall-detection', label: 'Fall Risk Monitor', icon: Shield },
      { id: 'posture-analysis', label: 'Posture Analysis', icon: Activity },
      { id: 'walking-patterns', label: 'Walking Patterns', icon: Activity },
      { id: 'gait-analysis', label: 'Gait Analysis', icon: Target },
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
      { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
      { id: 'ai-recommendations', label: 'AI Recommendations', icon: Activity },
      { id: 'ml-predictions', label: 'ML Predictions', icon: Activity },
      { id: 'enhanced-analytics', label: 'Enhanced Analytics', icon: Brain },
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
    developer: [
      { id: 'developer-tools', label: 'Developer Tools', icon: Code },
      { id: 'websocket-guide', label: 'WebSocket Guide', icon: Zap },
      { id: 'ws-token-settings', label: 'WebSocket Settings', icon: Settings },
      { id: 'apple-watch-guide', label: 'Apple Watch Guide', icon: Activity },
    ],
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
      ...navigationItems.developer,
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
    if (navigationItems.developer.find((item) => item.id === activeTab))
      category = 'Developer';

    return { label: currentItem.label, category };
  };

  const currentPageInfo = getCurrentPageInfo();
  return (
    <div className="bg-vitalsense-bg flex min-h-screen">
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
        <header className="bg-vitalsense-card block border-b lg:hidden">
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
                    {healthData.healthScore || 0}/100
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
          className="thin-scrollbar flex-1 overflow-y-auto px-6 pb-8 pt-4"
        >
          {!hasHealthData ? (
            <div className="mx-auto mt-4 max-w-5xl">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-6 pt-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Upload className="h-6 w-6" />
                    Get Started with Your Health Data
                  </CardTitle>
                  <CardDescription className="mt-2 text-base text-gray-600">
                    Import your Apple Health data to unlock comprehensive
                    insights and fall risk monitoring.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
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
                  className="space-y-6"
                >
                  {/* Primary Navigation - Main Features */}
                  <div>
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-2 p-2 sm:grid-cols-3">
                      {navigationItems.main.slice(0, 6).map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <TabsTrigger
                            key={item.id}
                            value={item.id}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex min-h-14 flex-col items-center gap-2 px-2 py-3 text-xs"
                          >
                            <IconComponent className="h-5 w-5" />
                            <span className="text-center text-xs leading-tight">
                              {item.label}
                            </span>
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </div>

                  {/* Compact Feature Categories */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-vitalsense-text-muted">
                        More Features
                      </h3>
                      <Badge variant="outline" className="px-3 py-1 text-xs">
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
                </Tabs>
              </div>

              {/* Content Area */}
              <div className="w-full space-y-6">
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    <VitalSenseMainDashboard
                      healthData={healthData}
                      onNavigateToFeature={setActiveTab}
                      onHealthDataImport={setHealthData}
                    />
                  </div>
                )}
                {activeTab === 'health-overview' && healthData && (
                  <div className="space-y-6">
                    <HealthOverview
                      healthData={healthData}
                      onNavigateToFeature={setActiveTab}
                    />
                  </div>
                )}
                {activeTab === 'user-profile' && (
                  <div className="space-y-6">
                    <UserProfile />
                  </div>
                )}
                {/* Removed VitalSenseBrandShowcase (component not found) */}
                {activeTab === 'insights' && healthData && (
                  <div className="space-y-6">
                    <EnhancedHealthInsightsDashboard healthData={healthData} />
                  </div>
                )}
                {activeTab === 'usage-analytics' && healthData && (
                  <div className="space-y-8">
                    <UsageAnalyticsDashboard />
                  </div>
                )}
                {activeTab === 'usage-predictions' && healthData && (
                  <div className="space-y-8">
                    <AIUsagePredictions healthData={healthData} />
                  </div>
                )}
                {activeTab === 'recommendations' && healthData && (
                  <div className="space-y-8">
                    <SmartFeatureRecommendations />
                  </div>
                )}
                {activeTab === 'engagement-optimizer' && healthData && (
                  <div className="space-y-8">
                    <PersonalizedEngagementOptimizer
                      healthData={healthData}
                      onNavigateToFeature={setActiveTab}
                    />
                  </div>
                )}
                {activeTab === 'smart-notifications' && healthData && (
                  <SmartNotificationEngine healthData={healthData} />
                )}
                {activeTab === 'realtime-scoring' && <RealTimeHealthScoring />}
                {activeTab === 'analytics' && healthData && (
                  <HealthAnalytics healthData={healthData} />
                )}
                {activeTab === 'enhanced-analytics' && (
                  <EnhancedHealthAnalytics
                    healthData={healthData}
                    onNavigateToFeature={(feature) => setActiveTab(feature)}
                  />
                )}
                {activeTab === 'posture-analysis' && healthData && (
                  <PostureAnalysis
                    healthData={healthData}
                    onNavigateToFeature={(feature) => setActiveTab(feature)}
                  />
                )}
                {activeTab === 'walking-patterns' && healthData && (
                  <WalkingPatternsAnalysis
                    healthData={healthData}
                    onNavigateToFeature={(feature) => setActiveTab(feature)}
                  />
                )}
                {activeTab === 'gait-analysis' && healthData && (
                  <GaitAnalysis
                    healthData={healthData}
                    onNavigateToFeature={(feature) => setActiveTab(feature)}
                  />
                )}
                {activeTab === 'fall-risk' && (
                  <FallRiskWalkingManager healthData={healthData} />
                )}
                {activeTab === 'fall-detection' && (
                  <FallRiskMonitor
                    healthData={healthData}
                    onNavigateToFeature={(feature) => setActiveTab(feature)}
                  />
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
                {activeTab === 'recommendations' && (
                  <BasicRecommendations healthData={healthData} />
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
                {activeTab === 'family-challenges' && (
                  <ErrorBoundary
                    fallback={
                      <div className="p-4 text-center">
                        <p className="text-red-600">
                          Family Challenges encountered an error.
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                          This might be due to missing environment
                          configuration. Check console for details.
                        </p>
                      </div>
                    }
                  >
                    <FamilyGameification />
                  </ErrorBoundary>
                )}
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
                  <EnhancedHealthDataImport onDataImported={setHealthData} />
                )}
                {activeTab === 'import' && (
                  <EnhancedHealthDataImport onDataImported={setHealthData} />
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
                {activeTab === 'developer-tools' && (
                  <ErrorBoundary
                    fallback={
                      <div className="p-4 text-center">
                        <p className="text-red-600">
                          Developer Tools encountered an error.
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                          Check console for details. Try refreshing the page.
                        </p>
                      </div>
                    }
                  >
                    <DeveloperTools />
                  </ErrorBoundary>
                )}
                {activeTab === 'ws-token-settings' && (
                  <WSTokenSettings inline={true} />
                )}
              </div>
            </div>
          )}
        </main>

        {/* Enhanced Footer */}
        <div className="mt-12 pt-8">
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
      </div>
    </div>
  );
}

export default App;
