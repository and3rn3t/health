/**
 * Privacy Controls Component
 * Manage privacy settings and data permissions
 */
import { Database, Eye, Lock, Shield, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyControls() {
  const privacySettings = [
    {
      id: 'data_sharing',
      title: 'Health Data Sharing',
      description: 'Allow sharing of anonymized health data for research',
      enabled: false,
      icon: Database,
    },
    {
      id: 'location_tracking',
      title: 'Location Services',
      description: 'Enable location tracking for services',
      enabled: true,
      icon: Eye,
    },
    {
      id: 'data_encryption',
      title: 'Enhanced Encryption',
      description: 'Use additional encryption for sensitive health data',
      enabled: true,
      icon: Lock,
    },
  ];

  const toggleSetting = (settingId: string) => {
    console.log(`Toggling setting: ${settingId}`);
    // In a real app, this would update the setting
  };

  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="my-0">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-vitalsense-teal/10">
              <Shield className="h-6 w-6 text-teal-600" />
            </div>
            <CardTitle className="text-3xl">Privacy Controls</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-center text-muted-foreground">
            Manage your privacy settings and control how your health data is
            used
          </CardContent>
        </Card>

        <div className="space-y-4 md:space-y-6">
          {privacySettings.map((setting) => {
            const Icon = setting.icon;
            return (
              <Card key={setting.id} className="my-0">
                <CardContent className="py-4 md:py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-vitalsense-teal/10">
                        <Icon className="h-6 w-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold leading-tight">
                          {setting.title}
                        </h3>
                        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                          {setting.description}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={setting.enabled}
                        onChange={() => toggleSetting(setting.id)}
                        className="peer sr-only"
                        aria-label={`Toggle ${setting.title}`}
                      />
                      <div className="peer h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-vitalsense-teal peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vitalsense-teal/30 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-card after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-card" />
                    </label>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="my-0">
          <CardContent className="py-5">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold leading-tight">
                  Data Protection Notice
                </h3>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  Your health data is protected by HIPAA compliance standards.
                  Changes to privacy settings may affect the functionality of
                  certain features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
