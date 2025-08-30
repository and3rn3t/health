import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Heart, Activity, Shield, Phone, AlertTriangle, Upload, Users, Gear, Roadmap, BarChart3, House, List, X, Clock, Share, Stethoscope, Trophy, Target, MagnifyingGlass, CloudArrowUp, TrendingUp } from '@phosphor-icons/react'
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
import { ProcessedHealthData } from '@/lib/healthDataProcessor'

function App() {
  const [healthData, setHealthData] = useKV<ProcessedHealthData | null>('health-data', null)
  const [fallRiskScore, setFallRiskScore] = useKV('fall-risk-score', 0)
  const [emergencyContacts, setEmergencyContacts] = useKV('emergency-contacts', [])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useKV('sidebar-collapsed', false)

  const hasHealthData = healthData && healthData.metrics && Object.keys(healthData.metrics).length > 0
  const isHighRisk = hasHealthData && (
    (healthData.healthScore || 0) < 60 || 
    (healthData.fallRiskFactors && healthData.fallRiskFactors.some(factor => factor.risk === 'high'))
  )

  // Define navigation structure with categories
  const navigationItems = {
    main: [
      { id: 'dashboard', label: 'Dashboard', icon: Heart },
      { id: 'insights', label: 'Live Insights', icon: TrendingUp },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'fall-risk', label: 'Fall Risk', icon: Shield },
      { id: 'search', label: 'Search', icon: MagnifyingGlass },
      { id: 'history', label: 'History', icon: Clock }
    ],
    ai: [
      { id: 'ai-recommendations', label: 'AI Recommendations', icon: Activity },
      { id: 'ml-predictions', label: 'ML Predictions', icon: Activity },
      { id: 'movement-patterns', label: 'Movement Analysis', icon: Activity },
      { id: 'realtime', label: 'Real-time Detection', icon: Activity },
      { id: 'monitoring-hub', label: 'Monitoring Hub', icon: Activity },
      { id: 'live-integration', label: 'Live Data Integration', icon: CloudArrowUp }
    ],
    gamification: [
      { id: 'game-center', label: 'Game Center', icon: Trophy },
      { id: 'family-challenges', label: 'Family Challenges', icon: Target },
      { id: 'competitions', label: 'Competitions', icon: Trophy }
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
      { id: 'infrastructure', label: 'Cloud Infrastructure', icon: Gear }
    ]
  }

  // Get current page details for breadcrumb
  const getCurrentPageInfo = () => {
    const allItems = [...navigationItems.main, ...navigationItems.ai, ...navigationItems.gamification, ...navigationItems.community, ...navigationItems.management, ...navigationItems.setup]
    const currentItem = allItems.find(item => item.id === activeTab)
    
    if (!currentItem) return { label: 'Dashboard', category: 'Main' }
    
    let category = 'Main'
    if (navigationItems.ai.find(item => item.id === activeTab)) category = 'AI & Monitoring'
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

          {/* AI & Monitoring */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                AI & Monitoring
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

          {/* Gamification */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Gamification & Motivation
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
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'Live Insights' && 'Real-time trending data and AI-powered insights'}
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'Analytics' && 'Deep analysis of your health metrics'}
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'Fall Risk' && 'Fall prevention and risk assessment'}
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'Search' && 'Find specific health insights and data'}
                    {currentPageInfo.category === 'Main' && currentPageInfo.label === 'History' && 'View your health history and fall records'}
                    {currentPageInfo.category === 'AI & Monitoring' && 'Advanced AI analysis and real-time monitoring'}
                    {currentPageInfo.category === 'Gamification' && 'Challenges, competitions, and motivation'}
                    {currentPageInfo.category === 'Community' && 'Share progress with your care team'}
                    {currentPageInfo.category === 'Management' && 'Data and contact management'}
                    {currentPageInfo.category === 'Setup' && 'Configuration and setup guides'}
                  </div>
              </div>
              <div className="flex items-center gap-4">
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
                    <TabsList className="grid w-full grid-cols-6 h-12">
                      {navigationItems.main.map((item) => {
                        const IconComponent = item.icon
                        return (
                          <TabsTrigger 
                            key={item.id}
                            value={item.id} 
                            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
                          >
                            <IconComponent className="h-4 w-4" />
                            <span className="hidden sm:inline">{item.label}</span>
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>
                  </div>

                  {/* Compact Secondary Navigation */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">More Features</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={activeTab === 'search' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setActiveTab('search')}
                          className="text-xs h-8"
                        >
                          <MagnifyingGlass className="h-3 w-3 mr-1" />
                          Search
                        </Button>
                        <Badge variant="outline" className="text-xs">
                          {navigationItems.ai.length + navigationItems.gamification.length + navigationItems.community.length + navigationItems.management.length + navigationItems.setup.length} features
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Tabbed Interface for Feature Categories */}
                    <Tabs defaultValue="ai" className="w-full">
                      <TabsList className="grid w-full grid-cols-4 h-10">
                        <TabsTrigger value="ai" className="text-xs">
                          <Activity className="h-3 w-3 mr-1" />
                          AI
                        </TabsTrigger>
                        <TabsTrigger value="games" className="text-xs">
                          <Trophy className="h-3 w-3 mr-1" />
                          Games
                        </TabsTrigger>
                        <TabsTrigger value="social" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Social
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="text-xs">
                          <Gear className="h-3 w-3 mr-1" />
                          Setup
                        </TabsTrigger>
                      </TabsList>
                      
                      <div className="mt-3">
                        <TabsContent value="ai" className="mt-0">
                          <div className="grid grid-cols-2 gap-2">
                            {navigationItems.ai.map((item) => {
                              const IconComponent = item.icon
                              return (
                                <Button
                                  key={item.id}
                                  variant={activeTab === item.id ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setActiveTab(item.id)}
                                  className="flex items-center gap-2 text-xs h-8"
                                >
                                  <IconComponent className="h-3 w-3" />
                                  <span className="truncate">{item.label}</span>
                                </Button>
                              )
                            })}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="games" className="mt-0">
                          <div className="grid grid-cols-2 gap-2">
                            {navigationItems.gamification.map((item) => {
                              const IconComponent = item.icon
                              return (
                                <Button
                                  key={item.id}
                                  variant={activeTab === item.id ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setActiveTab(item.id)}
                                  className="flex items-center gap-2 text-xs h-8"
                                >
                                  <IconComponent className="h-3 w-3" />
                                  <span className="truncate">{item.label}</span>
                                </Button>
                              )
                            })}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="social" className="mt-0">
                          <div className="grid grid-cols-2 gap-2">
                            {navigationItems.community.map((item) => {
                              const IconComponent = item.icon
                              return (
                                <Button
                                  key={item.id}
                                  variant={activeTab === item.id ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setActiveTab(item.id)}
                                  className="flex items-center gap-2 text-xs h-8"
                                >
                                  <IconComponent className="h-3 w-3" />
                                  <span className="truncate">{item.label}</span>
                                </Button>
                              )
                            })}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="settings" className="mt-0">
                          <div className="grid grid-cols-2 gap-2">
                            {[...navigationItems.management, ...navigationItems.setup].map((item) => {
                              const IconComponent = item.icon
                              return (
                                <Button
                                  key={item.id}
                                  variant={activeTab === item.id ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setActiveTab(item.id)}
                                  className="flex items-center gap-2 text-xs h-8"
                                >
                                  <IconComponent className="h-3 w-3" />
                                  <span className="truncate">{item.label}</span>
                                </Button>
                              )
                            })}
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </Tabs>
              </div>

              {/* Content Area */}
              <div className="space-y-6">
                {activeTab === 'dashboard' && healthData && <HealthDashboard healthData={healthData} />}
                {activeTab === 'insights' && healthData && <HealthInsightsDashboard healthData={healthData} />}
                {activeTab === 'analytics' && healthData && <HealthAnalytics healthData={healthData} />}
                {activeTab === 'fall-risk' && (
                  <FallRiskMonitor 
                    healthData={healthData} 
                    fallRiskScore={fallRiskScore}
                    setFallRiskScore={setFallRiskScore}
                  />
                )}
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
                {activeTab === 'history' && <FallHistory />}
                {activeTab === 'game-center' && healthData && <HealthGameCenter healthData={healthData} />}
                {activeTab === 'family-challenges' && <FamilyGameification />}
                {activeTab === 'competitions' && healthData && <HealthGameCenter healthData={healthData} />}
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