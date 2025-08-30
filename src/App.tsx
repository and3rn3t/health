import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Heart, Activity, Shield, Phone, AlertTriangle, Upload, Users, Gear, Roadmap, BarChart3, House, List, X, Clock } from '@phosphor-icons/react'
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
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'fall-risk', label: 'Fall Risk', icon: Shield },
      { id: 'ml-predictions', label: 'ML Predictions', icon: Activity },
      { id: 'movement-patterns', label: 'Movement Analysis', icon: Activity },
      { id: 'realtime', label: 'Real-time Detection', icon: Activity },
      { id: 'history', label: 'History', icon: Clock }
    ],
    management: [
      { id: 'contacts', label: 'Emergency Contacts', icon: Users },
      { id: 'import', label: 'Import Data', icon: Upload }
    ],
    setup: [
      { id: 'realtime', label: 'Real-time Detection', icon: Gear },
      { id: 'phases', label: 'Implementation', icon: Roadmap }
    ]
  }

  // Get current page details for breadcrumb
  const getCurrentPageInfo = () => {
    const allItems = [...navigationItems.main, ...navigationItems.management, ...navigationItems.setup]
    const currentItem = allItems.find(item => item.id === activeTab)
    
    if (!currentItem) return { label: 'Dashboard', category: 'Main' }
    
    let category = 'Main'
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
                <p className="text-sm text-muted-foreground">
                  {currentPageInfo.category === 'Main' && 'Health monitoring and analytics'}
                  {currentPageInfo.category === 'Management' && 'Data and contact management'}
                  {currentPageInfo.category === 'Setup' && 'Configuration and setup guides'}
                </p>
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  {/* Primary Navigation - Main Features */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Main Features</h3>
                      <TabsList className="grid w-full grid-cols-4 h-12">
                        {navigationItems.main.slice(0, 4).map((item) => {
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

                    {/* Secondary Navigation - Management & Setup */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Management</h4>
                        <div className="flex flex-wrap gap-2">
                          {navigationItems.main.slice(4).map((item) => {
                            const IconComponent = item.icon
                            return (
                              <Button
                                key={item.id}
                                variant={activeTab === item.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveTab(item.id)}
                                className="flex items-center gap-2"
                              >
                                <IconComponent className="h-4 w-4" />
                                {item.label}
                              </Button>
                            )
                          })}
                          {navigationItems.management.map((item) => {
                            const IconComponent = item.icon
                            return (
                              <Button
                                key={item.id}
                                variant={activeTab === item.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveTab(item.id)}
                                className="flex items-center gap-2"
                              >
                                <IconComponent className="h-4 w-4" />
                                {item.label}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Setup & Configuration</h4>
                        <div className="flex flex-wrap gap-2">
                          {navigationItems.setup.map((item) => {
                            const IconComponent = item.icon
                            return (
                              <Button
                                key={item.id}
                                variant={activeTab === item.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveTab(item.id)}
                                className="flex items-center gap-2"
                              >
                                <IconComponent className="h-4 w-4" />
                                {item.label}
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
                {activeTab === 'analytics' && healthData && <HealthAnalytics healthData={healthData} />}
                {activeTab === 'fall-risk' && (
                  <FallRiskMonitor 
                    healthData={healthData} 
                    fallRiskScore={fallRiskScore}
                    setFallRiskScore={setFallRiskScore}
                  />
                )}
                {activeTab === 'ml-predictions' && healthData && <MLPredictionsDashboard healthData={healthData} />}
                {activeTab === 'movement-patterns' && healthData && <MovementPatternAnalysis healthData={healthData} />}
                {activeTab === 'realtime' && <RealTimeFallDetection />}
                {activeTab === 'tooling' && <RealTimeFallDetection />}
                {activeTab === 'phases' && <ImplementationPhases />}
                {activeTab === 'history' && <FallHistory />}
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
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App