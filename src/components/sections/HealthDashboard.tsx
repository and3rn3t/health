// 🏥 VitalSense Health Dashboard Section
// Code-split component to reduce bundle size

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Activity, Brain, Heart, Target } from 'lucide-react';

export default function HealthDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-vitalsense-primary">
          Health Dashboard
        </h1>
        <p className="text-vitalsense-gray">
          Your comprehensive health overview powered by VitalSense
        </p>
      </div>

      {/* Health Metrics Grid */}
      <div className="md:grid-cols-2 grid gap-6 lg:grid-cols-4">
        {/* Health Score Card */}
        <Card className="bg-gradient-to-br from-vitalsense-primary/5 to-vitalsense-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Heart className="h-4 w-4 text-vitalsense-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vitalsense-primary">85</div>
            <p className="text-xs text-vitalsense-gray">+5 from last week</p>
          </CardContent>
        </Card>

        {/* Activity Card */}
        <Card className="bg-gradient-to-br from-vitalsense-secondary/5 to-vitalsense-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <Activity className="h-4 w-4 text-vitalsense-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vitalsense-secondary">
              7,842
            </div>
            <p className="text-xs text-vitalsense-gray">steps today</p>
          </CardContent>
        </Card>

        {/* Brain Health Card */}
        <Card className="from-vitalsense-accent/5 to-vitalsense-accent/10 bg-gradient-to-br">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brain Health</CardTitle>
            <Brain className="text-vitalsense-accent h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-vitalsense-accent text-2xl font-bold">
              Good
            </div>
            <p className="text-xs text-vitalsense-gray">cognitive assessment</p>
          </CardContent>
        </Card>

        {/* Goals Card */}
        <Card className="bg-gradient-to-br from-vitalsense-success/5 to-vitalsense-success/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals</CardTitle>
            <Target className="h-4 w-4 text-vitalsense-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vitalsense-success">
              3/5
            </div>
            <p className="text-xs text-vitalsense-gray">completed today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="md:grid-cols-2 grid gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your health data updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm">Morning walk</span>
                <span className="text-xs text-vitalsense-gray">
                  2 hours ago
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm">Heart rate updated</span>
                <span className="text-xs text-vitalsense-gray">
                  4 hours ago
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sleep data synced</span>
                <span className="text-xs text-vitalsense-gray">
                  8 hours ago
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your health data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full rounded-lg bg-vitalsense-primary px-4 py-2 text-white hover:bg-vitalsense-primary/90">
                Sync Health Data
              </button>
              <button className="w-full rounded-lg bg-vitalsense-secondary px-4 py-2 text-white hover:bg-vitalsense-secondary/90">
                View Trends
              </button>
              <button className="border-vitalsense-border hover:bg-vitalsense-muted w-full rounded-lg border px-4 py-2">
                Export Data
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-vitalsense-gray">
          🚀 This dashboard is code-split and loads on-demand for optimal
          performance
        </p>
      </div>
    </div>
  );
}
