import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bell, Plus, Trash, AlertTriangle, Heart, Activity, Clock, Shield, Stethoscope, Target } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'

interface HealthAlert {
  id: string
  name: string
  metric: string
  condition: 'above' | 'below' | 'equal' | 'range_outside' | 'trend_up' | 'trend_down'
  threshold: number
  thresholdMax?: number // For range conditions
  enabled: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  frequency: 'immediate' | 'daily' | 'weekly'
  createdAt: string
  lastTriggered?: string
  triggerCount: number
  description?: string
}

interface AlertsConfigProps {
  healthData: ProcessedHealthData
}

const HEALTH_METRICS = [
  { value: 'heart_rate', label: 'Heart Rate', unit: 'bpm', normalRange: [60, 100] },
  { value: 'steps', label: 'Daily Steps', unit: 'steps', normalRange: [8000, 12000] },
  { value: 'sleep_hours', label: 'Sleep Hours', unit: 'hours', normalRange: [7, 9] },
  { value: 'blood_pressure_systolic', label: 'Blood Pressure (Systolic)', unit: 'mmHg', normalRange: [90, 120] },
  { value: 'blood_pressure_diastolic', label: 'Blood Pressure (Diastolic)', unit: 'mmHg', normalRange: [60, 80] },
  { value: 'walking_speed', label: 'Walking Speed', unit: 'mph', normalRange: [2.5, 4.0] },
  { value: 'balance_score', label: 'Balance Score', unit: '%', normalRange: [80, 100] },
  { value: 'fall_risk_score', label: 'Fall Risk Score', unit: '%', normalRange: [0, 30] },
  { value: 'activity_level', label: 'Activity Level', unit: 'minutes', normalRange: [150, 300] },
  { value: 'weight', label: 'Weight', unit: 'lbs', normalRange: [0, 0] }, // User-specific
]

const CONDITION_LABELS = {
  above: 'Above threshold',
  below: 'Below threshold',
  equal: 'Equals threshold',
  range_outside: 'Outside normal range',
  trend_up: 'Trending upward',
  trend_down: 'Trending downward'
}

const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
}

export default function HealthAlertsConfig({ healthData }: AlertsConfigProps) {
  const [alerts, setAlerts] = useKV<HealthAlert[]>('health-alerts', [])
  const [alertHistory, setAlertHistory] = useKV<any[]>('alert-history', [])
  const [globalSettings, setGlobalSettings] = useKV('alert-global-settings', {
    enabled: true,
    quietHours: { start: '22:00', end: '07:00' },
    maxAlertsPerDay: 10,
    emailNotifications: false,
    pushNotifications: true
  })

  const [newAlert, setNewAlert] = useState<Partial<HealthAlert>>({
    name: '',
    metric: '',
    condition: 'above',
    threshold: 0,
    priority: 'medium',
    frequency: 'immediate',
    enabled: true,
    description: ''
  })

  const [showNewAlertForm, setShowNewAlertForm] = useState(false)

  const createAlert = () => {
    if (!newAlert.name || !newAlert.metric || newAlert.threshold === undefined) {
      toast.error('Please fill in all required fields')
      return
    }

    const alert: HealthAlert = {
      id: `alert_${Date.now()}`,
      name: newAlert.name!,
      metric: newAlert.metric!,
      condition: newAlert.condition!,
      threshold: newAlert.threshold!,
      thresholdMax: newAlert.thresholdMax,
      enabled: newAlert.enabled!,
      priority: newAlert.priority!,
      frequency: newAlert.frequency!,
      createdAt: new Date().toISOString(),
      triggerCount: 0,
      description: newAlert.description
    }

    setAlerts(current => [...current, alert])
    setNewAlert({
      name: '',
      metric: '',
      condition: 'above',
      threshold: 0,
      priority: 'medium',
      frequency: 'immediate',
      enabled: true,
      description: ''
    })
    setShowNewAlertForm(false)
    toast.success('Alert created successfully')
  }

  const deleteAlert = (alertId: string) => {
    setAlerts(current => current.filter(alert => alert.id !== alertId))
    toast.success('Alert deleted')
  }

  const toggleAlert = (alertId: string) => {
    setAlerts(current => 
      current.map(alert => 
        alert.id === alertId 
          ? { ...alert, enabled: !alert.enabled }
          : alert
      )
    )
  }

  const getMetricLabel = (metric: string) => {
    return HEALTH_METRICS.find(m => m.value === metric)?.label || metric
  }

  const getMetricUnit = (metric: string) => {
    return HEALTH_METRICS.find(m => m.value === metric)?.unit || ''
  }

  const generateSmartAlert = (metric: string) => {
    const metricInfo = HEALTH_METRICS.find(m => m.value === metric)
    if (!metricInfo) return

    const [min, max] = metricInfo.normalRange
    
    // Create alerts based on the metric type
    const smartAlerts: Partial<HealthAlert>[] = []

    if (metric === 'fall_risk_score') {
      smartAlerts.push({
        name: `High Fall Risk Alert`,
        metric,
        condition: 'above',
        threshold: 70,
        priority: 'critical',
        frequency: 'immediate',
        description: 'Alert when fall risk score indicates high danger'
      })
    } else if (metric === 'heart_rate') {
      smartAlerts.push(
        {
          name: `High Heart Rate Alert`,
          metric,
          condition: 'above',
          threshold: 120,
          priority: 'high',
          frequency: 'immediate',
          description: 'Alert when heart rate exceeds safe threshold'
        },
        {
          name: `Low Heart Rate Alert`,
          metric,
          condition: 'below',
          threshold: 50,
          priority: 'high',
          frequency: 'immediate',
          description: 'Alert when heart rate drops below safe threshold'
        }
      )
    } else if (min > 0 && max > 0) {
      smartAlerts.push({
        name: `${metricInfo.label} Out of Range`,
        metric,
        condition: 'range_outside',
        threshold: min,
        thresholdMax: max,
        priority: 'medium',
        frequency: 'daily',
        description: `Alert when ${metricInfo.label.toLowerCase()} is outside normal range`
      })
    }

    // Add the smart alerts
    smartAlerts.forEach(alertTemplate => {
      const alert: HealthAlert = {
        id: `alert_${Date.now()}_${Math.random()}`,
        name: alertTemplate.name!,
        metric: alertTemplate.metric!,
        condition: alertTemplate.condition!,
        threshold: alertTemplate.threshold!,
        thresholdMax: alertTemplate.thresholdMax,
        enabled: true,
        priority: alertTemplate.priority!,
        frequency: alertTemplate.frequency!,
        createdAt: new Date().toISOString(),
        triggerCount: 0,
        description: alertTemplate.description
      }
      
      setAlerts(current => [...current, alert])
    })

    toast.success(`Smart alerts created for ${metricInfo.label}`)
  }

  const activeAlerts = alerts.filter(alert => alert.enabled)
  const recentlyTriggered = alerts.filter(alert => 
    alert.lastTriggered && 
    new Date(alert.lastTriggered) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Health Alerts & Thresholds</h2>
          <p className="text-muted-foreground">
            Configure personalized health monitoring alerts and thresholds
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {activeAlerts.length} Active Alerts
          </Badge>
          <Button onClick={() => setShowNewAlertForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-green-600">{activeAlerts.length}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Triggered Today</p>
                <p className="text-2xl font-bold text-orange-600">{recentlyTriggered.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.priority === 'critical' && a.enabled).length}
                </p>
              </div>
              <Heart className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="alerts">Alert Rules</TabsTrigger>
          <TabsTrigger value="smart">Smart Setup</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-6">
          {/* New Alert Form */}
          {showNewAlertForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Alert</CardTitle>
                <CardDescription>
                  Set up a custom health monitoring alert with specific thresholds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="alert-name">Alert Name</Label>
                    <Input
                      id="alert-name"
                      placeholder="e.g., High Heart Rate Warning"
                      value={newAlert.name || ''}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert-metric">Health Metric</Label>
                    <Select 
                      value={newAlert.metric || ''} 
                      onValueChange={(value) => setNewAlert(prev => ({ ...prev, metric: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select metric to monitor" />
                      </SelectTrigger>
                      <SelectContent>
                        {HEALTH_METRICS.map((metric) => (
                          <SelectItem key={metric.value} value={metric.value}>
                            {metric.label} ({metric.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert-condition">Condition</Label>
                    <Select 
                      value={newAlert.condition || 'above'} 
                      onValueChange={(value: any) => setNewAlert(prev => ({ ...prev, condition: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert-threshold">
                      Threshold {newAlert.metric && `(${getMetricUnit(newAlert.metric)})`}
                    </Label>
                    <Input
                      id="alert-threshold"
                      type="number"
                      value={newAlert.threshold || ''}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
                    />
                  </div>

                  {newAlert.condition === 'range_outside' && (
                    <div className="space-y-2">
                      <Label htmlFor="alert-threshold-max">
                        Maximum Threshold {newAlert.metric && `(${getMetricUnit(newAlert.metric)})`}
                      </Label>
                      <Input
                        id="alert-threshold-max"
                        type="number"
                        value={newAlert.thresholdMax || ''}
                        onChange={(e) => setNewAlert(prev => ({ ...prev, thresholdMax: parseFloat(e.target.value) }))}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="alert-priority">Priority Level</Label>
                    <Select 
                      value={newAlert.priority || 'medium'} 
                      onValueChange={(value: any) => setNewAlert(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert-frequency">Alert Frequency</Label>
                    <Select 
                      value={newAlert.frequency || 'immediate'} 
                      onValueChange={(value: any) => setNewAlert(prev => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily Summary</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alert-description">Description (Optional)</Label>
                  <Input
                    id="alert-description"
                    placeholder="Brief description of when this alert should trigger"
                    value={newAlert.description || ''}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="alert-enabled"
                    checked={newAlert.enabled || false}
                    onCheckedChange={(checked) => setNewAlert(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label htmlFor="alert-enabled">Enable alert immediately</Label>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Button onClick={createAlert}>Create Alert</Button>
                  <Button variant="outline" onClick={() => setShowNewAlertForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Alerts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configured Alerts</h3>
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Alerts Configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first health monitoring alert to get started with personalized monitoring.
                  </p>
                  <Button onClick={() => setShowNewAlertForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Alert
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {alerts.map((alert) => (
                  <Card key={alert.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={alert.enabled}
                            onCheckedChange={() => toggleAlert(alert.id)}
                          />
                          <div>
                            <h4 className="font-semibold">{alert.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {getMetricLabel(alert.metric)} • {CONDITION_LABELS[alert.condition]}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={PRIORITY_COLORS[alert.priority]}>
                            {alert.priority}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAlert(alert.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium">Threshold:</span>
                          <span>
                            {alert.condition === 'range_outside' 
                              ? `${alert.threshold} - ${alert.thresholdMax} ${getMetricUnit(alert.metric)}`
                              : `${alert.threshold} ${getMetricUnit(alert.metric)}`
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium">Frequency:</span>
                          <span className="capitalize">{alert.frequency}</span>
                        </div>
                        
                        {alert.description && (
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">Description:</span>
                            <span className="text-muted-foreground">{alert.description}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Triggered: {alert.triggerCount} times</span>
                          {alert.lastTriggered && (
                            <>
                              <span>•</span>
                              <span>Last: {new Date(alert.lastTriggered).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="smart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Smart Alert Setup</CardTitle>
              <CardDescription>
                Automatically create recommended alerts based on your health metrics and medical guidelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {HEALTH_METRICS.map((metric) => (
                  <Card key={metric.value} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold">{metric.label}</h4>
                        <p className="text-sm text-muted-foreground">
                          Normal range: {metric.normalRange[0]}-{metric.normalRange[1]} {metric.unit}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => generateSmartAlert(metric.value)}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Create Smart Alerts
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Alert Settings</CardTitle>
              <CardDescription>
                Configure system-wide alert preferences and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="global-alerts">Enable All Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Master switch for all health monitoring alerts
                  </p>
                </div>
                <Switch
                  id="global-alerts"
                  checked={globalSettings.enabled}
                  onCheckedChange={(checked) => 
                    setGlobalSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Quiet Hours</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quiet-start">Start Time</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={globalSettings.quietHours.start}
                      onChange={(e) => 
                        setGlobalSettings(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, start: e.target.value }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-end">End Time</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={globalSettings.quietHours.end}
                      onChange={(e) => 
                        setGlobalSettings(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, end: e.target.value }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="max-alerts">Maximum Alerts Per Day</Label>
                <Input
                  id="max-alerts"
                  type="number"
                  min="1"
                  max="50"
                  value={globalSettings.maxAlertsPerDay}
                  onChange={(e) => 
                    setGlobalSettings(prev => ({ 
                      ...prev, 
                      maxAlertsPerDay: parseInt(e.target.value) 
                    }))
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Prevent alert fatigue by limiting daily notifications
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Notification Preferences</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={globalSettings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setGlobalSettings(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive immediate push notifications
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={globalSettings.pushNotifications}
                    onCheckedChange={(checked) => 
                      setGlobalSettings(prev => ({ ...prev, pushNotifications: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>
                View recent alert activity and monitoring history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Alert History</h3>
                  <p className="text-muted-foreground">
                    Alert activity will appear here once your monitoring system is active.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alertHistory.slice(0, 20).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          entry.priority === 'critical' ? 'bg-red-500' :
                          entry.priority === 'high' ? 'bg-orange-500' :
                          entry.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium">{entry.alertName}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.metric}: {entry.value} {entry.unit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}