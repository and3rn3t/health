import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, 
  Activity, 
  Clock, 
  Users,
  AlertTriangle,
  CheckCircle,
  Heart,
  Bell,
  Database,
  CloudArrowUp,
  Monitor,
  Wifi,
  Server,
  HardDrives,
  Globe,
  Lock
} from '@phosphor-icons/react'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'

interface SystemStatus {
  component: string
  status: 'operational' | 'degraded' | 'outage' | 'maintenance'
  uptime: number
  responseTime: number
  lastChecked: string
  description: string
}

interface UptimeMetric {
  date: string
  uptime: number
  incidents: number
  avgResponseTime: number
}

interface FailoverSystem {
  id: string
  name: string
  primary: boolean
  status: 'active' | 'standby' | 'failed'
  lastFailover: string | null
  healthCheck: 'passing' | 'warning' | 'critical'
}

interface MonitoringAlert {
  id: string
  type: 'performance' | 'security' | 'uptime' | 'capacity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: string
  resolved: boolean
  component: string
}

export default function UptimeMonitoringSystem() {
  const [systemStatus, setSystemStatus] = useKV<SystemStatus[]>('system-status', [])
  const [uptimeMetrics, setUptimeMetrics] = useKV<UptimeMetric[]>('uptime-metrics', [])
  const [failoverSystems, setFailoverSystems] = useKV<FailoverSystem[]>('failover-systems', [])
  const [alerts, setAlerts] = useKV<MonitoringAlert[]>('monitoring-alerts', [])
  const [lastStatusUpdate, setLastStatusUpdate] = useState<string | null>(null)

  // Initialize system status on first load
  useEffect(() => {
    if (systemStatus.length === 0) {
      const initialStatus: SystemStatus[] = [
        {
          component: 'Web Application',
          status: 'operational',
          uptime: 99.98,
          responseTime: 145,
          lastChecked: new Date().toISOString(),
          description: 'Main HealthGuard web application'
        },
        {
          component: 'Health Data API',
          status: 'operational',
          uptime: 99.95,
          responseTime: 89,
          lastChecked: new Date().toISOString(),
          description: 'Health data processing and analytics API'
        },
        {
          component: 'Fall Detection Service',
          status: 'operational',
          uptime: 99.99,
          responseTime: 234,
          lastChecked: new Date().toISOString(),
          description: 'Real-time fall detection and alert system'
        },
        {
          component: 'Emergency Alert System',
          status: 'operational',
          uptime: 100,
          responseTime: 67,
          lastChecked: new Date().toISOString(),
          description: 'Emergency notification and contact system'
        },
        {
          component: 'Database Cluster',
          status: 'operational',
          uptime: 99.97,
          responseTime: 34,
          lastChecked: new Date().toISOString(),
          description: 'Primary health data storage cluster'
        },
        {
          component: 'ML Processing Engine',
          status: 'operational',
          uptime: 99.92,
          responseTime: 512,
          lastChecked: new Date().toISOString(),
          description: 'Machine learning and prediction models'
        },
        {
          component: 'Healthcare API Gateway',
          status: 'operational',
          uptime: 99.96,
          responseTime: 178,
          lastChecked: new Date().toISOString(),
          description: 'Integration with healthcare provider systems'
        },
        {
          component: 'Real-time Monitoring',
          status: 'operational',
          uptime: 99.94,
          responseTime: 123,
          lastChecked: new Date().toISOString(),
          description: '24/7 health and device monitoring system'
        }
      ]
      setSystemStatus(initialStatus)

      const initialFailover: FailoverSystem[] = [
        {
          id: 'primary-web',
          name: 'Primary Web Servers',
          primary: true,
          status: 'active',
          lastFailover: null,
          healthCheck: 'passing'
        },
        {
          id: 'backup-web',
          name: 'Backup Web Servers',
          primary: false,
          status: 'standby',
          lastFailover: null,
          healthCheck: 'passing'
        },
        {
          id: 'primary-db',
          name: 'Primary Database',
          primary: true,
          status: 'active',
          lastFailover: null,
          healthCheck: 'passing'
        },
        {
          id: 'backup-db',
          name: 'Backup Database',
          primary: false,
          status: 'standby',
          lastFailover: null,
          healthCheck: 'passing'
        },
        {
          id: 'primary-alert',
          name: 'Primary Alert System',
          primary: true,
          status: 'active',
          lastFailover: null,
          healthCheck: 'passing'
        },
        {
          id: 'backup-alert',
          name: 'Backup Alert System',
          primary: false,
          status: 'standby',
          lastFailover: null,
          healthCheck: 'passing'
        }
      ]
      setFailoverSystems(initialFailover)

      // Generate some historical uptime data
      const historicalMetrics: UptimeMetric[] = []
      for (let i = 30; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        historicalMetrics.push({
          date: date.toISOString().split('T')[0],
          uptime: 99.5 + Math.random() * 0.5,
          incidents: Math.floor(Math.random() * 3),
          avgResponseTime: 100 + Math.random() * 200
        })
      }
      setUptimeMetrics(historicalMetrics)
    }
  }, [systemStatus.length, setSystemStatus, setFailoverSystems, setUptimeMetrics])

  // Simulate real-time monitoring updates
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toISOString()
      setLastStatusUpdate(now)
      
      // Randomly update some metrics to simulate real monitoring
      setSystemStatus(current => 
        current.map(status => ({
          ...status,
          lastChecked: now,
          responseTime: status.responseTime + (Math.random() - 0.5) * 20,
          uptime: Math.min(100, status.uptime + Math.random() * 0.001)
        }))
      )

      // Occasionally generate monitoring alerts
      if (Math.random() < 0.1) {
        const alertTypes = ['performance', 'security', 'uptime', 'capacity'] as const
        const severities = ['low', 'medium', 'high'] as const
        const components = ['Web Application', 'Health Data API', 'Database Cluster']
        
        const newAlert: MonitoringAlert = {
          id: Date.now().toString(),
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          message: `Monitoring detected anomaly in ${components[Math.floor(Math.random() * components.length)]}`,
          timestamp: now,
          resolved: false,
          component: components[Math.floor(Math.random() * components.length)]
        }
        
        setAlerts(current => [newAlert, ...current].slice(0, 50))
      }

      // Auto-resolve some alerts
      setAlerts(current => 
        current.map(alert => 
          !alert.resolved && Math.random() < 0.3 
            ? { ...alert, resolved: true }
            : alert
        )
      )
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [setSystemStatus, setAlerts])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': case 'active': case 'passing':
        return 'bg-green-100 text-green-800'
      case 'degraded': case 'standby': case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'outage': case 'failed': case 'critical':
        return 'bg-red-100 text-red-800'
      case 'maintenance':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  const overallUptime = systemStatus.length > 0 
    ? systemStatus.reduce((sum, s) => sum + s.uptime, 0) / systemStatus.length 
    : 0

  const criticalAlerts = alerts.filter(a => !a.resolved && (a.severity === 'critical' || a.severity === 'high'))
  const activeIncidents = systemStatus.filter(s => s.status !== 'operational').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            24/7 Uptime Monitoring & Failover
          </h2>
          <p className="text-muted-foreground">
            Real-time system monitoring with automatic failover capabilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {overallUptime.toFixed(2)}% Uptime
          </Badge>
          {lastStatusUpdate && (
            <Badge variant="outline" className="text-xs">
              Updated {new Date(lastStatusUpdate).toLocaleTimeString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Alert Banner */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''}</strong> requiring immediate attention.
            <Button variant="link" className="text-red-800 underline p-0 h-auto ml-2">
              View Details →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Overall Uptime</span>
            </div>
            <p className="text-2xl font-bold">{overallUptime.toFixed(2)}%</p>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="font-semibold">Active Incidents</span>
            </div>
            <p className="text-2xl font-bold">{activeIncidents}</p>
            <p className="text-sm text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">Avg Response Time</span>
            </div>
            <p className="text-2xl font-bold">
              {(systemStatus.reduce((sum, s) => sum + s.responseTime, 0) / Math.max(systemStatus.length, 1)).toFixed(0)}ms
            </p>
            <p className="text-sm text-muted-foreground">Across all services</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-5 w-5 text-red-500" />
              <span className="font-semibold">Unresolved Alerts</span>
            </div>
            <p className="text-2xl font-bold">{alerts.filter(a => !a.resolved).length}</p>
            <p className="text-sm text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">System Status</TabsTrigger>
          <TabsTrigger value="failover">Failover Systems</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Monitoring Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="grid gap-4">
            {systemStatus.map((status, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {status.component.includes('Database') && <Database className="h-5 w-5 text-blue-600" />}
                        {status.component.includes('API') && <Globe className="h-5 w-5 text-blue-600" />}
                        {status.component.includes('Web') && <Monitor className="h-5 w-5 text-blue-600" />}
                        {status.component.includes('Alert') && <Bell className="h-5 w-5 text-blue-600" />}
                        {status.component.includes('ML') && <Activity className="h-5 w-5 text-blue-600" />}
                        {status.component.includes('Fall') && <Shield className="h-5 w-5 text-blue-600" />}
                        {status.component.includes('Healthcare') && <Heart className="h-5 w-5 text-blue-600" />}
                        {status.component.includes('Monitoring') && <Monitor className="h-5 w-5 text-blue-600" />}
                      </div>
                      <div>
                        <h3 className="font-semibold">{status.component}</h3>
                        <p className="text-sm text-muted-foreground">{status.description}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(status.status)} size="sm">
                      {status.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Uptime</Label>
                      <p className="font-semibold">{status.uptime.toFixed(2)}%</p>
                      <Progress value={status.uptime} className="h-2 mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Response Time</Label>
                      <p className="font-semibold">{status.responseTime.toFixed(0)}ms</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Checked</Label>
                      <p className="font-semibold">{new Date(status.lastChecked).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="failover" className="space-y-4">
          <div className="grid gap-4">
            {failoverSystems.map((system) => (
              <Card key={system.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        {system.primary ? 
                          <Server className="h-5 w-5 text-green-600" /> : 
                          <HardDrives className="h-5 w-5 text-green-600" />
                        }
                      </div>
                      <div>
                        <h3 className="font-semibold">{system.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {system.primary ? 'Primary System' : 'Backup System'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(system.status)} size="sm">
                        {system.status}
                      </Badge>
                      <Badge className={getStatusColor(system.healthCheck)} size="sm">
                        {system.healthCheck}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">System Type</Label>
                      <p className="font-semibold">{system.primary ? 'Primary' : 'Backup'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Failover</Label>
                      <p className="font-semibold">
                        {system.lastFailover ? new Date(system.lastFailover).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                  
                  {!system.primary && system.status === 'standby' && (
                    <Button size="sm" variant="outline" className="mt-4">
                      <Wifi className="h-4 w-4 mr-2" />
                      Test Failover
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>30-Day Performance Trends</CardTitle>
              <CardDescription>
                Historical uptime and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Daily Uptime Percentage</h4>
                  <div className="h-32 bg-gray-50 rounded-lg flex items-end justify-center gap-1 p-4">
                    {uptimeMetrics.slice(-14).map((metric, index) => (
                      <div 
                        key={index}
                        className="bg-green-500 w-4 rounded-sm"
                        style={{ height: `${metric.uptime}%` }}
                        title={`${new Date(metric.date).toLocaleDateString()}: ${metric.uptime.toFixed(2)}%`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Average Uptime</Label>
                    <p className="text-2xl font-bold">
                      {(uptimeMetrics.reduce((sum, m) => sum + m.uptime, 0) / uptimeMetrics.length).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Total Incidents</Label>
                    <p className="text-2xl font-bold">
                      {uptimeMetrics.reduce((sum, m) => sum + m.incidents, 0)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Avg Response Time</Label>
                    <p className="text-2xl font-bold">
                      {(uptimeMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / uptimeMetrics.length).toFixed(0)}ms
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                  <p className="text-muted-foreground">
                    All systems are operating normally
                  </p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${alert.resolved ? 'bg-gray-100' : 'bg-red-100'}`}>
                          {alert.resolved ? 
                            <CheckCircle className="h-5 w-5 text-gray-600" /> :
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          }
                        </div>
                        <div>
                          <h3 className="font-semibold">{alert.message}</h3>
                          <p className="text-sm text-muted-foreground">
                            {alert.component} • {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)} size="sm">
                          {alert.severity}
                        </Badge>
                        <Badge variant={alert.resolved ? 'secondary' : 'destructive'} size="sm">
                          {alert.resolved ? 'Resolved' : 'Active'}
                        </Badge>
                      </div>
                    </div>
                    
                    {!alert.resolved && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setAlerts(current => 
                          current.map(a => 
                            a.id === alert.id ? { ...a, resolved: true } : a
                          )
                        )}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Resolved
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className || ''}`}>{children}</label>
}