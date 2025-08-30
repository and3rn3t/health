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
import Phase1Summary from '@/components/health/Phase1Summary'

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
    title: '✅ Foundation & Analytics (COMPLETED)',
    description: 'Enhanced foundation with comprehensive health data processing and AI-powered analytics',
    duration: 'COMPLETED',
    complexity: 'Medium',
    cost: 'DELIVERED',
    prerequisites: [
      '✅ Apple Health data access',
      '✅ Modern web browser support',
      '✅ TypeScript/React foundation'
    ],
    deliverables: [
      '✅ Advanced health data processing engine',
      '✅ Comprehensive analytics dashboard with AI insights',
      '✅ Fall risk assessment and scoring',
      '✅ Interactive data visualizations',
      '✅ Health score calculation system',
      '✅ Data quality assessment framework',
      '✅ Emergency contact management'
    ],
    technologies: [
      '✅ React with TypeScript',
      '✅ Spark LLM API integration',
      '✅ Advanced data visualization',
      '✅ AI-powered insights engine',
      '✅ Comprehensive health analytics'
    ],
    risks: [
      '✅ RESOLVED: Data format handling',
      '✅ RESOLVED: AI integration complexity',
      '✅ RESOLVED: Visualization performance'
    ],
    icon: <CheckCircle className="h-5 w-5 text-green-500" />
  },
  {
    id: 'phase2',
    title: '✅ Enhanced Analytics & Insights (COMPLETED)',
    description: 'Comprehensive health data analysis and risk assessment with AI-powered insights',
    duration: 'COMPLETED',
    complexity: 'Medium',
    cost: 'DELIVERED',
    prerequisites: [
      '✅ Phase 1 completed',
      '✅ Health data patterns identified',
      '✅ Basic analytics framework'
    ],
    deliverables: [
      '✅ Advanced health insights dashboard',
      '✅ Trend analysis and predictions with AI',
      '✅ Risk factor identification and scoring',
      '✅ Personalized health recommendations via LLM',
      '✅ Historical data visualization and patterns',
      '✅ Comprehensive health metrics analysis',
      '✅ AI-powered health insights generation'
    ],
    technologies: [
      '✅ Spark LLM API integration',
      '✅ Advanced data visualization components',
      '✅ Statistical analysis and health scoring',
      '✅ Real-time analytics processing',
      '✅ Interactive chart components'
    ],
    risks: [
      '✅ RESOLVED: Complex data modeling',
      '✅ RESOLVED: Performance with large datasets',
      '✅ RESOLVED: Algorithm accuracy concerns'
    ],
    icon: <CheckCircle className="h-5 w-5 text-green-500" />
  },
  {
    id: 'phase3',
    title: '✅ Basic Fall Detection (COMPLETED)',
    description: 'Apple Watch integration implemented with real-time monitoring and emergency response',
    duration: 'COMPLETED',
    complexity: 'Medium',
    cost: 'DELIVERED',
    prerequisites: [
      '✅ Apple Watch Series 4+ access',
      '✅ Core Motion integration implemented',
      '✅ Emergency response protocols designed'
    ],
    deliverables: [
      '✅ Apple Watch fall detection integration',
      '✅ Emergency alert system framework',
      '✅ Real-time sensor monitoring',
      '✅ Manual fall reporting interface',
      '✅ Advanced incident logging system',
      '✅ Fall history tracking and analysis'
    ],
    technologies: [
      '✅ Apple Watch Fall Detection API',
      '✅ Real-time sensor data processing',
      '✅ Emergency notification system',
      '✅ Emergency contact system',
      '✅ Data persistence and tracking'
    ],
    risks: [
      '✅ RESOLVED: False positive management',
      '✅ RESOLVED: Real-time processing performance',
      '✅ RESOLVED: Emergency response reliability'
    ],
    icon: <CheckCircle className="h-5 w-5 text-green-500" />
  },
  {
    id: 'phase4',
    title: '✅ AI-Powered Fall Prediction (COMPLETED)',
    description: 'Machine learning models implemented for advanced fall risk assessment and real-time detection',
    duration: 'COMPLETED',
    complexity: 'High',
    cost: 'DELIVERED',
    prerequisites: [
      '✅ Large dataset of movement patterns',
      '✅ ML expertise and algorithms',
      '✅ Training data collection system'
    ],
    deliverables: [
      '✅ Custom ML model for fall prediction',
      '✅ Real-time fall detection algorithm',
      '✅ Gait analysis and behavioral pattern recognition',
      '✅ Advanced risk score calculation',
      '✅ Personalized monitoring calibration',
      '✅ Live sensor data processing and visualization'
    ],
    technologies: [
      '✅ Advanced sensor fusion algorithms',
      '✅ Real-time fall detection engine',
      '✅ Time series analysis and pattern recognition',
      '✅ Apple Watch sensor integration',
      '✅ Machine learning risk assessment'
    ],
    risks: [
      '✅ RESOLVED: Model accuracy and validation',
      '✅ RESOLVED: Real-time processing performance',
      '✅ RESOLVED: Sensor data quality and reliability'
    ],
    icon: <CheckCircle className="h-5 w-5 text-green-500" />
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
  { phase: '✅ Foundation & Basic Setup (DONE)', startWeek: 0, duration: 4, dependencies: [] },
  { phase: '✅ Enhanced Analytics (DONE)', startWeek: 4, duration: 6, dependencies: ['Foundation'] },
  { phase: '✅ Basic Fall Detection (DONE)', startWeek: 6, duration: 4, dependencies: ['Foundation'] },
  { phase: '✅ AI Fall Prediction (DONE)', startWeek: 10, duration: 12, dependencies: ['Analytics', 'Basic Fall Detection'] },
  { phase: '🔄 Real-Time Monitoring (NEXT)', startWeek: 14, duration: 10, dependencies: ['Basic Fall Detection'] },
  { phase: 'Smart Home Integration', startWeek: 22, duration: 8, dependencies: ['Real-Time Monitoring'] },
  { phase: 'Advanced AI & Predictive', startWeek: 24, duration: 16, dependencies: ['AI Fall Prediction', 'Real-Time Monitoring'] }
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

  const totalProjectCost = '$100k - $250k remaining'
  const totalDuration = '24 weeks remaining (6 months)'

  return (
    <div className="space-y-6">
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Major Progress Update:</strong> Foundation, Enhanced Analytics, Basic Fall Detection, and AI-Powered Fall Prediction phases are complete! 
          Real-time fall detection with Apple Watch integration is now live. 
          Ready to move to advanced real-time monitoring infrastructure.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">Remaining Duration</span>
            </div>
            <p className="text-2xl font-bold">{totalDuration}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Remaining Investment</span>
            </div>
            <p className="text-2xl font-bold">{totalProjectCost}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Project Progress</span>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold">4 of 7 phases</p>
              <Progress value={57.1} className="h-2" />
              <p className="text-sm text-muted-foreground">Core features & AI detection complete</p>
            </div>
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
          {/* Special Phase 1 Summary */}
          {selectedPhase === 'phase1' && (
            <div className="mb-6">
              <Phase1Summary />
            </div>
          )}
          
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
                {timeline.map((item, index) => {
                  const isCompleted = item.phase.includes('✅')
                  const isInProgress = item.phase.includes('🔄')
                  
                  return (
                    <div key={index} className="relative">
                      <div className="flex items-center gap-4">
                        <div className="w-24 text-sm text-muted-foreground">
                          Week {item.startWeek + 1}-{item.startWeek + item.duration}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className={`font-semibold ${isCompleted ? 'text-green-700' : isInProgress ? 'text-blue-700' : ''}`}>
                              {item.phase}
                            </h4>
                            <Badge variant={isCompleted ? 'default' : isInProgress ? 'secondary' : 'outline'}>
                              {item.duration} weeks
                            </Badge>
                            {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {isInProgress && <Clock className="h-4 w-4 text-blue-500" />}
                          </div>
                          <Progress 
                            value={isCompleted ? 100 : isInProgress ? 60 : 0} 
                            className={`h-6 ${isCompleted ? '[&>div]:bg-green-500' : isInProgress ? '[&>div]:bg-blue-500' : ''}`} 
                          />
                          {item.dependencies.length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Depends on: {item.dependencies.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
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