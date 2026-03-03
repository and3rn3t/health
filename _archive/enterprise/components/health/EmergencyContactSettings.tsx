/**
 * Emergency Contact Settings Component
 * Configure emergency notification settings
 */

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Shield } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { EmergencyContactSettings } from '@/lib/emergencyContacts';

interface EmergencyContactSettingsProps {
  settings: EmergencyContactSettings;
  onUpdate: (settings: EmergencyContactSettings) => void;
}

export default function EmergencyContactSettings({
  settings,
  onUpdate,
}: EmergencyContactSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onUpdate(localSettings);
    toast.success('Settings saved successfully');
  };

  const updateSetting = <K extends keyof EmergencyContactSettings>(
    key: K,
    value: EmergencyContactSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure when and how emergency notifications are sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Notify</Label>
                <p className="text-sm text-gray-500">
                  Automatically send notifications when emergencies are detected
                </p>
              </div>
              <Checkbox
                checked={localSettings.autoNotify}
                onCheckedChange={(checked) =>
                  updateSetting('autoNotify', checked === true)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notify on Fall Detection</Label>
                <p className="text-sm text-gray-500">
                  Send alerts when a fall is detected
                </p>
              </div>
              <Checkbox
                checked={localSettings.notifyOnFallDetection}
                onCheckedChange={(checked) =>
                  updateSetting('notifyOnFallDetection', checked === true)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notify on High Fall Risk</Label>
                <p className="text-sm text-gray-500">
                  Send alerts when fall risk becomes high (may be frequent)
                </p>
              </div>
              <Checkbox
                checked={localSettings.notifyOnHighRisk}
                onCheckedChange={(checked) =>
                  updateSetting('notifyOnHighRisk', checked === true)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notify on Manual Trigger</Label>
                <p className="text-sm text-gray-500">
                  Send alerts when emergency button is manually pressed
                </p>
              </div>
              <Checkbox
                checked={localSettings.notifyOnManualTrigger}
                onCheckedChange={(checked) =>
                  updateSetting('notifyOnManualTrigger', checked === true)
                }
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="countdown">
                Cancellation Countdown (seconds)
              </Label>
              <Input
                id="countdown"
                type="number"
                min="0"
                max="120"
                value={localSettings.countdownSeconds}
                onChange={(e) =>
                  updateSetting('countdownSeconds', parseInt(e.target.value) || 30)
                }
              />
              <p className="text-sm text-gray-500">
                Time window to cancel false alarms before notifications are sent
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include Location</Label>
                <p className="text-sm text-gray-500">
                  Share your location with emergency contacts
                </p>
              </div>
              <Checkbox
                checked={localSettings.includeLocation}
                onCheckedChange={(checked) =>
                  updateSetting('includeLocation', checked === true)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include Health Data</Label>
                <p className="text-sm text-gray-500">
                  Include health metrics in emergency notifications
                </p>
              </div>
              <Checkbox
                checked={localSettings.includeHealthData}
                onCheckedChange={(checked) =>
                  updateSetting('includeHealthData', checked === true)
                }
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="max-retries">Max Retry Attempts</Label>
              <Input
                id="max-retries"
                type="number"
                min="0"
                max="10"
                value={localSettings.maxRetries}
                onChange={(e) =>
                  updateSetting('maxRetries', parseInt(e.target.value) || 3)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retry-delay">Retry Delay (milliseconds)</Label>
              <Input
                id="retry-delay"
                type="number"
                min="1000"
                step="1000"
                value={localSettings.retryDelay}
                onChange={(e) =>
                  updateSetting('retryDelay', parseInt(e.target.value) || 5000)
                }
              />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
