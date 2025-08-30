import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Heart, Activity, Shield, Phone, AlertTriangle, Upload, Users, Gear, Roadmap, BarChart3, House } from '@phosphor-icons/react'
import { toast } from 'sonner'

import HealthDashboard from '@/components/health/HealthDashboard'
import HealthAnalytics from '@/components/health/HealthAnalytics'
import FallRiskMonitor from '@/components/health/FallRiskMonitor'
import EmergencyContacts from '@/components/health/EmergencyContacts'
import FallHistory from '@/components/health/FallHistory'
import HealthDataImport from '@/components/health/HealthDataImport'
import FallMonitoringTooling from '@/components/health/FallMonitoringTooling'
import ImplementationPhases from '@/components/health/ImplementationPhases'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'

function App() {
  const [healthData, setHealthData] = useKV<ProcessedHealthData | null>('health-data', null)
  const [fallRiskScore, setFallRiskScore] = useKV('fall-risk-score', 0)
  const [emergencyContacts, setEmergencyContacts] = useKV('emergency-contacts', [])
  const [activeTab, setActiveTab] = useState('dashboard')

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
      { id: 'history', label: 'History', icon: Activity }
    ],
    management: [
      { id: 'contacts', label: 'Emergency Contacts', icon: Users },
      { id: 'import', label: 'Import Data', icon: Upload }
    ],
    setup: [
      { id: 'tooling', label: 'Setup Guide', icon: Gear },
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
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

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
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
            {/* Breadcrumb Navigation */}
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {/* Primary Navigation - Main Features */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Main Features</h3>
                  <TabsList className="grid w-full grid-cols-4 h-12">
                    {navigationItems.main.map((item) => {
                      const IconComponent = item.icon
                      return (
                        <TabsTrigger 
                          key={item.id}
                          value={item.id} 
                          className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
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

            <TabsContent value="dashboard" className="space-y-6">
              <HealthDashboard healthData={healthData} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <HealthAnalytics healthData={healthData} />
            </TabsContent>

            <TabsContent value="fall-risk" className="space-y-6">
              <FallRiskMonitor 
                healthData={healthData} 
                fallRiskScore={fallRiskScore}
                setFallRiskScore={setFallRiskScore}
              />
            </TabsContent>

            <TabsContent value="tooling" className="space-y-6">
              <FallMonitoringTooling />
            </TabsContent>

            <TabsContent value="phases" className="space-y-6">
              <ImplementationPhases />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <FallHistory />
            </TabsContent>

            <TabsContent value="contacts" className="space-y-6">
              <EmergencyContacts 
                contacts={emergencyContacts}
                setContacts={setEmergencyContacts}
              />
            </TabsContent>

            <TabsContent value="import" className="space-y-6">
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
            </TabsContent>
          </Tabs>
          </div>
        )}
      </main>
    </div>
  )
}

export default App