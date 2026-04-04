import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Cloud,
  Eye,
  Monitor,
  Moon,
  Settings,
  Shield,
  Smartphone,
  Sun,
} from 'lucide-react';
import { useState } from 'react';

export function HealthSettings() {
  const [settings, setSettings] = useState({
    notifications: {
      healthAlerts: true,
      fallDetection: true,
      medicationReminders: true,
      workoutGoals: false,
      dataSync: true,
    },
    privacy: {
      shareWithFamily: true,
      shareWithDoctors: false,
      dataCollection: true,
      locationTracking: true,
    },
    preferences: {
      theme: 'system',
      language: 'English',
      units: 'Imperial',
      timeFormat: '12-hour',
    },
    integrations: {
      appleHealth: true,
      googleFit: false,
      fitbit: false,
      cloudBackup: true,
    },
  });

  const toggleSetting = (category: keyof typeof settings, key: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key as keyof (typeof prev)[typeof category]],
      },
    }));
  };

  const settingSections = [
    {
      id: 'notifications',
      title: 'Notifications & Alerts',
      description:
        'Configure how and when you receive health-related notifications',
      icon: Bell,
      items: [
        {
          key: 'healthAlerts',
          label: 'Health Alerts',
          description: 'Critical health warnings and anomalies',
        },
        {
          key: 'fallDetection',
          label: 'Fall Detection',
          description: 'Immediate alerts for detected falls',
        },
        {
          key: 'medicationReminders',
          label: 'Medication Reminders',
          description: 'Scheduled medication notifications',
        },
        {
          key: 'workoutGoals',
          label: 'Workout Goals',
          description: 'Progress updates and achievement alerts',
        },
        {
          key: 'dataSync',
          label: 'Data Sync Alerts',
          description: 'Device synchronization notifications',
        },
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy & Data Sharing',
      description: 'Control who can access your health information',
      icon: Shield,
      items: [
        {
          key: 'shareWithFamily',
          label: 'Share with Family',
          description: 'Allow family members to view health data',
        },
        {
          key: 'shareWithDoctors',
          label: 'Share with Healthcare Providers',
          description: 'Automatic sharing with medical professionals',
        },
        {
          key: 'dataCollection',
          label: 'Usage Analytics',
          description: 'Help improve the app with anonymous usage data',
        },
        {
          key: 'locationTracking',
          label: 'Location Services',
          description: 'Enable location-based health features',
        },
      ],
    },
    {
      id: 'integrations',
      title: 'Device & App Integrations',
      description: 'Manage connections to health platforms and devices',
      icon: Smartphone,
      items: [
        {
          key: 'appleHealth',
          label: 'Apple Health',
          description: 'Sync with Apple Health app',
        },
        {
          key: 'googleFit',
          label: 'Google Fit',
          description: 'Connect to Google Fit platform',
        },
        {
          key: 'fitbit',
          label: 'Fitbit',
          description: 'Import data from Fitbit devices',
        },
        {
          key: 'cloudBackup',
          label: 'Cloud Backup',
          description: 'Automatic cloud data backup',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Health Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your health monitoring preferences, privacy settings, and
          device integrations.
        </p>
      </div>

      {/* Quick Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-vitalsense-primary" />
            System Status
          </CardTitle>
          <CardDescription>
            Overview of your current health monitoring setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Health Tracking</p>
                <p className="text-sm text-green-600">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Data Sync</p>
                <p className="text-sm text-green-600">Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-yellow-50 p-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Notifications</p>
                <p className="text-sm text-yellow-600">3 disabled</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
              <Cloud className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Cloud Backup</p>
                <p className="text-sm text-blue-600">Last: 2h ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Sections */}
      {settingSections.map((section) => {
        const IconComponent = section.icon;
        const sectionSettings = settings[section.id as keyof typeof settings];

        return (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent className="h-5 w-5 text-vitalsense-primary" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {section.items.map((item) => {
                  const isEnabled = sectionSettings[
                    item.key as keyof typeof sectionSettings
                  ] as boolean;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.label}</p>
                          <Badge variant={isEnabled ? 'default' : 'secondary'}>
                            {isEnabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {item.description}
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          toggleSetting(
                            section.id as keyof typeof settings,
                            item.key
                          )
                        }
                        variant={isEnabled ? 'default' : 'outline'}
                        size="sm"
                      >
                        {isEnabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Display Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-vitalsense-primary" />
            Display & Preferences
          </CardTitle>
          <CardDescription>
            Customize how the app looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="mb-2 font-medium">Theme</p>
                <div className="flex gap-2">
                  {[
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'System', icon: Monitor },
                  ].map((theme) => {
                    const IconComponent = theme.icon;
                    return (
                      <Button
                        key={theme.id}
                        variant={
                          settings.preferences.theme === theme.id
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        className="flex-1"
                      >
                        <IconComponent className="mr-2 h-4 w-4" />
                        {theme.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="mb-2 font-medium">Units</p>
                <div className="flex gap-2">
                  {['Imperial', 'Metric'].map((unit) => (
                    <Button
                      key={unit}
                      variant={
                        settings.preferences.units === unit
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      className="flex-1"
                    >
                      {unit}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button className="flex-1">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Save All Settings
            </Button>
            <Button variant="outline">Reset to Defaults</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HealthSettings;
