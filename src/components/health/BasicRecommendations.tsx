import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@/hooks/useCloudflareKV';
import { ProcessedHealthData } from '@/types';
import {
  Activity,
  BookOpen,
  CheckCircle,
  Clock,
  Heart,
  Lightbulb,
  Shield,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface BasicRecommendation {
  id: string;
  category:
    | 'general'
    | 'exercise'
    | 'nutrition'
    | 'sleep'
    | 'medical'
    | 'lifestyle';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'moderate' | 'challenging';
  timeframe: string;
  completed?: boolean;
  source: 'vitalsense' | 'health-guidelines' | 'expert-tips';
  tips: string[];
}

interface BasicRecommendationsProps {
  healthData?: ProcessedHealthData;
}

export const BasicRecommendations: React.FC<BasicRecommendationsProps> = ({
  healthData: _healthData,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('general');
  const [completedItems, setCompletedItems] = useKV<string[]>(
    'basic-recommendations-completed',
    []
  );

  // Static recommendations database
  const baseRecommendations: BasicRecommendation[] = [
    // General Health
    {
      id: 'general-hydration',
      category: 'general',
      title: 'Stay Hydrated Throughout the Day',
      description:
        'Maintain proper hydration for optimal body function and energy levels.',
      priority: 'high',
      difficulty: 'easy',
      timeframe: 'Daily',
      source: 'health-guidelines',
      tips: [
        'Drink a glass of water when you wake up',
        'Keep a water bottle with you throughout the day',
        'Aim for 8 glasses of water daily',
        'Monitor urine color as a hydration indicator',
      ],
    },
    {
      id: 'general-posture',
      category: 'general',
      title: 'Maintain Good Posture',
      description:
        'Proper posture reduces strain on your spine and improves overall health.',
      priority: 'medium',
      difficulty: 'moderate',
      timeframe: 'Ongoing',
      source: 'expert-tips',
      tips: [
        'Keep your shoulders back and relaxed',
        'Align your ears over your shoulders',
        'Take posture breaks every 30 minutes',
        'Strengthen your core muscles',
      ],
    },
    {
      id: 'general-mindfulness',
      category: 'general',
      title: 'Practice Daily Mindfulness',
      description:
        'Regular mindfulness practice can reduce stress and improve mental clarity.',
      priority: 'medium',
      difficulty: 'easy',
      timeframe: '5-10 minutes daily',
      source: 'vitalsense',
      tips: [
        'Start with 5 minutes of deep breathing',
        'Use guided meditation apps',
        'Practice gratitude journaling',
        'Take mindful walks in nature',
      ],
    },

    // Exercise
    {
      id: 'exercise-walking',
      category: 'exercise',
      title: 'Take a 30-Minute Daily Walk',
      description: 'Regular walking improves cardiovascular health and mood.',
      priority: 'high',
      difficulty: 'easy',
      timeframe: 'Daily',
      source: 'health-guidelines',
      tips: [
        "Start with 10 minutes if you're new to exercise",
        'Walk at a brisk pace',
        'Choose scenic routes to stay motivated',
        'Walk with friends or family for accountability',
      ],
    },
    {
      id: 'exercise-strength',
      category: 'exercise',
      title: 'Incorporate Basic Strength Training',
      description:
        'Strength training helps maintain muscle mass and bone density.',
      priority: 'medium',
      difficulty: 'moderate',
      timeframe: '2-3 times per week',
      source: 'expert-tips',
      tips: [
        'Start with bodyweight exercises',
        'Focus on major muscle groups',
        'Allow rest days between sessions',
        'Gradually increase intensity',
      ],
    },
    {
      id: 'exercise-balance',
      category: 'exercise',
      title: 'Practice Balance Exercises',
      description:
        'Balance training helps prevent falls and improves stability.',
      priority: 'medium',
      difficulty: 'easy',
      timeframe: '10 minutes, 3x per week',
      source: 'vitalsense',
      tips: [
        'Try standing on one foot',
        'Practice heel-to-toe walking',
        'Use yoga poses like tree pose',
        'Hold onto a chair for support initially',
      ],
    },

    // Nutrition
    {
      id: 'nutrition-vegetables',
      category: 'nutrition',
      title: 'Eat 5 Servings of Fruits and Vegetables',
      description:
        'Increase your daily intake of nutrient-rich fruits and vegetables.',
      priority: 'high',
      difficulty: 'easy',
      timeframe: 'Daily',
      source: 'health-guidelines',
      tips: [
        'Add fruits to your breakfast',
        'Include vegetables in every meal',
        'Try new colorful vegetables each week',
        'Prepare healthy snacks in advance',
      ],
    },
    {
      id: 'nutrition-fiber',
      category: 'nutrition',
      title: 'Increase Fiber Intake',
      description:
        'Adequate fiber supports digestive health and helps maintain stable blood sugar.',
      priority: 'medium',
      difficulty: 'easy',
      timeframe: 'Daily',
      source: 'expert-tips',
      tips: [
        'Choose whole grain bread and pasta',
        'Add beans and legumes to meals',
        'Eat fruits with the skin on',
        'Include nuts and seeds in your diet',
      ],
    },
    {
      id: 'nutrition-portions',
      category: 'nutrition',
      title: 'Practice Portion Control',
      description:
        'Proper portion sizes help maintain a healthy weight and energy levels.',
      priority: 'medium',
      difficulty: 'moderate',
      timeframe: 'Every meal',
      source: 'vitalsense',
      tips: [
        'Use smaller plates and bowls',
        'Fill half your plate with vegetables',
        'Eat slowly and mindfully',
        'Stop eating when 80% full',
      ],
    },

    // Sleep
    {
      id: 'sleep-schedule',
      category: 'sleep',
      title: 'Maintain a Consistent Sleep Schedule',
      description:
        "Regular sleep times help regulate your body's internal clock.",
      priority: 'high',
      difficulty: 'moderate',
      timeframe: 'Daily',
      source: 'health-guidelines',
      tips: [
        'Go to bed at the same time every night',
        'Wake up at the same time every morning',
        'Avoid sleeping in on weekends',
        'Create a relaxing bedtime routine',
      ],
    },
    {
      id: 'sleep-environment',
      category: 'sleep',
      title: 'Optimize Your Sleep Environment',
      description:
        'A comfortable sleep environment promotes better quality rest.',
      priority: 'medium',
      difficulty: 'easy',
      timeframe: 'One-time setup',
      source: 'expert-tips',
      tips: [
        'Keep your bedroom cool (60-67°F)',
        'Use blackout curtains or eye mask',
        'Minimize noise with earplugs or white noise',
        'Ensure your mattress and pillows are comfortable',
      ],
    },
    {
      id: 'sleep-screens',
      category: 'sleep',
      title: 'Limit Screen Time Before Bed',
      description:
        'Reducing blue light exposure helps your body prepare for sleep.',
      priority: 'medium',
      difficulty: 'moderate',
      timeframe: '1 hour before bed',
      source: 'vitalsense',
      tips: [
        'Stop using devices 1 hour before bed',
        'Use blue light filters on devices',
        'Read a book instead of scrolling',
        'Try relaxation techniques before sleep',
      ],
    },

    // Medical
    {
      id: 'medical-checkups',
      category: 'medical',
      title: 'Schedule Regular Health Checkups',
      description:
        'Preventive care helps catch health issues early and maintain wellness.',
      priority: 'high',
      difficulty: 'easy',
      timeframe: 'Annually',
      source: 'health-guidelines',
      tips: [
        'Schedule annual physical exams',
        'Keep up with recommended screenings',
        'Discuss health concerns with your doctor',
        'Maintain a health record journal',
      ],
    },
    {
      id: 'medical-medications',
      category: 'medical',
      title: 'Take Medications as Prescribed',
      description:
        'Proper medication adherence is crucial for managing health conditions.',
      priority: 'high',
      difficulty: 'easy',
      timeframe: 'As prescribed',
      source: 'expert-tips',
      tips: [
        'Set medication reminders',
        'Use a pill organizer',
        'Never skip doses without consulting your doctor',
        'Keep a list of all medications',
      ],
    },

    // Lifestyle
    {
      id: 'lifestyle-social',
      category: 'lifestyle',
      title: 'Maintain Social Connections',
      description:
        'Strong social relationships contribute to mental and physical health.',
      priority: 'medium',
      difficulty: 'easy',
      timeframe: 'Weekly',
      source: 'vitalsense',
      tips: [
        'Schedule regular calls with friends',
        'Join community groups or clubs',
        'Volunteer for causes you care about',
        'Practice active listening in conversations',
      ],
    },
    {
      id: 'lifestyle-stress',
      category: 'lifestyle',
      title: 'Develop Healthy Stress Management',
      description:
        'Effective stress management improves overall health and wellbeing.',
      priority: 'high',
      difficulty: 'moderate',
      timeframe: 'Daily practice',
      source: 'expert-tips',
      tips: [
        'Identify your stress triggers',
        'Practice deep breathing exercises',
        'Engage in hobbies you enjoy',
        "Don't hesitate to seek professional help",
      ],
    },
  ];

  // Mark recommendations as completed
  const recommendations = baseRecommendations.map((rec) => ({
    ...rec,
    completed: completedItems?.includes(rec.id) || false,
  }));

  const toggleCompletion = (id: string) => {
    const newCompleted = completedItems?.includes(id)
      ? completedItems.filter((itemId) => itemId !== id)
      : [...(completedItems || []), id];

    setCompletedItems(newCompleted);
  };

  // Filter recommendations
  const filteredRecommendations = recommendations.filter((rec) => {
    if (activeCategory === 'completed') return rec.completed;
    if (activeCategory === 'active') return !rec.completed;
    if (activeCategory === 'general')
      return rec.category === 'general' || activeCategory === 'general';
    return rec.category === activeCategory;
  });

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'exercise':
        return Activity;
      case 'nutrition':
        return Heart;
      case 'sleep':
        return Clock;
      case 'medical':
        return Shield;
      case 'lifestyle':
        return Users;
      case 'general':
        return BookOpen;
      default:
        return Lightbulb;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get source icon
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'vitalsense':
        return Zap;
      case 'health-guidelines':
        return Shield;
      case 'expert-tips':
        return Target;
      default:
        return BookOpen;
    }
  };

  // Statistics
  const totalRecommendations = recommendations.length;
  const completedCount = recommendations.filter((r) => r.completed).length;
  const completionRate =
    totalRecommendations > 0
      ? (completedCount / totalRecommendations) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <BookOpen className="text-primary h-6 w-6" />
            Health Recommendations
          </h2>
          <p className="text-muted-foreground">
            Evidence-based health guidance from trusted sources
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <BookOpen className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRecommendations}</p>
                <p className="text-muted-foreground text-sm">
                  Total Recommendations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-muted-foreground text-sm">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {completionRate.toFixed(0)}%
                </p>
                <p className="text-muted-foreground text-sm">Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {
                    recommendations.filter(
                      (r) => r.priority === 'high' && !r.completed
                    ).length
                  }
                </p>
                <p className="text-muted-foreground text-sm">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations List */}
      <Card>
        <CardHeader>
          <CardTitle>Browse Recommendations</CardTitle>
          <CardDescription>
            Curated health advice from medical guidelines and expert sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-8">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="exercise">Exercise</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
              <TabsTrigger value="sleep">Sleep</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
            </TabsList>

            <TabsContent value={activeCategory} className="mt-6">
              {filteredRecommendations.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <h3 className="mb-2 text-lg font-semibold">
                    No recommendations in this category
                  </h3>
                  <p className="text-muted-foreground">
                    Try browsing other categories or check back later for new
                    recommendations.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecommendations
                    .sort((a, b) => {
                      const priorityOrder = { high: 3, medium: 2, low: 1 };
                      return (
                        priorityOrder[b.priority] - priorityOrder[a.priority]
                      );
                    })
                    .map((recommendation) => {
                      const CategoryIcon = getCategoryIcon(
                        recommendation.category
                      );
                      const SourceIcon = getSourceIcon(recommendation.source);

                      return (
                        <Card
                          key={recommendation.id}
                          className={`transition-all ${
                            recommendation.completed
                              ? 'bg-green-50/50 opacity-75'
                              : ''
                          }`}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="mb-2 flex items-center gap-3">
                                  <CategoryIcon className="text-primary h-5 w-5" />
                                  <Badge
                                    variant="outline"
                                    className={getPriorityColor(
                                      recommendation.priority
                                    )}
                                  >
                                    {recommendation.priority.toUpperCase()}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {recommendation.difficulty}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <SourceIcon className="h-3 w-3" />
                                    {recommendation.source.replace('-', ' ')}
                                  </Badge>
                                  {recommendation.completed && (
                                    <Badge className="bg-green-100 text-green-800">
                                      ✓ Completed
                                    </Badge>
                                  )}
                                </div>
                                <CardTitle
                                  className={
                                    recommendation.completed
                                      ? 'line-through'
                                      : ''
                                  }
                                >
                                  {recommendation.title}
                                </CardTitle>
                                <CardDescription>
                                  {recommendation.description}
                                </CardDescription>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() =>
                                    toggleCompletion(recommendation.id)
                                  }
                                  variant={
                                    recommendation.completed
                                      ? 'outline'
                                      : 'default'
                                  }
                                  className="flex items-center gap-1"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  {recommendation.completed
                                    ? 'Mark Active'
                                    : 'Complete'}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {recommendation.timeframe}
                                </div>
                                <div className="flex items-center gap-1">
                                  <CategoryIcon className="h-4 w-4" />
                                  {recommendation.category}
                                </div>
                              </div>

                              <Separator />

                              <div>
                                <h4 className="mb-2 font-semibold">
                                  Helpful Tips:
                                </h4>
                                <ul className="space-y-1">
                                  {recommendation.tips.map((tip, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start gap-2 text-sm"
                                    >
                                      <span className="text-primary mt-1">
                                        •
                                      </span>
                                      <span>{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
