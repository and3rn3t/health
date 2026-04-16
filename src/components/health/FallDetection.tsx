/**
 * Fall Detection Component
 * AI-powered fall detection system
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, AlertTriangle, Shield, Smartphone } from '@/lib/icons';

export default function FallDetection() {
  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card variant="glass">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  System Status
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Active
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              24/7 Monitoring Enabled
            </p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Check
                </p>
                <p className="text-2xl font-bold text-primary">2m ago</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Movement Analysis
            </p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-5">
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
          </CardContent>
        </Card>
      </div>

      {/* Detection Settings */}
      <Card variant="glass">
        <CardContent className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Detection Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Automatic Detection</h3>
                <p className="text-xs text-muted-foreground">
                  Monitor movement patterns for fall detection
                </p>
              </div>
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Emergency Alerts</h3>
                <p className="text-xs text-muted-foreground">
                  Send alerts to emergency contacts
                </p>
              </div>
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Apple Watch Integration</h3>
                <p className="text-xs text-muted-foreground">
                  Use Watch fall detection sensors
                </p>
              </div>
              <div className="h-3 w-3 rounded-full bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card variant="glass">
        <CardContent className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium">Normal Activity Detected</p>
                <p className="text-xs text-muted-foreground">Today at 10:30 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Activity className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Exercise Session Started</p>
                <p className="text-xs text-muted-foreground">Today at 9:15 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">System Check Completed</p>
                <p className="text-xs text-muted-foreground">Today at 8:00 AM</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" size="sm" className="min-h-[44px]">
              Test Alert System
            </Button>
            <Button variant="outline" size="sm" className="min-h-[44px]">
              Configure Contacts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Notice */}
      <Card variant="glass">
        <CardContent className="p-4">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            <strong>Advanced AI Fall Detection Coming Soon</strong> — Machine
            learning algorithms for improved accuracy and predictive fall risk
            assessment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
