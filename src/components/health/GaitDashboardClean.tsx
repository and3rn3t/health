/**
 * Comprehensive Gait Dashboard Component
 * Combines LiDAR gait analysis and walking pattern visualization
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  const [activeAnalysisMode, setActiveAnalysisMode] = useState<'overview' | 'lidar' | 'walking'>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <span className="text-primary text-2xl">🚶</span>
            Gait Analysis Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive walking pattern analysis using advanced sensors and real-time tracking
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Advanced Analytics
        </Badge>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⚙️</span>
            Analysis Mode
          </CardTitle>
          <CardDescription>
            Choose your preferred analysis method based on available sensors and requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Button
              variant={activeAnalysisMode === 'overview' ? 'default' : 'outline'}
              onClick={() => setActiveAnalysisMode('overview')}
              className="h-auto flex-col gap-2 p-4"
            >
              <span className="text-lg">📊</span>
              <div className="text-center">
                <div className="font-semibold">Overview</div>
                <div className="text-xs text-muted-foreground">
                  Quick insights and comparison
                </div>
              </div>
            </Button>
            
            <Button
              variant={activeAnalysisMode === 'lidar' ? 'default' : 'outline'}
              onClick={() => setActiveAnalysisMode('lidar')}
              className="h-auto flex-col gap-2 p-4"
            >
              <span className="text-lg">🎯</span>
              <div className="text-center">
                <div className="font-semibold">LiDAR Analysis</div>
                <div className="text-xs text-muted-foreground">
                  High-precision depth sensing
                </div>
              </div>
            </Button>
            
            <Button
              variant={activeAnalysisMode === 'walking' ? 'default' : 'outline'}
              onClick={() => setActiveAnalysisMode('walking')}
              className="h-auto flex-col gap-2 p-4"
            >
              <span className="text-lg">👟</span>
              <div className="text-center">
                <div className="font-semibold">Walking Tracker</div>
                <div className="text-xs text-muted-foreground">
                  Real-time movement analysis
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      <div className="space-y-6">
        {activeAnalysisMode === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">85%</p>
                    <p className="text-xs text-muted-foreground">Gait Quality</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">1.4</p>
                    <p className="text-xs text-muted-foreground">Avg Speed (m/s)</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">95</p>
                    <p className="text-xs text-muted-foreground">Cadence (steps/min)</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">78%</p>
                    <p className="text-xs text-muted-foreground">Balance Score</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Options */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Analysis Method</CardTitle>
                <CardDescription>
                  Select the appropriate analysis tool based on your device capabilities and analysis needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎯</span>
                      <h3 className="font-semibold">LiDAR Gait Analysis</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      High-precision analysis using LiDAR depth sensing technology for detailed spatial metrics
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

                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👟</span>
                      <h3 className="font-semibold">Walking Pattern Tracking</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Real-time movement tracking using accelerometer and gyroscope for rhythm and symmetry analysis
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📈</span>
                  Recent Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium text-sm">LiDAR Analysis Session</p>
                      <p className="text-xs text-muted-foreground">Today at 2:30 PM • 5 minutes</p>
                    </div>
                    <Badge variant="outline">87% Quality</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium text-sm">Walking Pattern Session</p>
                      <p className="text-xs text-muted-foreground">Today at 1:15 PM • 12 minutes</p>
                    </div>
                    <Badge variant="outline">82% Quality</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium text-sm">Comprehensive Analysis</p>
                      <p className="text-xs text-muted-foreground">Yesterday at 4:45 PM • 30 minutes</p>
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
