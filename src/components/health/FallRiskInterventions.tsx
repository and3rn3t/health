/**
 * Fall Risk Intervention and Prevention Component
 * Provides personalized interventions based on fall risk assessment
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@github/spark/hooks';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle,
  Dumbbell,
  Heart,
  Home,
  Phone,
  Play,
  Shield,
  Target,
  Trophy,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Intervention {
  id: string;
  category: 'exercise' | 'home_safety' | 'medical' | 'lifestyle' | 'technology';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  difficulty: 'easy' | 'moderate' | 'challenging';
  timeCommitment: string;
  frequency: string;
  instructions: string[];
  benefits: string[];
  precautions: string[];
  completed: boolean;
  completedDate?: Date;
  progress: number; // 0-100
}

interface ExerciseProgram {
  id: string;
  name: string;
  type: 'balance' | 'strength' | 'flexibility' | 'cardiovascular';
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: Exercise[];
  weeklyFrequency: number;
  totalWeeks: number;
  currentWeek: number;
}

interface Exercise {
  name: string;
  description: string;
  sets: number;
  reps: number;
  duration?: number; // seconds
  restTime: number; // seconds
  instructions: string[];
  modifications: string[];
  safety: string[];
}

interface ProgressTracking {
  interventionId: string;
  completedSessions: number;
  totalSessions: number;
  lastCompletedDate: Date;
  adherenceRate: number;
  notes: string[];
}

function InterventionCard({
  intervention,
  onToggleComplete,
  onViewDetails,
}: {
  intervention: Intervention;
  onToggleComplete: (id: string) => void;
  onViewDetails: (intervention: Intervention) => void;
}) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Target className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'exercise':
        return <Dumbbell className="h-5 w-5" />;
      case 'home_safety':
        return <Home className="h-5 w-5" />;
      case 'medical':
        return <Heart className="h-5 w-5" />;
      case 'lifestyle':
        return <Brain className="h-5 w-5" />;
      case 'technology':
        return <Phone className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  return (
    <Card
      className={`transition-all duration-200 ${getPriorityColor(intervention.priority)} ${
        intervention.completed ? 'opacity-75' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon(intervention.category)}
            <div>
              <CardTitle
                className={`text-lg ${intervention.completed ? 'line-through' : ''}`}
              >
                {intervention.title}
              </CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {intervention.category.replace('_', ' ')}
                </Badge>
                <Badge
                  variant={
                    intervention.priority === 'urgent'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="text-xs"
                >
                  {getPriorityIcon(intervention.priority)}
                  {intervention.priority}
                </Badge>
              </div>
            </div>
          </div>
          <Checkbox
            checked={intervention.completed}
            onCheckedChange={() => onToggleComplete(intervention.id)}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          {intervention.description}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Progress</span>
            <span>{intervention.progress}%</span>
          </div>
          <Progress value={intervention.progress} className="h-2" />
        </div>

        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>Difficulty: {intervention.difficulty}</span>
          <span>{intervention.timeCommitment}</span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(intervention)}
            className="flex-1"
          >
            <BookOpen className="mr-1 h-3 w-3" />
            View Details
          </Button>
          {intervention.category === 'exercise' && (
            <Button size="sm" className="flex-1">
              <Play className="mr-1 h-3 w-3" />
              Start Session
            </Button>
          )}
        </div>

        {intervention.completed && intervention.completedDate && (
          <div className="flex items-center gap-2 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            Completed on {intervention.completedDate.toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExerciseProgramCard({ program }: { program: ExerciseProgram }) {
  const progressPercentage = (program.currentWeek / program.totalWeeks) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              {program.name}
            </CardTitle>
            <CardDescription>
              {program.type} • {program.duration} min •{' '}
              {program.weeklyFrequency}x/week
            </CardDescription>
          </div>
          <Badge
            variant={
              program.difficulty === 'beginner' ? 'default' : 'secondary'
            }
          >
            {program.difficulty}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              Week {program.currentWeek} of {program.totalWeeks}
            </span>
            <span>{progressPercentage.toFixed(0)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">This Week's Exercises:</h4>
          <div className="space-y-1">
            {program.exercises.slice(0, 3).map((exercise, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs"
              >
                <span>{exercise.name}</span>
                <span>
                  {exercise.sets}x{exercise.reps}
                </span>
              </div>
            ))}
            {program.exercises.length > 3 && (
              <p className="text-muted-foreground text-xs">
                +{program.exercises.length - 3} more exercises
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <Play className="mr-1 h-3 w-3" />
            Start Workout
          </Button>
          <Button variant="outline" size="sm">
            <Video className="mr-1 h-3 w-3" />
            Watch Demo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function InterventionDetailsDialog({
  intervention,
  isOpen,
  onClose,
}: {
  intervention: Intervention | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!intervention) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {intervention.category === 'exercise' && (
              <Dumbbell className="h-5 w-5" />
            )}
            {intervention.category === 'home_safety' && (
              <Home className="h-5 w-5" />
            )}
            {intervention.category === 'medical' && (
              <Heart className="h-5 w-5" />
            )}
            {intervention.category === 'lifestyle' && (
              <Brain className="h-5 w-5" />
            )}
            {intervention.category === 'technology' && (
              <Phone className="h-5 w-5" />
            )}
            {intervention.title}
          </DialogTitle>
          <DialogDescription>{intervention.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <div>
            <h3 className="mb-3 font-semibold">Step-by-Step Instructions</h3>
            <ol className="space-y-2">
              {intervention.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-800">
                    {index + 1}
                  </span>
                  <span className="text-sm">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="mb-3 font-semibold">Expected Benefits</h3>
            <ul className="space-y-1">
              {intervention.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Precautions */}
          {intervention.precautions.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold">Safety Precautions</h3>
              <ul className="space-y-1">
                {intervention.precautions.map((precaution, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-500" />
                    {precaution}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Schedule */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Recommended Schedule</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Frequency:</span>
                <p className="font-medium">{intervention.frequency}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Time Commitment:</span>
                <p className="font-medium">{intervention.timeCommitment}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FallRiskInterventions() {
  const [interventions, setInterventions] = useKV(
    'fall-interventions',
    [] as Intervention[]
  );
  const [exercisePrograms, setExercisePrograms] = useKV(
    'exercise-programs',
    [] as ExerciseProgram[]
  );
  const [selectedIntervention, setSelectedIntervention] =
    useState<Intervention | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('interventions');

  // Initialize with default interventions if empty
  useEffect(() => {
    if (interventions.length === 0) {
      const defaultInterventions: Intervention[] = [
        {
          id: '1',
          category: 'exercise',
          title: 'Daily Balance Training',
          description:
            'Stand on one foot, walk heel-to-toe, and practice weight shifts to improve balance',
          priority: 'high',
          difficulty: 'easy',
          timeCommitment: '10-15 minutes',
          frequency: 'Daily',
          instructions: [
            'Find a stable surface near a wall or chair for support',
            'Stand on one foot for 30 seconds, then switch feet',
            'Walk in a straight line placing heel directly in front of toes',
            'Practice shifting weight from side to side while standing',
            'Hold each position for 10-30 seconds depending on ability',
          ],
          benefits: [
            'Improves static and dynamic balance',
            'Strengthens core and leg muscles',
            'Enhances proprioception and body awareness',
            'Reduces fall risk by up to 25%',
          ],
          precautions: [
            'Always have a stable surface nearby for support',
            'Stop if you feel dizzy or unsteady',
            'Start with shorter durations and gradually increase',
          ],
          completed: false,
          progress: 35,
        },
        {
          id: '2',
          category: 'home_safety',
          title: 'Remove Trip Hazards',
          description:
            'Identify and eliminate common household items that increase fall risk',
          priority: 'urgent',
          difficulty: 'easy',
          timeCommitment: '2-3 hours',
          frequency: 'One-time setup, monthly review',
          instructions: [
            'Remove loose rugs or secure them with non-slip backing',
            'Clear walkways of electrical cords, books, and clutter',
            'Install grab bars in bathroom near toilet and shower',
            'Ensure adequate lighting in all areas, especially stairs',
            'Check that handrails are secure and at appropriate height',
          ],
          benefits: [
            'Reduces environmental fall hazards',
            'Creates safer living environment',
            'Prevents 30-40% of home-related falls',
            'Improves confidence in home mobility',
          ],
          precautions: [
            'Have someone help with installations if needed',
            'Use proper tools and hardware for mounting',
            'Test all installations before relying on them',
          ],
          completed: false,
          progress: 0,
        },
        {
          id: '3',
          category: 'medical',
          title: 'Medication Review',
          description:
            'Schedule appointment to review medications that may affect balance',
          priority: 'high',
          difficulty: 'easy',
          timeCommitment: '1 hour appointment',
          frequency: 'Every 6 months',
          instructions: [
            'Gather all current medications including over-the-counter',
            'Schedule appointment with primary care physician',
            'Discuss any dizziness, drowsiness, or balance issues',
            'Ask about medication timing and potential interactions',
            'Request written summary of any changes made',
          ],
          benefits: [
            'Identifies medications that increase fall risk',
            'Optimizes medication timing and dosage',
            'Reduces side effects affecting balance',
            'Improves overall medication management',
          ],
          precautions: [
            'Never stop medications without physician approval',
            'Bring complete list of all supplements and medications',
            'Report any new symptoms or concerns',
          ],
          completed: false,
          progress: 0,
        },
        {
          id: '4',
          category: 'lifestyle',
          title: 'Vision and Hearing Assessment',
          description:
            'Annual check-ups to ensure optimal sensory function for balance',
          priority: 'medium',
          difficulty: 'easy',
          timeCommitment: '1-2 hours',
          frequency: 'Annually',
          instructions: [
            'Schedule comprehensive eye exam with optometrist',
            'Get hearing test with audiologist if needed',
            'Update eyeglass prescription if necessary',
            'Discuss any vision changes or concerns',
            'Consider contrast and depth perception evaluation',
          ],
          benefits: [
            'Ensures optimal vision for navigation',
            'Identifies hearing issues that affect balance',
            'Updates corrective lenses as needed',
            'Detects age-related sensory changes',
          ],
          precautions: [
            'Inform providers about fall risk concerns',
            'Ask about impact of conditions on balance',
            'Follow up on any recommended treatments',
          ],
          completed: false,
          progress: 0,
        },
      ];
      setInterventions(defaultInterventions);
    }
  }, [interventions.length, setInterventions]);

  // Initialize exercise programs
  useEffect(() => {
    if (exercisePrograms.length === 0) {
      const defaultPrograms: ExerciseProgram[] = [
        {
          id: '1',
          name: 'Fall Prevention Basics',
          type: 'balance',
          duration: 15,
          difficulty: 'beginner',
          weeklyFrequency: 3,
          totalWeeks: 8,
          currentWeek: 2,
          exercises: [
            {
              name: 'Single Leg Stand',
              description: 'Stand on one foot with support nearby',
              sets: 2,
              reps: 1,
              duration: 30,
              restTime: 30,
              instructions: [
                'Hold onto chair',
                'Lift one foot',
                'Hold for 30 seconds',
              ],
              modifications: [
                'Use both hands for support',
                'Reduce time to 15 seconds',
              ],
              safety: ['Keep chair within reach', 'Stop if dizzy'],
            },
            {
              name: 'Heel-to-Toe Walk',
              description:
                'Walk in straight line placing heel in front of toes',
              sets: 2,
              reps: 10,
              restTime: 60,
              instructions: [
                'Walk slowly',
                'Place heel directly in front of toes',
                'Look ahead',
              ],
              modifications: ['Walk beside wall for support', 'Reduce steps'],
              safety: ['Clear path ahead', 'Have support available'],
            },
          ],
        },
      ];
      setExercisePrograms(defaultPrograms);
    }
  }, [exercisePrograms.length, setExercisePrograms]);

  const handleToggleComplete = (interventionId: string) => {
    setInterventions((prev) =>
      prev.map((intervention) =>
        intervention.id === interventionId
          ? {
              ...intervention,
              completed: !intervention.completed,
              completedDate: !intervention.completed ? new Date() : undefined,
              progress: !intervention.completed ? 100 : intervention.progress,
            }
          : intervention
      )
    );

    const intervention = interventions.find((i) => i.id === interventionId);
    if (intervention) {
      toast.success(
        intervention.completed
          ? `Marked "${intervention.title}" as incomplete`
          : `Completed "${intervention.title}"!`
      );
    }
  };

  const handleViewDetails = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setDetailsDialogOpen(true);
  };

  const completedCount = interventions.filter((i) => i.completed).length;
  const completionRate =
    interventions.length > 0
      ? (completedCount / interventions.length) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold">
            <Shield className="h-7 w-7" />
            Fall Risk Interventions
          </h2>
          <p className="text-muted-foreground">
            Personalized recommendations to reduce your fall risk
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">
            {completedCount}/{interventions.length}
          </p>
          <p className="text-muted-foreground text-sm">Completed</p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your Progress
          </CardTitle>
          <CardDescription>Track your fall prevention journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Overall Completion</span>
              <span>{completionRate.toFixed(0)}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />

            <div className="grid grid-cols-2 gap-4 pt-4 md:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {completedCount}
                </p>
                <p className="text-muted-foreground text-xs">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {
                    interventions.filter(
                      (i) => i.priority === 'high' || i.priority === 'urgent'
                    ).length
                  }
                </p>
                <p className="text-muted-foreground text-xs">High Priority</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {Math.round(
                    interventions.reduce((sum, i) => sum + i.progress, 0) /
                      interventions.length
                  ) || 0}
                  %
                </p>
                <p className="text-muted-foreground text-xs">Avg Progress</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {exercisePrograms.reduce((sum, p) => sum + p.currentWeek, 0)}
                </p>
                <p className="text-muted-foreground text-xs">Exercise Weeks</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="exercises">Exercise Programs</TabsTrigger>
        </TabsList>

        <TabsContent value="interventions" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {interventions.map((intervention) => (
              <InterventionCard
                key={intervention.id}
                intervention={intervention}
                onToggleComplete={handleToggleComplete}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exercises" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {exercisePrograms.map((program) => (
              <ExerciseProgramCard key={program.id} program={program} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <InterventionDetailsDialog
        intervention={selectedIntervention}
        isOpen={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
      />
    </div>
  );
}
