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
import { Button } from '@/components/ui/button';
import { Settings } from '@/lib/icons';
import { useState } from 'react';

export default function SettingsPanel() {
  const [showDangerZone, setShowDangerZone] = useState(false);

  return (
    <div className="space-y-6">
      {/* Fully featured settings panel */}
      <UserSettingsPanel />

      {/* App Preferences info */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
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

      {/* Danger Zone — behind confirmation */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible account actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showDangerZone ? (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              onClick={() => setShowDangerZone(true)}
            >
              Show dangerous actions
            </Button>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Reset All Settings</h4>
                  <p className="text-xs text-muted-foreground">
                    Restore default settings
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Reset
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Delete Account</h4>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="min-h-[44px]"
                >
                  Delete
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
