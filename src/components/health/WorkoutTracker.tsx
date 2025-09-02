import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Activity,
  Calendar,
  Clock,
  Heart,
  Plus,
  Target,
  Timer,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface Workout {
  id: string;
  type: string;
  duration: number; // in minutes
  intensity: 'low' | 'moderate' | 'high';
  date: string;
  calories?: number;
  notes?: string;
}

export function WorkoutTracker() {
  const [workouts] = useState<Workout[]>([
    {
      id: '1',
      type: 'Running',
      duration: 30,
      intensity: 'moderate',
      date: '2024-12-01',
      calories: 285,
      notes: 'Morning jog around the park',
    },
    {
      id: '2',
      type: 'Strength Training',
      duration: 45,
      intensity: 'high',
      date: '2024-11-30',
      calories: 320,
      notes: 'Upper body focus',
    },
    {
      id: '3',
      type: 'Yoga',
      duration: 60,
      intensity: 'low',
      date: '2024-11-29',
      calories: 180,
      notes: 'Evening relaxation session',
    },
    {
      id: '4',
      type: 'Cycling',
      duration: 40,
      intensity: 'moderate',
      date: '2024-11-28',
      calories: 250,
    },
  ]);

  const thisWeekWorkouts = workouts.length;
  const thisWeekMinutes = workouts.reduce(
    (total, workout) => total + workout.duration,
    0
  );
  const thisWeekCalories = workouts.reduce(
    (total, workout) => total + (workout.calories || 0),
    0
  );

  const getIntensityColor = (intensity: Workout['intensity']) => {
    switch (intensity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkoutIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('run')) return Activity;
    if (lowerType.includes('strength') || lowerType.includes('weight'))
      return Zap;
    if (lowerType.includes('yoga') || lowerType.includes('stretch'))
      return Heart;
    if (lowerType.includes('cycle') || lowerType.includes('bike'))
      return Activity;
    return Activity;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workout Tracker</h1>
        <p className="text-muted-foreground mt-2">
          Track your fitness activities and monitor your progress towards health
          goals.
        </p>
      </div>

      {/* Weekly Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-vitalsense-primary" />
              <div className="text-2xl font-bold">{thisWeekWorkouts}</div>
              <div className="text-muted-foreground text-sm">workouts</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-vitalsense-primary" />
              <div className="text-2xl font-bold">{thisWeekMinutes}</div>
              <div className="text-muted-foreground text-sm">minutes</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Calories Burned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-vitalsense-primary" />
              <div className="text-2xl font-bold">{thisWeekCalories}</div>
              <div className="text-muted-foreground text-sm">kcal</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workouts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Workouts</h2>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log Workout
          </Button>
        </div>

        {workouts.map((workout) => {
          const IconComponent = getWorkoutIcon(workout.type);
          return (
            <Card key={workout.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-vitalsense-primary/10 rounded-lg p-2 text-vitalsense-primary">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{workout.type}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {workout.date}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getIntensityColor(workout.intensity)}>
                    {workout.intensity} intensity
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Clock className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-sm">
                      Duration:
                    </span>
                    <span className="font-medium">{workout.duration} min</span>
                  </div>

                  {workout.calories && (
                    <div className="flex items-center gap-2">
                      <Zap className="text-muted-foreground h-4 w-4" />
                      <span className="text-muted-foreground text-sm">
                        Calories:
                      </span>
                      <span className="font-medium">
                        {workout.calories} kcal
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Heart className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-sm">
                      Intensity:
                    </span>
                    <span className="font-medium capitalize">
                      {workout.intensity}
                    </span>
                  </div>
                </div>

                {workout.notes && (
                  <div className="bg-muted/50 mt-4 rounded-lg p-3">
                    <p className="text-muted-foreground text-sm">
                      {workout.notes}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    Repeat Workout
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-vitalsense-primary" />
            Quick Start
          </CardTitle>
          <CardDescription>
            Start a new workout or access common activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {['Running', 'Strength Training', 'Yoga', 'Cycling'].map((type) => {
              const IconComponent = getWorkoutIcon(type);
              return (
                <Button
                  key={type}
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4"
                >
                  <IconComponent className="h-6 w-6" />
                  <span className="text-sm">{type}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WorkoutTracker;
