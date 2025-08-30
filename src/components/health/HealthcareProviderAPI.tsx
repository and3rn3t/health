import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Stethoscope, 
  Plus, 
  Trash,
  Send,
  CheckCircle,
  Warning,
  Clock,
  Shield,
  Database,
  Link,
  Key,
  Hospital,
  User,
  Bell,
  FileText,
  Activity
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface HealthcareProvider {
  id: string
  name: string
  type: 'primary-care' | 'specialist' | 'hospital' | 'clinic' | 'pharmacy'
  contactInfo: {
    email: string
    phone: string
    fax?: string
    address: string
  }
  apiConfig: {
    endpoint: string
    apiKey: string
    protocol: 'FHIR' | 'HL7' | 'Custom'
    version: string
  }
  permissions: {
    canReceiveAlerts: boolean
    canAccessFullHistory: boolean
    emergencyContact: boolean
    dataSharing: 'read-only' | 'read-write' | 'emergency-only'
  }
  lastSync: string | null
  status: 'active' | 'pending' | 'inactive'
}

interface APIIntegration {
  id: string
  providerId: string
  endpoint: string
  status: 'connected' | 'pending' | 'error' | 'testing'
  lastTest: string | null
  responseTime: number | null
  dataFormat: string
  frequency: 'real-time' | 'hourly' | 'daily' | 'weekly'
}

interface HealthReport {
  id: string
  providerId: string
  type: 'emergency' | 'routine' | 'alert' | 'summary'
  data: any
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  timestamp: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export default function HealthcareProviderAPI() {
  const [providers, setProviders] = useKV<HealthcareProvider[]>('healthcare-providers', [])
  const [integrations, setIntegrations] = useKV<APIIntegration[]>('api-integrations', [])
  const [reports, setReports] = useKV<HealthReport[]>('health-reports', [])
  const [newProvider, setNewProvider] = useState<Partial<HealthcareProvider>>({
    name: '',
    type: 'primary-care',
    contactInfo: { email: '', phone: '', address: '' },
    apiConfig: { endpoint: '', apiKey: '', protocol: 'FHIR', version: '4.0' },
    permissions: {
      canReceiveAlerts: true,
      canAccessFullHistory: false,
      emergencyContact: false,
      dataSharing: 'read-only'
    }
  })
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  // Simulate API testing
  const testAPIConnection = async (providerId: string) => {
    setIsTestingConnection(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const integration = integrations.find(i => i.providerId === providerId)
      if (integration) {
        setIntegrations(current => 
          current.map(i => 
            i.providerId === providerId 
              ? { 
                  ...i, 
                  status: 'connected', 
                  lastTest: new Date().toISOString(),
                  responseTime: Math.random() * 500 + 100
                }
              : i
          )
        )
        toast.success('API connection successful')
      }
    } catch (error) {
      setIntegrations(current => 
        current.map(i => 
          i.providerId === providerId 
            ? { ...i, status: 'error', lastTest: new Date().toISOString() }
            : i
        )
      )
      toast.error('API connection failed')
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Add new healthcare provider
  const addProvider = () => {
    if (!newProvider.name || !newProvider.contactInfo?.email) {
      toast.error('Please fill in required fields')
      return
    }

    const provider: HealthcareProvider = {
      id: Date.now().toString(),
      name: newProvider.name,
      type: newProvider.type || 'primary-care',
      contactInfo: newProvider.contactInfo!,
      apiConfig: newProvider.apiConfig!,
      permissions: newProvider.permissions!,
      lastSync: null,
      status: 'pending'
    }

    const integration: APIIntegration = {
      id: Date.now().toString() + '_int',
      providerId: provider.id,
      endpoint: provider.apiConfig.endpoint,
      status: 'pending',
      lastTest: null,
      responseTime: null,
      dataFormat: provider.apiConfig.protocol,
      frequency: 'daily'
    }

    setProviders(current => [...current, provider])
    setIntegrations(current => [...current, integration])
    
    // Reset form
    setNewProvider({
      name: '',
      type: 'primary-care',
      contactInfo: { email: '', phone: '', address: '' },
      apiConfig: { endpoint: '', apiKey: '', protocol: 'FHIR', version: '4.0' },
      permissions: {
        canReceiveAlerts: true,
        canAccessFullHistory: false,
        emergencyContact: false,
        dataSharing: 'read-only'
      }
    })

    toast.success('Healthcare provider added successfully')
  }

  // Send health report to provider
  const sendHealthReport = async (providerId: string, type: HealthReport['type'], data: any) => {
    const report: HealthReport = {
      id: Date.now().toString(),
      providerId,
      type,
      data,
      status: 'pending',
      timestamp: new Date().toISOString(),
      priority: type === 'emergency' ? 'critical' : type === 'alert' ? 'high' : 'medium'
    }

    setReports(current => [...current, report])

    // Simulate sending
    setTimeout(() => {
      setReports(current => 
        current.map(r => 
          r.id === report.id 
            ? { ...r, status: 'sent' }
            : r
        )
      )
      toast.success('Health report sent successfully')
    }, 1000)
  }

  // Remove provider
  const removeProvider = (providerId: string) => {
    setProviders(current => current.filter(p => p.id !== providerId))
    setIntegrations(current => current.filter(i => i.providerId !== providerId))
    setReports(current => current.filter(r => r.providerId !== providerId))
    toast.success('Provider removed')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': case 'active': case 'sent': case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'pending': case 'testing':
        return 'bg-yellow-100 text-yellow-800'
      case 'error': case 'inactive': case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="h-6 w-6" />
            Healthcare Provider Integration
          </h2>
          <p className="text-muted-foreground">
            Connect with healthcare providers for seamless data sharing and emergency alerts
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {providers.length} Providers Connected
        </Badge>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="integrations">API Status</TabsTrigger>
          <TabsTrigger value="reports">Health Reports</TabsTrigger>
          <TabsTrigger value="add-provider">Add Provider</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          {providers.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Hospital className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Healthcare Providers Connected</h3>
                <p className="text-muted-foreground mb-4">
                  Add your healthcare providers to enable secure data sharing and emergency alerts
                </p>
                <Button onClick={() => document.querySelector('[data-state="inactive"][value="add-provider"]')?.click()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Provider
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {providers.map((provider) => {
                const integration = integrations.find(i => i.providerId === provider.id)
                const recentReports = reports.filter(r => r.providerId === provider.id).slice(0, 3)
                
                return (
                  <Card key={provider.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Hospital className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{provider.name}</CardTitle>
                            <CardDescription className="capitalize">
                              {provider.type.replace('-', ' ')} • {provider.contactInfo.email}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(provider.status)}>
                            {provider.status}
                          </Badge>
                          {integration && (
                            <Badge className={getStatusColor(integration.status)}>
                              API: {integration.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Contact Information</h4>
                          <div className="text-sm space-y-1">
                            <div>{provider.contactInfo.phone}</div>
                            <div className="text-muted-foreground">{provider.contactInfo.address}</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Permissions</h4>
                          <div className="space-y-1">
                            <Badge variant={provider.permissions.canReceiveAlerts ? 'default' : 'secondary'} className="text-xs">
                              {provider.permissions.canReceiveAlerts ? 'Alerts Enabled' : 'No Alerts'}
                            </Badge>
                            <Badge variant={provider.permissions.emergencyContact ? 'default' : 'secondary'} className="text-xs">
                              {provider.permissions.emergencyContact ? 'Emergency Contact' : 'Standard Contact'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Recent Activity</h4>
                          <div className="text-sm">
                            {recentReports.length > 0 ? (
                              <div className="space-y-1">
                                {recentReports.map(report => (
                                  <div key={report.id} className="flex items-center gap-2">
                                    <Badge className={getPriorityColor(report.priority)} size="sm">
                                      {report.type}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(report.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No recent activity</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => testAPIConnection(provider.id)}
                          disabled={isTestingConnection}
                        >
                          <Link className="h-4 w-4 mr-2" />
                          {isTestingConnection ? 'Testing...' : 'Test Connection'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => sendHealthReport(provider.id, 'summary', { type: 'weekly-summary' })}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Report
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeProvider(provider.id)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4">
            {integrations.map((integration) => {
              const provider = providers.find(p => p.id === integration.providerId)
              
              return (
                <Card key={integration.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-blue-500" />
                        <div>
                          <h3 className="font-semibold">{provider?.name || 'Unknown Provider'}</h3>
                          <p className="text-sm text-muted-foreground">{integration.endpoint}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Protocol</Label>
                        <p className="font-medium">{integration.dataFormat}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Frequency</Label>
                        <p className="font-medium capitalize">{integration.frequency}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Response Time</Label>
                        <p className="font-medium">
                          {integration.responseTime ? `${integration.responseTime.toFixed(0)}ms` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Last Test</Label>
                        <p className="font-medium">
                          {integration.lastTest ? new Date(integration.lastTest).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Health Reports Sent</h3>
                  <p className="text-muted-foreground">
                    Health reports will appear here when sent to healthcare providers
                  </p>
                </CardContent>
              </Card>
            ) : (
              reports.slice().reverse().map((report) => {
                const provider = providers.find(p => p.id === report.providerId)
                
                return (
                  <Card key={report.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold capitalize">{report.type} Report</h3>
                            <p className="text-sm text-muted-foreground">
                              To: {provider?.name || 'Unknown Provider'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(report.priority)}>
                            {report.priority}
                          </Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Sent: {new Date(report.timestamp).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="add-provider" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Healthcare Provider</CardTitle>
              <CardDescription>
                Connect a new healthcare provider for data sharing and emergency alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider-name">Provider Name *</Label>
                  <Input 
                    id="provider-name"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., City General Hospital"
                  />
                </div>
                <div>
                  <Label htmlFor="provider-type">Provider Type</Label>
                  <select 
                    id="provider-type"
                    className="w-full p-2 border rounded-md bg-background"
                    value={newProvider.type}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, type: e.target.value as any }))}
                  >
                    <option value="primary-care">Primary Care</option>
                    <option value="specialist">Specialist</option>
                    <option value="hospital">Hospital</option>
                    <option value="clinic">Clinic</option>
                    <option value="pharmacy">Pharmacy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider-email">Email *</Label>
                  <Input 
                    id="provider-email"
                    type="email"
                    value={newProvider.contactInfo?.email}
                    onChange={(e) => setNewProvider(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo!, email: e.target.value }
                    }))}
                    placeholder="provider@hospital.com"
                  />
                </div>
                <div>
                  <Label htmlFor="provider-phone">Phone</Label>
                  <Input 
                    id="provider-phone"
                    value={newProvider.contactInfo?.phone}
                    onChange={(e) => setNewProvider(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo!, phone: e.target.value }
                    }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="provider-address">Address</Label>
                <Textarea 
                  id="provider-address"
                  value={newProvider.contactInfo?.address}
                  onChange={(e) => setNewProvider(prev => ({ 
                    ...prev, 
                    contactInfo: { ...prev.contactInfo!, address: e.target.value }
                  }))}
                  placeholder="123 Medical Center Dr, City, State 12345"
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">API Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="api-endpoint">API Endpoint</Label>
                    <Input 
                      id="api-endpoint"
                      value={newProvider.apiConfig?.endpoint}
                      onChange={(e) => setNewProvider(prev => ({ 
                        ...prev, 
                        apiConfig: { ...prev.apiConfig!, endpoint: e.target.value }
                      }))}
                      placeholder="https://api.hospital.com/fhir"
                    />
                  </div>
                  <div>
                    <Label htmlFor="api-key">API Key</Label>
                    <Input 
                      id="api-key"
                      type="password"
                      value={newProvider.apiConfig?.apiKey}
                      onChange={(e) => setNewProvider(prev => ({ 
                        ...prev, 
                        apiConfig: { ...prev.apiConfig!, apiKey: e.target.value }
                      }))}
                      placeholder="Enter API key"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="api-protocol">Protocol</Label>
                    <select 
                      id="api-protocol"
                      className="w-full p-2 border rounded-md bg-background"
                      value={newProvider.apiConfig?.protocol}
                      onChange={(e) => setNewProvider(prev => ({ 
                        ...prev, 
                        apiConfig: { ...prev.apiConfig!, protocol: e.target.value as any }
                      }))}
                    >
                      <option value="FHIR">FHIR</option>
                      <option value="HL7">HL7</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="api-version">Version</Label>
                    <Input 
                      id="api-version"
                      value={newProvider.apiConfig?.version}
                      onChange={(e) => setNewProvider(prev => ({ 
                        ...prev, 
                        apiConfig: { ...prev.apiConfig!, version: e.target.value }
                      }))}
                      placeholder="4.0"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Permissions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Emergency Alerts</Label>
                      <p className="text-sm text-muted-foreground">Allow emergency notifications to this provider</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={newProvider.permissions?.canReceiveAlerts}
                      onChange={(e) => setNewProvider(prev => ({ 
                        ...prev, 
                        permissions: { ...prev.permissions!, canReceiveAlerts: e.target.checked }
                      }))}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Emergency Contact</Label>
                      <p className="text-sm text-muted-foreground">Include in emergency contact list</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={newProvider.permissions?.emergencyContact}
                      onChange={(e) => setNewProvider(prev => ({ 
                        ...prev, 
                        permissions: { ...prev.permissions!, emergencyContact: e.target.checked }
                      }))}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={addProvider} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Healthcare Provider
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}