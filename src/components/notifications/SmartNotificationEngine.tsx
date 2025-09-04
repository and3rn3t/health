import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ProcessedHealthData } from '@/lib/healthDataProcessor';
import { useKV } from '@github/spark/hooks';
import {
  AlertTriangle,
  Bell,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Info,
  Mail,
  Phone,
  Settings,
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Type aliases for union types
type DeliveryStatus = 'pending' | 'sent' | 'failed';
type NotificationType =
  | 'health'
  | 'exercise'
  | 'fall'
  | 'achievement'
  | 'reminder'
  | 'emergency';
type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
type _ActivityType = 'morning' | 'afternoon' | 'evening';

interface EngagementPattern {
  hour: number;
  dayOfWeek: number;
  engagementScore: number;
  activityType: string;
  frequency: number;
}

interface DeliveryMethodSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  phone: boolean;
}

interface UrgencyLevelConfig {
  low: DeliveryMethodSettings;
  medium: DeliveryMethodSettings;
  high: DeliveryMethodSettings;
  critical: DeliveryMethodSettings;
}

interface NotificationPreferences {
  enabled: boolean;
  healthReminders: boolean;
  exercisePrompts: boolean;
  fallRiskAlerts: boolean;
  achievementCelebrations: boolean;
  familyUpdates: boolean;
  optimalTimingEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  maxNotificationsPerDay: number;
  personalizedTiming: boolean;
  deliveryMethods: UrgencyLevelConfig;
  contactInfo: {
    email: string;
    phone: string;
    emergencyContacts: string[];
  };
  escalationEnabled: boolean;
  escalationDelay: number;
}

interface SmartNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  scheduledTime: Date;
  optimalTime: Date;
  engagementScore: number;
  delivered: boolean;
  interacted: boolean;
  createdAt: Date;
  deliveryMethods: string[];
  deliveryStatus: {
    push?: DeliveryStatus;
    email?: DeliveryStatus;
    sms?: DeliveryStatus;
    phone?: DeliveryStatus;
  };
  escalated: boolean;
  acknowledgmentRequired: boolean;
  acknowledged: boolean;
}

interface SmartNotificationEngineProps {
  readonly healthData: ProcessedHealthData;
}

export default function SmartNotificationEngine({
  healthData,
}: SmartNotificationEngineProps) {
  // Default preferences to avoid undefined issues
  const defaultPreferences: NotificationPreferences = {
    enabled: true,
    healthReminders: true,
    exercisePrompts: true,
    fallRiskAlerts: true,
    achievementCelebrations: true,
    familyUpdates: true,
    optimalTimingEnabled: true,
    quietHoursStart: 22,
    quietHoursEnd: 8,
    maxNotificationsPerDay: 10,
    personalizedTiming: true,
    deliveryMethods: {
      low: { push: true, email: false, sms: false, phone: false },
      medium: { push: true, email: true, sms: false, phone: false },
      high: { push: true, email: true, sms: true, phone: false },
      critical: { push: true, email: true, sms: true, phone: true },
    },
    contactInfo: {
      email: '',
      phone: '',
      emergencyContacts: [],
    },
    escalationEnabled: true,
    escalationDelay: 15,
  };

  const [preferences, setPreferences] = useKV<NotificationPreferences>(
    'notification-preferences',
    defaultPreferences
  );

  // Safe preferences getter with fallback
  const safePreferences = preferences || defaultPreferences;

  // Safe setter for preferences
  const updatePreferences = (
    updater: (current: NotificationPreferences) => NotificationPreferences
  ) => {
    setPreferences((current) => updater(current || defaultPreferences));
  };

  const [notifications, setNotifications] = useKV<SmartNotification[]>(
    'smart-notifications',
    []
  );
  const [engagementPatterns, setEngagementPatterns] = useKV<
    EngagementPattern[]
  >('engagement-patterns', []);
  const [notificationQueue, setNotificationQueue] = useState<
    SmartNotification[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalGenerated: 0,
    totalDelivered: 0,
    totalInteracted: 0,
    averageEngagementScore: 0,
    optimalTimeAccuracy: 0,
  });

  // Simulate engagement pattern learning
  useEffect(() => {
    const simulateEngagementLearning = () => {
      const patterns: EngagementPattern[] = [];

      // Generate realistic engagement patterns
      for (let hour = 0; hour < 24; hour++) {
        for (let day = 0; day < 7; day++) {
          let score = 0.3; // Base engagement

          // Higher engagement during typical waking hours
          if (hour >= 7 && hour <= 22) {
            score += 0.4;
          }

          // Peak engagement times
          if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
            score += 0.3;
          }

          // Weekend vs weekday patterns
          if (day === 0 || day === 6) {
            // Weekend
            score += 0.1;
          }

          // Add some randomness
          score += (Math.random() - 0.5) * 0.2;
          score = Math.max(0, Math.min(1, score));

          const getActivityType = (hourValue: number): string => {
            if (hourValue < 12) return 'morning';
            if (hourValue < 17) return 'afternoon';
            return 'evening';
          };

          patterns.push({
            hour,
            dayOfWeek: day,
            engagementScore: score,
            activityType: getActivityType(hour),
            frequency: Math.floor(Math.random() * 10) + 1,
          });
        }
      }

      setEngagementPatterns(patterns);
    };

    const interval = setInterval(simulateEngagementLearning, 30000); // Update every 30 seconds
    simulateEngagementLearning(); // Initial call

    return () => clearInterval(interval);
  }, [setEngagementPatterns]);

  // Helper function to check if current time is in quiet hours
  const isQuietHours = (
    hour: number,
    prefs: typeof safePreferences
  ): boolean => {
    if (prefs.quietHoursStart < prefs.quietHoursEnd) {
      return hour >= prefs.quietHoursStart || hour < prefs.quietHoursEnd;
    } else {
      return hour >= prefs.quietHoursStart && hour < prefs.quietHoursEnd;
    }
  };

  // Helper function to find optimal time based on engagement patterns
  const findOptimalEngagementTime = (
    todayPatterns: EngagementPattern[],
    currentHour: number,
    now: Date,
    priority: string
  ): Date | null => {
    for (let i = 0; i < 24; i++) {
      const checkHour = (currentHour + i) % 24;

      if (isQuietHours(checkHour, safePreferences) && priority !== 'high') {
        continue;
      }

      const pattern = todayPatterns.find((p) => p.hour === checkHour);
      if (pattern && pattern.engagementScore > 0.6) {
        const optimalTime = new Date(now);
        optimalTime.setHours(checkHour, Math.floor(Math.random() * 60), 0, 0);

        // If the time is in the past, set it for today or tomorrow
        if (optimalTime <= now) {
          if (i === 0) {
            optimalTime.setTime(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
          } else {
            optimalTime.setDate(optimalTime.getDate() + 1);
          }
        }

        return optimalTime;
      }
    }
    return null;
  };

  // Calculate optimal notification time
  const calculateOptimalTime = (
    notificationType: string,
    priority: string
  ): Date => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Find the best engagement times for the current day
    const todayPatterns = (engagementPatterns || []).filter(
      (p) => p.dayOfWeek === currentDay
    );

    if (todayPatterns.length === 0) {
      return new Date(now.getTime() + 15 * 60 * 1000); // Default: 15 minutes from now
    }

    // For critical notifications, send immediately
    if (priority === 'critical') {
      return now;
    }

    // Try to find optimal engagement time
    const optimalTime = findOptimalEngagementTime(
      todayPatterns,
      currentHour,
      now,
      priority
    );
    if (optimalTime) {
      return optimalTime;
    }

    // Fallback: 1 hour from now
    return new Date(now.getTime() + 60 * 60 * 1000);
  };

  // Get delivery methods based on priority
  const getDeliveryMethods = (
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): string[] => {
    if (!preferences) return ['push']; // Default fallback

    const methods: string[] = [];
    const config = safePreferences.deliveryMethods[priority];

    if (config.push) methods.push('push');
    if (config.email) methods.push('email');
    if (config.sms) methods.push('sms');
    if (config.phone) methods.push('phone');

    return methods;
  };

  // Helper function to create delivery status
  const createDeliveryStatus = (
    deliveryMethods: string[]
  ): SmartNotification['deliveryStatus'] => {
    return deliveryMethods.reduce(
      (acc, method) => {
        acc[method as keyof typeof acc] =
          Math.random() > 0.1 ? 'sent' : 'failed';
        return acc;
      },
      {} as SmartNotification['deliveryStatus']
    );
  };

  // Helper function to update notification status
  const updateNotificationAsDelivered = useCallback(
    (notification: SmartNotification): SmartNotification => {
      return {
        ...notification,
        delivered: true,
        deliveryStatus: createDeliveryStatus(notification.deliveryMethods),
      };
    },
    []
  );

  // Helper functions for notification state updates
  const updateNotificationList = useCallback(
    (deliveredNotification: SmartNotification) =>
      (current: typeof notifications) => {
        const updated = (current || []).map((n) =>
          n.id === deliveredNotification.id ? deliveredNotification : n
        );
        return updated.some((n) => n.id === deliveredNotification.id)
          ? updated
          : [...updated, deliveredNotification];
      },
    []
  );

  const removeFromQueue = useCallback(
    (notificationId: string) => (current: typeof notificationQueue) =>
      current.filter((n) => n.id !== notificationId),
    []
  );

  // Extract notification queue processing to reduce nesting
  const processNotificationQueue = useCallback(() => {
    const now = new Date();

    notificationQueue.forEach((notification) => {
      if (notification.scheduledTime <= now && !notification.delivered) {
        // Simulate delivery
        const deliveredNotification =
          updateNotificationAsDelivered(notification);

        setNotifications(updateNotificationList(deliveredNotification));
        setNotificationQueue(removeFromQueue(notification.id));

        toast.success(`Notification delivered: ${notification.title}`);
      }
    });
  }, [
    notificationQueue,
    setNotifications,
    updateNotificationAsDelivered,
    updateNotificationList,
    removeFromQueue,
  ]);

  // Notification delivery simulation
  useEffect(() => {
    const interval = setInterval(processNotificationQueue, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [processNotificationQueue]);

  // Helper function to create health reminder notifications
  const createHealthReminderNotification = (
    healthScore: number,
    now: Date
  ): SmartNotification | null => {
    if (!safePreferences.healthReminders || healthScore >= 70) {
      return null;
    }

    const priority = healthScore < 50 ? 'high' : 'medium';
    return {
      id: `health-reminder-${Date.now()}`,
      type: 'health',
      title: 'Health Check Reminder',
      message: `Your health score is ${healthScore}/100. Consider reviewing your recent activity and metrics.`,
      priority,
      scheduledTime: calculateOptimalTime('health', priority),
      optimalTime: calculateOptimalTime('health', priority),
      engagementScore: 0,
      delivered: false,
      interacted: false,
      createdAt: now,
      deliveryMethods: getDeliveryMethods(priority),
      deliveryStatus: {},
      escalated: false,
      acknowledgmentRequired: healthScore < 40,
      acknowledged: false,
    };
  };

  // Helper function to create exercise prompt notifications
  const createExercisePromptNotification = (
    todaySteps: number,
    now: Date
  ): SmartNotification | null => {
    if (!preferences?.exercisePrompts || todaySteps >= 8000) {
      return null;
    }

    return {
      id: `exercise-prompt-${Date.now()}`,
      type: 'exercise',
      title: 'Step Goal Reminder',
      message: `You've taken ${todaySteps} steps today. Consider a short walk to reach your daily goal!`,
      priority: 'low',
      scheduledTime: calculateOptimalTime('exercise', 'low'),
      optimalTime: calculateOptimalTime('exercise', 'low'),
      engagementScore: 0,
      delivered: false,
      interacted: false,
      createdAt: now,
      deliveryMethods: getDeliveryMethods('low'),
      deliveryStatus: {},
      escalated: false,
      acknowledgmentRequired: false,
      acknowledged: false,
    };
  };

  // Generate smart notifications based on health data
  const generateSmartNotifications = async () => {
    if (!preferences?.enabled || isGenerating) return;

    setIsGenerating(true);

    try {
      const newNotifications: SmartNotification[] = [];
      const now = new Date();

      // Health reminder notifications
      const healthNotification = createHealthReminderNotification(
        healthData.healthScore,
        now
      );
      if (healthNotification) {
        newNotifications.push(healthNotification);
      }

      // Exercise prompts
      const todaySteps = Math.floor(Math.random() * 10000) + 2000; // Simulated
      const exerciseNotification = createExercisePromptNotification(
        todaySteps,
        now
      );
      if (exerciseNotification) {
        newNotifications.push(exerciseNotification);
      }

      // Fall risk alerts
      if (
        preferences?.fallRiskAlerts &&
        healthData.fallRiskFactors?.some((f) => f.risk === 'high')
      ) {
        const notification: SmartNotification = {
          id: `fall-risk-${Date.now()}`,
          type: 'fall',
          title: 'Fall Risk Alert',
          message:
            'High fall risk detected based on your recent movement patterns. Please be cautious and consider safety measures.',
          priority: 'critical',
          scheduledTime: now,
          optimalTime: now,
          engagementScore: 0,
          delivered: false,
          interacted: false,
          createdAt: now,
          deliveryMethods: getDeliveryMethods('critical'),
          deliveryStatus: {},
          escalated: false,
          acknowledgmentRequired: true,
          acknowledged: false,
        };
        newNotifications.push(notification);
      }

      // Achievement celebrations
      if (preferences?.achievementCelebrations) {
        const achievements = [
          'Completed daily step goal for 3 consecutive days!',
          'Heart rate variability has improved this week!',
          'Sleep quality score increased by 15%!',
        ];

        if (Math.random() > 0.7) {
          // 30% chance
          const achievement =
            achievements[Math.floor(Math.random() * achievements.length)];
          const notification: SmartNotification = {
            id: `achievement-${Date.now()}`,
            type: 'achievement',
            title: 'Achievement Unlocked! 🎉',
            message: achievement,
            priority: 'low',
            scheduledTime: calculateOptimalTime('achievement', 'low'),
            optimalTime: calculateOptimalTime('achievement', 'low'),
            engagementScore: 0,
            delivered: false,
            interacted: false,
            createdAt: now,
            deliveryMethods: getDeliveryMethods('low'),
            deliveryStatus: {},
            escalated: false,
            acknowledgmentRequired: false,
            acknowledged: false,
          };
          newNotifications.push(notification);
        }
      }

      // Update analytics
      setAnalytics((current) => ({
        ...current,
        totalGenerated: current.totalGenerated + newNotifications.length,
      }));

      // Add to queue for delivery
      setNotificationQueue((current) => [...current, ...newNotifications]);

      toast.success(`Generated ${newNotifications.length} smart notifications`);
    } catch (error) {
      console.error('Failed to generate notifications:', error);
      toast.error('Failed to generate notifications');
    } finally {
      setIsGenerating(false);
    }
  };

  // Update analytics when notifications change
  useEffect(() => {
    const notificationList = notifications || [];
    const delivered = notificationList.filter((n) => n.delivered).length;
    const interacted = notificationList.filter((n) => n.interacted).length;
    const avgEngagement =
      notificationList.length > 0
        ? notificationList.reduce((sum, n) => sum + n.engagementScore, 0) /
          notificationList.length
        : 0;

    setAnalytics((current) => ({
      ...current,
      totalDelivered: delivered,
      totalInteracted: interacted,
      averageEngagementScore: avgEngagement,
      optimalTimeAccuracy: delivered > 0 ? (interacted / delivered) * 100 : 0,
    }));
  }, [notifications]);

  // Get optimal engagement time for current user
  const getCurrentOptimalTime = (): string => {
    const now = new Date();
    const currentDay = now.getDay();
    const patterns = (engagementPatterns || []).filter(
      (p) => p.dayOfWeek === currentDay
    );

    if (patterns.length === 0) return 'No data available';

    const bestPattern = patterns.reduce(
      (best, current) =>
        current.engagementScore > best.engagementScore ? current : best,
      patterns[0] // Provide initial value
    );

    const hour = bestPattern.hour.toString().padStart(2, '0');
    return `${hour}:00 - ${hour}:59`;
  };

  // Get notification type icon
  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'health':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'exercise':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'fall':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'achievement':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'reminder':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'secondary',
      medium: 'outline',
      high: 'destructive',
      critical: 'destructive',
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants]}>
        {priority}
      </Badge>
    );
  };

  // Helper to get delivery method icon
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'push':
        return <Smartphone className="h-3 w-3" />;
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'sms':
        return <Smartphone className="h-3 w-3" />;
      case 'phone':
        return <Phone className="h-3 w-3" />;
      default:
        return <Bell className="h-3 w-3" />;
    }
  };

  // Helper to get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    if (status === 'sent') return 'secondary';
    if (status === 'failed') return 'destructive';
    return 'outline';
  };

  // Helper to render delivery method item
  const renderDeliveryMethodItem = (
    method: string,
    notification: SmartNotification
  ) => {
    const status =
      notification.deliveryStatus[
        method as keyof typeof notification.deliveryStatus
      ];

    return (
      <div key={method} className="flex items-center gap-1">
        {getMethodIcon(method)}
        <span className="text-xs capitalize">{method}</span>
        {status && (
          <Badge
            variant={getStatusBadgeVariant(status)}
            className="px-1 py-0 text-xs"
          >
            {status}
          </Badge>
        )}
      </div>
    );
  };

  // Helper to handle notification acknowledgment
  const handleNotificationAcknowledgment = (notificationId: string) => {
    setNotifications((current) =>
      (current || []).map((n) =>
        n.id === notificationId
          ? {
              ...n,
              acknowledged: true,
              interacted: true,
            }
          : n
      )
    );
    toast.success('Notification acknowledged');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground flex items-center gap-2 text-2xl font-bold">
            <Bell className="h-6 w-6" />
            Smart Notifications
          </h2>
          <p className="text-muted-foreground">
            AI-powered notifications optimized for your engagement patterns
          </p>
        </div>
        <Button
          onClick={generateSmartNotifications}
          disabled={isGenerating || !safePreferences.enabled}
          className="flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Generate Smart Notifications'}
        </Button>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Generated</p>
                <p className="text-2xl font-bold">{analytics.totalGenerated}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Delivered</p>
                <p className="text-2xl font-bold">{analytics.totalDelivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Engagement Rate</p>
                <p className="text-2xl font-bold">
                  {analytics.totalDelivered > 0
                    ? Math.round(
                        (analytics.totalInteracted / analytics.totalDelivered) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Optimal Time Hit Rate
                </p>
                <p className="text-2xl font-bold">
                  {Math.round(analytics.optimalTimeAccuracy)}%
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Engagement Insights
          </CardTitle>
          <CardDescription>
            Personalized timing and delivery optimization based on your patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 font-medium">Current Optimal Time</h4>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-lg font-semibold">
                  {getCurrentOptimalTime()}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                Best time for high engagement based on your patterns
              </p>
            </div>

            <div>
              <h4 className="mb-3 font-medium">Queue Status</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">
                    Queued: {notificationQueue.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">
                    Recent:{' '}
                    {Array.isArray(notifications)
                      ? notifications.slice(-5).length
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Pattern Visualization */}
          <div className="mt-6">
            <h4 className="mb-3 font-medium">Weekly Engagement Pattern</h4>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                (day, dayIndex) => (
                  <div key={day} className="text-center">
                    <p className="text-muted-foreground mb-1 text-xs">{day}</p>
                    <div className="space-y-1">
                      {Array.from({ length: 4 }, (_, hourBlock) => {
                        const patterns =
                          engagementPatterns?.filter(
                            (p) =>
                              p.dayOfWeek === dayIndex &&
                              p.hour >= hourBlock * 6 &&
                              p.hour < (hourBlock + 1) * 6
                          ) || [];
                        const avgScore =
                          patterns.length > 0
                            ? patterns.reduce(
                                (sum, p) => sum + p.engagementScore,
                                0
                              ) / patterns.length
                            : 0;

                        return (
                          <div
                            key={hourBlock}
                            className={`h-4 rounded-sm bg-green-${Math.round(avgScore * 900)} opacity-${Math.round((0.7 + avgScore * 0.3) * 100)}`}
                            title={`${hourBlock * 6}:00-${(hourBlock + 1) * 6}:00: ${Math.round(avgScore * 100)}% engagement`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Each block represents 6-hour periods. Brighter green indicates
              higher engagement.
            </p>
          </div>
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
            Customize your notification settings and delivery preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Smart Notifications</p>
              <p className="text-muted-foreground text-sm">
                Turn on AI-powered notification system
              </p>
            </div>
            <Switch
              checked={safePreferences.enabled}
              onCheckedChange={(checked) =>
                updatePreferences((current) => ({
                  ...current,
                  enabled: checked,
                }))
              }
            />
          </div>

          {safePreferences.enabled && (
            <>
              {/* Notification Types */}
              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>

                {[
                  {
                    key: 'healthReminders',
                    label: 'Health Reminders',
                    desc: 'Get notified about health score changes and recommendations',
                  },
                  {
                    key: 'exercisePrompts',
                    label: 'Exercise Prompts',
                    desc: 'Receive motivation for physical activity and step goals',
                  },
                  {
                    key: 'fallRiskAlerts',
                    label: 'Fall Risk Alerts',
                    desc: 'Critical alerts for fall risk detection and prevention',
                  },
                  {
                    key: 'achievementCelebrations',
                    label: 'Achievement Celebrations',
                    desc: 'Celebrate health milestones and accomplishments',
                  },
                  {
                    key: 'familyUpdates',
                    label: 'Family Updates',
                    desc: 'Share your progress with family members and caregivers',
                  },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-muted-foreground text-xs">{desc}</p>
                    </div>
                    <Switch
                      checked={
                        safePreferences[
                          key as keyof NotificationPreferences
                        ] as boolean
                      }
                      onCheckedChange={(checked) =>
                        updatePreferences((current) => ({
                          ...current,
                          [key]: checked,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Timing Preferences */}
              <div className="space-y-4">
                <h4 className="font-medium">Timing & Frequency</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Optimal Timing</p>
                    <p className="text-muted-foreground text-xs">
                      Use AI to optimize delivery times
                    </p>
                  </div>
                  <Switch
                    checked={safePreferences.optimalTimingEnabled}
                    onCheckedChange={(checked) =>
                      updatePreferences((current) => ({
                        ...current,
                        optimalTimingEnabled: checked,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Quiet Hours Start
                    </p>
                    <Select
                      value={safePreferences.quietHoursStart.toString()}
                      onValueChange={(value) =>
                        updatePreferences((current) => ({
                          ...current,
                          quietHoursStart: parseInt(value),
                        }))
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
                    <p className="mb-2 text-sm font-medium">Quiet Hours End</p>
                    <Select
                      value={safePreferences.quietHoursEnd.toString()}
                      onValueChange={(value) =>
                        updatePreferences((current) => ({
                          ...current,
                          quietHoursEnd: parseInt(value),
                        }))
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

                <div>
                  <p className="mb-2 text-sm font-medium">
                    Max Notifications Per Day
                  </p>
                  <div className="px-3">
                    <Slider
                      value={[safePreferences.maxNotificationsPerDay]}
                      onValueChange={([value]) =>
                        updatePreferences((current) => ({
                          ...current,
                          maxNotificationsPerDay: value,
                        }))
                      }
                      max={20}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                      <span>1</span>
                      <span>{safePreferences.maxNotificationsPerDay}</span>
                      <span>20</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="font-medium">Contact Information</h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium">Email Address</p>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={safePreferences.contactInfo.email}
                      onChange={(e) =>
                        updatePreferences((current) => ({
                          ...current,
                          contactInfo: {
                            ...current.contactInfo,
                            email: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium">Phone Number</p>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={safePreferences.contactInfo.phone}
                      onChange={(e) =>
                        updatePreferences((current) => ({
                          ...current,
                          contactInfo: {
                            ...current.contactInfo,
                            phone: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Methods by Priority */}
              <div className="space-y-4">
                <h4 className="font-medium">Delivery Methods by Priority</h4>
                <p className="text-muted-foreground text-sm">
                  Configure how notifications are delivered based on their
                  urgency level
                </p>

                {(['low', 'medium', 'high', 'critical'] as const).map(
                  (level) => (
                    <div
                      key={level}
                      className="space-y-3 rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium capitalize">
                          {level} Priority
                        </h5>
                        {getPriorityBadge(level)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={
                              safePreferences.deliveryMethods[level].push
                            }
                            onCheckedChange={(checked) =>
                              updatePreferences((current) => ({
                                ...current,
                                deliveryMethods: {
                                  ...current.deliveryMethods,
                                  [level]: {
                                    ...current.deliveryMethods[level],
                                    push: checked,
                                  },
                                },
                              }))
                            }
                          />
                          <div className="flex items-center gap-1">
                            <Smartphone className="h-4 w-4" />
                            <span className="text-sm">Push</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={
                              safePreferences.deliveryMethods[level].email
                            }
                            onCheckedChange={(checked) =>
                              updatePreferences((current) => ({
                                ...current,
                                deliveryMethods: {
                                  ...current.deliveryMethods,
                                  [level]: {
                                    ...current.deliveryMethods[level],
                                    email: checked,
                                  },
                                },
                              }))
                            }
                          />
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span className="text-sm">Email</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={safePreferences.deliveryMethods[level].sms}
                            onCheckedChange={(checked) =>
                              updatePreferences((current) => ({
                                ...current,
                                deliveryMethods: {
                                  ...current.deliveryMethods,
                                  [level]: {
                                    ...current.deliveryMethods[level],
                                    sms: checked,
                                  },
                                },
                              }))
                            }
                          />
                          <div className="flex items-center gap-1">
                            <Smartphone className="h-4 w-4" />
                            <span className="text-sm">SMS</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={
                              safePreferences.deliveryMethods[level].phone
                            }
                            onCheckedChange={(checked) =>
                              updatePreferences((current) => ({
                                ...current,
                                deliveryMethods: {
                                  ...current.deliveryMethods,
                                  [level]: {
                                    ...current.deliveryMethods[level],
                                    phone: checked,
                                  },
                                },
                              }))
                            }
                          />
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">Phone</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Escalation Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Escalation Settings</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Enable Escalation</p>
                    <p className="text-muted-foreground text-xs">
                      Escalate critical notifications if not acknowledged
                    </p>
                  </div>
                  <Switch
                    checked={safePreferences.escalationEnabled}
                    onCheckedChange={(checked) =>
                      updatePreferences((current) => ({
                        ...current,
                        escalationEnabled: checked,
                      }))
                    }
                  />
                </div>

                {safePreferences.escalationEnabled && (
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Escalation Delay (minutes)
                    </p>
                    <div className="px-3">
                      <Slider
                        value={[safePreferences.escalationDelay]}
                        onValueChange={([value]) =>
                          updatePreferences((current) => ({
                            ...current,
                            escalationDelay: value,
                          }))
                        }
                        max={60}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                        <span>1 min</span>
                        <span>{safePreferences.escalationDelay} minutes</span>
                        <span>60 min</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">
                      If a critical notification isn't acknowledged within this
                      time, emergency contacts will be notified
                    </p>
                  </div>
                )}
              </div>

              {/* Test Notifications */}
              <div className="space-y-4">
                <h4 className="font-medium">Test Delivery Methods</h4>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {(['low', 'medium', 'high', 'critical'] as const).map(
                    (priority) => (
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
                            acknowledged: false,
                          };

                          setNotifications((current) => [
                            ...(current || []),
                            testNotification,
                          ]);
                          toast.success(
                            `Test ${priority} notification created`
                          );
                        }}
                        className="capitalize"
                      >
                        Test {priority}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </>
          )}
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
          {Array.isArray(notifications) && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications
                .slice(-10)
                .reverse()
                .map((notification) => (
                  <div
                    key={notification.id}
                    className="bg-muted flex items-start justify-between rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationTypeIcon(notification.type)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {notification.title}
                          </p>
                          {getPriorityBadge(notification.priority)}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {notification.message}
                        </p>
                        <div className="text-muted-foreground flex items-center gap-4 text-xs">
                          <span>
                            Created:{' '}
                            {notification.createdAt.toLocaleTimeString()}
                          </span>
                          <span>
                            Optimal:{' '}
                            {notification.optimalTime.toLocaleTimeString()}
                          </span>
                          {notification.delivered && (
                            <Badge variant="outline" className="text-xs">
                              Delivered
                            </Badge>
                          )}
                          {notification.interacted && (
                            <Badge variant="secondary" className="text-xs">
                              Interacted
                            </Badge>
                          )}
                          {notification.escalated && (
                            <Badge variant="destructive" className="text-xs">
                              Escalated
                            </Badge>
                          )}
                          {notification.acknowledgmentRequired &&
                            !notification.acknowledged && (
                              <Badge variant="destructive" className="text-xs">
                                Needs Acknowledgment
                              </Badge>
                            )}
                        </div>

                        {/* Delivery Methods and Status */}
                        {notification.deliveryMethods.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                              Methods:
                            </span>
                            {notification.deliveryMethods.map((method) =>
                              renderDeliveryMethodItem(method, notification)
                            )}
                          </div>
                        )}

                        {/* Acknowledge Button for Critical Notifications */}
                        {notification.acknowledgmentRequired &&
                          !notification.acknowledged &&
                          notification.delivered && (
                            <div className="mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleNotificationAcknowledgment(
                                    notification.id
                                  )
                                }
                                className="h-6 text-xs"
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
                No notifications yet. Generate smart notifications to see them
                here.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
