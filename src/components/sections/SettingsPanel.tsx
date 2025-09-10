// ⚙️ VitalSense Settings Panel Section
// Code-split component for app settings and preferences

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Settings, Shield, Users, Wifi } from 'lucide-react';

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

      {/* Settings Categories */}
      <div className="md:grid-cols-2 grid gap-6">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-vitalsense-primary" />
              <span>Account Settings</span>
            </CardTitle>
            <CardDescription>Manage your account and profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Profile Information</span>
              <button className="text-sm text-vitalsense-primary hover:underline">
                Edit
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span>Email Preferences</span>
              <button className="text-sm text-vitalsense-primary hover:underline">
                Manage
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span>Account Security</span>
              <button className="text-sm text-vitalsense-primary hover:underline">
                Review
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-vitalsense-accent" />
              <span>Privacy & Security</span>
            </CardTitle>
            <CardDescription>Control your data privacy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Data Sharing</span>
              <div className="w-11 bg-vitalsense-muted relative h-6 rounded-full">
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Analytics Tracking</span>
              <div className="w-11 relative h-6 rounded-full bg-vitalsense-primary">
                <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Two-Factor Auth</span>
              <button className="text-sm text-vitalsense-primary hover:underline">
                Enable
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-vitalsense-secondary" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>
              Customize your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Health Alerts</span>
              <div className="w-11 relative h-6 rounded-full bg-vitalsense-primary">
                <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Goal Reminders</span>
              <div className="w-11 relative h-6 rounded-full bg-vitalsense-primary">
                <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Weekly Reports</span>
              <div className="w-11 bg-vitalsense-muted relative h-6 rounded-full">
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data & Sync */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wifi className="h-5 w-5 text-vitalsense-success" />
              <span>Data & Sync</span>
            </CardTitle>
            <CardDescription>Manage data synchronization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Auto-Sync</span>
              <div className="w-11 relative h-6 rounded-full bg-vitalsense-primary">
                <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Sync Frequency</span>
              <select className="border-vitalsense-border rounded border px-2 py-1 text-sm">
                <option>Real-time</option>
                <option>Every hour</option>
                <option>Daily</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span>Data Export</span>
              <button className="text-sm text-vitalsense-primary hover:underline">
                Download
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* App Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-vitalsense-gray" />
            <span>App Preferences</span>
          </CardTitle>
          <CardDescription>Customize your app experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="md:grid-cols-2 grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Theme</label>
              <select className="border-vitalsense-border px-3 w-full rounded border py-2">
                <option>Light</option>
                <option>Dark</option>
                <option>Auto</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <select className="border-vitalsense-border px-3 w-full rounded border py-2">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Units</label>
              <select className="border-vitalsense-border px-3 w-full rounded border py-2">
                <option>Metric</option>
                <option>Imperial</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Default View</label>
              <select className="border-vitalsense-border px-3 w-full rounded border py-2">
                <option>Dashboard</option>
                <option>Health Trends</option>
                <option>Goals</option>
              </select>
            </div>
          </div>
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
            <button className="bg-red-50 text-red-600 hover:bg-red-100 rounded px-4 py-2">
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
            <button className="bg-red-600 hover:bg-red-700 rounded px-4 py-2 text-white">
              Delete
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <p className="text-xs text-vitalsense-gray">
          ⚙️ Settings panel loaded on-demand for optimal bundle size
        </p>
      </div>
    </div>
  );
}
