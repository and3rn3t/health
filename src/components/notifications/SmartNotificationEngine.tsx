import React, { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, BellRinging, Clock, Brain, TrendingUp, CheckCircle, AlertTriangle, Info, Calendar, Settings } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'

interface EngagementPattern {
  hour: number
  dayOfWeek: number
  engagementScore: number
  activityType: string
  frequency: number
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
    personalizedTiming: true
  })

  const [engagementPatterns, setEngagementPatterns] = useKV<EngagementPattern[]>('engagement-patterns', [])
  const [notifications, setNotifications] = useKV<SmartNotification[]>('smart-notifications', [])
  const [notificationStats, setNotificationStats] = useKV('notification-stats', {
    totalSent: 0,
    totalInteracted: 0,
    engagementRate: 0,
    optimalTimeAccuracy: 0
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

  // Generate optimal notification times based on engagement patterns
  const getOptimalNotificationTime = (priority: 'low' | 'medium' | 'high' | 'critical') => {
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
        createdAt: now
      })
    }

    // Exercise prompt notifications
    if (preferences.exercisePrompts && healthData.metrics.steps) {
      const dailySteps = healthData.metrics.steps.value
      if (dailySteps < 8000) {
        const optimalTime = getOptimalNotificationTime('low')
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
          createdAt: now
        })
      }
    }

    // Fall risk alert notifications
    if (preferences.fallRiskAlerts && healthData.fallRiskFactors) {
      const highRiskFactors = healthData.fallRiskFactors.filter(f => f.risk === 'high')
      if (highRiskFactors.length > 0) {
        const optimalTime = getOptimalNotificationTime('critical')
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
          createdAt: now
        })
      }
    }

    // Achievement celebration notifications
    if (preferences.achievementCelebrations && healthData.healthScore && healthData.healthScore > 85) {
      const optimalTime = getOptimalNotificationTime('medium')
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
        createdAt: now
      })
    }

    if (newNotifications.length > 0) {
      setNotifications(current => [...current, ...newNotifications])
      toast.success(`Generated ${newNotifications.length} smart notification(s)`)
    }
  }

  // Simulate notification delivery at optimal times
  useEffect(() => {
    const checkPendingNotifications = () => {
      const now = new Date()
      setNotifications(current => {
        return current.map(notification => {
          if (!notification.delivered && notification.optimalTime <= now) {
            // Simulate delivery
            toast.info(notification.title, {
              description: notification.message,
              action: {
                label: 'View',
                onClick: () => {
                  // Mark as interacted
                  setNotifications(current => 
                    current.map(n => 
                      n.id === notification.id ? { ...n, interacted: true } : n
                    )
                  )
                }
              }
            })
            return { ...notification, delivered: true }
          }
          return notification
        })
      })
    }

    const interval = setInterval(checkPendingNotifications, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [setNotifications])

  // Calculate engagement statistics
  useEffect(() => {
    const delivered = notifications.filter(n => n.delivered)
    const interacted = notifications.filter(n => n.interacted)
    const engagementRate = delivered.length > 0 ? (interacted.length / delivered.length) * 100 : 0
    
    setNotificationStats({
      totalSent: delivered.length,
      totalInteracted: interacted.length,
      engagementRate,
      optimalTimeAccuracy: 85 // Simulated accuracy percentage
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
                      </div>
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