import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  Apple,
  Watch,
  Smartphone,
  Shield,
  Code,
  FlaskConical,
  Upload,
  Settings,
  FileText,
} from 'lucide-react';

interface IntegrationTask {
  id: string;
  title: string;
  description: string;
  category: 'setup' | 'development' | 'testing' | 'deployment';
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  dependencies: string[];
  completed: boolean;
  notes?: string;
}

export default function AppleWatchIntegrationChecklist() {
  const [tasks, setTasks] = useKV<IntegrationTask[]>('integration-tasks', [
    // Setup Phase
    {
      id: 'apple-dev-account',
      title: 'Apple Developer Program Enrollment',
      description:
        'Register for Apple Developer Program and obtain necessary certificates',
      category: 'setup',
      priority: 'high',
      estimatedHours: 4,
      dependencies: [],
      completed: false,
    },
    {
      id: 'healthkit-entitlements',
      title: 'HealthKit Entitlements Setup',
      description:
        'Configure app entitlements for HealthKit access and background processing',
      category: 'setup',
      priority: 'high',
      estimatedHours: 2,
      dependencies: ['apple-dev-account'],
      completed: false,
    },
    {
      id: 'xcode-project',
      title: 'iOS Project Creation',
      description: 'Create new iOS app project with HealthKit integration',
      category: 'setup',
      priority: 'high',
      estimatedHours: 3,
      dependencies: ['apple-dev-account'],
      completed: false,
    },
    {
      id: 'watchos-target',
      title: 'WatchOS Target Setup',
      description: 'Add WatchOS app target to iOS project',
      category: 'setup',
      priority: 'high',
      estimatedHours: 2,
      dependencies: ['xcode-project'],
      completed: false,
    },

    // Development Phase
    {
      id: 'healthkit-manager',
      title: 'HealthKit Data Manager',
      description: 'Implement core HealthKit data reading and authorization',
      category: 'development',
      priority: 'high',
      estimatedHours: 16,
      dependencies: ['healthkit-entitlements'],
      completed: false,
    },
    {
      id: 'websocket-bridge',
      title: 'WebSocket Bridge Implementation',
      description:
        'Create bridge between native HealthKit data and web application',
      category: 'development',
      priority: 'high',
      estimatedHours: 12,
      dependencies: ['healthkit-manager'],
      completed: false,
    },
    {
      id: 'fall-detection',
      title: 'Advanced Fall Detection',
      description:
        'Implement multi-sensor fall detection using Apple Watch sensors',
      category: 'development',
      priority: 'high',
      estimatedHours: 24,
      dependencies: ['watchos-target', 'healthkit-manager'],
      completed: false,
    },
    {
      id: 'background-processing',
      title: 'Background Health Monitoring',
      description:
        'Implement background app refresh for continuous health monitoring',
      category: 'development',
      priority: 'medium',
      estimatedHours: 8,
      dependencies: ['healthkit-manager'],
      completed: false,
    },
    {
      id: 'Watch-complications',
      title: 'Watch Face Complications',
      description:
        'Create Watch face widgets for health score and emergency access',
      category: 'development',
      priority: 'medium',
      estimatedHours: 6,
      dependencies: ['watchos-target'],
      completed: false,
    },
    {
      id: 'emergency-response',
      title: 'Emergency Response System',
      description: 'Implement automated emergency contact and location sharing',
      category: 'development',
      priority: 'high',
      estimatedHours: 10,
      dependencies: ['fall-detection'],
      completed: false,
    },

    // Testing Phase
    {
      id: 'simulator-testing',
      title: 'iOS Simulator Testing',
      description: 'Test app functionality using iOS and WatchOS simulators',
      category: 'testing',
      priority: 'high',
      estimatedHours: 8,
      dependencies: ['websocket-bridge', 'fall-detection'],
      completed: false,
    },
    {
      id: 'device-testing',
      title: 'Physical Device Testing',
      description: 'Test on real iPhone and Apple Watch devices',
      category: 'testing',
      priority: 'high',
      estimatedHours: 12,
      dependencies: ['simulator-testing'],
      completed: false,
    },
    {
      id: 'fall-simulation',
      title: 'Fall Detection Testing',
      description: 'Simulate fall scenarios and test emergency response',
      category: 'testing',
      priority: 'high',
      estimatedHours: 6,
      dependencies: ['device-testing', 'emergency-response'],
      completed: false,
    },
    {
      id: 'data-accuracy',
      title: 'Health Data Accuracy Validation',
      description: 'Verify accuracy of health data collection and processing',
      category: 'testing',
      priority: 'medium',
      estimatedHours: 4,
      dependencies: ['device-testing'],
      completed: false,
    },

    // Deployment Phase
    {
      id: 'privacy-policy',
      title: 'Privacy Policy Updates',
      description: 'Update privacy policy for HealthKit data collection',
      category: 'deployment',
      priority: 'high',
      estimatedHours: 3,
      dependencies: [],
      completed: false,
    },
    {
      id: 'app-store-submission',
      title: 'App Store Submission',
      description: 'Submit iOS and WatchOS apps for App Store review',
      category: 'deployment',
      priority: 'high',
      estimatedHours: 6,
      dependencies: ['fall-simulation', 'privacy-policy'],
      completed: false,
    },
    {
      id: 'websocket-infrastructure',
      title: 'Production WebSocket Deployment',
      description: 'Deploy real-time health data streaming infrastructure',
      category: 'deployment',
      priority: 'high',
      estimatedHours: 8,
      dependencies: ['websocket-bridge'],
      completed: false,
    },
    {
      id: 'security-audit',
      title: 'Security and Compliance Audit',
      description: 'Conduct security review and HIPAA compliance assessment',
      category: 'deployment',
      priority: 'high',
      estimatedHours: 12,
      dependencies: ['websocket-infrastructure'],
      completed: false,
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleTask = (taskId: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const getTasksByCategory = (category: string) => {
    if (category === 'all') return tasks;
    return tasks.filter((task) => task.category === category);
  };

  const calculateProgress = (category?: string) => {
    const relevantTasks = category
      ? tasks.filter((t) => t.category === category)
      : tasks;
    const completedTasks = relevantTasks.filter((t) => t.completed).length;
    return Math.round((completedTasks / relevantTasks.length) * 100);
  };

  const getTotalHours = (category?: string) => {
    const relevantTasks = category
      ? tasks.filter((t) => t.category === category)
      : tasks;
    return relevantTasks.reduce(
      (total, task) => total + task.estimatedHours,
      0
    );
  };

  const getCompletedHours = (category?: string) => {
    const relevantTasks = category
      ? tasks.filter((t) => t.category === category)
      : tasks;
    return relevantTasks
      .filter((t) => t.completed)
      .reduce((total, task) => total + task.estimatedHours, 0);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'setup':
        return <Settings className="h-4 w-4" />;
      case 'development':
        return <Code className="h-4 w-4" />;
      case 'testing':
        return <FlaskConical className="h-4 w-4" />;
      case 'deployment':
        return <Upload className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const categories = [
    { id: 'all', label: 'All Tasks', icon: <FileText className="h-4 w-4" /> },
    {
      id: 'setup',
      label: 'Setup & Configuration',
      icon: <Settings className="h-4 w-4" />,
    },
    {
      id: 'development',
      label: 'Development',
      icon: <Code className="h-4 w-4" />,
    },
    { id: 'testing', label: 'Testing', icon: <FlaskConical className="h-4 w-4" /> },
    {
      id: 'deployment',
      label: 'Deployment',
      icon: <Upload className="h-4 w-4" />,
    },
  ];

  const overallProgress = calculateProgress();
  const isBlockedTask = (task: IntegrationTask) => {
    return task.dependencies.some(
      (depId) => !tasks.find((t) => t.id === depId)?.completed
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-6 w-6" />
            Apple Watch & HealthKit Integration Checklist
          </CardTitle>
          <CardDescription>
            Complete implementation guide for production-ready Apple Watch and
            HealthKit integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-primary text-2xl font-bold">
                {overallProgress}%
              </div>
              <div className="text-muted-foreground text-sm">
                Overall Progress
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {getCompletedHours()}/{getTotalHours()}
              </div>
              <div className="text-muted-foreground text-sm">
                Hours Complete
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {tasks.filter((t) => t.completed).length}
              </div>
              <div className="text-muted-foreground text-sm">
                Tasks Complete
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {
                  tasks.filter((t) => t.priority === 'high' && !t.completed)
                    .length
                }
              </div>
              <div className="text-muted-foreground text-sm">
                High Priority Remaining
              </div>
            </div>
          </div>
          <Progress value={overallProgress} className="w-full" />
        </CardContent>
      </Card>

      {/* Integration Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-5 w-5" />
              iOS App Development
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{calculateProgress('development')}%</span>
              </div>
              <Progress value={calculateProgress('development')} />
              <div className="text-muted-foreground text-xs">
                {getCompletedHours('development')}/
                {getTotalHours('development')} hours
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Watch className="h-5 w-5" />
              Apple Watch Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Setup</span>
                <span>{calculateProgress('setup')}%</span>
              </div>
              <Progress value={calculateProgress('setup')} />
              <div className="text-muted-foreground text-xs">
                Foundation & configuration
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5" />
              Production Deployment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Deployment</span>
                <span>{calculateProgress('deployment')}%</span>
              </div>
              <Progress value={calculateProgress('deployment')} />
              <div className="text-muted-foreground text-xs">
                Security & App Store
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Management */}
      <Tabs
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex items-center gap-1 text-xs"
            >
              {category.icon}
              <span className="hidden sm:inline">
                {category.label.split(' ')[0]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent
            key={category.id}
            value={category.id}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{category.label}</h3>
              <Badge variant="outline">
                {
                  getTasksByCategory(category.id).filter((t) => t.completed)
                    .length
                }{' '}
                / {getTasksByCategory(category.id).length} completed
              </Badge>
            </div>

            <div className="space-y-3">
              {getTasksByCategory(category.id).map((task) => {
                const blocked = isBlockedTask(task);
                return (
                  <Card
                    key={task.id}
                    className={`${task.completed ? 'opacity-75' : ''} ${blocked && !task.completed ? 'border-yellow-200 bg-yellow-50' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                          disabled={blocked}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4
                              className={`font-medium ${task.completed ? 'text-muted-foreground line-through' : ''}`}
                            >
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${getPriorityColor(task.priority)}`}
                              />
                              <span className="text-muted-foreground text-xs">
                                {task.estimatedHours}h
                              </span>
                              {getCategoryIcon(task.category)}
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {task.description}
                          </p>

                          {task.dependencies.length > 0 && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">
                                Depends on:
                              </span>
                              {task.dependencies.map((depId) => {
                                const depTask = tasks.find(
                                  (t) => t.id === depId
                                );
                                const depCompleted = depTask?.completed;
                                return (
                                  <Badge
                                    key={depId}
                                    variant={
                                      depCompleted ? 'default' : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {depCompleted ? (
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                    ) : (
                                      <Clock className="mr-1 h-3 w-3" />
                                    )}
                                    {depTask?.title}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}

                          {blocked && !task.completed && (
                            <Alert className="border-yellow-200">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                This task is blocked by incomplete dependencies
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps & Resources</CardTitle>
          <CardDescription>
            Key actions to begin Apple Watch and HealthKit integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Immediate Actions</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3" />
                  <a
                    href="https://developer.apple.com/programs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Register for Apple Developer Program
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3" />
                  <a
                    href="https://developer.apple.com/documentation/healthkit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Review HealthKit Documentation
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3" />
                  <a
                    href="https://developer.apple.com/documentation/watchos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Study WatchOS Development Guide
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Technical Requirements</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3" />
                  <span>Xcode 15+ with iOS 17 SDK</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3" />
                  <span>Physical iPhone and Apple Watch for testing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3" />
                  <span>WebSocket server infrastructure</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
