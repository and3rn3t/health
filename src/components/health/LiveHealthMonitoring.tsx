/**
 * Live Health Monitoring Component
 * Real-time health data display and monitoring
 */
import { Activity, Heart, Zap } from 'lucide-react';

export default function LiveHealthMonitoring() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <Activity className="h-12 w-12 text-vitalsense-teal mx-auto mb-4" />
          <h1 className="text-foreground mb-2 text-3xl font-bold">
            Live Health Monitoring
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of your vital signs and health metrics
          </p>
        </div>

        <div className="md:grid-cols-2 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="bg-card border-border rounded-lg border p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <Heart className="h-8 w-8 text-vitalsense-error" />
              <span className="text-foreground text-2xl font-bold">72</span>
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">
              Heart Rate
            </h3>
            <p className="text-muted-foreground text-sm">BPM - Normal</p>
          </div>

          <div className="bg-card border-border rounded-lg border p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <Zap className="text-yellow-500 h-8 w-8" />
              <span className="text-foreground text-2xl font-bold">7,842</span>
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">
              Steps Today
            </h3>
            <p className="text-muted-foreground text-sm">Goal: 10,000 steps</p>
          </div>

          <div className="bg-card border-border rounded-lg border p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <Activity className="text-vitalsense-teal h-8 w-8" />
              <span className="text-foreground text-2xl font-bold">85</span>
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">
              Health Score
            </h3>
            <p className="text-muted-foreground text-sm">Excellent</p>
          </div>
        </div>

        <div className="bg-card border-border mt-8 rounded-lg border p-6 shadow-md">
          <h2 className="text-foreground mb-4 text-xl font-bold">
            Live Data Stream
          </h2>
          <div className="space-y-4">
            <div className="border-border flex items-center justify-between border-b py-2">
              <span className="text-foreground">Last sync</span>
              <span className="text-muted-foreground text-sm">Just now</span>
            </div>
            <div className="border-border flex items-center justify-between border-b py-2">
              <span className="text-foreground">Connection status</span>
              <span className="text-sm font-semibold text-vitalsense-success">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-foreground">Next sync</span>
              <span className="text-muted-foreground text-sm">
                In 5 minutes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
