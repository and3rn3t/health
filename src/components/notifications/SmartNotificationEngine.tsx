import React, { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Bell, BellRinging, Clock, Brain, TrendingUp, CheckCircle, AlertTriangle, Info, Calendar, Settings, Envelope, DeviceMobile, Phone, Gear } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'

interface EngagementPattern {
  hour: number
  dayOfWeek: number
  engagementScore: number
  activityType: string
  frequency: number
}

interface DeliveryMethodSettings {
  push: boolean
  email: boolean
  sms: boolean
  phone: boolean
}

interface UrgencyLevelConfig {
  low: DeliveryMethodSettings
  medium: DeliveryMethodSettings
  high: DeliveryMethodSettings
  critical: DeliveryMethodSettings
}

interface NotificationPreferences {
  enabled: boolean
  healthReminders: boolean
  exercisePrompts: boolean
  fallRiskAlerts: boolean
  achievementCelebrations: boolean
  familyUpdates: boolean
  optimalTimingEnabled: boolean
  quietHoursStart: number
  quietHoursEnd: number
  maxNotificationsPerDay: number
  personalizedTiming: boolean
  deliveryMethods: UrgencyLevelConfig
  contactInfo: {
    email: string
    phone: string
    emergencyContacts: string[]
  }
  escalationEnabled: boolean
  escalationDelay: number // minutes
}

interface SmartNotification {
  id: string
  type: 'health' | 'exercise' | 'fall-risk' | 'achievement' | 'family'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  scheduledTime: Date
  optimalTime: Date
  engagementScore: number
  delivered: boolean
  interacted: boolean
  createdAt: Date
  deliveryMethods: string[]
  deliveryStatus: {
    push?: 'sent' | 'failed' | 'pending'
    email?: 'sent' | 'failed' | 'pending'
    sms?: 'sent' | 'failed' | 'pending'
    phone?: 'sent' | 'failed' | 'pending'
  }
  escalated: boolean
  acknowledgmentRequired: boolean
  acknowledged: boolean
}

interface SmartNotificationEngineProps {
  healthData: ProcessedHealthData
}

export default function SmartNotificationEngine({ healthData }: SmartNotificationEngineProps) {
  const [preferences, setPreferences] = useKV<NotificationPreferences>('notification-preferences', {
    enabled: true,
    healthReminders: true,
    exercisePrompts: true,
    fallRiskAlerts: true,
    achievementCelebrations: true,
    familyUpdates: false,
    optimalTimingEnabled: true,
    quietHoursStart: 22,
    quietHoursEnd: 7,
    maxNotificationsPerDay: 6,
    personalizedTiming: true,
    deliveryMethods: {
      low: { push: true, email: false, sms: false, phone: false },
      medium: { push: true, email: true, sms: false, phone: false },
      high: { push: true, email: true, sms: true, phone: false },
      critical: { push: true, email: true, sms: true, phone: true }
    },
    contactInfo: {
      email: '',
      phone: '',
      emergencyContacts: []
    },
    escalationEnabled: true,
    escalationDelay: 15
  })

  const [engagementPatterns, setEngagementPatterns] = useKV<EngagementPattern[]>('engagement-patterns', [])
  const [notifications, setNotifications] = useKV<SmartNotification[]>('smart-notifications', [])
  const [notificationStats, setNotificationStats] = useKV('notification-stats', {
    totalSent: 0,
    totalInteracted: 0,
    engagementRate: 0,
    optimalTimeAccuracy: 0,
    deliveryStats: {
      push: { sent: 0, failed: 0 },
      email: { sent: 0, failed: 0 },
      sms: { sent: 0, failed: 0 },
      phone: { sent: 0, failed: 0 }
    }
  })

  // Simulate real-time engagement tracking
  useEffect(() => {
    const trackEngagement = () => {
      const now = new Date()
      const currentHour = now.getHours()
      const dayOfWeek = now.getDay()
      
      // Simulate user engagement with random but realistic patterns
      const isActiveTime = (currentHour >= 6 && currentHour <= 10) || 
                          (currentHour >= 17 && currentHour <= 21)
      const baseEngagement = isActiveTime ? 0.7 : 0.3
      const randomVariation = Math.random() * 0.3
      const engagementScore = Math.min(1, baseEngagement + randomVariation)

      // Update engagement patterns
      setEngagementPatterns(current => {
        const existing = current.find(p => p.hour === currentHour && p.dayOfWeek === dayOfWeek)
        if (existing) {
          return current.map(p => 
            p.hour === currentHour && p.dayOfWeek === dayOfWeek
              ? { ...p, engagementScore: (p.engagementScore + engagementScore) / 2, frequency: p.frequency + 1 }
              : p
          )
        } else {
          return [...current, {
            hour: currentHour,
            dayOfWeek,
            engagementScore,
            activityType: 'general',
            frequency: 1
          }]
        }
      })
    }

    const interval = setInterval(trackEngagement, 60000) // Track every minute
    return () => clearInterval(interval)
  }, [setEngagementPatterns])

  // Get delivery methods for a priority level
  const getDeliveryMethods = (priority: 'low' | 'medium' | 'high' | 'critical'): string[] => {
    const methods: string[] = []
    const config = preferences.deliveryMethods[priority]
    
    if (config.push) methods.push('push')
    if (config.email) methods.push('email')
    if (config.sms) methods.push('sms')
    if (config.phone) methods.push('phone')
    
    return methods
  }

  // Simulate delivery through different channels
  const simulateDelivery = async (notification: SmartNotification) => {
    const deliveryStatus: SmartNotification['deliveryStatus'] = {}
    const methods = notification.deliveryMethods

    for (const method of methods) {
      // Simulate delivery delay and success/failure
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000))
      
      const success = Math.random() > 0.1 // 90% success rate
      deliveryStatus[method as keyof typeof deliveryStatus] = success ? 'sent' : 'failed'
      
      if (success) {
        switch (method) {
          case 'push':
            toast.info(`📱 Push notification sent: ${notification.title}`)
            break
          case 'email':
            toast.info(`📧 Email sent: ${notification.title}`)
            break
          case 'sms':
            toast.info(`📱 SMS sent: ${notification.title}`)
            break
          case 'phone':
            toast.info(`📞 Phone call initiated: ${notification.title}`)
            break
        }
      } else {
        toast.error(`Failed to deliver via ${method}: ${notification.title}`)
      }
    }

    return deliveryStatus
  }
  // Generate optimal notification times based on engagement patterns
    if (!preferences.optimalTimingEnabled || engagementPatterns.length === 0) {
      return new Date()
    }

    const now = new Date()
    const currentDay = now.getDay()
    
    // Filter patterns for today or similar days
    const relevantPatterns = engagementPatterns.filter(p => 
      p.dayOfWeek === currentDay || Math.abs(p.dayOfWeek - currentDay) <= 1
    )

    if (relevantPatterns.length === 0) {
      return new Date()
    }

    // Sort by engagement score and find optimal time
    const sortedPatterns = relevantPatterns.sort((a, b) => b.engagementScore - a.engagementScore)
    const optimalPattern = sortedPatterns[0]

    // For critical notifications, send immediately
    if (priority === 'critical') {
      return new Date()
    }

    // For other priorities, schedule for optimal time
    const optimalTime = new Date()
    optimalTime.setHours(optimalPattern.hour, 0, 0, 0)
    
    // If optimal time is in the past, schedule for tomorrow
    if (optimalTime < now) {
      optimalTime.setDate(optimalTime.getDate() + 1)
    }

    // Respect quiet hours
    if (optimalTime.getHours() >= preferences.quietHoursStart || 
        optimalTime.getHours() <= preferences.quietHoursEnd) {
      optimalTime.setHours(preferences.quietHoursEnd + 1, 0, 0, 0)
    }

    return optimalTime
  }

  // Generate smart notifications based on health data and patterns
  const generateSmartNotifications = async () => {
    if (!preferences.enabled) return

    const now = new Date()
    const todayNotifications = notifications.filter(n => 
      n.createdAt.toDateString() === now.toDateString()
    )

    if (todayNotifications.length >= preferences.maxNotificationsPerDay) {
      return
    }

    const newNotifications: SmartNotification[] = []

    // Health reminder notifications
    if (preferences.healthReminders && healthData.healthScore && healthData.healthScore < 70) {
      const optimalTime = getOptimalNotificationTime('medium')
      const deliveryMethods = getDeliveryMethods('medium')
      newNotifications.push({
        id: `health-${Date.now()}`,
        type: 'health',
        title: 'Health Check Reminder',
        message: `Your health score is ${healthData.healthScore}/100. Consider reviewing your recent metrics.`,
        priority: 'medium',
        scheduledTime: now,
        optimalTime,
        engagementScore: 0,
        delivered: false,
        interacted: false,
        createdAt: now,
        deliveryMethods,
        deliveryStatus: {},
        escalated: false,
        acknowledgmentRequired: false,
        acknowledged: false
      })
    }

    // Exercise prompt notifications
    if (preferences.exercisePrompts && healthData.metrics.steps) {
      const dailySteps = healthData.metrics.steps.value
      if (dailySteps < 8000) {
        const optimalTime = getOptimalNotificationTime('low')
        const deliveryMethods = getDeliveryMethods('low')
        newNotifications.push({
          id: `exercise-${Date.now()}`,
          type: 'exercise',
          title: 'Stay Active!',
          message: `You're at ${dailySteps.toLocaleString()} steps today. A short walk could boost your energy!`,
          priority: 'low',
          scheduledTime: now,
          optimalTime,
          engagementScore: 0,
          delivered: false,
          interacted: false,
          createdAt: now,
          deliveryMethods,
          deliveryStatus: {},
          escalated: false,
          acknowledgmentRequired: false,
          acknowledged: false
        })
      }
    }

    // Fall risk alert notifications
    if (preferences.fallRiskAlerts && healthData.fallRiskFactors) {
      const highRiskFactors = healthData.fallRiskFactors.filter(f => f.risk === 'high')
      if (highRiskFactors.length > 0) {
        const optimalTime = getOptimalNotificationTime('critical')
        const deliveryMethods = getDeliveryMethods('critical')
        newNotifications.push({
          id: `fall-risk-${Date.now()}`,
          type: 'fall-risk',
          title: 'Fall Risk Alert',
          message: `High fall risk detected. Consider reviewing safety measures and consulting your healthcare provider.`,
          priority: 'critical',
          scheduledTime: now,
          optimalTime,
          engagementScore: 0,
          delivered: false,
          interacted: false,
          createdAt: now,
          deliveryMethods,
          deliveryStatus: {},
          escalated: false,
          acknowledgmentRequired: true,
          acknowledged: false
        })
      }
    }

    // Achievement celebration notifications
    if (preferences.achievementCelebrations && healthData.healthScore && healthData.healthScore > 85) {
      const optimalTime = getOptimalNotificationTime('medium')
      const deliveryMethods = getDeliveryMethods('medium')
      newNotifications.push({
        id: `achievement-${Date.now()}`,
        type: 'achievement',
        title: '🎉 Great Health Score!',
        message: `Congratulations! Your health score of ${healthData.healthScore}/100 is excellent. Keep up the great work!`,
        priority: 'medium',
        scheduledTime: now,
        optimalTime,
        engagementScore: 0,
        delivered: false,
        interacted: false,
        createdAt: now,
        deliveryMethods,
        deliveryStatus: {},
        escalated: false,
        acknowledgmentRequired: false,
        acknowledged: false
      })
    }

    if (newNotifications.length > 0) {
      setNotifications(current => [...current, ...newNotifications])
      toast.success(`Generated ${newNotifications.length} smart notification(s)`)
    }
  }

  // Simulate notification delivery at optimal times
  useEffect(() => {
    const checkPendingNotifications = async () => {
      const now = new Date()
      
      for (const notification of notifications) {
        if (!notification.delivered && notification.optimalTime <= now) {
          // Simulate delivery through configured methods
          const deliveryStatus = await simulateDelivery(notification)
          
          // Update notification with delivery status
          setNotifications(current => 
            current.map(n => 
              n.id === notification.id 
                ? { 
                    ...n, 
                    delivered: true, 
                    deliveryStatus,
                    interacted: false 
                  } 
                : n
            )
          )
        }

        // Handle escalation for critical notifications
        if (notification.delivered && 
            notification.priority === 'critical' && 
            !notification.acknowledged && 
            !notification.escalated &&
            preferences.escalationEnabled) {
          
          const timeSinceDelivery = now.getTime() - notification.optimalTime.getTime()
          const escalationThreshold = preferences.escalationDelay * 60 * 1000 // Convert to milliseconds
          
          if (timeSinceDelivery > escalationThreshold) {
            // Escalate notification
            toast.error('⚠️ Critical notification escalated to emergency contacts', {
              description: notification.title,
              duration: 10000
            })
            
            setNotifications(current => 
              current.map(n => 
                n.id === notification.id ? { ...n, escalated: true } : n
              )
            )
          }
        }
      }
    }

    const interval = setInterval(checkPendingNotifications, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [notifications, preferences.escalationEnabled, preferences.escalationDelay, setNotifications])

  // Calculate engagement statistics
  useEffect(() => {
    const delivered = notifications.filter(n => n.delivered)
    const interacted = notifications.filter(n => n.interacted)
    const engagementRate = delivered.length > 0 ? (interacted.length / delivered.length) * 100 : 0
    
    // Calculate delivery method statistics
    const deliveryStats = {
      push: { sent: 0, failed: 0 },
      email: { sent: 0, failed: 0 },
      sms: { sent: 0, failed: 0 },
      phone: { sent: 0, failed: 0 }
    }
    
    delivered.forEach(notification => {
      Object.entries(notification.deliveryStatus).forEach(([method, status]) => {
        if (method in deliveryStats) {
          const methodKey = method as keyof typeof deliveryStats
          if (status === 'sent') {
            deliveryStats[methodKey].sent++
          } else if (status === 'failed') {
            deliveryStats[methodKey].failed++
          }
        }
      })
    })
    
    setNotificationStats({
      totalSent: delivered.length,
      totalInteracted: interacted.length,
      engagementRate,
      optimalTimeAccuracy: 85, // Simulated accuracy percentage
      deliveryStats
    })
  }, [notifications, setNotificationStats])

  const getBestEngagementTimes = () => {
    if (engagementPatterns.length === 0) return []
    
    return engagementPatterns
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 3)
      .map(pattern => ({
        time: `${pattern.hour}:00`,
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][pattern.dayOfWeek],
        score: Math.round(pattern.engagementScore * 100)
      }))
  }

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'health': return <TrendingUp className="h-4 w-4" />
      case 'exercise': return <Clock className="h-4 w-4" />
      case 'fall-risk': return <AlertTriangle className="h-4 w-4" />
      case 'achievement': return <CheckCircle className="h-4 w-4" />
      case 'family': return <Info className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'secondary',
      medium: 'default', 
      high: 'destructive',
      critical: 'destructive'
    } as const
    
    return <Badge variant={variants[priority as keyof typeof variants]}>{priority}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BellRinging className="h-6 w-6" />
            Smart Notifications
          </h2>
          <p className="text-muted-foreground">
            AI-powered notifications optimized for your engagement patterns
          </p>
        </div>
        <Button onClick={generateSmartNotifications} className="gap-2">
          <Brain className="h-4 w-4" />
          Generate Smart Notifications
        </Button>
      </div>

      {/* Notification Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{notificationStats.totalSent}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                <p className="text-2xl font-bold">{notificationStats.engagementRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Optimal Timing</p>
                <p className="text-2xl font-bold">{notificationStats.optimalTimeAccuracy}%</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Smart Features</p>
                <p className="text-2xl font-bold">{preferences.optimalTimingEnabled ? 'ON' : 'OFF'}</p>
              </div>
              <Brain className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Method Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Delivery Method Performance
          </CardTitle>
          <CardDescription>
            Success rates and reliability metrics for each delivery method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(notificationStats.deliveryStats).map(([method, stats]) => {
              const total = stats.sent + stats.failed
              const successRate = total > 0 ? (stats.sent / total) * 100 : 0
              
              const getMethodIcon = (method: string) => {
                switch (method) {
                  case 'push': return <DeviceMobile className="h-5 w-5 text-muted-foreground" />
                  case 'email': return <Envelope className="h-5 w-5 text-muted-foreground" />
                  case 'sms': return <DeviceMobile className="h-5 w-5 text-muted-foreground" />
                  case 'phone': return <Phone className="h-5 w-5 text-muted-foreground" />
                  default: return <Bell className="h-5 w-5 text-muted-foreground" />
                }
              }
              
              return (
                <div key={method} className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getMethodIcon(method)}
                      <span className="font-medium capitalize">{method}</span>
                    </div>
                    <Badge variant={successRate >= 90 ? 'secondary' : successRate >= 75 ? 'default' : 'destructive'}>
                      {successRate.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Sent:</span>
                      <span>{stats.sent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span>{stats.failed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>{total}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>

      {/* Engagement Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Optimal Engagement Times
          </CardTitle>
          <CardDescription>
            AI-analyzed patterns of when you're most likely to engage with health notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getBestEngagementTimes().length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {getBestEngagementTimes().map((time, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{time.day} {time.time}</p>
                    <p className="text-sm text-muted-foreground">Engagement Score</p>
                  </div>
                  <Badge variant="secondary">{time.score}%</Badge>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Continue using the app to learn your optimal engagement patterns. Smart timing will improve over time.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Customize your notification experience and timing preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Smart Notifications</p>
              <p className="text-sm text-muted-foreground">Turn all notifications on or off</p>
            </div>
            <Switch
              checked={preferences.enabled}
              onCheckedChange={(checked) => 
                setPreferences(current => ({ ...current, enabled: checked }))
              }
            />
          </div>

          {/* Notification types */}
          <div className="space-y-4">
            <h4 className="font-medium">Notification Types</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Health Reminders</p>
                  <p className="text-xs text-muted-foreground">Get notified about health metrics that need attention</p>
                </div>
                <Switch
                  checked={preferences.healthReminders}
                  onCheckedChange={(checked) => 
                    setPreferences(current => ({ ...current, healthReminders: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Exercise Prompts</p>
                  <p className="text-xs text-muted-foreground">Gentle nudges to stay active throughout the day</p>
                </div>
                <Switch
                  checked={preferences.exercisePrompts}
                  onCheckedChange={(checked) => 
                    setPreferences(current => ({ ...current, exercisePrompts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Fall Risk Alerts</p>
                  <p className="text-xs text-muted-foreground">Important alerts about fall risk factors</p>
                </div>
                <Switch
                  checked={preferences.fallRiskAlerts}
                  onCheckedChange={(checked) => 
                    setPreferences(current => ({ ...current, fallRiskAlerts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Achievement Celebrations</p>
                  <p className="text-xs text-muted-foreground">Celebrate your health milestones and achievements</p>
                </div>
                <Switch
                  checked={preferences.achievementCelebrations}
                  onCheckedChange={(checked) => 
                    setPreferences(current => ({ ...current, achievementCelebrations: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Family Updates</p>
                  <p className="text-xs text-muted-foreground">Notifications about family member health updates</p>
                </div>
                <Switch
                  checked={preferences.familyUpdates}
                  onCheckedChange={(checked) => 
                    setPreferences(current => ({ ...current, familyUpdates: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Smart timing settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Smart Timing</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Optimal Timing</p>
                <p className="text-xs text-muted-foreground">Use AI to send notifications at your most engaged times</p>
              </div>
              <Switch
                checked={preferences.optimalTimingEnabled}
                onCheckedChange={(checked) => 
                  setPreferences(current => ({ ...current, optimalTimingEnabled: checked }))
                }
              />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Quiet Hours</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Start</label>
                    <Select
                      value={preferences.quietHoursStart.toString()}
                      onValueChange={(value) => 
                        setPreferences(current => ({ ...current, quietHoursStart: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">End</label>
                    <Select
                      value={preferences.quietHoursEnd.toString()}
                      onValueChange={(value) => 
                        setPreferences(current => ({ ...current, quietHoursEnd: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Max Notifications Per Day</p>
                <div className="px-3">
                  <Slider
                    value={[preferences.maxNotificationsPerDay]}
                    onValueChange={([value]) => 
                      setPreferences(current => ({ ...current, maxNotificationsPerDay: value }))
                    }
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1</span>
                    <span>{preferences.maxNotificationsPerDay}</span>
                    <span>20</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Method Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gear className="h-5 w-5" />
            Delivery Method Configuration
          </CardTitle>
          <CardDescription>
            Configure how notifications are delivered based on urgency levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Contact Information</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Email Address</label>
                <div className="flex items-center gap-2">
                  <Envelope className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={preferences.contactInfo.email}
                    onChange={(e) => 
                      setPreferences(current => ({
                        ...current,
                        contactInfo: { ...current.contactInfo, email: e.target.value }
                      }))
                    }
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number</label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={preferences.contactInfo.phone}
                    onChange={(e) => 
                      setPreferences(current => ({
                        ...current,
                        contactInfo: { ...current.contactInfo, phone: e.target.value }
                      }))
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Urgency Level Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium">Delivery Methods by Urgency Level</h4>
            
            {Object.entries(preferences.deliveryMethods).map(([level, methods]) => (
              <div key={level} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium capitalize">{level} Priority</h5>
                    {getPriorityBadge(level)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {level === 'low' && 'Exercise reminders, general health tips'}
                    {level === 'medium' && 'Health score changes, medication reminders'}
                    {level === 'high' && 'Abnormal readings, missed medications'}
                    {level === 'critical' && 'Fall detection, emergency situations'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DeviceMobile className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Push</span>
                    </div>
                    <Switch
                      checked={methods.push}
                      onCheckedChange={(checked) => 
                        setPreferences(current => ({
                          ...current,
                          deliveryMethods: {
                            ...current.deliveryMethods,
                            [level]: { ...current.deliveryMethods[level as keyof UrgencyLevelConfig], push: checked }
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Envelope className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Email</span>
                    </div>
                    <Switch
                      checked={methods.email}
                      onCheckedChange={(checked) => 
                        setPreferences(current => ({
                          ...current,
                          deliveryMethods: {
                            ...current.deliveryMethods,
                            [level]: { ...current.deliveryMethods[level as keyof UrgencyLevelConfig], email: checked }
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DeviceMobile className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">SMS</span>
                    </div>
                    <Switch
                      checked={methods.sms}
                      onCheckedChange={(checked) => 
                        setPreferences(current => ({
                          ...current,
                          deliveryMethods: {
                            ...current.deliveryMethods,
                            [level]: { ...current.deliveryMethods[level as keyof UrgencyLevelConfig], sms: checked }
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Phone</span>
                    </div>
                    <Switch
                      checked={methods.phone}
                      onCheckedChange={(checked) => 
                        setPreferences(current => ({
                          ...current,
                          deliveryMethods: {
                            ...current.deliveryMethods,
                            [level]: { ...current.deliveryMethods[level as keyof UrgencyLevelConfig], phone: checked }
                          }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Escalation Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Escalation Settings</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable Escalation</p>
                <p className="text-xs text-muted-foreground">Escalate critical notifications if not acknowledged</p>
              </div>
              <Switch
                checked={preferences.escalationEnabled}
                onCheckedChange={(checked) => 
                  setPreferences(current => ({ ...current, escalationEnabled: checked }))
                }
              />
            </div>

            {preferences.escalationEnabled && (
              <div>
                <p className="text-sm font-medium mb-2">Escalation Delay (minutes)</p>
                <div className="px-3">
                  <Slider
                    value={[preferences.escalationDelay]}
                    onValueChange={([value]) => 
                      setPreferences(current => ({ ...current, escalationDelay: value }))
                    }
                    max={60}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1 min</span>
                    <span>{preferences.escalationDelay} minutes</span>
                    <span>60 min</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  If a critical notification isn't acknowledged within this time, emergency contacts will be notified
                </p>
              </div>
            )}
          </div>

          {/* Test Notifications */}
          <div className="space-y-4">
            <h4 className="font-medium">Test Delivery Methods</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['low', 'medium', 'high', 'critical'] as const).map((priority) => (
                <Button
                  key={priority}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const testNotification: SmartNotification = {
                      id: `test-${priority}-${Date.now()}`,
                      type: 'health',
                      title: `Test ${priority} notification`,
                      message: `This is a test ${priority} priority notification to verify delivery methods.`,
                      priority,
                      scheduledTime: new Date(),
                      optimalTime: new Date(),
                      engagementScore: 0,
                      delivered: false,
                      interacted: false,
                      createdAt: new Date(),
                      deliveryMethods: getDeliveryMethods(priority),
                      deliveryStatus: {},
                      escalated: false,
                      acknowledgmentRequired: priority === 'critical',
                      acknowledged: false
                    }
                    
                    setNotifications(current => [...current, testNotification])
                    toast.success(`Test ${priority} notification created`)
                  }}
                  className="capitalize"
                >
                  Test {priority}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Notifications
          </CardTitle>
          <CardDescription>
            Your notification history and engagement patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(-10).reverse().map((notification) => (
                <div key={notification.id} className="flex items-start justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    {getNotificationTypeIcon(notification.type)}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {getPriorityBadge(notification.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {notification.createdAt.toLocaleTimeString()}</span>
                        <span>Optimal: {notification.optimalTime.toLocaleTimeString()}</span>
                        {notification.delivered && <Badge variant="outline" className="text-xs">Delivered</Badge>}
                        {notification.interacted && <Badge variant="secondary" className="text-xs">Interacted</Badge>}
                        {notification.escalated && <Badge variant="destructive" className="text-xs">Escalated</Badge>}
                        {notification.acknowledgmentRequired && !notification.acknowledged && (
                          <Badge variant="destructive" className="text-xs">Needs Acknowledgment</Badge>
                        )}
                      </div>
                      
                      {/* Delivery Methods and Status */}
                      {notification.deliveryMethods.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Methods:</span>
                          {notification.deliveryMethods.map((method) => {
                            const status = notification.deliveryStatus[method as keyof typeof notification.deliveryStatus]
                            const getMethodIcon = (method: string) => {
                              switch (method) {
                                case 'push': return <DeviceMobile className="h-3 w-3" />
                                case 'email': return <Envelope className="h-3 w-3" />
                                case 'sms': return <DeviceMobile className="h-3 w-3" />
                                case 'phone': return <Phone className="h-3 w-3" />
                                default: return <Bell className="h-3 w-3" />
                              }
                            }
                            
                            return (
                              <div key={method} className="flex items-center gap-1">
                                {getMethodIcon(method)}
                                <span className="text-xs capitalize">{method}</span>
                                {status && (
                                  <Badge 
                                    variant={status === 'sent' ? 'secondary' : status === 'failed' ? 'destructive' : 'outline'}
                                    className="text-xs px-1 py-0"
                                  >
                                    {status}
                                  </Badge>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      
                      {/* Acknowledge Button for Critical Notifications */}
                      {notification.acknowledgmentRequired && !notification.acknowledged && notification.delivered && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNotifications(current => 
                                current.map(n => 
                                  n.id === notification.id ? { ...n, acknowledged: true, interacted: true } : n
                                )
                              )
                              toast.success('Notification acknowledged')
                            }}
                            className="text-xs h-6"
                          >
                            Acknowledge
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No notifications yet. Generate smart notifications to see them here.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}