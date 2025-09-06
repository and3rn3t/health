import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  GraduationCap,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface TrainingSession {
  id: string;
  type: 'posture' | 'balance' | 'gait' | 'flexibility';
  name: string;
  description: string;
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: Exercise[];
  goals: TrainingGoal[];
}

interface Exercise {
  id: string;
  name: string;
  instruction: string;
  duration: number; // seconds
  targetMetrics: {
    postureScore: number;
    balanceStability: number;
    movementPrecision: number;
  };
  realTimeCoaching: boolean;
}

interface TrainingGoal {
  id: string;
  metric: string;
  target: number;
  current: number;
  unit: string;
  timeframe: string;
}

interface PostureCorrection {
  id: string;
  issue: string;
  severity: 'mild' | 'moderate' | 'significant';
  correction: string;
  visualCue: string;
  timestamp: Date;
}

interface SessionProgress {
  currentExercise: number;
  exerciseProgress: number;
  overallScore: number;
  corrections: PostureCorrection[];
  achievements: string[];
  biometrics: {
    heartRate?: number;
    stability: number;
    effort: number;
  };
}

export const LiDARTrainingAssistant: React.FC = () => {
  const [selectedSession, setSelectedSession] =
    useState<TrainingSession | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionProgress, setSessionProgress] =
    useState<SessionProgress | null>(null);
  const [realtimeCoaching, setRealtimeCoaching] = useState(true);
  const [trainingHistory, setTrainingHistory] = useState<
    Array<{
      id: number;
      session: TrainingSession;
      progress: SessionProgress;
      completedAt: Date;
      duration: number;
    }>
  >([]);

  const trainingPrograms: TrainingSession[] = [
    {
      id: 'posture_basics',
      type: 'posture',
      name: 'Posture Fundamentals',
      description: 'Learn proper spinal alignment and head positioning',
      duration: 15,
      difficulty: 'beginner',
      exercises: [
        {
          id: 'wall_stand',
          name: 'Wall Standing Alignment',
          instruction:
            'Stand against the wall with your back flat. Feel the alignment.',
          duration: 60,
          targetMetrics: {
            postureScore: 85,
            balanceStability: 80,
            movementPrecision: 75,
          },
          realTimeCoaching: true,
        },
        {
          id: 'chin_tucks',
          name: 'Chin Tuck Exercise',
          instruction: 'Gently tuck your chin to reduce forward head posture.',
          duration: 45,
          targetMetrics: {
            postureScore: 88,
            balanceStability: 75,
            movementPrecision: 85,
          },
          realTimeCoaching: true,
        },
      ],
      goals: [
        {
          id: 'goal_1',
          metric: 'Forward Head Posture',
          target: 5,
          current: 12,
          unit: 'degrees',
          timeframe: '2 weeks',
        },
        {
          id: 'goal_2',
          metric: 'Spinal Alignment Score',
          target: 90,
          current: 75,
          unit: '%',
          timeframe: '1 month',
        },
      ],
    },
    {
      id: 'balance_training',
      type: 'balance',
      name: 'Dynamic Balance Training',
      description:
        'Improve stability and reduce fall risk through targeted exercises',
      duration: 20,
      difficulty: 'intermediate',
      exercises: [
        {
          id: 'single_leg',
          name: 'Single Leg Stand',
          instruction:
            'Stand on one leg for 30 seconds, maintain steady posture.',
          duration: 30,
          targetMetrics: {
            postureScore: 80,
            balanceStability: 90,
            movementPrecision: 85,
          },
          realTimeCoaching: true,
        },
        {
          id: 'heel_to_toe',
          name: 'Heel-to-Toe Walking',
          instruction:
            'Walk in a straight line placing heel directly in front of toes.',
          duration: 60,
          targetMetrics: {
            postureScore: 85,
            balanceStability: 88,
            movementPrecision: 92,
          },
          realTimeCoaching: true,
        },
      ],
      goals: [
        {
          id: 'goal_3',
          metric: 'Single Leg Stand Time',
          target: 60,
          current: 25,
          unit: 'seconds',
          timeframe: '3 weeks',
        },
        {
          id: 'goal_4',
          metric: 'Stability Index',
          target: 95,
          current: 78,
          unit: '%',
          timeframe: '1 month',
        },
      ],
    },
  ];

  const generateRealtimeCorrections = useCallback((): PostureCorrection[] => {
    const possibleCorrections = [
      {
        issue: 'Forward head posture detected',
        severity: 'moderate' as const,
        correction: 'Gently tuck your chin back',
        visualCue: 'Imagine a string pulling the top of your head upward',
      },
      {
        issue: 'Shoulders are elevated',
        severity: 'mild' as const,
        correction: 'Relax your shoulders down',
        visualCue: 'Let your shoulders melt away from your ears',
      },
      {
        issue: 'Weight shifting to left',
        severity: 'moderate' as const,
        correction: 'Center your weight between both feet',
        visualCue: 'Feel equal pressure on both feet',
      },
      {
        issue: 'Excessive forward lean',
        severity: 'significant' as const,
        correction: 'Straighten your back, engage your core',
        visualCue: 'Imagine your spine as a straight line',
      },
    ];

    const numCorrections = Math.floor(Math.random() * 3);
    const shuffled = [...possibleCorrections];
    shuffled.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, numCorrections).map((correction, index) => ({
      id: `correction_${index}`,
      ...correction,
      timestamp: new Date(),
    }));
  }, []);

  const startTrainingSession = (session: TrainingSession) => {
    setSelectedSession(session);
    setIsTraining(true);
    setIsPaused(false);
    setSessionProgress({
      currentExercise: 0,
      exerciseProgress: 0,
      overallScore: 0,
      corrections: [],
      achievements: [],
      biometrics: {
        heartRate: Math.floor(Math.random() * 20) + 70,
        stability: Math.floor(Math.random() * 30) + 70,
        effort: Math.floor(Math.random() * 40) + 60,
      },
    });
  };

  const pauseTraining = () => {
    setIsPaused(!isPaused);
  };

  const stopTraining = useCallback(() => {
    if (selectedSession && sessionProgress) {
      // Save session to history
      const completedSession = {
        id: Date.now(),
        session: selectedSession,
        progress: sessionProgress,
        completedAt: new Date(),
        duration: Math.floor(Math.random() * 20) + 10, // Simulated duration
      };
      setTrainingHistory((prev) => [completedSession, ...prev.slice(0, 4)]);
    }

    setIsTraining(false);
    setIsPaused(false);
    setSelectedSession(null);
    setSessionProgress(null);
  }, [selectedSession, sessionProgress]);

  useEffect(() => {
    if (!isTraining || isPaused) return;

    const interval = setInterval(() => {
      if (sessionProgress && selectedSession) {
        const newProgress = sessionProgress.exerciseProgress + 2;

        if (newProgress >= 100) {
          // Move to next exercise or complete session
          if (
            sessionProgress.currentExercise <
            selectedSession.exercises.length - 1
          ) {
            setSessionProgress((prev) =>
              prev
                ? {
                    ...prev,
                    currentExercise: prev.currentExercise + 1,
                    exerciseProgress: 0,
                    corrections: realtimeCoaching
                      ? generateRealtimeCorrections()
                      : prev.corrections,
                  }
                : null
            );
          } else {
            // Session complete
            stopTraining();
          }
        } else {
          setSessionProgress((prev) =>
            prev
              ? {
                  ...prev,
                  exerciseProgress: newProgress,
                  overallScore: Math.min(prev.overallScore + 0.5, 100),
                  corrections:
                    realtimeCoaching && Math.random() < 0.3
                      ? generateRealtimeCorrections()
                      : prev.corrections,
                  biometrics: {
                    heartRate: Math.floor(Math.random() * 10) + 75,
                    stability: Math.min(
                      prev.biometrics.stability + Math.random() * 2,
                      100
                    ),
                    effort: Math.floor(Math.random() * 20) + 70,
                  },
                }
              : null
          );
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [
    isTraining,
    isPaused,
    sessionProgress,
    selectedSession,
    realtimeCoaching,
    generateRealtimeCorrections,
    stopTraining,
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'significant':
        return 'text-red-600';
      case 'moderate':
        return 'text-orange-600';
      case 'mild':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isTraining && selectedSession && sessionProgress) {
    const currentExercise =
      selectedSession.exercises[sessionProgress.currentExercise];

    return (
      <div className="space-y-6 p-6">
        {/* Training Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">{selectedSession.name}</h2>
          <p className="text-gray-600">
            Exercise {sessionProgress.currentExercise + 1} of{' '}
            {selectedSession.exercises.length}
          </p>
        </div>

        {/* Current Exercise */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {currentExercise.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-700">{currentExercise.instruction}</p>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Exercise Progress</span>
                  <span>{sessionProgress.exerciseProgress.toFixed(0)}%</span>
                </div>
                <Progress
                  value={sessionProgress.exerciseProgress}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">Posture Score</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.min(
                      sessionProgress.overallScore + Math.random() * 10,
                      100
                    ).toFixed(0)}
                    %
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Stability</div>
                  <div className="text-2xl font-bold text-green-600">
                    {sessionProgress.biometrics.stability.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Effort</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {sessionProgress.biometrics.effort.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Corrections */}
        {realtimeCoaching && sessionProgress.corrections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Real-time Coaching
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessionProgress.corrections.map((correction) => (
                  <Alert key={correction.id}>
                    <AlertTriangle
                      className={`h-4 w-4 ${getSeverityColor(correction.severity)}`}
                    />
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="font-semibold">{correction.issue}</div>
                        <div className="text-sm">{correction.correction}</div>
                        <div className="text-xs italic text-gray-600">
                          {correction.visualCue}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Training Controls */}
        <div className="flex justify-center gap-2">
          <Button onClick={pauseTraining} variant="outline">
            {isPaused ? (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Resume
              </>
            ) : (
              <>
                <PauseCircle className="mr-2 h-4 w-4" />
                Pause
              </>
            )}
          </Button>
          <Button onClick={stopTraining} variant="destructive">
            <RotateCcw className="mr-2 h-4 w-4" />
            Stop Session
          </Button>
          <Button
            onClick={() => setRealtimeCoaching(!realtimeCoaching)}
            variant="outline"
          >
            <Activity className="mr-2 h-4 w-4" />
            Coaching: {realtimeCoaching ? 'ON' : 'OFF'}
          </Button>
        </div>

        {isPaused && (
          <Alert>
            <PauseCircle className="h-4 w-4" />
            <AlertDescription>
              Training session is paused. Click Resume to continue.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <GraduationCap className="mx-auto mb-2 h-10 w-10 text-purple-600" />
        <h2 className="text-2xl font-bold">LiDAR Training Assistant</h2>
        <p className="text-sm text-gray-600">
          Personalized posture and balance training with real-time feedback
        </p>
      </div>

      {/* Training Programs */}
      <div className="grid gap-4">
        {trainingPrograms.map((program) => (
          <Card
            key={program.id}
            className="cursor-pointer transition-shadow hover:shadow-lg"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {program.name}
                  </CardTitle>
                  <p className="mt-1 text-sm text-gray-600">
                    {program.description}
                  </p>
                </div>
                <Badge className={getDifficultyColor(program.difficulty)}>
                  {program.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {program.duration} minutes
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {program.exercises.length} exercises
                  </span>
                  <span className="capitalize">{program.type} focus</span>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold">Training Goals</h4>
                  <div className="space-y-2">
                    {program.goals.map((goal) => (
                      <div
                        key={goal.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{goal.metric}</span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(goal.current / goal.target) * 100}
                            className="w-16"
                          />
                          <span className="w-16 text-right">
                            {goal.current}/{goal.target} {goal.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => startTrainingSession(program)}
                  className="w-full"
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Training
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Training History */}
      {trainingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainingHistory.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-semibold">{session.session.name}</div>
                    <div className="text-sm text-gray-600">
                      {session.completedAt.toLocaleDateString()} •{' '}
                      {session.duration} minutes
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {session.progress.overallScore.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600">Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto mb-2 h-8 w-8 text-green-600" />
            <div className="text-2xl font-bold">7</div>
            <div className="text-sm text-gray-600">Sessions Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="mx-auto mb-2 h-8 w-8 text-blue-600" />
            <div className="text-2xl font-bold">85%</div>
            <div className="text-sm text-gray-600">Average Score</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="mx-auto mb-2 h-8 w-8 text-purple-600" />
            <div className="text-2xl font-bold">3</div>
            <div className="text-sm text-gray-600">Goals Achieved</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiDARTrainingAssistant;
