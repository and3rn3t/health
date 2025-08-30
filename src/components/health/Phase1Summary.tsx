import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Brain, 
  BarChart3, 
  Shield, 
  Heart, 
  Activity,
  Rocket,
  Code,
  Lightbulb
} from '@phosphor-icons/react'

export default function Phase1Summary() {
  const completedFeatures = [
    {
      category: "Data Processing",
      icon: <Code className="h-5 w-5" />,
      features: [
        "Advanced Apple Health data parsing and validation",
        "90-day historical trend analysis",
        "Data quality assessment (completeness, consistency, recency)",
        "Multi-metric correlation analysis",
        "Comprehensive health score calculation"
      ]
    },
    {
      category: "AI Analytics",
      icon: <Brain className="h-5 w-5" />,
      features: [
        "LLM-powered health insights generation",
        "Personalized recommendations engine",
        "Custom health query answering",
        "Pattern recognition and trend prediction",
        "Risk factor identification and scoring"
      ]
    },
    {
      category: "Data Visualization",
      icon: <BarChart3 className="h-5 w-5" />,
      features: [
        "Interactive health metric charts",
        "Correlation visualization between metrics",
        "Weekly and monthly trend aggregation",
        "Real-time dashboard with health score",
        "Data quality indicators and reliability metrics"
      ]
    },
    {
      category: "Fall Risk Assessment",
      icon: <Shield className="h-5 w-5" />,
      features: [
        "Walking steadiness analysis",
        "Activity level assessment",
        "Heart rate variability monitoring",
        "Fall risk factor identification",
        "Actionable prevention recommendations"
      ]
    }
  ]

  const technicalAchievements = [
    "Sophisticated health data processor with TypeScript types",
    "Real-time AI insights using Spark LLM API",
    "Interactive visualization components with hover states",
    "Comprehensive analytics engine with correlation calculations",
    "Health score algorithm based on multiple risk factors",
    "Data quality assessment framework",
    "Modular component architecture for scalability"
  ]

  const nextPhaseFeatures = [
    "Apple Watch real-time integration",
    "Advanced fall detection algorithms",
    "Machine learning model training",
    "Emergency response automation",
    "Healthcare provider integration",
    "Predictive health modeling"
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <h1 className="text-3xl font-bold">Phase 1 Foundation Complete!</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We've successfully built a comprehensive health data import and analytics foundation 
          with AI-powered insights, setting the stage for advanced fall risk monitoring.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge className="flex items-center gap-2" variant="default">
            <CheckCircle className="h-4 w-4" />
            Phase 1 Complete
          </Badge>
          <Badge className="flex items-center gap-2" variant="outline">
            <Rocket className="h-4 w-4" />
            Ready for Phase 2
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
              <div className="flex justify-between text-sm mb-2">
                <span>Phase 1: Foundation & Analytics</span>
                <span className="font-medium">100% Complete</span>
              </div>
              <Progress value={100} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Project Progress</span>
                <span className="font-medium">35% Complete</span>
              </div>
              <Progress value={35} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Features */}
      <div className="grid gap-6">
        <h2 className="text-2xl font-bold text-center">What We've Built</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
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
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
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
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {technicalAchievements.slice(0, Math.ceil(technicalAchievements.length / 2)).map((achievement, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{achievement}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {technicalAchievements.slice(Math.ceil(technicalAchievements.length / 2)).map((achievement, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
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
            What's Next: Phase 2 Enhanced Monitoring
          </CardTitle>
          <CardDescription>
            Building on our solid foundation to add real-time monitoring capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Upcoming Features
              </h4>
              <ul className="space-y-2">
                {nextPhaseFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Key Capabilities</h4>
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="font-medium text-sm">Real-time Fall Detection</div>
                  <div className="text-xs text-muted-foreground">
                    Advanced algorithms using accelerometer and gyroscope data
                  </div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="font-medium text-sm">Emergency Response</div>
                  <div className="text-xs text-muted-foreground">
                    Automated caregiver notifications and emergency services contact
                  </div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="font-medium text-sm">Predictive Modeling</div>
                  <div className="text-xs text-muted-foreground">
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
          <CardTitle className="text-center">Phase 1 Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-500">20+</div>
              <div className="text-sm text-muted-foreground">Health Metrics Analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-500">90</div>
              <div className="text-sm text-muted-foreground">Days Historical Data</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-500">5</div>
              <div className="text-sm text-muted-foreground">AI Insight Categories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500">10+</div>
              <div className="text-sm text-muted-foreground">Fall Risk Factors</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}