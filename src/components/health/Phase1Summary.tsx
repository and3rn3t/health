import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Brain,
  BarChart3,
  Shield,
  Heart,
  Activity,
  Rocket,
  Code,
  Lightbulb,
} from '@phosphor-icons/react';

export default function Phase1Summary() {
  const completedFeatures = [
    {
      category: 'Data Processing',
      icon: <Code className="h-5 w-5" />,
      features: [
        'Advanced Apple Health data parsing and validation',
        '90-day historical trend analysis',
        'Data quality assessment (completeness, consistency, recency)',
        'Multi-metric correlation analysis',
        'Comprehensive health score calculation',
      ],
    },
    {
      category: 'AI Analytics',
      icon: <Brain className="h-5 w-5" />,
      features: [
        'LLM-powered health insights generation',
        'Personalized recommendations engine',
        'Custom health query answering',
        'Pattern recognition and trend prediction',
        'Risk factor identification and scoring',
      ],
    },
    {
      category: 'Data Visualization',
      icon: <BarChart3 className="h-5 w-5" />,
      features: [
        'Interactive health metric charts',
        'Correlation visualization between metrics',
        'Weekly and monthly trend aggregation',
        'Real-time dashboard with health score',
        'Data quality indicators and reliability metrics',
      ],
    },
    {
      category: 'Fall Risk Assessment',
      icon: <Shield className="h-5 w-5" />,
      features: [
        'Walking steadiness analysis',
        'Activity level assessment',
        'Heart rate variability monitoring',
        'Fall risk factor identification',
        'Actionable prevention recommendations',
      ],
    },
  ];

  const technicalAchievements = [
    'Sophisticated health data processor with TypeScript types',
    'Real-time AI insights using Spark LLM API',
    'Interactive visualization components with hover states',
    'Comprehensive analytics engine with correlation calculations',
    'Health score algorithm based on multiple risk factors',
    'Data quality assessment framework',
    'Modular component architecture for scalability',
  ];

  const nextPhaseFeatures = [
    'Custom ML model for fall prediction',
    'Gait analysis algorithms',
    'Behavioral pattern recognition',
    'Real-time risk score calculation',
    'Personalized monitoring adjustments',
    'Cloud-based monitoring platform',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <h1 className="text-3xl font-bold">Phase 1 Foundation Complete!</h1>
        </div>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          We've successfully completed Phases 1-2 with comprehensive health data
          analytics and AI insights, plus significant progress on Phase 3 fall
          detection framework. Ready for Apple Watch integration!
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge className="flex items-center gap-2" variant="default">
            <CheckCircle className="h-4 w-4" />
            Phases 1-2 Complete
          </Badge>
          <Badge className="flex items-center gap-2" variant="secondary">
            <Activity className="h-4 w-4" />
            Phase 3 In Progress
          </Badge>
          <Badge className="flex items-center gap-2" variant="outline">
            <Rocket className="h-4 w-4" />
            Ready for Phase 4
          </Badge>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Implementation Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Phase 1-2: Foundation & Enhanced Analytics</span>
                <span className="font-medium">100% Complete</span>
              </div>
              <Progress value={100} className="h-3" />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Phase 3: Basic Fall Detection</span>
                <span className="font-medium">60% Complete</span>
              </div>
              <Progress value={60} className="h-3" />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Overall Project Progress</span>
                <span className="font-medium">37% Complete</span>
              </div>
              <Progress value={37} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Features */}
      <div className="grid gap-6">
        <h2 className="text-center text-2xl font-bold">
          What We've Built (Phases 1-2 Complete)
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {completedFeatures.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {category.icon}
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Phase 3 Progress */}
      <div className="grid gap-6">
        <h2 className="text-center text-2xl font-bold">
          Phase 3 Fall Detection - In Progress
        </h2>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Current Implementation Status
            </CardTitle>
            <CardDescription>
              Framework and core components implemented, Apple Watch integration
              next
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-3 font-medium text-green-700">
                  ✅ Completed
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>Emergency contact management system</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>Fall reporting and logging interface</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>Fall history tracking and analytics</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>Basic fall risk assessment framework</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 font-medium text-blue-700">
                  🔄 Next Steps
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 border-blue-500" />
                    <span>Apple Watch fall detection API integration</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 border-blue-500" />
                    <span>Core Motion sensor data processing</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 border-blue-500" />
                    <span>Real-time emergency alert system</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 border-blue-500" />
                    <span>False positive filtering algorithms</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technical Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Technical Foundation
          </CardTitle>
          <CardDescription>
            Robust architecture and implementation details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              {technicalAchievements
                .slice(0, Math.ceil(technicalAchievements.length / 2))
                .map((achievement, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span>{achievement}</span>
                  </div>
                ))}
            </div>
            <div className="space-y-2">
              {technicalAchievements
                .slice(Math.ceil(technicalAchievements.length / 2))
                .map((achievement, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span>{achievement}</span>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Phase Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            What's Next: Phase 4 AI-Powered Fall Prediction
          </CardTitle>
          <CardDescription>
            Advanced machine learning and real-time monitoring capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 flex items-center gap-2 font-medium">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Upcoming Features
              </h4>
              <ul className="space-y-2">
                {nextPhaseFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-medium">Key Capabilities</h4>
              <div className="space-y-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-sm font-medium">
                    Real-time Fall Detection
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Advanced algorithms using accelerometer and gyroscope data
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-sm font-medium">Emergency Response</div>
                  <div className="text-muted-foreground text-xs">
                    Automated caregiver notifications and emergency services
                    contact
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-sm font-medium">Predictive Modeling</div>
                  <div className="text-muted-foreground text-xs">
                    Machine learning for proactive fall risk prediction
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Phases 1-3 Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            <div>
              <div className="text-3xl font-bold text-blue-500">20+</div>
              <div className="text-muted-foreground text-sm">
                Health Metrics Analyzed
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-500">90</div>
              <div className="text-muted-foreground text-sm">
                Days Historical Data
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-500">7</div>
              <div className="text-muted-foreground text-sm">
                Complete Components Built
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500">10+</div>
              <div className="text-muted-foreground text-sm">
                Fall Risk Factors
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
