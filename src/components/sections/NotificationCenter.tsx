/**
 * Notification Center Component
 * Manage alerts, notifications, and system messages
 */
import { AlertCircle, Bell, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotificationCenter() {
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Health Goal Achieved',
      message: 'You reached your daily step goal of 10,000 steps!',
      time: '2 hours ago',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      id: 2,
      type: 'warning',
      title: 'Heart Rate Alert',
      message: 'Your heart rate was elevated during workout session',
      time: '4 hours ago',
      icon: AlertCircle,
      color: 'text-yellow-600',
    },
    {
      id: 3,
      type: 'info',
      title: 'Data Sync Complete',
      message: 'Successfully synced health data from Apple Watch',
      time: '1 day ago',
      icon: Info,
      color: 'text-blue-600',
    },
  ];

  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 text-teal-600" />
          <h1 className="text-foreground mb-2 text-3xl font-bold">
            Notification Center
          </h1>
          <p className="text-muted-foreground">
            Stay updated with your health alerts and system notifications
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <Card key={notification.id} className="my-0">
                <CardContent className="py-5">
                  <div className="flex items-start gap-4">
                    <Icon className={`mt-1 h-6 w-6 ${notification.color}`} />
                    <div className="flex-1">
                      <h3 className="text-foreground mb-1 text-lg font-semibold leading-tight">
                        {notification.title}
                      </h3>
                      <p className="text-muted-foreground mb-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <span className="text-muted-foreground text-sm">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button size="lg" className="bg-vitalsense-teal hover:bg-vitalsense-teal/90">
            Mark All as Read
          </Button>
        </div>
      </div>
    </div>
  );
}
