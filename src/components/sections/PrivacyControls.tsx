/**
 * Privacy Controls Component
 * Manage privacy settings and data permissions
 */
import { Database, Eye, Lock, Shield, Users } from 'lucide-react';

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
      id: 'caregiver_access',
      title: 'Caregiver Access',
      description: 'Grant authorized caregivers access to your health data',
      enabled: true,
      icon: Users,
    },
    {
      id: 'location_tracking',
      title: 'Location Services',
      description: 'Enable location tracking for emergency services',
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
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <Shield className="h-12 w-12 text-teal-600 mx-auto mb-4" />
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Privacy Controls
          </h1>
          <p className="text-gray-600">
            Manage your privacy settings and control how your health data is
            used
          </p>
        </div>

        <div className="space-y-6">
          {privacySettings.map((setting) => {
            const Icon = setting.icon;
            return (
              <div
                key={setting.id}
                className="rounded-lg bg-white p-6 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Icon className="text-teal-600 h-8 w-8" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {setting.title}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={setting.enabled}
                      onChange={() => toggleSetting(setting.id)}
                      className="sr-only peer"
                      aria-label={`Toggle ${setting.title}`}
                    />
                    <div className="w-11 bg-gray-200 peer-focus:ring-teal-300 after:h-5 after:w-5 peer-checked:bg-teal-600 peer h-6 rounded-full after:absolute after:left-[2px] after:top-[2px] after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4"></div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-yellow-50 border-yellow-200 mt-8 rounded-lg border p-6">
          <div className="space-x-3 flex items-center">
            <Shield className="text-yellow-600 h-6 w-6" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Data Protection Notice
              </h3>
              <p className="text-gray-600 mt-1">
                Your health data is protected by HIPAA compliance standards.
                Changes to privacy settings may affect the functionality of
                certain features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
