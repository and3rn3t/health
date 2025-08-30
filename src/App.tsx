import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Heart, Activity, Shield, Phone, AlertTriangle, Upload, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'

import HealthDashboard from '@/components/health/HealthDashboard'
import FallRiskMonitor from '@/components/health/FallRiskMonitor'
import EmergencyContacts from '@/components/health/EmergencyContacts'
import FallHistory from '@/components/health/FallHistory'
import HealthDataImport from '@/components/health/HealthDataImport'

function App() {
  const [healthData, setHealthData] = useKV('health-data', null)
  const [fallRiskScore, setFallRiskScore] = useKV('fall-risk-score', 0)
  const [emergencyContacts, setEmergencyContacts] = useKV('emergency-contacts', [])
  const [activeTab, setActiveTab] = useState('dashboard')

  const hasHealthData = healthData && Object.keys(healthData).length > 0
  const isHighRisk = fallRiskScore > 70

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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="fall-risk" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Fall Risk
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Fall History
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contacts
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <HealthDashboard healthData={healthData} />
            </TabsContent>

            <TabsContent value="fall-risk" className="space-y-6">
              <FallRiskMonitor 
                healthData={healthData} 
                fallRiskScore={fallRiskScore}
                setFallRiskScore={setFallRiskScore}
              />
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
        )}
      </main>
    </div>
  )
}

export default App