/**
 * Comprehensive Gait Dashboard Component
 * Combines LiDAR gait analysis and walking pattern visualization
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Footprints, Target, TrendingUp } from '@/lib/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState } from 'react';
import { LiDARGaitAnalyzer } from './LiDARGaitAnalyzerClean';
import { WalkingPatternVisualizer } from './WalkingPatternVisualizerClean';

export function GaitDashboard() {
  const [activeAnalysisMode, setActiveAnalysisMode] = useState<
    'overview' | 'lidar' | 'walking'
  >('overview');

  return (
    <div className="space-y-6">
      {/* Mode Selection — segmented control */}
      <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
        {(
          [
            { key: 'overview', label: 'Overview' },
            { key: 'lidar', label: 'LiDAR Analysis' },
            { key: 'walking', label: 'Walking Tracker' },
          ] as const
        ).map(({ key, label }) => (
          <Button
            key={key}
            size="sm"
            variant="ghost"
            aria-pressed={activeAnalysisMode === key}
            onClick={() => setActiveAnalysisMode(key)}
            className={`min-h-[44px] flex-1 rounded-lg text-sm font-medium transition-all ${
              activeAnalysisMode === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {activeAnalysisMode === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats Overview */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card variant="glass">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">85%</p>
                    <p className="text-xs text-muted-foreground">Gait Quality</p>
                  </div>
                </CardContent>
              </Card>
              <Card variant="glass">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">1.4</p>
                    <p className="text-xs text-muted-foreground">Avg Speed (m/s)</p>
                  </div>
                </CardContent>
              </Card>
              <Card variant="glass">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">95</p>
                    <p className="text-xs text-muted-foreground">Cadence (steps/min)</p>
                  </div>
                </CardContent>
              </Card>
              <Card variant="glass">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">78%</p>
                    <p className="text-xs text-muted-foreground">Balance Score</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Options */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Choose Your Analysis Method</CardTitle>
                <CardDescription>
                  Select the appropriate analysis tool based on your device
                  capabilities and analysis needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">LiDAR Gait Analysis</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      High-precision analysis using LiDAR depth sensing
                      technology for detailed spatial metrics
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-500">✅</span>
                        <span>Step length and width measurement</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-500">✅</span>
                        <span>Foot clearance analysis</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-500">✅</span>
                        <span>Posture stability assessment</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setActiveAnalysisMode('lidar')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Start LiDAR Analysis
                    </Button>
                  </div>

                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center gap-2">
                      <Footprints className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">
                        Walking Pattern Tracking
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Real-time movement tracking using accelerometer and
                      gyroscope for rhythm and symmetry analysis
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-500">✅</span>
                        <span>Real-time step counting</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-500">✅</span>
                        <span>Walking rhythm analysis</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-500">✅</span>
                        <span>Gait symmetry assessment</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setActiveAnalysisMode('walking')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Start Walking Tracker
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Summary */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recent Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        LiDAR Analysis Session
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Today at 2:30 PM • 5 minutes
                      </p>
                    </div>
                    <Badge variant="outline">87% Quality</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        Walking Pattern Session
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Today at 1:15 PM • 12 minutes
                      </p>
                    </div>
                    <Badge variant="outline">82% Quality</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        Comprehensive Analysis
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Yesterday at 4:45 PM • 30 minutes
                      </p>
                    </div>
                    <Badge variant="outline">91% Quality</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeAnalysisMode === 'lidar' && (
          <div>
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={() => setActiveAnalysisMode('overview')}
                className="gap-2"
              >
                ← Back to Overview
              </Button>
            </div>
            <LiDARGaitAnalyzer />
          </div>
        )}

        {activeAnalysisMode === 'walking' && (
          <div>
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={() => setActiveAnalysisMode('overview')}
                className="gap-2"
              >
                ← Back to Overview
              </Button>
            </div>
            <WalkingPatternVisualizer />
          </div>
        )}
      </div>
    </div>
  );
}
