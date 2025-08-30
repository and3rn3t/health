import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Play,
  CheckCircle, 
  Clock, 
  Code, 
  Database, 
  Shield, 
  Brain, 
  Pulse,
  Warning,
  Users,
  Monitor,
  Smartphone,
  CloudArrowUp,
  GearSix,
  Target,
  Lightning,
  Star
} from '@phosphor-icons/react'

interface PhaseDetail {
  id: string
  title: string
  description: string
  duration: string
  complexity: 'Low' | 'Medium' | 'High'
  cost: string
  prerequisites: string[]
  deliverables: string[]
  technologies: string[]
  risks: string[]
  icon: React.ReactNode
}

const implementationPhases: PhaseDetail[] = [
  {
    id: 'phase1',
    title: 'Foundation & Basic Setup',
    description: 'Establish core infrastructure and basic health data integration',
    duration: '2-4 weeks',
    complexity: 'Low',
    cost: '$5k - $15k',
    prerequisites: [
      'Apple Developer Account',
      'HealthKit permissions approved',
      'Basic iOS development knowledge'
    ],
    deliverables: [
      'HealthKit data import functionality',
      'Basic health metrics dashboard',
      'Emergency contact management',
      'Apple Watch connectivity',
      'Data persistence system'
    ],
    technologies: [
      'HealthKit Framework',
      'Core Data / SQLite',
      'WatchKit',
      'UserDefaults',
      'Basic UI Components'
    ],
    risks: [
      'HealthKit permission rejection',
      'Apple Watch compatibility issues',
      'Data format inconsistencies'
    ],
    icon: <Code className="h-5 w-5" />
  },
  {
    id: 'phase2',
    title: 'Enhanced Analytics & Insights',
    description: 'Implement comprehensive health data analysis and risk assessment',
    duration: '3-6 weeks',
    complexity: 'Medium',
    cost: '$15k - $35k',
    prerequisites: [
      'Phase 1 completed',
      'Health data patterns identified',
      'Basic analytics framework'
    ],
    deliverables: [
      'Advanced health insights dashboard',
      'Trend analysis and predictions',
      'Risk factor identification',
      'Personalized health recommendations',
      'Historical data visualization'
    ],
    technologies: [
      'Core ML framework',
      'Charts.js / D3.js',
      'Statistical analysis libraries',
      'Background processing',
      'Push notifications'
    ],
    risks: [
      'Complex data modeling',
      'Performance with large datasets',
      'Algorithm accuracy concerns'
    ],
    icon: <Database className="h-5 w-5" />
  },
  {
    id: 'phase3',
    title: 'Basic Fall Detection',
    description: 'Implement fundamental fall detection using Apple Watch built-in features',
    duration: '4-8 weeks',
    complexity: 'Medium',
    cost: '$25k - $50k',
    prerequisites: [
      'Apple Watch Series 4+ access',
      'Core Motion understanding',
      'Emergency response protocols'
    ],
    deliverables: [
      'Apple Watch fall detection integration',
      'Emergency alert system',
      'False positive filtering',
      'Manual fall reporting',
      'Basic incident logging'
    ],
    technologies: [
      'Apple Watch Fall Detection API',
      'Core Motion',
      'CallKit framework',
      'Emergency SOS integration',
      'Location services'
    ],
    risks: [
      'High false positive rates',
      'Limited customization of Apple\'s system',
      'Reliability in real scenarios'
    ],
    icon: <Shield className="h-5 w-5" />
  },
  {
    id: 'phase4',
    title: 'AI-Powered Fall Prediction',
    description: 'Develop machine learning models for advanced fall risk assessment',
    duration: '8-12 weeks',
    complexity: 'High',
    cost: '$50k - $100k',
    prerequisites: [
      'Large dataset of movement patterns',
      'ML expertise or consultation',
      'Training data collection system'
    ],
    deliverables: [
      'Custom ML model for fall prediction',
      'Gait analysis algorithms',
      'Behavioral pattern recognition',
      'Risk score calculation',
      'Personalized monitoring adjustments'
    ],
    technologies: [
      'TensorFlow / PyTorch',
      'Core ML conversion',
      'Advanced sensor fusion',
      'Time series analysis',
      'Edge computing optimization'
    ],
    risks: [
      'Insufficient training data',
      'Model accuracy and bias',
      'Real-time processing constraints',
      'Regulatory compliance issues'
    ],
    icon: <Brain className="h-5 w-5" />
  },
  {
    id: 'phase5',
    title: 'Real-Time Monitoring System',
    description: 'Build comprehensive 24/7 monitoring infrastructure',
    duration: '6-10 weeks',
    complexity: 'High',
    cost: '$75k - $150k',
    prerequisites: [
      'Cloud infrastructure knowledge',
      'Real-time systems experience',
      'Scalability planning'
    ],
    deliverables: [
      'Cloud-based monitoring platform',
      '24/7 alert processing system',
      'Multi-device synchronization',
      'Healthcare provider integration',
      'Family/caregiver dashboard'
    ],
    technologies: [
      'Real-time databases (Firebase/AWS)',
      'WebSocket connections',
      'Microservices architecture',
      'Load balancing',
      'API gateways'
    ],
    risks: [
      'System scalability challenges',
      'High operational costs',
      'Uptime reliability requirements',
      'Data privacy compliance'
    ],
    icon: <Monitor className="h-5 w-5" />
  },
  {
    id: 'phase6',
    title: 'Smart Home Integration',
    description: 'Extend monitoring beyond wearables with environmental sensors',
    duration: '4-8 weeks',
    complexity: 'Medium',
    cost: '$30k - $75k',
    prerequisites: [
      'HomeKit development experience',
      'IoT sensor integration knowledge',
      'Network security expertise'
    ],
    deliverables: [
      'HomeKit sensor integration',
      'Multi-sensor data fusion',
      'Room-level monitoring',
      'Environmental risk factors',
      'Smart home automation triggers'
    ],
    technologies: [
      'HomeKit framework',
      'Matter/Thread protocols',
      'Sensor fusion algorithms',
      'Edge processing',
      'Mesh networking'
    ],
    risks: [
      'Device compatibility issues',
      'Network reliability dependencies',
      'Privacy concerns with cameras',
      'Installation complexity'
    ],
    icon: <GearSix className="h-5 w-5" />
  },
  {
    id: 'phase7',
    title: 'Advanced AI & Predictive Analytics',
    description: 'Implement sophisticated AI for health trend prediction and intervention',
    duration: '10-16 weeks',
    complexity: 'High',
    cost: '$100k - $200k',
    prerequisites: [
      'Large-scale health datasets',
      'AI/ML research capabilities',
      'Medical advisory board'
    ],
    deliverables: [
      'Predictive health modeling',
      'Early intervention recommendations',
      'Personalized care plans',
      'Health trajectory forecasting',
      'Medical professional alerts'
    ],
    technologies: [
      'Advanced neural networks',
      'Federated learning',
      'Natural language processing',
      'Computer vision (for gait analysis)',
      'Reinforcement learning'
    ],
    risks: [
      'Regulatory approval challenges',
      'Clinical validation requirements',
      'Ethical AI considerations',
      'Medical liability concerns'
    ],
    icon: <Star className="h-5 w-5" />
  }
]

interface ImplementationTimeline {
  phase: string
  startWeek: number
  duration: number
  dependencies: string[]
}

const timeline: ImplementationTimeline[] = [
  { phase: 'Foundation & Basic Setup', startWeek: 0, duration: 4, dependencies: [] },
  { phase: 'Enhanced Analytics', startWeek: 4, duration: 6, dependencies: ['Foundation'] },
  { phase: 'Basic Fall Detection', startWeek: 6, duration: 8, dependencies: ['Foundation'] },
  { phase: 'AI Fall Prediction', startWeek: 14, duration: 12, dependencies: ['Analytics', 'Basic Fall Detection'] },
  { phase: 'Real-Time Monitoring', startWeek: 18, duration: 10, dependencies: ['Basic Fall Detection'] },
  { phase: 'Smart Home Integration', startWeek: 26, duration: 8, dependencies: ['Real-Time Monitoring'] },
  { phase: 'Advanced AI & Predictive', startWeek: 28, duration: 16, dependencies: ['AI Fall Prediction', 'Real-Time Monitoring'] }
]

export default function ImplementationPhases() {
  const [selectedPhase, setSelectedPhase] = useState<string>('phase1')
  const [viewMode, setViewMode] = useState<'phases' | 'timeline' | 'comparison'>('phases')

  const currentPhase = implementationPhases.find(p => p.id === selectedPhase)

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalProjectCost = '$300k - $650k'
  const totalDuration = '44 weeks (11 months)'

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <Lightning className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Development Roadmap:</strong> From basic health data import to advanced AI-powered fall prevention system.
          Each phase builds on previous work and can be developed incrementally.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">Total Duration</span>
            </div>
            <p className="text-2xl font-bold">{totalDuration}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Total Investment</span>
            </div>
            <p className="text-2xl font-bold">{totalProjectCost}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="font-semibold">Team Size</span>
            </div>
            <p className="text-2xl font-bold">3-8 developers</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="phases">Phase Details</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="comparison">Phase Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Phase Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Implementation Phases</CardTitle>
                <CardDescription>
                  Select a phase to view detailed requirements and deliverables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {implementationPhases.map((phase) => (
                    <Button
                      key={phase.id}
                      variant={selectedPhase === phase.id ? 'default' : 'ghost'}
                      className="w-full justify-start h-auto p-3"
                      onClick={() => setSelectedPhase(phase.id)}
                    >
                      <div className="flex items-center gap-3">
                        {phase.icon}
                        <div className="text-left">
                          <div className="font-medium">{phase.title}</div>
                          <div className="text-xs text-muted-foreground">{phase.duration}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Phase Details */}
            <div className="lg:col-span-2 space-y-6">
              {currentPhase && (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {currentPhase.icon}
                          {currentPhase.title}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge className={getComplexityColor(currentPhase.complexity)}>
                            {currentPhase.complexity} Complexity
                          </Badge>
                          <Badge variant="outline">{currentPhase.duration}</Badge>
                        </div>
                      </div>
                      <CardDescription>{currentPhase.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Prerequisites
                          </h4>
                          <ul className="space-y-2">
                            {currentPhase.prerequisites.map((prereq, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                {prereq}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Key Deliverables
                          </h4>
                          <ul className="space-y-2">
                            {currentPhase.deliverables.map((deliverable, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                {deliverable}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          Technologies & Tools
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {currentPhase.technologies.map((tech, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {tech}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Warning className="h-4 w-4" />
                          Risk Factors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {currentPhase.risks.map((risk, index) => (
                            <Alert key={index} className="py-2">
                              <AlertDescription className="text-sm">
                                {risk}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Investment & Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-2">Estimated Cost</h4>
                          <p className="text-2xl font-bold text-primary">{currentPhase.cost}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Including development, testing, and initial deployment
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Development Time</h4>
                          <p className="text-2xl font-bold text-primary">{currentPhase.duration}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            With experienced development team
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Development Timeline
              </CardTitle>
              <CardDescription>
                Parallel development streams with dependencies shown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {timeline.map((item, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center gap-4">
                      <div className="w-24 text-sm text-muted-foreground">
                        Week {item.startWeek + 1}-{item.startWeek + item.duration}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{item.phase}</h4>
                          <Badge variant="outline">{item.duration} weeks</Badge>
                        </div>
                        <Progress value={(item.duration / 16) * 100} className="h-6" />
                        {item.dependencies.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Depends on: {item.dependencies.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {implementationPhases.map((phase) => (
              <Card key={phase.id} className="relative">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
                    <div className="flex items-center gap-3">
                      {phase.icon}
                      <div>
                        <h3 className="font-semibold">{phase.title}</h3>
                        <p className="text-sm text-muted-foreground">{phase.duration}</p>
                      </div>
                    </div>
                    <div>
                      <Badge className={getComplexityColor(phase.complexity)}>
                        {phase.complexity}
                      </Badge>
                    </div>
                    <div className="font-semibold">{phase.cost}</div>
                    <div className="text-sm">
                      {phase.deliverables.length} deliverables
                    </div>
                    <div className="text-sm">
                      {phase.risks.length} risk factors
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}