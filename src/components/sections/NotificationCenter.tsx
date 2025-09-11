/**
 * Notification Center Component
 * Manage alerts, notifications, and system messages
 */
import { AlertCircle, Bell, CheckCircle, Info } from 'lucide-react';

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
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <Bell className="h-12 w-12 text-teal-600 mx-auto mb-4" />
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Notification Center
          </h1>
          <p className="text-gray-600">
            Stay updated with your health alerts and system notifications
          </p>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div
                key={notification.id}
                className="rounded-lg bg-white p-6 shadow-md"
              >
                <div className="flex items-start space-x-4">
                  <Icon className={`mt-1 h-6 w-6 ${notification.color}`} />
                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 mb-2">{notification.message}</p>
                    <span className="text-sm text-gray-500">
                      {notification.time}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button className="bg-teal-600 py-3 hover:bg-teal-700 rounded-lg px-6 text-white transition-colors">
            Mark All as Read
          </button>
        </div>
      </div>
    </div>
  );
}
