// 🏥 VitalSense Health Dashboard Section
// Code-split component to reduce bundle size

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Activity, Brain, Heart, Target } from 'lucide-react';

export default function HealthDashboard() {
  return (
    <div className="md:space-y-5 space-y-4">
      {/* Header */}
      <div className="py-2 text-center">
        <h1 className="mb-2 text-3xl font-bold text-vitalsense-primary">
          Health Dashboard
        </h1>
        <p className="text-vitalsense-gray mx-auto max-w-2xl text-lg leading-relaxed">
          Your comprehensive health overview powered by VitalSense
        </p>
      </div>

      {/* Health Metrics Grid */}
      <div className="md:grid-cols-2 lg:gap-7 grid gap-6 lg:grid-cols-4">
        {/* Health Score Card */}
        <Card className="border-border rounded-md border border-vitalsense-primary/20 bg-gradient-to-br from-vitalsense-primary/5 to-vitalsense-primary/10">
          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0 px-4">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Heart className="h-5 w-5 text-vitalsense-primary" />
          </CardHeader>
          <CardContent className="pb-5 md:pt-3 px-4 pt-2">
            <div className="mb-2 text-3xl font-bold text-vitalsense-primary">
              85
            </div>
            <p className="text-xs text-vitalsense-gray">+5 from last week</p>
          </CardContent>
        </Card>

        {/* Activity Card */}
        <Card className="border-border rounded-md border border-vitalsense-secondary/20 bg-gradient-to-br from-vitalsense-secondary/5 to-vitalsense-secondary/10">
          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0 px-4">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <Activity className="h-5 w-5 text-vitalsense-secondary" />
          </CardHeader>
          <CardContent className="pb-5 md:pt-3 px-4 pt-2">
            <div className="mb-2 text-3xl font-bold text-vitalsense-secondary">
              7,842
            </div>
            <p className="text-xs text-vitalsense-gray">steps today</p>
          </CardContent>
        </Card>

        {/* Brain Health Card */}
        <Card className="from-vitalsense-accent/5 to-vitalsense-accent/10 border-vitalsense-accent/20 border-border rounded-md border bg-gradient-to-br">
          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0 px-4">
            <CardTitle className="text-sm font-medium">Brain Health</CardTitle>
            <Brain className="text-vitalsense-accent h-5 w-5" />
          </CardHeader>
          <CardContent className="pb-5 md:pt-3 px-4 pt-2">
            <div className="text-vitalsense-accent mb-2 text-3xl font-bold">
              Good
            </div>
            <p className="text-xs text-vitalsense-gray">cognitive assessment</p>
          </CardContent>
        </Card>

        {/* Goals Card */}
        <Card className="border-border rounded-md border border-vitalsense-success/20 bg-gradient-to-br from-vitalsense-success/5 to-vitalsense-success/10">
          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0 px-4">
            <CardTitle className="text-sm font-medium">Goals</CardTitle>
            <Target className="h-5 w-5 text-vitalsense-success" />
          </CardHeader>
          <CardContent className="pb-5 md:pt-3 px-4 pt-2">
            <div className="mb-2 text-3xl font-bold text-vitalsense-success">
              3/5
            </div>
            <p className="text-xs text-vitalsense-gray">completed today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="md:grid-cols-2 grid gap-8">
        {/* Recent Activity */}
        <Card className="border-border rounded-md border">
          <CardHeader className="py-3 pb-3 px-4">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription className="text-base">
              Your health data updates
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-3 px-4">
            <div className="space-y-6">
              <div className="border-border flex items-center justify-between border-b pb-4">
                <span className="text-sm font-medium">Morning walk</span>
                <span className="text-xs text-vitalsense-gray">
                  2 hours ago
                </span>
              </div>
              <div className="border-border flex items-center justify-between border-b pb-4">
                <span className="text-sm font-medium">Heart rate updated</span>
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
          <CardFooter className="pt-3 px-4" />
        </Card>

        {/* Quick Actions */}
        <Card className="border-border rounded-md border">
          <CardHeader className="py-3 pb-3 px-4">
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your health data</CardDescription>
          </CardHeader>
          <CardFooter className="pt-3 block px-4">
            <div className="w-full space-y-4">
              <button className="px-3 w-full rounded-md bg-vitalsense-primary py-2 text-white hover:bg-vitalsense-primary/90">
                Sync Health Data
              </button>
              <button className="px-3 w-full rounded-md bg-vitalsense-secondary py-2 text-white hover:bg-vitalsense-secondary/90">
                View Trends
              </button>
              <button className="border-vitalsense-border px-3 hover:bg-vitalsense-muted w-full rounded-md border py-2">
                Export Data
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-xs text-vitalsense-gray">
          🚀 This dashboard is code-split and loads on-demand for optimal
          performance
        </p>
      </div>
    </div>
  );
}
