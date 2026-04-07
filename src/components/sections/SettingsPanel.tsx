// ⚙️ VitalSense Settings Panel Section
// Code-split component for app settings and preferences

import UserSettingsPanel from '@/components/settings/UserSettingsPanel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Settings } from '@/lib/icons';

export default function SettingsPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-vitalsense-primary">
          Settings
        </h1>
        <p className="text-vitalsense-gray">
          Customize your VitalSense experience
        </p>
      </div>

      {/* Fully featured settings panel */}
      <UserSettingsPanel />

      {/* Preferences summary now managed in UserSettingsPanel above */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="text-vitalsense-gray h-5 w-5" />
            <span>App Preferences</span>
          </CardTitle>
          <CardDescription>
            Preferences are managed in the settings panel above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the controls above to change theme, language, units, and default
            view.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible account actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Reset All Settings</h4>
              <p className="text-vitalsense-gray text-sm">
                Restore default settings
              </p>
            </div>
            <button className="rounded bg-red-50 px-4 py-2 text-red-600 hover:bg-red-100">
              Reset
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-vitalsense-gray text-sm">
                Permanently delete your account
              </p>
            </div>
            <button className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">
              Delete
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <p className="text-vitalsense-gray text-xs">
          ⚙️ Settings panel loaded on-demand for optimal bundle size
        </p>
      </div>
    </div>
  );
}
