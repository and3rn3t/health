import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@github/spark/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Type aliases for better code organization
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
type _ExerciseType = 'balance' | 'mobility' | 'strength' | 'coordination';
type MovementSpeed = 'too-fast' | 'good' | 'too-slow';
type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

// LiDAR Training Assistant Types
interface TrainingSession {
  id: string;
  type: 'posture' | 'gait' | 'balance' | 'flexibility' | 'strength';
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  duration: number; // minutes
  exercises: TrainingExercise[];
  startTime?: Date;
  completedAt?: Date;
  progress: number; // 0-100
  currentExercise: number;
  realTimeCoaching: boolean;
  results?: TrainingResults;
}

interface TrainingExercise {
  id: string;
  name: string;
  description: string;
  targetMetrics: {
    alignment?: number; // target angle/position
    balance?: number; // target stability score
    duration?: number; // hold time in seconds
    repetitions?: number;
    range?: { min: number; max: number }; // movement range
  };
  instructions: string[];
  commonMistakes: string[];
  modifications: {
    easier: string[];
    harder: string[];
  };
  feedback: ExerciseFeedback;
  completed: boolean;
  attempts: number;
  bestScore: number;
}

interface ExerciseFeedback {
  currentScore: number; // 0-100
  alignment: {
    head: 'good' | 'forward' | 'tilted';
    shoulders: 'aligned' | 'rounded' | 'uneven';
    spine: 'neutral' | 'flexed' | 'extended';
    pelvis: 'neutral' | 'tilted' | 'rotated';
  };
  balance: {
    stability: number; // 0-100
    sway: number; // mm
    weightDistribution: number; // 0-100
  };
  movement: {
    smoothness: number; // 0-100
    range: number; // percentage of target range
    speed: MovementSpeed;
    compensation: string[]; // detected compensations
  };
  encouragement: string;
  corrections: string[];
}

interface TrainingResults {
  overallScore: number; // 0-100
  exerciseScores: { [exerciseId: string]: number };
  improvements: {
    posture: number; // percentage improvement
    balance: number;
    flexibility: number;
    strength: number;
  };
  timeSpent: number; // minutes
  caloriesBurned: number;
  streakDays: number;
  achievements: Achievement[];
  nextRecommendations: string[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: AchievementRarity;
}

interface RealTimeCoaching {
  isActive: boolean;
  currentCue: string;
  voiceEnabled: boolean;
  intensity: 'gentle' | 'standard' | 'intensive';
  corrections: string[];
  encouragements: string[];
  nextCue: string;
  countdown?: number;
}

interface LiDARTrainingAssistantProps {
  onSessionComplete?: (results: TrainingResults) => void;
  preferredDifficulty?: DifficultyLevel;
  voiceCoachingEnabled?: boolean;
  realTimeAnalysis?: boolean;
}

export function LiDARTrainingAssistant({
  onSessionComplete,
  preferredDifficulty: _preferredDifficulty = 'intermediate',
  voiceCoachingEnabled = false,
  realTimeAnalysis = true,
}: Readonly<LiDARTrainingAssistantProps>) {
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(
    null
  );
  const [isTraining, setIsTraining] = useState(false);
  const [realTimeCoaching, setRealTimeCoaching] = useState<RealTimeCoaching>({
    isActive: false,
    currentCue: '',
    voiceEnabled: voiceCoachingEnabled,
    intensity: 'standard',
    corrections: [],
    encouragements: [],
    nextCue: '',
  });
  const [_trainingHistory, setTrainingHistory] = useKV(
    'training-sessions',
    '[]'
  );
  // Placeholder for future program functionality
  // const [currentProgram, setCurrentProgram] = useState<TrainingProgram | null>(null);
  // const [availablePrograms] = useState<TrainingProgram[]>([]);
  const [achievements, setAchievements] = useKV('training-achievements', '[]');

  // Predefined training sessions - wrapped in useMemo to prevent recreation
  const trainingLibrary: TrainingSession[] = useMemo(
    () => [
      {
        id: 'posture-basics',
        type: 'posture',
        name: 'Posture Fundamentals',
        description:
          'Learn proper spinal alignment and head positioning with real-time LiDAR feedback',
        difficulty: 'beginner',
        duration: 15,
        progress: 0,
        currentExercise: 0,
        realTimeCoaching: true,
        exercises: [
          {
            id: 'neutral-spine',
            name: 'Neutral Spine Position',
            description: 'Find and maintain optimal spinal alignment',
            targetMetrics: {
              alignment: 90, // degrees - neutral spine
              duration: 30, // hold for 30 seconds
            },
            instructions: [
              'Stand with feet hip-width apart',
              'Imagine a string pulling from the top of your head',
              'Lengthen your neck and lift your chest',
              'Engage your core gently',
              'Maintain natural curves in your spine',
            ],
            commonMistakes: [
              'Tilting head too far forward or back',
              'Lifting chest too high (military posture)',
              'Holding breath instead of breathing naturally',
              'Tensing shoulders',
            ],
            modifications: {
              easier: [
                'Perform against a wall for support',
                'Hold for shorter duration (15 seconds)',
              ],
              harder: [
                'Close eyes to challenge proprioception',
                'Add gentle head movements',
              ],
            },
            feedback: {
              currentScore: 0,
              alignment: {
                head: 'good',
                shoulders: 'aligned',
                spine: 'neutral',
                pelvis: 'neutral',
              },
              balance: { stability: 85, sway: 12, weightDistribution: 90 },
              movement: {
                smoothness: 80,
                range: 85,
                speed: 'good',
                compensation: [],
              },
              encouragement:
                'Great start! Focus on lengthening through the crown of your head.',
              corrections: [],
            },
            completed: false,
            attempts: 0,
            bestScore: 0,
          },
          {
            id: 'chin-tuck-hold',
            name: 'Chin Tuck Hold',
            description:
              'Strengthen deep neck flexors to counteract forward head posture',
            targetMetrics: {
              alignment: 95, // near-perfect chin tuck
              duration: 20, // hold for 20 seconds
              repetitions: 3,
            },
            instructions: [
              'Start in neutral spine position',
              'Gently draw your chin back and down',
              'Create a slight double chin appearance',
              'Keep your eyes looking straight ahead',
              'Hold the position while breathing normally',
            ],
            commonMistakes: [
              'Tilting head down instead of drawing chin back',
              'Creating too much tension in the neck',
              'Holding breath during the exercise',
              'Moving too quickly into position',
            ],
            modifications: {
              easier: [
                'Use finger to guide chin back',
                'Hold for 10 seconds instead',
              ],
              harder: ['Add resistance with hand', 'Perform with eyes closed'],
            },
            feedback: {
              currentScore: 0,
              alignment: {
                head: 'good',
                shoulders: 'aligned',
                spine: 'neutral',
                pelvis: 'neutral',
              },
              balance: { stability: 88, sway: 10, weightDistribution: 85 },
              movement: {
                smoothness: 75,
                range: 90,
                speed: 'good',
                compensation: [],
              },
              encouragement: "Excellent! You're activating the right muscles.",
              corrections: [],
            },
            completed: false,
            attempts: 0,
            bestScore: 0,
          },
          {
            id: 'shoulder-blade-squeeze',
            name: 'Shoulder Blade Squeeze',
            description:
              'Strengthen middle trapezius and rhomboids for better shoulder alignment',
            targetMetrics: {
              alignment: 85, // good shoulder blade retraction
              duration: 15, // hold squeeze
              repetitions: 5,
            },
            instructions: [
              'Stand in neutral spine position',
              'Keep arms at your sides, elbows bent 90°',
              'Squeeze shoulder blades together',
              'Avoid lifting shoulders toward ears',
              'Hold the squeeze while breathing',
            ],
            commonMistakes: [
              'Lifting shoulders up instead of back',
              'Using arms instead of shoulder blade muscles',
              'Squeezing too aggressively',
              'Arching the back',
            ],
            modifications: {
              easier: [
                'Perform seated with back support',
                'Use lighter squeeze',
              ],
              harder: ['Add resistance band', 'Hold for longer duration'],
            },
            feedback: {
              currentScore: 0,
              alignment: {
                head: 'good',
                shoulders: 'aligned',
                spine: 'neutral',
                pelvis: 'neutral',
              },
              balance: { stability: 90, sway: 8, weightDistribution: 88 },
              movement: {
                smoothness: 82,
                range: 88,
                speed: 'good',
                compensation: [],
              },
              encouragement:
                'Perfect! Feel those shoulder blade muscles working.',
              corrections: [],
            },
            completed: false,
            attempts: 0,
            bestScore: 0,
          },
        ],
      },
      {
        id: 'balance-challenge',
        type: 'balance',
        name: 'Balance & Stability Challenge',
        description:
          'Progressive balance training with LiDAR stability monitoring',
        difficulty: 'intermediate',
        duration: 20,
        progress: 0,
        currentExercise: 0,
        realTimeCoaching: true,
        exercises: [
          {
            id: 'single-leg-stand',
            name: 'Single Leg Standing',
            description: 'Test and improve static balance on one leg',
            targetMetrics: {
              balance: 80, // stability score
              duration: 30, // seconds per leg
            },
            instructions: [
              'Stand with feet together',
              'Lift one foot off the ground',
              'Keep hips level and standing leg straight',
              'Focus on a fixed point ahead',
              'Breathe normally and stay relaxed',
            ],
            commonMistakes: [
              'Holding onto something for support too early',
              'Tilting to one side',
              'Bending the standing leg excessively',
              'Tensing up instead of staying relaxed',
            ],
            modifications: {
              easier: [
                'Hold onto wall lightly',
                'Keep toe of lifted leg touching ground',
              ],
              harder: [
                'Close eyes',
                'Add head movements',
                'Stand on unstable surface',
              ],
            },
            feedback: {
              currentScore: 0,
              alignment: {
                head: 'good',
                shoulders: 'aligned',
                spine: 'neutral',
                pelvis: 'neutral',
              },
              balance: { stability: 75, sway: 15, weightDistribution: 85 },
              movement: {
                smoothness: 85,
                range: 80,
                speed: 'good',
                compensation: ['hip hiking'],
              },
              encouragement: 'Good balance! Try to keep your hips level.',
              corrections: ['Avoid leaning to the side'],
            },
            completed: false,
            attempts: 0,
            bestScore: 0,
          },
        ],
      },
    ],
    []
  );

  // Helper function to get alignment status
  const getAlignmentStatus = (
    quality: number,
    thresholds: [number, number]
  ) => {
    if (quality > thresholds[0]) return 'good';
    if (quality > thresholds[1]) return 'moderate';
    return 'poor';
  };

  // Helper functions for alignment mapping with proper return types
  const getHeadAlignment = useCallback(
    (status: string): 'good' | 'forward' | 'tilted' => {
      if (status === 'good') return 'good';
      if (status === 'moderate') return 'forward';
      return 'tilted';
    },
    []
  );

  const getShoulderAlignment = useCallback(
    (status: string): 'aligned' | 'rounded' | 'uneven' => {
      if (status === 'good') return 'aligned';
      if (status === 'moderate') return 'rounded';
      return 'uneven';
    },
    []
  );

  const getSpineAlignment = useCallback(
    (status: string): 'neutral' | 'flexed' | 'extended' => {
      if (status === 'good') return 'neutral';
      if (status === 'moderate') return 'flexed';
      return 'extended';
    },
    []
  );

  const getPelvisAlignment = useCallback(
    (status: string): 'tilted' | 'neutral' | 'rotated' => {
      if (status === 'good') return 'neutral';
      if (status === 'moderate') return 'tilted';
      return 'rotated';
    },
    []
  );

  // Helper function to determine movement speed
  const getMovementSpeed = useCallback((speedRandom: number) => {
    if (speedRandom > 0.7) return 'too-fast';
    if (speedRandom > 0.3) return 'good';
    return 'too-slow';
  }, []);

  // Helper function to get compensations
  const getCompensations = useCallback((compensationRandom: number) => {
    if (compensationRandom > 0.6) return ['hip hiking'];
    if (compensationRandom > 0.3) return ['shoulder elevation'];
    return [];
  }, []);

  // Generate real-time feedback
  const generateRealTimeFeedback = useCallback(
    (exercise: TrainingExercise): ExerciseFeedback => {
      // Simulate LiDAR analysis with realistic variations
      const baseScore = 70 + Math.random() * 25;
      const alignmentQuality = Math.random();
      const balanceQuality = Math.random();

      // Determine alignment statuses
      const headStatus = getAlignmentStatus(alignmentQuality, [0.7, 0.4]);
      const shoulderStatus = getAlignmentStatus(alignmentQuality, [0.6, 0.3]);
      const spineStatus = getAlignmentStatus(alignmentQuality, [0.5, 0.25]);
      const pelvisStatus = getAlignmentStatus(alignmentQuality, [0.6, 0.3]);

      // Map alignment statuses to specific terms
      const headValue = getHeadAlignment(headStatus);
      const shoulderValue = getShoulderAlignment(shoulderStatus);
      const spineValue = getSpineAlignment(spineStatus);
      const pelvisValue = getPelvisAlignment(pelvisStatus);

      // Determine speed and compensation
      const speedRandom = Math.random();
      const movementSpeed = getMovementSpeed(speedRandom);

      const compensationRandom = Math.random();
      const compensations = getCompensations(compensationRandom);

      const encouragements = [
        'Great work! Keep it up!',
        "You're doing excellent!",
        'Perfect form! Stay focused.',
        'Nice improvement! Feel the difference.',
        'Excellent balance! Hold that position.',
      ];

      // Determine corrections based on exercise feedback
      let corrections: string[] = [];
      if (exercise.feedback.alignment.head === 'forward') {
        corrections = ['Gently draw your chin back'];
      } else if (exercise.feedback.alignment.shoulders === 'rounded') {
        corrections = ['Squeeze shoulder blades together'];
      } else if (exercise.feedback.balance.stability < 70) {
        corrections = ['Engage your core for better stability'];
      }

      return {
        currentScore: Math.round(baseScore),
        alignment: {
          head: headValue,
          shoulders: shoulderValue,
          spine: spineValue,
          pelvis: pelvisValue,
        },
        balance: {
          stability: Math.round(60 + balanceQuality * 35),
          sway: Math.round(8 + (1 - balanceQuality) * 15),
          weightDistribution: Math.round(75 + balanceQuality * 20),
        },
        movement: {
          smoothness: Math.round(70 + Math.random() * 25),
          range: Math.round(80 + Math.random() * 15),
          speed: movementSpeed,
          compensation: compensations,
        },
        encouragement:
          encouragements[Math.floor(Math.random() * encouragements.length)],
        corrections,
      };
    },
    [
      getHeadAlignment,
      getShoulderAlignment,
      getSpineAlignment,
      getPelvisAlignment,
      getMovementSpeed,
      getCompensations,
    ]
  ); // Start training session
  const startTrainingSession = useCallback(
    (sessionId: string) => {
      const session = trainingLibrary.find((s) => s.id === sessionId);
      if (!session) return;

      const sessionCopy = {
        ...session,
        startTime: new Date(),
        progress: 0,
        currentExercise: 0,
        exercises: session.exercises.map((ex) => ({
          ...ex,
          completed: false,
          attempts: 0,
          bestScore: 0,
        })),
      };

      setCurrentSession(sessionCopy);
      setIsTraining(true);
      setRealTimeCoaching((prev) => ({
        ...prev,
        isActive: true,
        currentCue: "Let's begin! Stand in a comfortable position.",
      }));
    },
    [trainingLibrary]
  );

  // Complete training session
  const completeTrainingSession = useCallback(() => {
    if (!currentSession) return;

    const results: TrainingResults = {
      overallScore: Math.round(
        currentSession.exercises.reduce((sum, ex) => sum + ex.bestScore, 0) /
          currentSession.exercises.length
      ),
      exerciseScores: Object.fromEntries(
        currentSession.exercises.map((ex) => [ex.id, ex.bestScore])
      ),
      improvements: {
        posture: Math.round(5 + Math.random() * 15),
        balance: Math.round(3 + Math.random() * 12),
        flexibility: Math.round(2 + Math.random() * 8),
        strength: Math.round(4 + Math.random() * 10),
      },
      timeSpent: currentSession.duration,
      caloriesBurned: Math.round(currentSession.duration * 3.5), // approximate
      streakDays: 1, // This would be calculated from history
      achievements: [], // Would be determined based on performance
      nextRecommendations: [
        'Try the intermediate balance challenge',
        'Focus on core strengthening exercises',
        'Practice daily posture breaks',
      ],
    };

    const completedSession = {
      ...currentSession,
      completedAt: new Date(),
      progress: 100,
      results,
    };

    // Save to history
    setTrainingHistory((prev) =>
      JSON.stringify([
        completedSession,
        ...JSON.parse(prev || '[]').slice(0, 19),
      ])
    );

    // Check for achievements
    if (results.overallScore >= 90) {
      const newAchievement: Achievement = {
        id: `excellence-${Date.now()}`,
        title: 'Excellence in Training',
        description: 'Scored 90% or higher in a training session',
        icon: '🏆',
        unlockedAt: new Date(),
        rarity: 'epic',
      };
      setAchievements((prev) =>
        JSON.stringify([newAchievement, ...JSON.parse(prev || '[]')])
      );
    }

    setIsTraining(false);
    setRealTimeCoaching((prev) => ({ ...prev, isActive: false }));
    onSessionComplete?.(results);
  }, [currentSession, onSessionComplete, setTrainingHistory, setAchievements]);

  // Complete current exercise
  const completeExercise = useCallback(() => {
    if (!currentSession) return;

    const currentEx = currentSession.exercises[currentSession.currentExercise];
    const feedback = generateRealTimeFeedback(currentEx);

    // Update exercise
    currentEx.completed = true;
    currentEx.feedback = feedback;
    currentEx.bestScore = Math.max(currentEx.bestScore, feedback.currentScore);
    currentEx.attempts += 1;

    // Move to next exercise or complete session
    const nextExerciseIndex = currentSession.currentExercise + 1;
    if (nextExerciseIndex < currentSession.exercises.length) {
      const updatedSession = {
        ...currentSession,
        currentExercise: nextExerciseIndex,
        progress: (nextExerciseIndex / currentSession.exercises.length) * 100,
      };
      setCurrentSession(updatedSession);
      setRealTimeCoaching((prev) => ({
        ...prev,
        currentCue: `Great job! Moving to: ${currentSession.exercises[nextExerciseIndex].name}`,
        encouragements: [...prev.encouragements, feedback.encouragement],
      }));
    } else {
      // Session complete - call the completion function
      completeTrainingSession();
    }
  }, [currentSession, generateRealTimeFeedback, completeTrainingSession]);

  // Real-time coaching updates
  useEffect(() => {
    if (!isTraining || !realTimeAnalysis || !currentSession) return;

    const interval = setInterval(() => {
      const currentEx =
        currentSession.exercises[currentSession.currentExercise];
      if (currentEx && !currentEx.completed) {
        const feedback = generateRealTimeFeedback(currentEx);
        currentEx.feedback = feedback;

        // Update coaching cues
        let newCue = '';
        const corrections = feedback.corrections;

        if (corrections.length > 0) {
          newCue = corrections[0];
        } else if (feedback.currentScore > 85) {
          newCue = feedback.encouragement;
        } else {
          newCue = 'Keep focusing on your form';
        }

        setRealTimeCoaching((prev) => ({
          ...prev,
          currentCue: newCue,
          corrections: corrections,
        }));

        // Force re-render of current session
        setCurrentSession((prev) => (prev ? { ...prev } : null));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isTraining, realTimeAnalysis, currentSession, generateRealTimeFeedback]);

  // Helper functions
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAlignmentIcon = (status: string) => {
    switch (status) {
      case 'good':
      case 'aligned':
      case 'neutral':
        return '✅';
      case 'forward':
      case 'rounded':
      case 'flexed':
      case 'tilted':
        return '⚠️';
      default:
        return '❌';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            🎯 LiDAR Training Assistant
            <div className="flex items-center gap-2">
              <Badge variant={isTraining ? 'default' : 'secondary'}>
                {isTraining ? '🔴 Active' : '⚪ Ready'}
              </Badge>
              <Badge variant={realTimeAnalysis ? 'default' : 'secondary'}>
                {realTimeAnalysis ? '📡 Real-time' : '📊 Static'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {!isTraining ? (
        // Training Selection
        <Tabs defaultValue="sessions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sessions">🏋️ Sessions</TabsTrigger>
            <TabsTrigger value="programs">📋 Programs</TabsTrigger>
            <TabsTrigger value="progress">📈 Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-4">
            <div className="md:grid-cols-2 grid grid-cols-1 gap-4">
              {trainingLibrary.map((session) => (
                <Card
                  key={session.id}
                  className="transition-shadow hover:shadow-md"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{session.name}</CardTitle>
                      <Badge className={getDifficultyColor(session.difficulty)}>
                        {session.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3 text-sm">
                      {session.description}
                    </p>
                    <div className="mb-4 flex items-center justify-between text-sm">
                      <span>⏱️ {session.duration} min</span>
                      <span>💪 {session.exercises.length} exercises</span>
                      <span>🎯 {session.type}</span>
                    </div>
                    <Button
                      onClick={() => startTrainingSession(session.id)}
                      className="w-full"
                      variant="default"
                    >
                      Start Training
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="programs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🗓️ Training Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Training programs coming soon!
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Multi-week structured programs with progressive difficulty
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📊 Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Start your first training session to see progress!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // Active Training Session
        <div className="space-y-4">
          {/* Session Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {currentSession?.name}
                <Badge>{currentSession?.difficulty}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Session Progress</span>
                    <span>{Math.round(currentSession?.progress || 0)}%</span>
                  </div>
                  <Progress value={currentSession?.progress || 0} />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>
                    Exercise {(currentSession?.currentExercise || 0) + 1} of{' '}
                    {currentSession?.exercises.length}
                  </span>
                  <span>⏱️ {currentSession?.duration} min session</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Exercise */}
          {currentSession && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {
                    currentSession.exercises[currentSession.currentExercise]
                      ?.name
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Exercise Description */}
                  <p className="text-muted-foreground text-sm">
                    {
                      currentSession.exercises[currentSession.currentExercise]
                        ?.description
                    }
                  </p>

                  {/* Real-time Feedback */}
                  {realTimeCoaching.isActive && (
                    <div className="md:grid-cols-2 grid grid-cols-1 gap-4">
                      {/* Alignment Feedback */}
                      <Card className="bg-blue-50">
                        <CardContent className="pt-4">
                          <h4 className="mb-2 font-medium">🧘 Alignment</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center justify-between">
                              <span>Head:</span>
                              <span>
                                {getAlignmentIcon(
                                  currentSession.exercises[
                                    currentSession.currentExercise
                                  ]?.feedback.alignment.head
                                )}{' '}
                                {
                                  currentSession.exercises[
                                    currentSession.currentExercise
                                  ]?.feedback.alignment.head
                                }
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Shoulders:</span>
                              <span>
                                {getAlignmentIcon(
                                  currentSession.exercises[
                                    currentSession.currentExercise
                                  ]?.feedback.alignment.shoulders
                                )}{' '}
                                {
                                  currentSession.exercises[
                                    currentSession.currentExercise
                                  ]?.feedback.alignment.shoulders
                                }
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Spine:</span>
                              <span>
                                {getAlignmentIcon(
                                  currentSession.exercises[
                                    currentSession.currentExercise
                                  ]?.feedback.alignment.spine
                                )}{' '}
                                {
                                  currentSession.exercises[
                                    currentSession.currentExercise
                                  ]?.feedback.alignment.spine
                                }
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Performance Score */}
                      <Card className="bg-green-50">
                        <CardContent className="pt-4">
                          <h4 className="mb-2 font-medium">📊 Performance</h4>
                          <div className="text-center">
                            <div
                              className={`text-2xl font-bold ${getScoreColor(currentSession.exercises[currentSession.currentExercise]?.feedback.currentScore || 0)}`}
                            >
                              {currentSession.exercises[
                                currentSession.currentExercise
                              ]?.feedback.currentScore || 0}
                              %
                            </div>
                            <div className="text-muted-foreground text-sm">
                              Current Score
                            </div>
                            <Progress
                              value={
                                currentSession.exercises[
                                  currentSession.currentExercise
                                ]?.feedback.currentScore || 0
                              }
                              className="mt-2"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Live Coaching */}
                  {realTimeCoaching.currentCue && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertDescription className="text-blue-800">
                        🎯 **Coach:** {realTimeCoaching.currentCue}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Exercise Instructions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        📋 Instructions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-1 text-sm">
                        {currentSession.exercises[
                          currentSession.currentExercise
                        ]?.instructions.map((instruction, index) => (
                          <li
                            key={instruction}
                            className="flex items-start gap-2"
                          >
                            <span className="text-blue-500 font-medium">
                              {index + 1}.
                            </span>
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button onClick={completeExercise} className="flex-1">
                      ✅ Complete Exercise
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsTraining(false)}
                    >
                      ⏸️ Pause
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Achievement Toast (would be implemented with a toast system) */}
      {achievements && JSON.parse(achievements).length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-medium">New Achievement Unlocked!</p>
                <p className="text-muted-foreground text-sm">
                  {JSON.parse(achievements)[0]?.title}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
