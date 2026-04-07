/**
 * Heart Health Monitoring Component
 * Comprehensive cardiovascular health tracking
 */

import { Button } from '@/components/ui/button';
import { Activity, AlertCircle, Heart, TrendingUp } from '@/lib/icons';

export default function HeartHealthMonitoring() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Heart Health Monitoring
        </h1>
        <p className="text-muted-foreground">
          Comprehensive cardiovascular health tracking and analysis
        </p>
      </div>

      {/* Heart Rate Overview */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Current HR
              </p>
              <p className="text-2xl font-bold text-vitalsense-error">72 BPM</p>
            </div>
            <Heart className="h-8 w-8 text-vitalsense-error" />
          </div>
          <p className="mt-2 text-xs text-vitalsense-success">
            ↓ 3 BPM from avg
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Resting HR
              </p>
              <p className="text-2xl font-bold text-vitalsense-primary">
                65 BPM
              </p>
            </div>
            <Activity className="h-8 w-8 text-vitalsense-primary" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">7-day average</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">HRV</p>
              <p className="text-2xl font-bold text-vitalsense-success">
                42 ms
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-vitalsense-success" />
          </div>
          <p className="mt-2 text-xs text-vitalsense-success">
            ↑ Good variability
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Health Score
              </p>
              <p className="text-2xl font-bold text-vitalsense-teal">87/100</p>
            </div>
            <AlertCircle className="h-8 w-8 text-vitalsense-teal" />
          </div>
          <p className="mt-2 text-xs text-vitalsense-teal">Excellent</p>
        </div>
      </div>

      {/* Heart Rate Zones */}
      <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Heart Rate Zones</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-4 w-4 rounded bg-muted"></div>
              <span className="text-sm font-medium">Resting Zone</span>
              <span className="text-xs text-muted-foreground">&lt;65 BPM</span>
            </div>
            <span className="text-sm text-muted-foreground">2h 15m today</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-4 w-4 rounded bg-vitalsense-primary"></div>
              <span className="text-sm font-medium">Fat Burn Zone</span>
              <span className="text-xs text-muted-foreground">65-92 BPM</span>
            </div>
            <span className="text-sm text-muted-foreground">45m today</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-4 w-4 rounded bg-vitalsense-success"></div>
              <span className="text-sm font-medium">Cardio Zone</span>
              <span className="text-xs text-muted-foreground">92-119 BPM</span>
            </div>
            <span className="text-sm text-muted-foreground">30m today</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-4 w-4 rounded bg-yellow-500"></div>
              <span className="text-sm font-medium">Peak Zone</span>
              <span className="text-xs text-muted-foreground">&gt;119 BPM</span>
            </div>
            <span className="text-sm text-muted-foreground">15m today</span>
          </div>
        </div>
      </div>

      {/* Health Insights */}
      <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Health Insights</h2>

        <div className="space-y-3">
          <div className="flex items-center space-x-3 rounded border border-border bg-muted p-3">
            <Heart className="h-5 w-5 text-vitalsense-success" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Excellent cardiovascular fitness
              </p>
              <p className="text-xs text-muted-foreground">
                Your resting heart rate is in the optimal range
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rounded border border-border bg-muted p-3">
            <TrendingUp className="h-5 w-5 text-vitalsense-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Heart rate variability improving
              </p>
              <p className="text-xs text-muted-foreground">
                7% increase over the past month
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rounded border border-border bg-muted p-3">
            <AlertCircle className="h-5 w-5 text-vitalsense-teal" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Consider more cardio exercise
              </p>
              <p className="text-xs text-muted-foreground">
                To maintain your excellent heart health
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <Button variant="outline" size="sm">
            View Detailed Report
          </Button>
          <Button variant="outline" size="sm">
            Set HR Alerts
          </Button>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="mt-8 rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-vitalsense-error">
          🚧 <strong>Advanced Cardiac Analysis Coming Soon</strong> - ECG
          analysis, atrial fibrillation detection, and predictive cardiovascular
          risk assessment.
        </p>
      </div>
    </div>
  );
}
