/**
 * Intervention Progress Analytics Component
 * Visualizes intervention progress and effectiveness over time
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react';
import React from 'react';
import type { PersonalizedInterventionPlan, InterventionProgress } from '@/lib/enhanced-intervention-engine';

interface InterventionProgressAnalyticsProps {
  interventionPlan: PersonalizedInterventionPlan;
  showDetails?: boolean;
}

export default function InterventionProgressAnalytics({
  interventionPlan,
  showDetails = true,
}: InterventionProgressAnalyticsProps) {
  // Calculate overall progress statistics
  const overallStats = React.useMemo(() => {
    const progress = interventionPlan.progress;
    if (progress.length === 0) {
      return {
        averageCompletion: 0,
        averageAdherence: 0,
        averageEffectiveness: 0,
        totalActive: 0,
        totalCompleted: 0,
      };
    }

    const total = progress.length;
    const averageCompletion =
      progress.reduce((sum, p) => sum + p.completionRate, 0) / total;
    const averageAdherence =
      progress.reduce((sum, p) => sum + p.adherenceRate, 0) / total;
    const averageEffectiveness =
      progress.reduce((sum, p) => sum + p.effectiveness, 0) / total;

    return {
      averageCompletion,
      averageAdherence,
      averageEffectiveness,
      totalActive: progress.filter((p) => {
        const intervention = interventionPlan.activeInterventions.find(
          (i) => i.id === p.interventionId
        );
        return intervention !== undefined;
      }).length,
      totalCompleted: interventionPlan.completedInterventions.length,
    };
  }, [interventionPlan]);

  // Calculate risk reduction progress
  const riskReduction = React.useMemo(() => {
    const baseline = interventionPlan.baselineRisk;
    const current = interventionPlan.currentRisk;
    const target = interventionPlan.targetRisk;
    const totalReduction = baseline - target;
    const achievedReduction = baseline - current;
    const progressPercent =
      totalReduction > 0 ? (achievedReduction / totalReduction) * 100 : 0;

    return {
      baseline,
      current,
      target,
      totalReduction,
      achievedReduction,
      progressPercent,
      remainingReduction: current - target,
    };
  }, [interventionPlan]);

  // Render intervention progress card
  const renderInterventionProgress = (progress: InterventionProgress) => {
    const intervention = interventionPlan.activeInterventions.find(
      (i) => i.id === progress.interventionId
    );

    if (!intervention) return null;

    const daysActive = Math.floor(
      (new Date().getTime() - progress.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Card key={progress.interventionId} className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{intervention.title}</CardTitle>
              <CardDescription className="mt-1">
                {intervention.description}
              </CardDescription>
            </div>
            <Badge
              variant={
                progress.completionRate >= 80
                  ? 'default'
                  : progress.completionRate >= 50
                    ? 'secondary'
                    : 'outline'
              }
            >
              {progress.completionRate}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Metrics */}
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Completion Rate</span>
                <span>{progress.completionRate}%</span>
              </div>
              <Progress value={progress.completionRate} className="h-2" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Adherence Rate</span>
                <span>{progress.adherenceRate}%</span>
              </div>
              <Progress value={progress.adherenceRate} className="h-2" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Effectiveness</span>
                <span>{progress.effectiveness}%</span>
              </div>
              <Progress value={progress.effectiveness} className="h-2" />
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border p-3">
            <div>
              <div className="text-xs text-gray-500">Days Active</div>
              <div className="text-lg font-semibold">{daysActive}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">User Rating</div>
              <div className="text-lg font-semibold">
                {progress.userRating > 0 ? '⭐'.repeat(progress.userRating) : 'N/A'}
              </div>
            </div>
          </div>

          {/* Challenges and Modifications */}
          {showDetails && (
            <div className="space-y-2">
              {progress.challenges.length > 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <div className="mb-1 text-sm font-medium text-yellow-900">
                    Challenges
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-yellow-800">
                    {progress.challenges.map((challenge, idx) => (
                      <li key={idx}>{challenge}</li>
                    ))}
                  </ul>
                </div>
              )}
              {progress.modifications.length > 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="mb-1 text-sm font-medium text-blue-900">
                    Modifications
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-blue-800">
                    {progress.modifications.map((mod, idx) => (
                      <li key={idx}>{mod}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Overall Progress
          </CardTitle>
          <CardDescription>
            Your intervention plan progress and risk reduction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Risk Reduction Progress */}
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Risk Reduction Progress</span>
                <span>{riskReduction.progressPercent.toFixed(1)}%</span>
              </div>
              <Progress value={riskReduction.progressPercent} className="h-3" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <div className="text-xs text-gray-500">Baseline Risk</div>
                <div className="mt-1 text-2xl font-bold text-gray-700">
                  {riskReduction.baseline.toFixed(1)}
                </div>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="text-xs text-gray-500">Current Risk</div>
                <div className="mt-1 text-2xl font-bold text-blue-600">
                  {riskReduction.current.toFixed(1)}
                </div>
                <div className="mt-1 text-xs text-green-600">
                  ↓ {riskReduction.achievedReduction.toFixed(1)} points
                </div>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="text-xs text-gray-500">Target Risk</div>
                <div className="mt-1 text-2xl font-bold text-green-600">
                  {riskReduction.target.toFixed(1)}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {riskReduction.remainingReduction > 0
                    ? `${riskReduction.remainingReduction.toFixed(1)} to go`
                    : 'Target reached!'}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="mb-1 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs text-gray-500">Avg Completion</span>
              </div>
              <div className="text-2xl font-bold">
                {overallStats.averageCompletion.toFixed(0)}%
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-gray-500">Avg Adherence</span>
              </div>
              <div className="text-2xl font-bold">
                {overallStats.averageAdherence.toFixed(0)}%
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-gray-500">Avg Effectiveness</span>
              </div>
              <div className="text-2xl font-bold">
                {overallStats.averageEffectiveness.toFixed(0)}%
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-xs text-gray-500">Active</span>
              </div>
              <div className="text-2xl font-bold">
                {overallStats.totalActive}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Intervention Progress */}
      {interventionPlan.progress.length > 0 && (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              Active ({overallStats.totalActive})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({overallStats.totalCompleted})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {interventionPlan.progress
              .filter((p) =>
                interventionPlan.activeInterventions.some(
                  (i) => i.id === p.interventionId
                )
              )
              .map(renderInterventionProgress)}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {interventionPlan.completedInterventions.length > 0 ? (
              <div className="space-y-4">
                {interventionPlan.completedInterventions.map((intervention) => {
                  const progress = interventionPlan.progress.find(
                    (p) => p.interventionId === intervention.id
                  );
                  return (
                    <Card key={intervention.id} className="border-green-200 bg-green-50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {intervention.title}
                            </CardTitle>
                            <CardDescription>{intervention.description}</CardDescription>
                          </div>
                          <Badge variant="outline" className="border-green-600 text-green-700">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Completed
                          </Badge>
                        </div>
                      </CardHeader>
                      {progress && (
                        <CardContent>
                          <div className="text-sm text-gray-600">
                            Final effectiveness: {progress.effectiveness}%
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No completed interventions yet
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
