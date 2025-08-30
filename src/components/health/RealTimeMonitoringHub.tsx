import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@github/spark/hooks'
import { 
  Monitor,
  WifiHigh,
  Phone,
  Users,
  AlertTriangle,
  CheckCircle,
  X,
  Play,
  Pause,
  BellRinging,
  Clock,
  Activity,
  Shield,
  Globe,
  CloudArrowUp,
  Heart,
  Lightning
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'

interface MonitoringStatus {
  isActive: boolean
  lastUpdate: string
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected'
  devicesConnected: number
  alertsToday: number
  uptime: string
}

interface AlertEvent {
  id: string
  timestamp: string
  type: 'fall_detected' | 'heart_rate_anomaly' | 'movement_pattern' | 'device_offline' | 'manual_alert'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  resolved: boolean
  responseTime?: string
}

interface ConnectedDevice {
  id: string
  name: string
  type: 'apple_watch' | 'iphone' | 'smart_home' | 'sensor'
  status: 'online' | 'offline' | 'warning'
  lastSeen: string
  batteryLevel?: number
}

interface RealTimeMonitoringHubProps {
  healthData: ProcessedHealthData
}

export default function RealTimeMonitoringHub({ healthData }: RealTimeMonitoringHubProps) {
  const [monitoringActive, setMonitoringActive] = useKV('monitoring-active', false)
  const [alerts, setAlerts] = useKV<AlertEvent[]>('realtime-alerts', [])
  const [devices, setDevices] = useKV<ConnectedDevice[]>('connected-devices', [])
  const [emergencyContacts, setEmergencyContacts] = useKV('emergency-contacts', [])
  
  const [currentStatus, setCurrentStatus] = useState<MonitoringStatus>({
    isActive: monitoringActive,
    lastUpdate: new Date().toLocaleTimeString(),
    connectionQuality: 'excellent',
    devicesConnected: 3,
    alertsToday: 2,
    uptime: '99.8%'
  })

  // Simulate real-time updates
  useEffect(() => {
    if (monitoringActive) {
      const interval = setInterval(() => {
        setCurrentStatus(prev => ({
          ...prev,
          lastUpdate: new Date().toLocaleTimeString(),
          devicesConnected: Math.random() > 0.9 ? prev.devicesConnected - 1 : prev.devicesConnected
        }))
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [monitoringActive])

  // Initialize default devices if none exist
  useEffect(() => {
    if (devices.length === 0) {
      const defaultDevices: ConnectedDevice[] = [
        {
          id: 'apple-watch-1',
          name: 'Apple Watch Series 9',
          type: 'apple_watch',
          status: 'online',
          lastSeen: new Date().toISOString(),
          batteryLevel: 87
        },
        {
          id: 'iphone-1',
          name: 'iPhone 15 Pro',
          type: 'iphone',
          status: 'online',
          lastSeen: new Date().toISOString(),
          batteryLevel: 92
        },
        {
          id: 'home-sensor-1',
          name: 'Living Room Motion Sensor',
          type: 'smart_home',
          status: 'online',
          lastSeen: new Date().toISOString()
        }
      ]
      setDevices(defaultDevices)
    }
  }, [devices, setDevices])

  const toggleMonitoring = () => {
    const newStatus = !monitoringActive
    setMonitoringActive(newStatus)
    setCurrentStatus(prev => ({ ...prev, isActive: newStatus }))
    
    if (newStatus) {
      toast.success('Real-time monitoring activated')
      // Simulate connection to monitoring infrastructure
      setTimeout(() => {
        toast.info('Connected to monitoring cloud infrastructure')
      }, 1000)
    } else {
      toast.info('Real-time monitoring paused')
    }
  }

  const simulateAlert = () => {
    const newAlert: AlertEvent = {
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'movement_pattern',
      severity: 'medium',
      description: 'Unusual movement pattern detected - possible increased fall risk',
      resolved: false
    }
    
    setAlerts(currentAlerts => [newAlert, ...currentAlerts])
    toast.warning('New alert generated for testing')
  }

  const resolveAlert = (alertId: string) => {
    setAlerts(currentAlerts => 
      currentAlerts.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true, responseTime: '2m 15s' } : alert
      )
    )
    toast.success('Alert resolved')
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'apple_watch': return <Activity className="h-4 w-4" />
      case 'iphone': return <Phone className="h-4 w-4" />
      case 'smart_home': return <Monitor className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'offline': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'border-blue-200 bg-blue-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'high': return 'border-orange-200 bg-orange-50'
      case 'critical': return 'border-red-200 bg-red-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const unreadAlerts = alerts.filter(alert => !alert.resolved).length

  return (
    <div className="space-y-6">
      {/* Header Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            Real-Time Monitoring Hub
          </h2>
          <p className="text-muted-foreground">
            24/7 health monitoring and emergency response system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleMonitoring}
            variant={monitoringActive ? 'destructive' : 'default'}
            className="flex items-center gap-2"
          >
            {monitoringActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {monitoringActive ? 'Pause Monitoring' : 'Start Monitoring'}
          </Button>
          <Button onClick={simulateAlert} variant="outline" size="sm">
            Test Alert
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {monitoringActive ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-semibold">
                    {monitoringActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <Monitor className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connection</p>
                <div className="flex items-center gap-2 mt-1">
                  <WifiHigh className="h-4 w-4 text-green-500" />
                  <span className="font-semibold capitalize">{currentStatus.connectionQuality}</span>
                </div>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Devices</p>
                <p className="text-2xl font-bold">{currentStatus.devicesConnected}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread Alerts</p>
                <p className="text-2xl font-bold text-orange-600">{unreadAlerts}</p>
              </div>
              <BellRinging className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Monitoring Interface */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts" className="relative">
            Alerts
            {unreadAlerts > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {unreadAlerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Health Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Live Health Metrics
                </CardTitle>
                <CardDescription>
                  Real-time data from connected devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Heart Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-semibold">72 BPM</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Activity Level</span>
                    <div className="flex items-center gap-2">
                      <Progress value={65} className="w-20 h-2" />
                      <span className="font-semibold">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fall Risk Score</span>
                    <Badge variant="outline" className="text-green-700 border-green-200">
                      Low Risk
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Update</span>
                    <span className="text-sm text-muted-foreground">{currentStatus.lastUpdate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Response */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Emergency Response
                </CardTitle>
                <CardDescription>
                  Quick access to emergency features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="destructive" className="w-full" size="lg">
                    <Phone className="h-4 w-4 mr-2" />
                    Emergency Alert
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Call Family
                    </Button>
                    <Button variant="outline" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Medical ID
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {emergencyContacts.length} emergency contacts configured
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightning className="h-5 w-5" />
                System Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm font-semibold text-green-600">{currentStatus.uptime}</span>
                  </div>
                  <Progress value={99.8} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm font-semibold text-blue-600">< 2s</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Data Quality</span>
                    <span className="text-sm font-semibold text-green-600">Excellent</span>
                  </div>
                  <Progress value={97} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Alerts</h3>
            <Badge variant="outline">{alerts.length} total alerts</Badge>
          </div>
          
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Active Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    All systems operating normally
                  </p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id} className={getSeverityColor(alert.severity)}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          <Badge variant="outline" className="text-xs">
                            {alert.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                            {alert.severity}
                          </Badge>
                          {alert.resolved && (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1">{alert.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                          {alert.responseTime && (
                            <span>Resolved in {alert.responseTime}</span>
                          )}
                        </div>
                      </div>
                      {!alert.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <Card key={device.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.type)}
                      <div>
                        <h4 className="font-semibold text-sm">{device.name}</h4>
                        <p className="text-xs text-muted-foreground capitalize">
                          {device.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getDeviceStatusColor(device.status)}`} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Status</span>
                      <span className={`font-medium capitalize ${getDeviceStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                    </div>
                    
                    {device.batteryLevel && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Battery</span>
                        <div className="flex items-center gap-2">
                          <Progress value={device.batteryLevel} className="w-16 h-1" />
                          <span className="font-medium">{device.batteryLevel}%</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>Last Seen</span>
                      <span className="text-muted-foreground">
                        {new Date(device.lastSeen).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <CloudArrowUp className="h-4 w-4" />
            <AlertDescription>
              <strong>Infrastructure Status:</strong> This represents the planned cloud-based monitoring infrastructure 
              for Phase 5. Current implementation shows simulated data for development and testing purposes.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cloud Infrastructure</CardTitle>
                <CardDescription>Monitoring platform architecture</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Load Balancer</span>
                    <Badge variant="outline" className="text-green-700 border-green-200">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Gateway</span>
                    <Badge variant="outline" className="text-green-700 border-green-200">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time Database</span>
                    <Badge variant="outline" className="text-green-700 border-green-200">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">WebSocket Service</span>
                    <Badge variant="outline" className="text-green-700 border-green-200">
                      Online
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required Services</CardTitle>
                <CardDescription>Phase 5 implementation needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <strong>Cloud Platform:</strong> AWS/Firebase for scalability
                  </div>
                  <div className="text-sm">
                    <strong>Real-time Database:</strong> Firebase Realtime Database or AWS DynamoDB
                  </div>
                  <div className="text-sm">
                    <strong>Push Notifications:</strong> FCM/APNs integration
                  </div>
                  <div className="text-sm">
                    <strong>API Gateway:</strong> Rate limiting and authentication
                  </div>
                  <div className="text-sm">
                    <strong>Monitoring:</strong> Health checks and alerting
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}