/**
 * Fall Detection Component
 * AI-powered fall detection system
 */

import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, Shield, Smartphone } from 'lucide-react';

export default function FallDetection() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-foreground mb-2 text-3xl font-bold">
          Fall Detection System
        </h1>
        <p className="text-muted-foreground">
          AI-powered fall detection with automatic emergency alerts
        </p>
      </div>

      {/* Status Overview */}
      <div className="md:grid-cols-3 mb-8 grid grid-cols-1 gap-6">
        <div className="border-border bg-card rounded-lg border p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                System Status
              </p>
              <p className="text-2xl font-bold text-vitalsense-success">
                Active
              </p>
            </div>
            <Shield className="h-8 w-8 text-vitalsense-success" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            24/7 Monitoring Enabled
          </p>
        </div>

        <div className="border-border bg-card rounded-lg border p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Last Check
              </p>
              <p className="text-2xl font-bold text-vitalsense-primary">
                2m ago
              </p>
            </div>
            <Activity className="h-8 w-8 text-vitalsense-primary" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Movement Analysis
          </p>
        </div>

        <div className="border-border bg-card rounded-lg border p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Risk Level
              </p>
              <p className="text-yellow-500 text-2xl font-bold">Low</p>
            </div>
            <AlertTriangle className="text-yellow-500 h-8 w-8" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Based on Activity
          </p>
        </div>
      </div>

      {/* Detection Settings */}
      <div className="border-border bg-card mb-8 rounded-lg border p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Detection Settings</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Automatic Detection</h3>
              <p className="text-muted-foreground text-sm">
                Monitor movement patterns for fall detection
              </p>
            </div>
            <div className="h-3 w-3 rounded-full bg-vitalsense-success"></div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Emergency Alerts</h3>
              <p className="text-muted-foreground text-sm">
                Send alerts to emergency contacts
              </p>
            </div>
            <div className="h-3 w-3 rounded-full bg-vitalsense-success"></div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Apple Watch Integration</h3>
              <p className="text-muted-foreground text-sm">
                Use Watch fall detection sensors
              </p>
            </div>
            <div className="h-3 w-3 bg-muted rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="border-border bg-card rounded-lg border p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>

        <div className="space-y-3">
          <div className="space-x-3 border-border bg-muted p-3 flex items-center rounded border">
            <Shield className="h-5 w-5 text-vitalsense-success" />
            <div className="flex-1">
              <p className="text-sm font-medium">Normal Activity Detected</p>
              <p className="text-xs text-muted-foreground">Today at 10:30 AM</p>
            </div>
          </div>

          <div className="space-x-3 border-border bg-muted p-3 flex items-center rounded border">
            <Activity className="h-5 w-5 text-vitalsense-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Exercise Session Started</p>
              <p className="text-xs text-muted-foreground">Today at 9:15 AM</p>
            </div>
          </div>

          <div className="space-x-3 border-border bg-muted p-3 flex items-center rounded border">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">System Check Completed</p>
              <p className="text-xs text-muted-foreground">Today at 8:00 AM</p>
            </div>
          </div>
        </div>

        <div className="space-x-3 mt-6 flex">
          <Button variant="outline" size="sm">
            Test Alert System
          </Button>
          <Button variant="outline" size="sm">
            Configure Contacts
          </Button>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="border-border bg-card mt-8 rounded-lg border p-4">
        <p className="text-yellow-600 text-sm">
          🚧 <strong>Advanced AI Fall Detection Coming Soon</strong> - Machine
          learning algorithms for improved accuracy and predictive fall risk
          assessment.
        </p>
      </div>
    </div>
  );
}
