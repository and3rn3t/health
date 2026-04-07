/**
 * Fall Detection Component
 * AI-powered fall detection system
 */

import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, Shield, Smartphone } from '@/lib/icons';

export default function FallDetection() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Fall Detection System
        </h1>
        <p className="text-muted-foreground">
          AI-powered fall detection with automatic emergency alerts
        </p>
      </div>

      {/* Status Overview */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                System Status
              </p>
              <p className="text-2xl font-bold text-vitalsense-success">
                Active
              </p>
            </div>
            <Shield className="h-8 w-8 text-vitalsense-success" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            24/7 Monitoring Enabled
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Last Check
              </p>
              <p className="text-2xl font-bold text-vitalsense-primary">
                2m ago
              </p>
            </div>
            <Activity className="h-8 w-8 text-vitalsense-primary" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Movement Analysis
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Risk Level
              </p>
              <p className="text-2xl font-bold text-yellow-500">Low</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Based on Activity
          </p>
        </div>
      </div>

      {/* Detection Settings */}
      <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Detection Settings</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Automatic Detection</h3>
              <p className="text-sm text-muted-foreground">
                Monitor movement patterns for fall detection
              </p>
            </div>
            <div className="h-3 w-3 rounded-full bg-vitalsense-success"></div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Emergency Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Send alerts to emergency contacts
              </p>
            </div>
            <div className="h-3 w-3 rounded-full bg-vitalsense-success"></div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Apple Watch Integration</h3>
              <p className="text-sm text-muted-foreground">
                Use Watch fall detection sensors
              </p>
            </div>
            <div className="h-3 w-3 rounded-full bg-muted"></div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-border bg-card p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>

        <div className="space-y-3">
          <div className="flex items-center space-x-3 rounded border border-border bg-muted p-3">
            <Shield className="h-5 w-5 text-vitalsense-success" />
            <div className="flex-1">
              <p className="text-sm font-medium">Normal Activity Detected</p>
              <p className="text-xs text-muted-foreground">Today at 10:30 AM</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rounded border border-border bg-muted p-3">
            <Activity className="h-5 w-5 text-vitalsense-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Exercise Session Started</p>
              <p className="text-xs text-muted-foreground">Today at 9:15 AM</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rounded border border-border bg-muted p-3">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">System Check Completed</p>
              <p className="text-xs text-muted-foreground">Today at 8:00 AM</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <Button variant="outline" size="sm">
            Test Alert System
          </Button>
          <Button variant="outline" size="sm">
            Configure Contacts
          </Button>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="mt-8 rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-yellow-600">
          🚧 <strong>Advanced AI Fall Detection Coming Soon</strong> - Machine
          learning algorithms for improved accuracy and predictive fall risk
          assessment.
        </p>
      </div>
    </div>
  );
}
