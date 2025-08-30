import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Heart, Activity, Shield, Phone, AlertTriangle, Upload, Users, Gear, Roadmap, BarChart3, House, List, X, Clock, Share, Stethoscope, Trophy, Target, MagnifyingGlass, CloudArrowUp, TrendingUp, Bell, Brain, Moon, Sun, Monitor, Apple, Code, Lightbulb, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'

import HealthDashboard from '@/components/health/HealthDashboard'
import HealthAnalytics from '@/components/health/HealthAnalytics'
import FallRiskMonitor from '@/components/health/FallRiskMonitor'
import EmergencyContacts from '@/components/health/EmergencyContacts'
import FallHistory from '@/components/health/FallHistory'
import HealthDataImport from '@/components/health/HealthDataImport'
import FallMonitoringTooling from '@/components/health/FallMonitoringTooling'
import RealTimeFallDetection from '@/components/health/RealTimeFallDetection'
import ImplementationPhases from '@/components/health/ImplementationPhases'
import MovementPatternAnalysis from '@/components/health/MovementPatternAnalysis'
import MLPredictionsDashboard from '@/components/health/MLPredictionsDashboard'
import AIRecommendations from '@/components/health/AIRecommendations'
import CommunityShare from '@/components/health/CommunityShare'
import HealthcarePortal from '@/components/health/HealthcarePortal'
import FamilyDashboard from '@/components/health/FamilyDashboard'
import HealthGameCenter from '@/components/gamification/HealthGameCenter'
import FamilyGameification from '@/components/gamification/FamilyGameification'
import HealthSearch from '@/components/health/HealthSearch'
import RealTimeMonitoringHub from '@/components/health/RealTimeMonitoringHub'
import CloudInfrastructureStatus from '@/components/health/CloudInfrastructureStatus'
import LiveHealthDataIntegration from '@/components/health/LiveHealthDataIntegration'
import HealthInsightsDashboard from '@/components/health/HealthInsightsDashboard'
import HealthAlertsConfig from '@/components/health/HealthAlertsConfig'
import PredictiveHealthAlerts from '@/components/health/PredictiveHealthAlerts'
import RealTimeHealthScoring from '@/components/health/RealTimeHealthScoring'
import AdvancedAppleWatchIntegration from '@/components/health/AdvancedAppleWatchIntegration'
import EnhancedHealthInsightsDashboard from '@/components/health/EnhancedHealthInsightsDashboard'
import AppleWatchIntegrationChecklist from '@/components/health/AppleWatchIntegrationChecklist'
import XcodeDevelopmentSetup from '@/components/health/XcodeDevelopmentSetup'
import ComprehensiveAppleHealthKitGuide from '@/components/health/ComprehensiveAppleHealthKitGuide'
import WebSocketArchitectureGuide from '@/components/health/WebSocketArchitectureGuide'
import SmartFeatureRecommendations from '@/components/recommendations/SmartFeatureRecommendations'
import PersonalizedEngagementOptimizer from '@/components/recommendations/PersonalizedEngagementOptimizer'
import UsageAnalyticsDashboard from '@/components/analytics/UsageAnalyticsDashboard'
import AIUsagePredictions from '@/components/analytics/AIUsagePredictions'
import SmartNotificationEngine from '@/components/notifications/SmartNotificationEngine'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'

function App() {
  const [healthData, setHealthData] = useKV<ProcessedHealthData | null>('health-data', null)
  const [fallRiskScore, setFallRiskScore] = useKV('fall-risk-score', 0)
  const [emergencyContacts, setEmergencyContacts] = useKV('emergency-contacts', [])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useKV('sidebar-collapsed', false)
  const [themeMode, setThemeMode] = useKV<'light' | 'dark' | 'system'>('theme-mode', 'system')

  // Apply theme based on mode and system preference using [data-appearance]
  useEffect(() => {
    const root = document.documentElement

    const applyTheme = () => {
      // Cleanup any legacy class usage
      root.classList.remove('dark')

      if (themeMode === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.setAttribute('data-appearance', systemPrefersDark ? 'dark' : 'light')
      } else if (themeMode === 'dark') {
        root.setAttribute('data-appearance', 'dark')
      } else {
        root.setAttribute('data-appearance', 'light')
      }
    }

    applyTheme()

    // Listen for system theme changes when in system mode
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme()
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [themeMode])

  const toggleThemeMode = () => {
    const modes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const currentIndex = modes.indexOf(themeMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setThemeMode(nextMode)
    
    const modeLabels = {
      light: 'Light mode',
      dark: 'Dark mode', 
      system: 'System preference'
    }
    toast.success(`Switched to ${modeLabels[nextMode]}`)
  }

  // Helper to get current effective theme
  const getEffectiveTheme = () => {
    if (themeMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return themeMode
  }

  const hasHealthData = healthData && healthData.metrics && Object.keys(healthData.metrics).length > 0
  const isHighRisk = hasHealthData && (
    (healthData.healthScore || 0) < 60 || 
    (healthData.fallRiskFactors && healthData.fallRiskFactors.some(factor => factor.risk === 'high'))
  )

  // Define navigation structure with categories
  const navigationItems = {
    main: [
      { id: 'dashboard', label: 'Dashboard', icon: Heart },
  { id: 'insights', label: 'Insights', icon: TrendingUp },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'usage-analytics', label: 'Usage Analytics', icon: Brain },
      { id: 'usage-predictions', label: 'Usage Predictions', icon: Sparkle },
      { id: 'fall-risk', label: 'Fall Risk', icon: Shield },
      { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
      { id: 'engagement-optimizer', label: 'Engagement Optimizer', icon: Target },
      { id: 'smart-notifications', label: 'Smart Notifications', icon: Bell },
      { id: 'search', label: 'Search', icon: MagnifyingGlass }
    ],
    monitoring: [
      { id: 'realtime-scoring', label: 'Live Health Score', icon: Heart },
      { id: 'alerts', label: 'Health Alerts', icon: Bell },
      { id: 'predictive-alerts', label: 'Predictive Alerts', icon: Brain },
      { id: 'history', label: 'History', icon: Clock }
    ],
    ai: [
      { id: 'ai-recommendations', label: 'AI Recommendations', icon: Activity },
      { id: 'ml-predictions', label: 'ML Predictions', icon: Activity },
      { id: 'movement-patterns', label: 'Movement Analysis', icon: Activity },
      { id: 'realtime', label: 'Fall Detection', icon: Activity }
    ],
    advanced: [
      { id: 'monitoring-hub', label: 'Monitoring Hub', icon: Activity },
      { id: 'live-integration', label: 'Live Integration', icon: CloudArrowUp },
      { id: 'advanced-watch', label: 'Watch Integration', icon: Activity }
    ],
    gamification: [
      { id: 'game-center', label: 'Game Center', icon: Trophy },
      { id: 'family-challenges', label: 'Family Challenges', icon: Target }
    ],
    community: [
      { id: 'family', label: 'Family Dashboard', icon: Users },
      { id: 'community', label: 'Community Share', icon: Share },
      { id: 'healthcare', label: 'Healthcare Portal', icon: Stethoscope }
    ],
    management: [
      { id: 'contacts', label: 'Emergency Contacts', icon: Users },
      { id: 'import', label: 'Import Data', icon: Upload }
    ],
    setup: [
  { id: 'phases', label: 'Implementation', icon: Roadmap },
  { id: 'healthkit-guide', label: 'HealthKit Guide', icon: Apple },
      { id: 'websocket-guide', label: 'WebSocket Bridge', icon: CloudArrowUp },
  { id: 'integration-checklist', label: 'Integration Checklist', icon: Apple },
      { id: 'xcode-setup', label: 'Xcode Development Setup', icon: Code },
      { id: 'infrastructure', label: 'Cloud Infrastructure', icon: Gear }
    ]
  }

  // Get current page details for breadcrumb
  const getCurrentPageInfo = () => {
    const allItems = [...navigationItems.main, ...navigationItems.monitoring, ...navigationItems.ai, ...navigationItems.advanced, ...navigationItems.gamification, ...navigationItems.community, ...navigationItems.management, ...navigationItems.setup]
    const currentItem = allItems.find(item => item.id === activeTab)
    
    if (!currentItem) return { label: 'Dashboard', category: 'Main' }
    
    let category = 'Main'
    if (navigationItems.monitoring.find(item => item.id === activeTab)) category = 'Monitoring'
    if (navigationItems.ai.find(item => item.id === activeTab)) category = 'AI & ML'
    if (navigationItems.advanced.find(item => item.id === activeTab)) category = 'Advanced'
    if (navigationItems.gamification.find(item => item.id === activeTab)) category = 'Gamification'
    if (navigationItems.community.find(item => item.id === activeTab)) category = 'Community'
    if (navigationItems.management.find(item => item.id === activeTab)) category = 'Management'
    if (navigationItems.setup.find(item => item.id === activeTab)) category = 'Setup'
    
    return { label: currentItem.label, category }
  }

  const currentPageInfo = getCurrentPageInfo()

  // Sidebar component for larger screens
  const Sidebar = () => (
    <aside className={`
      fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out
      bg-card border-r border-border
      ${sidebarCollapsed ? 'w-16' : 'w-64'}
      hidden lg:block
    `}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">HealthGuard</h2>
                  <p className="text-xs text-muted-foreground">Health Monitor</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(current => !current)}
              className="h-8 w-8 p-0"
            >
              {sidebarCollapsed ? <List className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6">
          {/* Main Features */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Main Features
              </h3>
            )}
            <div className="space-y-1">
              {navigationItems.main.map((item) => {
                const IconComponent = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                      w-full justify-start h-10
                      ${sidebarCollapsed ? 'px-3' : 'px-3'}
                      ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                    `}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="ml-3">{item.label}</span>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Monitoring */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Monitoring & Alerts
              </h3>
            )}
            <div className="space-y-1">
              {navigationItems.monitoring.map((item) => {
                const IconComponent = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                      w-full justify-start h-10
                      ${sidebarCollapsed ? 'px-3' : 'px-3'}
                      ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                    `}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="ml-3">{item.label}</span>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* AI & ML */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                AI & Machine Learning
              </h3>
            )}
            <div className="space-y-1">
              {navigationItems.ai.map((item) => {
                const IconComponent = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                      w-full justify-start h-10
                      ${sidebarCollapsed ? 'px-3' : 'px-3'}
                      ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                    `}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="ml-3">{item.label}</span>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Advanced Features */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Advanced Features
              </h3>
            )}
            <div className="space-y-1">
              {navigationItems.advanced.map((item) => {
                const IconComponent = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                      w-full justify-start h-10
                      ${sidebarCollapsed ? 'px-3' : 'px-3'}
                      ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                    `}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="ml-3">{item.label}</span>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Gamification */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Gamification
              </h3>
            )}
            <div className="space-y-1">
              {navigationItems.gamification.map((item) => {
                const IconComponent = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                      w-full justify-start h-10
                      ${sidebarCollapsed ? 'px-3' : 'px-3'}
                      ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                    `}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="ml-3">{item.label}</span>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Community */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Community & Care
              </h3>
            )}
            <div className="space-y-1">
              {navigationItems.community.map((item) => {
                const IconComponent = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                      w-full justify-start h-10
                      ${sidebarCollapsed ? 'px-3' : 'px-3'}
                      ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                    `}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="ml-3">{item.label}</span>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Management */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Management
              </h3>
            )}
            <div className="space-y-1">
              {navigationItems.management.map((item) => {
                const IconComponent = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                      w-full justify-start h-10
                      ${sidebarCollapsed ? 'px-3' : 'px-3'}
                      ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                    `}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="ml-3">{item.label}</span>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Setup */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Setup & Configuration
              </h3>
            )}
            <div className="space-y-1">
              {navigationItems.setup.map((item) => {
                const IconComponent = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                      w-full justify-start h-10
                      ${sidebarCollapsed ? 'px-3' : 'px-3'}
                      ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                    `}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="ml-3">{item.label}</span>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {/* Theme mode toggle */}
          <div className="mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleThemeMode}
              className={`
                w-full justify-start h-8
                ${sidebarCollapsed ? 'px-3' : 'px-3'}
                hover:bg-muted
              `}
            >
              {themeMode === 'dark' && <Moon className="h-4 w-4 flex-shrink-0" />}
              {themeMode === 'light' && <Sun className="h-4 w-4 flex-shrink-0" />}
              {themeMode === 'system' && <Monitor className="h-4 w-4 flex-shrink-0" />}
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
              <Badge variant="outline" className="w-full justify-center text-primary border-primary">
                Health Score: {healthData.healthScore || 0}/100
              </Badge>
              {isHighRisk && (
                <Badge variant="destructive" className="w-full justify-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  High Fall Risk
                </Badge>
              )}
            </div>
          )}
          {hasHealthData && sidebarCollapsed && isHighRisk && (
            <div className="flex justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          )}
        </div>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar for larger screens */}
      <Sidebar />
      
      {/* Main layout with responsive margin */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Header */}
        <header className="border-b bg-card lg:hidden">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">HealthGuard</h1>
                  <p className="text-sm text-muted-foreground">Apple Health Insights & Fall Risk Monitor</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {hasHealthData && (
                  <Badge variant="outline" className="text-primary border-primary">
                    Health Score: {healthData.healthScore || 0}/100
                  </Badge>
                )}
                {isHighRisk && (
                  <Badge variant="destructive" className="flex items-center gap-2">
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
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-accent border-accent hover:bg-accent hover:text-accent-foreground"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Emergency
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="border-b bg-card hidden lg:block">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {currentPageInfo.label}
                </h1>
                  <div className="text-sm text-muted-foreground">
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'Dashboard' && 'Core health monitoring overview'}
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'Insights' && 'Real-time trending data and AI-powered insights'}
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'Analytics' && 'Deep analysis of your health metrics'}
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'Usage Analytics' && 'Discover how AI optimizes your HealthGuard experience'}
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'Usage Predictions' && 'AI-powered forecasts of your health engagement trends'}
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'Fall Risk' && 'Fall prevention and risk assessment'}
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'Recommendations' && 'Smart suggestions based on your usage patterns'}
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'Engagement Optimizer' && 'Personalized recommendations to optimize your health monitoring experience'}
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'Smart Notifications' && 'AI-powered notifications optimized for your engagement patterns'}
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'Search' && 'Find specific health insights and data'}
                    {currentPageInfo.category === 'Monitoring' && 'Health monitoring and alert system'}
                    {currentPageInfo.category === 'AI & ML' && 'Advanced AI analysis and machine learning'}
                    {currentPageInfo.category === 'Advanced' && 'Advanced monitoring and integration features'}
                    {currentPageInfo.category === 'Gamification' && 'Challenges, competitions, and motivation'}
                    {currentPageInfo.category === 'Community' && 'Share progress with your care team'}
                    {currentPageInfo.category === 'Management' && 'Data and contact management'}
                    {currentPageInfo.category === 'Setup' && 'Configuration and setup guides'}
                  </div>
              </div>
              <div className="flex items-center gap-4">
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
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-accent border-accent hover:bg-accent hover:text-accent-foreground"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Emergency
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 py-6">
          {!hasHealthData ? (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Get Started with Your Health Data
                  </CardTitle>
                  <CardDescription>
                    Import your Apple Health data to unlock comprehensive insights and fall risk monitoring.
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
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <House className="h-4 w-4" />
                        HealthGuard
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  {/* Primary Navigation - Main Features */}
                  <div>
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 gap-1 h-auto p-1">
                      {navigationItems.main.slice(0, 6).map((item) => {
                        const IconComponent = item.icon
                        return (
                          <TabsTrigger 
                            key={item.id}
                            value={item.id} 
                            className="flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs py-2 px-1 min-h-12"
                          >
                            <IconComponent className="h-4 w-4" />
                            <span className="text-xs leading-tight text-center">{item.label}</span>
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>
                  </div>

                  {/* Compact Feature Categories */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">More Features</h3>
                      <Badge variant="outline" className="text-xs">
                        {navigationItems.main.slice(7).length + navigationItems.monitoring.length + navigationItems.ai.length + navigationItems.advanced.length + navigationItems.gamification.length + navigationItems.community.length + navigationItems.management.length + navigationItems.setup.length} more
                      </Badge>
                    </div>
                    
                    {/* Horizontal scrollable categories */}
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {/* Core Features */}
                      <div className="flex-shrink-0 space-y-2 min-w-[140px]">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Core Features
                        </h4>
                        <div className="space-y-1">
                          {navigationItems.main.slice(7).map((item) => {
                            const IconComponent = item.icon
                            return (
                              <Button
                                key={item.id}
                                variant={activeTab === item.id ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveTab(item.id)}
                                className="w-full justify-start text-xs h-7 px-2"
                              >
                                <IconComponent className="h-3 w-3 mr-2" />
                                <span className="truncate">{item.label}</span>
                              </Button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Monitoring */}
                      <div className="flex-shrink-0 space-y-2 min-w-[140px]">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Monitoring
                        </h4>
                        <div className="space-y-1">
                          {navigationItems.monitoring.slice(0, 3).map((item) => {
                            const IconComponent = item.icon
                            return (
                              <Button
                                key={item.id}
                                variant={activeTab === item.id ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveTab(item.id)}
                                className="w-full justify-start text-xs h-7 px-2"
                              >
                                <IconComponent className="h-3 w-3 mr-2" />
                                <span className="truncate">{item.label}</span>
                              </Button>
                            )
                          })}
                        </div>
                      </div>

                      {/* AI & ML */}
                      <div className="flex-shrink-0 space-y-2 min-w-[140px]">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          AI & ML
                        </h4>
                        <div className="space-y-1">
                          {navigationItems.ai.slice(0, 3).map((item) => {
                            const IconComponent = item.icon
                            return (
                              <Button
                                key={item.id}
                                variant={activeTab === item.id ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveTab(item.id)}
                                className="w-full justify-start text-xs h-7 px-2"
                              >
                                <IconComponent className="h-3 w-3 mr-2" />
                                <span className="truncate">{item.label}</span>
                              </Button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Advanced */}
                      <div className="flex-shrink-0 space-y-2 min-w-[140px]">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Advanced
                        </h4>
                        <div className="space-y-1">
                          {navigationItems.advanced.map((item) => {
                            const IconComponent = item.icon
                            return (
                              <Button
                                key={item.id}
                                variant={activeTab === item.id ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveTab(item.id)}
                                className="w-full justify-start text-xs h-7 px-2"
                              >
                                <IconComponent className="h-3 w-3 mr-2" />
                                <span className="truncate">{item.label}</span>
                              </Button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Community */}
                      <div className="flex-shrink-0 space-y-2 min-w-[140px]">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Community
                        </h4>
                        <div className="space-y-1">
                          {[...navigationItems.gamification, ...navigationItems.community].map((item) => {
                            const IconComponent = item.icon
                            return (
                              <Button
                                key={item.id}
                                variant={activeTab === item.id ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveTab(item.id)}
                                className="w-full justify-start text-xs h-7 px-2"
                              >
                                <IconComponent className="h-3 w-3 mr-2" />
                                <span className="truncate">{item.label}</span>
                              </Button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Setup */}
                      <div className="flex-shrink-0 space-y-2 min-w-[140px]">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Setup
                        </h4>
                        <div className="space-y-1">
                          {[...navigationItems.management, ...navigationItems.setup.slice(0, 3)].map((item) => {
                            const IconComponent = item.icon
                            return (
                              <Button
                                key={item.id}
                                variant={activeTab === item.id ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveTab(item.id)}
                                className="w-full justify-start text-xs h-7 px-2"
                              >
                                <IconComponent className="h-3 w-3 mr-2" />
                                <span className="truncate">{item.label}</span>
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Tabs>
              </div>

              {/* Content Area */}
              <div className="space-y-6">
                {activeTab === 'dashboard' && healthData && <HealthDashboard healthData={healthData} />}
                {activeTab === 'insights' && healthData && <EnhancedHealthInsightsDashboard healthData={healthData} />}
                {activeTab === 'usage-analytics' && healthData && <UsageAnalyticsDashboard healthData={healthData} />}
                {activeTab === 'usage-predictions' && healthData && <AIUsagePredictions healthData={healthData} />}
                {activeTab === 'recommendations' && healthData && (
                  <SmartFeatureRecommendations 
                    healthData={healthData} 
                    onNavigateToFeature={setActiveTab}
                  />
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
                {activeTab === 'analytics' && healthData && <HealthAnalytics healthData={healthData} />}
                {activeTab === 'fall-risk' && (
                  <FallRiskMonitor 
                    healthData={healthData} 
                    fallRiskScore={fallRiskScore}
                    setFallRiskScore={setFallRiskScore}
                  />
                )}
                {activeTab === 'alerts' && healthData && <HealthAlertsConfig healthData={healthData} />}
                {activeTab === 'predictive-alerts' && healthData && <PredictiveHealthAlerts healthData={healthData} />}
                {activeTab === 'search' && healthData && (
                  <HealthSearch 
                    healthData={healthData} 
                    onNavigateToInsight={(tab, metric) => {
                      setActiveTab(tab)
                      if (metric) {
                        toast.success(`Navigated to ${metric} in ${tab}`)
                      }
                    }}
                  />
                )}
                {activeTab === 'ai-recommendations' && healthData && <AIRecommendations healthData={healthData} />}
                {activeTab === 'ml-predictions' && healthData && <MLPredictionsDashboard healthData={healthData} />}
                {activeTab === 'movement-patterns' && healthData && <MovementPatternAnalysis healthData={healthData} />}
                {activeTab === 'realtime' && <RealTimeFallDetection />}
                {activeTab === 'monitoring-hub' && healthData && <RealTimeMonitoringHub healthData={healthData} />}
                {activeTab === 'live-integration' && <LiveHealthDataIntegration />}
                {activeTab === 'advanced-watch' && <AdvancedAppleWatchIntegration />}
                {activeTab === 'history' && <FallHistory />}
                {activeTab === 'game-center' && healthData && <HealthGameCenter healthData={healthData} />}
                {activeTab === 'family-challenges' && <FamilyGameification />}
                {activeTab === 'family' && healthData && <FamilyDashboard healthData={healthData} />}
                {activeTab === 'community' && healthData && <CommunityShare healthData={healthData} />}
                {activeTab === 'healthcare' && healthData && <HealthcarePortal healthData={healthData} />}
                {activeTab === 'contacts' && (
                  <EmergencyContacts 
                    contacts={emergencyContacts}
                    setContacts={setEmergencyContacts}
                  />
                )}
                {activeTab === 'import' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Import Additional Health Data</CardTitle>
                      <CardDescription>
                        Update your health data to keep insights current and accurate.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <HealthDataImport onDataImported={setHealthData} />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'phases' && <ImplementationPhases />}
                {activeTab === 'healthkit-guide' && <ComprehensiveAppleHealthKitGuide />}
                {activeTab === 'websocket-guide' && <WebSocketArchitectureGuide />}
                {activeTab === 'integration-checklist' && <AppleWatchIntegrationChecklist />}
                {activeTab === 'xcode-setup' && <XcodeDevelopmentSetup />}
                {activeTab === 'infrastructure' && <CloudInfrastructureStatus />}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App