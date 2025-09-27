/**
 * LiDAR Cognitive Assessment Analyzer
 * Dual-task gait analysis for cognitive load assessment and early dementia detection
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@github/spark/hooks';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface CognitiveTaskType {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // seconds
  instructions: string[];
  cognitiveLoad: number; // 1-10 scale
}

interface DualTaskGaitMetrics {
  // Primary gait metrics
  cadence: number;
  stepLength: number;
  walkingSpeed: number;
  gaitVariability: number;

  // Dual-task specific metrics
  cognitiveTaskAccuracy: number;
  reactionTime: number;
  taskSwitchingCost: number;
  attentionalDemand: number;

  // Cognitive interference metrics
  gaitCognitiveInterference: number;
  dualTaskCost: number;
  priorityStrategy: 'gait-first' | 'cognitive-first' | 'balanced';
}

interface CognitiveAssessmentResult {
  id: string;
  timestamp: Date;
  taskType: string;

  // Performance scores
  overallCognitiveScore: number;
  executiveFunctionScore: number;
  attentionScore: number;
  processingSpeedScore: number;
  workingMemoryScore: number;

  // Risk assessments
  cognitiveDeclineRisk: 'low' | 'moderate' | 'high' | 'severe';
  dementiaRiskIndicators: string[];
  recommendedActions: string[];

  // Metrics
  metrics: DualTaskGaitMetrics;
  confidence: number;
}

const COGNITIVE_TASKS: CognitiveTaskType[] = [
  {
    id: 'serial-sevens',
    name: 'Serial Sevens',
    description: 'Count backwards from 100 by 7s while walking',
    difficulty: 'hard',
    duration: 60,
    instructions: [
      'Start walking at your normal pace',
      'Count backwards from 100 by 7s out loud',
      'Continue until instructed to stop',
      'Try to maintain both tasks equally',
    ],
    cognitiveLoad: 8,
  },
  {
    id: 'verbal-fluency',
    name: 'Verbal Fluency',
    description: 'Name animals while walking',
    difficulty: 'medium',
    duration: 45,
    instructions: [
      'Walk at your comfortable pace',
      'Name as many animals as you can',
      'Try not to repeat any animals',
      'Continue for the full duration',
    ],
    cognitiveLoad: 6,
  },
  {
    id: 'digit-span',
    name: 'Digit Span',
    description: 'Repeat number sequences while walking',
    difficulty: 'medium',
    duration: 90,
    instructions: [
      'Listen to the number sequence',
      'Walk while repeating it back',
      'Sequences will get progressively longer',
      'Focus on accuracy over speed',
    ],
    cognitiveLoad: 7,
  },
  {
    id: 'stroop-task',
    name: 'Color-Word Stroop',
    description: 'Name colors while walking and responding to prompts',
    difficulty: 'hard',
    duration: 75,
    instructions: [
      'Walk at your normal pace',
      'Name the color of words shown (not the word itself)',
      'Respond as quickly and accurately as possible',
      'Maintain walking throughout',
    ],
    cognitiveLoad: 9,
  },
  {
    id: 'simple-attention',
    name: 'Simple Attention',
    description: 'Walk while counting aloud',
    difficulty: 'easy',
    duration: 30,
    instructions: [
      'Walk at your comfortable pace',
      'Count aloud from 1 to 50',
      'Maintain steady counting rhythm',
      'Focus on both tasks equally',
    ],
    cognitiveLoad: 4,
  },
];

export const LiDARCognitiveAnalyzer: React.FC = React.memo(() => {
  // Core state
  const [isActive, setIsActive] = useState(false);
  const [currentTask, setCurrentTask] = useState<CognitiveTaskType | null>(
    null
  );
  const [sessionProgress, setSessionProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Assessment state
  const [gaitMetrics, setGaitMetrics] = useState<DualTaskGaitMetrics | null>(
    null
  );
  const [cognitivePerformance, setCognitivePerformance] = useState<
    Record<string, number>
  >({});
  const [currentAssessment, setCurrentAssessment] =
    useState<CognitiveAssessmentResult | null>(null);

  // UI state
  const [selectedTaskId, setSelectedTaskId] =
    useState<string>('simple-attention');
  const [calibrationComplete, setCalibrationComplete] = useState(false);

  // Persistence
  const [assessmentHistory, setAssessmentHistory] = useKV<
    CognitiveAssessmentResult[]
  >('cognitive-assessments', []);

  // Memoized values
  const selectedTask = useMemo(
    () =>
      COGNITIVE_TASKS.find((task) => task.id === selectedTaskId) ||
      COGNITIVE_TASKS[0],
    [selectedTaskId]
  );

  const averageScores = useMemo(() => {
    if (!assessmentHistory || assessmentHistory.length === 0) return null;

    const recentAssessments = assessmentHistory.slice(-10);
    return {
      cognitive:
        recentAssessments.reduce((sum, a) => sum + a.overallCognitiveScore, 0) /
        recentAssessments.length,
      attention:
        recentAssessments.reduce((sum, a) => sum + a.attentionScore, 0) /
        recentAssessments.length,
      executive:
        recentAssessments.reduce(
          (sum, a) => sum + a.executiveFunctionScore,
          0
        ) / recentAssessments.length,
      processing:
        recentAssessments.reduce((sum, a) => sum + a.processingSpeedScore, 0) /
        recentAssessments.length,
    };
  }, [assessmentHistory]);

  // Session management
  const startAssessment = useCallback(async () => {
    if (!selectedTask || !calibrationComplete) return;

    setIsActive(true);
    setCurrentTask(selectedTask);
    setTimeRemaining(selectedTask.duration);
    setSessionProgress(0);
    setGaitMetrics(null);
    setCognitivePerformance({});
    setCurrentAssessment(null);

    // Initialize LiDAR scanning
    console.log(`Starting cognitive assessment: ${selectedTask.name}`);

    // Start timer
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, selectedTask.duration - elapsed);
      const progress = (elapsed / selectedTask.duration) * 100;

      setTimeRemaining(remaining);
      setSessionProgress(Math.min(progress, 100));

      if (remaining <= 0) {
        clearInterval(timer);
        completeAssessment();
      }
    }, 100);

    // Simulate real-time gait metrics updates
    const metricsTimer = setInterval(() => {
      if (!isActive) {
        clearInterval(metricsTimer);
        return;
      }

      updateGaitMetrics();
    }, 1000);
  }, [selectedTask, calibrationComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const completeAssessment = useCallback(async () => {
    if (!currentTask || !gaitMetrics) return;

    setIsActive(false);

    // Generate comprehensive assessment
    const assessment = await generateCognitiveAssessment(
      currentTask,
      gaitMetrics,
      cognitivePerformance
    );
    setCurrentAssessment(assessment);

    // Save to history
    const updatedHistory = [...(assessmentHistory || []), assessment];
    setAssessmentHistory(updatedHistory);

    console.log('Cognitive assessment completed:', assessment);
  }, [
    currentTask,
    gaitMetrics,
    cognitivePerformance,
    assessmentHistory,
    setAssessmentHistory,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopAssessment = useCallback(() => {
    setIsActive(false);
    setCurrentTask(null);
    setSessionProgress(0);
    setTimeRemaining(0);
  }, []);

  // Metrics simulation
  const updateGaitMetrics = useCallback(() => {
    if (!isActive || !currentTask) return;

    // Simulate dual-task gait metrics with cognitive interference
    const baselineGait = {
      cadence: 110 + Math.random() * 10,
      stepLength: 0.65 + Math.random() * 0.1,
      walkingSpeed: 1.2 + Math.random() * 0.2,
      gaitVariability: 0.05 + Math.random() * 0.03,
    };

    // Apply cognitive load effects
    const cognitiveInterference = currentTask.cognitiveLoad / 10;
    const dualTaskMetrics: DualTaskGaitMetrics = {
      ...baselineGait,
      cadence: baselineGait.cadence * (1 - cognitiveInterference * 0.1),
      walkingSpeed:
        baselineGait.walkingSpeed * (1 - cognitiveInterference * 0.15),
      gaitVariability:
        baselineGait.gaitVariability * (1 + cognitiveInterference * 0.5),

      cognitiveTaskAccuracy: Math.max(
        0.3,
        0.95 - cognitiveInterference * 0.2 + Math.random() * 0.1
      ),
      reactionTime: 800 + cognitiveInterference * 200 + Math.random() * 100,
      taskSwitchingCost: cognitiveInterference * 150 + Math.random() * 50,
      attentionalDemand: cognitiveInterference * 8 + Math.random() * 2,

      gaitCognitiveInterference:
        cognitiveInterference * 0.25 + Math.random() * 0.1,
      dualTaskCost: cognitiveInterference * 0.2 + Math.random() * 0.05,
      priorityStrategy: Math.random() > 0.5 ? 'gait-first' : 'cognitive-first',
    };

    setGaitMetrics(dualTaskMetrics);

    // Update cognitive performance
    setCognitivePerformance((prev) => ({
      ...prev,
      accuracy: dualTaskMetrics.cognitiveTaskAccuracy,
      reactionTime: dualTaskMetrics.reactionTime,
      consistency: 1 - dualTaskMetrics.gaitVariability / 0.1,
    }));
  }, [isActive, currentTask]);

  // Assessment generation
  const generateCognitiveAssessment = useCallback(
    async (
      task: CognitiveTaskType,
      metrics: DualTaskGaitMetrics,
      performance: Record<string, number>
    ): Promise<CognitiveAssessmentResult> => {
      // Calculate cognitive scores
      const executiveFunctionScore = Math.max(
        0,
        100 - metrics.taskSwitchingCost / 2
      );
      const attentionScore = Math.max(0, performance.accuracy * 100);
      const processingSpeedScore = Math.max(
        0,
        100 - (metrics.reactionTime - 500) / 10
      );
      const workingMemoryScore = Math.max(
        0,
        (performance.consistency || 0.5) * 100
      );

      const overallCognitiveScore =
        executiveFunctionScore * 0.3 +
        attentionScore * 0.25 +
        processingSpeedScore * 0.25 +
        workingMemoryScore * 0.2;

      // Assess cognitive decline risk
      let cognitiveDeclineRisk: 'low' | 'moderate' | 'high' | 'severe' = 'low';
      const riskIndicators: string[] = [];
      const recommendations: string[] = [];

      if (metrics.dualTaskCost > 0.3) {
        cognitiveDeclineRisk = 'moderate';
        riskIndicators.push('Significant dual-task interference');
        recommendations.push('Consider cognitive training exercises');
      }

      if (metrics.gaitCognitiveInterference > 0.4) {
        cognitiveDeclineRisk = 'high';
        riskIndicators.push('High cognitive-motor interference');
        recommendations.push('Consult with a neurologist');
      }

      if (overallCognitiveScore < 60) {
        cognitiveDeclineRisk = 'severe';
        riskIndicators.push('Low overall cognitive performance');
        recommendations.push('Immediate clinical evaluation recommended');
      }

      if (metrics.attentionalDemand > 7) {
        riskIndicators.push('High attentional demand during dual-tasking');
        recommendations.push('Practice divided attention exercises');
      }

      return {
        id: `assessment-${Date.now()}`,
        timestamp: new Date(),
        taskType: task.id,
        overallCognitiveScore,
        executiveFunctionScore,
        attentionScore,
        processingSpeedScore,
        workingMemoryScore,
        cognitiveDeclineRisk,
        dementiaRiskIndicators: riskIndicators,
        recommendedActions: recommendations,
        metrics,
        confidence: Math.min(
          0.95,
          0.7 + (performance.consistency || 0.5) * 0.25
        ),
      };
    },
    []
  );

  // Effects
  useEffect(() => {
    // Simulate calibration completion
    const timer = setTimeout(() => setCalibrationComplete(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="gap-3 flex items-center">
            <Brain className="text-purple-600 h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">LiDAR Cognitive Assessment</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Dual-task gait analysis for cognitive load assessment and early
                detection
              </p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="assessment" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-6">
          {/* Task Selection */}
          {!isActive && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Select Cognitive Task
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="md:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {COGNITIVE_TASKS.map((task) => (
                    <Card
                      key={task.id}
                      className={`cursor-pointer transition-all ${
                        selectedTaskId === task.id
                          ? 'ring-purple-500 ring-2'
                          : 'ring-gray-300 hover:ring-1'
                      }`}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="font-semibold">{task.name}</h3>
                          <Badge
                            variant={(() => {
                              if (task.difficulty === 'easy')
                                return 'secondary';
                              if (task.difficulty === 'medium')
                                return 'default';
                              return 'destructive';
                            })()}
                          >
                            {task.difficulty}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3 text-sm">
                          {task.description}
                        </p>
                        <div className="text-xs flex justify-between">
                          <span>
                            <Clock className="h-3 w-3 mr-1 inline" />
                            {task.duration}s
                          </span>
                          <span>
                            <Activity className="h-3 w-3 mr-1 inline" />
                            Load: {task.cognitiveLoad}/10
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Instructions */}
                {selectedTask && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Instructions: {selectedTask.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="list-inside list-decimal space-y-2">
                        {selectedTask.instructions.map((instruction) => (
                          <li
                            key={instruction.slice(0, 20)}
                            className="text-sm"
                          >
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                )}

                {/* Start Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={startAssessment}
                    disabled={!calibrationComplete}
                    size="lg"
                    className="min-w-[200px]"
                  >
                    {!calibrationComplete ? (
                      <>Calibrating System...</>
                    ) : (
                      <>
                        <Brain className="h-5 w-5 mr-2" />
                        Start Cognitive Assessment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Assessment */}
          {isActive && currentTask && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Active Assessment: {currentTask.name}</span>
                  <Badge variant="outline">
                    {Math.ceil(timeRemaining)}s remaining
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress */}
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(sessionProgress)}%</span>
                  </div>
                  <Progress value={sessionProgress} className="h-2" />
                </div>

                {/* Real-time Metrics */}
                {gaitMetrics && (
                  <div className="md:grid-cols-4 grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-blue-600 text-2xl font-bold">
                          {gaitMetrics.walkingSpeed.toFixed(2)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Speed (m/s)
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-green-600 text-2xl font-bold">
                          {Math.round(gaitMetrics.cognitiveTaskAccuracy * 100)}%
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Task Accuracy
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-orange-600 text-2xl font-bold">
                          {Math.round(gaitMetrics.reactionTime)}ms
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Reaction Time
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-purple-600 text-2xl font-bold">
                          {Math.round(gaitMetrics.dualTaskCost * 100)}%
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Dual-Task Cost
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Stop Button */}
                <div className="flex justify-center">
                  <Button onClick={stopAssessment} variant="destructive">
                    Stop Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {currentAssessment ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Assessment Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Score */}
                <div className="text-center">
                  <div className="text-4xl text-purple-600 mb-2 font-bold">
                    {Math.round(currentAssessment.overallCognitiveScore)}
                  </div>
                  <div className="text-muted-foreground text-lg">
                    Overall Cognitive Score
                  </div>
                  <Badge
                    variant={(() => {
                      if (currentAssessment.cognitiveDeclineRisk === 'low')
                        return 'secondary';
                      if (currentAssessment.cognitiveDeclineRisk === 'moderate')
                        return 'default';
                      return 'destructive';
                    })()}
                    className="mt-2"
                  >
                    {currentAssessment.cognitiveDeclineRisk.toUpperCase()} RISK
                  </Badge>
                </div>

                {/* Domain Scores */}
                <div className="md:grid-cols-4 grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-blue-600 text-2xl font-bold">
                        {Math.round(currentAssessment.executiveFunctionScore)}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Executive Function
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-green-600 text-2xl font-bold">
                        {Math.round(currentAssessment.attentionScore)}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Attention
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-orange-600 text-2xl font-bold">
                        {Math.round(currentAssessment.processingSpeedScore)}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Processing Speed
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-purple-600 text-2xl font-bold">
                        {Math.round(currentAssessment.workingMemoryScore)}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Working Memory
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Risk Indicators */}
                {currentAssessment.dementiaRiskIndicators.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="mb-2 font-semibold">Risk Indicators:</div>
                      <ul className="list-inside list-disc space-y-1">
                        {currentAssessment.dementiaRiskIndicators.map(
                          (indicator) => (
                            <li
                              key={indicator.slice(0, 20)}
                              className="text-sm"
                            >
                              {indicator}
                            </li>
                          )
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Recommendations */}
                {currentAssessment.recommendedActions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Recommended Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {currentAssessment.recommendedActions.map((action) => (
                          <li
                            key={action.slice(0, 20)}
                            className="flex items-start gap-2"
                          >
                            <CheckCircle className="text-green-600 mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Complete an assessment to see results
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          {assessmentHistory && assessmentHistory.length > 0 ? (
            <>
              {/* Trends */}
              {averageScores && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="md:grid-cols-4 grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-purple-600 text-2xl font-bold">
                          {Math.round(averageScores.cognitive)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Avg Cognitive
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-600 text-2xl font-bold">
                          {Math.round(averageScores.attention)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Avg Attention
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-600 text-2xl font-bold">
                          {Math.round(averageScores.executive)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Avg Executive
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-orange-600 text-2xl font-bold">
                          {Math.round(averageScores.processing)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Avg Processing
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assessment History */}
              <Card>
                <CardHeader>
                  <CardTitle>Assessment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assessmentHistory
                      ?.slice(-10)
                      .reverse()
                      .map((assessment) => (
                        <Card key={assessment.id}>
                          <CardContent className="p-4">
                            <div className="mb-2 flex items-start justify-between">
                              <div>
                                <div className="font-semibold">
                                  {COGNITIVE_TASKS.find(
                                    (t) => t.id === assessment.taskType
                                  )?.name || assessment.taskType}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  {assessment.timestamp.toLocaleDateString()} at{' '}
                                  {assessment.timestamp.toLocaleTimeString()}
                                </div>
                              </div>
                              <Badge
                                variant={(() => {
                                  if (assessment.cognitiveDeclineRisk === 'low')
                                    return 'secondary';
                                  if (
                                    assessment.cognitiveDeclineRisk ===
                                    'moderate'
                                  )
                                    return 'default';
                                  return 'destructive';
                                })()}
                              >
                                {assessment.cognitiveDeclineRisk}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-center">
                              <div>
                                <div className="text-purple-600 font-semibold">
                                  {Math.round(assessment.overallCognitiveScore)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Overall
                                </div>
                              </div>
                              <div>
                                <div className="text-blue-600 font-semibold">
                                  {Math.round(assessment.attentionScore)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Attention
                                </div>
                              </div>
                              <div>
                                <div className="text-green-600 font-semibold">
                                  {Math.round(
                                    assessment.executiveFunctionScore
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Executive
                                </div>
                              </div>
                              <div>
                                <div className="text-orange-600 font-semibold">
                                  {Math.round(assessment.processingSpeedScore)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Processing
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No assessment history available
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Complete some assessments to see trends
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
});

LiDARCognitiveAnalyzer.displayName = 'LiDARCognitiveAnalyzer';
