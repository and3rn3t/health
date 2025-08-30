import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Apple, 
  Download, 
  Gear, 
  Code, 
  TestTube, 
  Shield, 
  Watch, 
  Smartphone, 
  CheckCircle, 
  Circle, 
  Clock,
  AlertTriangle,
  FileText,
  Key,
  Database,
  CloudArrowUp,
  Terminal,
  Folder,
  Play,
  Bug
} from '@phosphor-icons/react'

interface SetupStep {
  id: string
  title: string
  description: string
  category: 'prerequisites' | 'xcode' | 'project' | 'healthkit' | 'watchos' | 'testing'
  priority: 'critical' | 'high' | 'medium'
  estimatedTime: string
  completed: boolean
  instructions: string[]
  tips?: string[]
  troubleshooting?: string[]
}

export default function XcodeDevelopmentSetup() {
  const [setupSteps, setSetupSteps] = useKV<SetupStep[]>('xcode-setup-steps', [
    // Prerequisites
    {
      id: 'apple-account',
      title: 'Apple ID & Developer Account',
      description: 'Create Apple ID and enroll in Apple Developer Program',
      category: 'prerequisites',
      priority: 'critical',
      estimatedTime: '2-3 hours',
      completed: false,
      instructions: [
        'Create an Apple ID at appleid.apple.com if you don\'t have one',
        'Visit developer.apple.com/programs/',
        'Enroll in Apple Developer Program ($99/year)',
        'Wait for approval (usually 24-48 hours)',
        'Access Apple Developer Portal with your credentials'
      ],
      tips: [
        'Use a professional email address for your Apple ID',
        'Keep your enrollment information readily available',
        'Consider using a business entity for commercial apps'
      ]
    },
    {
      id: 'mac-requirements',
      title: 'Mac System Requirements',
      description: 'Ensure your Mac meets development requirements',
      category: 'prerequisites',
      priority: 'critical',
      estimatedTime: '30 minutes',
      completed: false,
      instructions: [
        'macOS Sonoma 14.0 or later recommended',
        'At least 8GB RAM (16GB+ recommended)',
        'At least 200GB free storage space',
        'Stable internet connection for downloads',
        'Admin privileges on your Mac'
      ],
      tips: [
        'Close unnecessary applications during setup',
        'Ensure good internet connection for large downloads',
        'Consider using an external SSD for Xcode projects'
      ]
    },

    // Xcode Setup
    {
      id: 'xcode-installation',
      title: 'Install Xcode 15+',
      description: 'Download and install latest Xcode from App Store',
      category: 'xcode',
      priority: 'critical',
      estimatedTime: '2-4 hours',
      completed: false,
      instructions: [
        'Open Mac App Store',
        'Search for "Xcode" and click Install',
        'Wait for download (15GB+) and installation',
        'Launch Xcode and accept license agreements',
        'Install additional components when prompted'
      ],
      tips: [
        'Download will take time - plan accordingly',
        'Keep Mac plugged in during installation',
        'Don\'t interrupt the installation process'
      ],
      troubleshooting: [
        'If installation fails, try restarting and retry',
        'Clear App Store cache: Hold Option, click Apple menu > System Information',
        'Ensure sufficient storage space before starting'
      ]
    },
    {
      id: 'xcode-command-tools',
      title: 'Xcode Command Line Tools',
      description: 'Install command line developer tools',
      category: 'xcode',
      priority: 'high',
      estimatedTime: '30 minutes',
      completed: false,
      instructions: [
        'Open Terminal application',
        'Run: xcode-select --install',
        'Click "Install" in the popup dialog',
        'Wait for installation to complete',
        'Verify with: xcode-select -p'
      ],
      tips: [
        'This enables command-line development tools',
        'Required for many development workflows',
        'Automatically installed with full Xcode but worth verifying'
      ]
    },
    {
      id: 'simulator-setup',
      title: 'iOS & watchOS Simulators',
      description: 'Download and configure device simulators',
      category: 'xcode',
      priority: 'high',
      estimatedTime: '1-2 hours',
      completed: false,
      instructions: [
        'Open Xcode > Preferences > Components',
        'Download iOS 17+ simulators',
        'Download watchOS 10+ simulators',
        'Open Window > Devices and Simulators',
        'Create paired iPhone and Apple Watch simulators'
      ],
      tips: [
        'Download only the simulators you need initially',
        'Paired simulators are required for Watch app testing',
        'Consider downloading multiple iOS versions for compatibility testing'
      ]
    },

    // Project Setup
    {
      id: 'ios-project-creation',
      title: 'Create iOS App Project',
      description: 'Set up new iOS project with proper configuration',
      category: 'project',
      priority: 'critical',
      estimatedTime: '45 minutes',
      completed: false,
      instructions: [
        'Open Xcode > Create a new Xcode project',
        'Select iOS > App template',
        'Choose SwiftUI for interface and Swift for language',
        'Set Bundle Identifier (e.g., com.yourname.healthguard)',
        'Select Team (your Developer Account)',
        'Choose location and create project'
      ],
      tips: [
        'Use reverse domain notation for Bundle ID',
        'Bundle ID must be unique across App Store',
        'Team selection links to your Developer Account'
      ]
    },
    {
      id: 'project-settings',
      title: 'Configure Project Settings',
      description: 'Set up deployment targets and basic configuration',
      category: 'project',
      priority: 'high',
      estimatedTime: '30 minutes',
      completed: false,
      instructions: [
        'Set iOS Deployment Target to 16.0 or later',
        'Configure App Icons (1024x1024 for App Store)',
        'Set Display Name and Bundle Display Name',
        'Configure Launch Screen',
        'Set up Git repository for version control'
      ],
      tips: [
        'Higher deployment targets = newer features, fewer supported devices',
        'App icons must be exactly 1024x1024 pixels',
        'Initialize Git early for better version control'
      ]
    },

    // HealthKit Integration
    {
      id: 'healthkit-capability',
      title: 'Enable HealthKit Capability',
      description: 'Add HealthKit entitlement to iOS app',
      category: 'healthkit',
      priority: 'critical',
      estimatedTime: '15 minutes',
      completed: false,
      instructions: [
        'Select your app target in Xcode',
        'Go to Signing & Capabilities tab',
        'Click + Capability button',
        'Add "HealthKit" capability',
        'Configure Clinical Health Records if needed'
      ],
      tips: [
        'HealthKit capability automatically updates entitlements',
        'Clinical Health Records require additional approval',
        'Background delivery requires additional setup'
      ]
    },
    {
      id: 'healthkit-permissions',
      title: 'Configure HealthKit Permissions',
      description: 'Set up Info.plist with required HealthKit usage descriptions',
      category: 'healthkit',
      priority: 'critical',
      estimatedTime: '20 minutes',
      completed: false,
      instructions: [
        'Open Info.plist file',
        'Add NSHealthShareUsageDescription key',
        'Add NSHealthUpdateUsageDescription key',
        'Provide clear, user-friendly descriptions',
        'Add NSHealthClinicalHealthRecordsShareUsageDescription if needed'
      ],
      tips: [
        'Be specific about what health data you\'ll access',
        'Users see these descriptions when granting permissions',
        'Clear descriptions improve approval chances'
      ]
    },
    {
      id: 'healthkit-framework',
      title: 'Import HealthKit Framework',
      description: 'Add HealthKit framework and create data manager',
      category: 'healthkit',
      priority: 'high',
      estimatedTime: '1 hour',
      completed: false,
      instructions: [
        'Import HealthKit in your Swift files',
        'Create HKHealthStore instance',
        'Request authorization for required data types',
        'Implement data reading methods',
        'Set up background delivery if needed'
      ],
      tips: [
        'Only request permissions for data you actually use',
        'Users can deny specific data types',
        'Background delivery helps track real-time changes'
      ]
    },

    // watchOS Setup
    {
      id: 'watchos-target',
      title: 'Add watchOS App Target',
      description: 'Create companion Apple Watch application',
      category: 'watchos',
      priority: 'critical',
      estimatedTime: '30 minutes',
      completed: false,
      instructions: [
        'In Xcode project, File > New > Target',
        'Select watchOS > Watch App template',
        'Choose SwiftUI for interface',
        'Set Product Name (e.g., "HealthGuard Watch")',
        'Ensure Bundle Identifier follows pattern',
        'Create and configure the target'
      ],
      tips: [
        'Watch app Bundle ID should be iOS app Bundle ID + .watchkitapp',
        'Watch apps automatically inherit some iOS app capabilities',
        'Consider watch-specific features like complications'
      ]
    },
    {
      id: 'watch-healthkit',
      title: 'Configure Watch HealthKit',
      description: 'Set up HealthKit for watchOS target',
      category: 'watchos',
      priority: 'high',
      estimatedTime: '45 minutes',
      completed: false,
      instructions: [
        'Select watchOS target in project navigator',
        'Add HealthKit capability to Watch target',
        'Configure Watch Info.plist with usage descriptions',
        'Import HealthKit in Watch app files',
        'Implement Watch-specific health data access'
      ],
      tips: [
        'Watch can access more sensor data than iPhone',
        'Some HealthKit features are Watch-only (e.g., heart rate variability)',
        'Watch and iPhone apps can share HealthKit permissions'
      ]
    },
    {
      id: 'watch-connectivity',
      title: 'Set Up Watch Connectivity',
      description: 'Enable communication between iOS and watchOS apps',
      category: 'watchos',
      priority: 'high',
      estimatedTime: '1 hour',
      completed: false,
      instructions: [
        'Import WatchConnectivity framework in both targets',
        'Set up WCSession delegates',
        'Implement session activation',
        'Create data transfer methods',
        'Handle session state changes'
      ],
      tips: [
        'Both iOS and Watch apps need WCSession setup',
        'Test different connectivity scenarios',
        'Handle cases when Watch is not paired or available'
      ]
    },

    // Testing Setup
    {
      id: 'simulator-testing',
      title: 'Simulator Testing Setup',
      description: 'Configure and test with iOS and watchOS simulators',
      category: 'testing',
      priority: 'high',
      estimatedTime: '1 hour',
      completed: false,
      instructions: [
        'Build and run iOS app in simulator',
        'Build and run Watch app in paired simulator',
        'Test HealthKit permission flow',
        'Verify data sharing between apps',
        'Test basic UI and navigation'
      ],
      tips: [
        'Simulators don\'t have real health data - use mock data',
        'Some HealthKit features require physical devices',
        'Test on multiple device sizes and orientations'
      ]
    },
    {
      id: 'device-provisioning',
      title: 'Device Provisioning Setup',
      description: 'Configure devices for development and testing',
      category: 'testing',
      priority: 'critical',
      estimatedTime: '45 minutes',
      completed: false,
      instructions: [
        'Connect iPhone to Mac via USB',
        'Add device to Apple Developer Portal',
        'Create development provisioning profiles',
        'Install profiles in Xcode',
        'Test app installation on physical device'
      ],
      tips: [
        'Physical devices required for full HealthKit testing',
        'Ensure devices are running supported iOS/watchOS versions',
        'Keep provisioning profiles up to date'
      ]
    }
  ])

  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const toggleStep = (stepId: string) => {
    setSetupSteps(currentSteps => 
      currentSteps.map(step => 
        step.id === stepId ? { ...step, completed: !step.completed } : step
      )
    )
  }

  const getStepsByCategory = (category: string) => {
    if (category === 'all') return setupSteps
    return setupSteps.filter(step => step.category === category)
  }

  const calculateProgress = (category?: string) => {
    const relevantSteps = category ? setupSteps.filter(s => s.category === category) : setupSteps
    const completedSteps = relevantSteps.filter(s => s.completed).length
    return Math.round((completedSteps / relevantSteps.length) * 100)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prerequisites': return <CheckCircle className="h-4 w-4" />
      case 'xcode': return <Code className="h-4 w-4" />
      case 'project': return <Folder className="h-4 w-4" />
      case 'healthkit': return <Shield className="h-4 w-4" />
      case 'watchos': return <Watch className="h-4 w-4" />
      case 'testing': return <TestTube className="h-4 w-4" />
      default: return <Circle className="h-4 w-4" />
    }
  }

  const categories = [
    { id: 'all', label: 'All Steps', icon: <FileText className="h-4 w-4" /> },
    { id: 'prerequisites', label: 'Prerequisites', icon: <CheckCircle className="h-4 w-4" /> },
    { id: 'xcode', label: 'Xcode Setup', icon: <Code className="h-4 w-4" /> },
    { id: 'project', label: 'iOS Project', icon: <Smartphone className="h-4 w-4" /> },
    { id: 'healthkit', label: 'HealthKit', icon: <Shield className="h-4 w-4" /> },
    { id: 'watchos', label: 'watchOS', icon: <Watch className="h-4 w-4" /> },
    { id: 'testing', label: 'Testing', icon: <TestTube className="h-4 w-4" /> }
  ]

  const overallProgress = calculateProgress()
  const criticalStepsRemaining = setupSteps.filter(s => s.priority === 'critical' && !s.completed).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-6 w-6" />
            Xcode Development Environment Setup
          </CardTitle>
          <CardDescription>
            Complete guide to setting up Xcode for iOS and watchOS development with HealthKit integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{overallProgress}%</div>
              <div className="text-sm text-muted-foreground">Setup Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{setupSteps.filter(s => s.completed).length}/{setupSteps.length}</div>
              <div className="text-sm text-muted-foreground">Steps Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{criticalStepsRemaining}</div>
              <div className="text-sm text-muted-foreground">Critical Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">~8-12h</div>
              <div className="text-sm text-muted-foreground">Total Time Est.</div>
            </div>
          </div>
          <Progress value={overallProgress} className="w-full" />
          
          {criticalStepsRemaining > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {criticalStepsRemaining} critical setup steps remaining. Complete these first for basic functionality.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-5 w-5" />
              Installation Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Xcode & Tools</span>
                <span>{calculateProgress('xcode')}%</span>
              </div>
              <Progress value={calculateProgress('xcode')} />
              <div className="text-xs text-muted-foreground">
                ~3-5 hours download time
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gear className="h-5 w-5" />
              Configuration Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Project & HealthKit</span>
                <span>{Math.round((calculateProgress('project') + calculateProgress('healthkit')) / 2)}%</span>
              </div>
              <Progress value={Math.round((calculateProgress('project') + calculateProgress('healthkit')) / 2)} />
              <div className="text-xs text-muted-foreground">
                Project setup & permissions
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="h-5 w-5" />
              Testing Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Devices & Testing</span>
                <span>{calculateProgress('testing')}%</span>
              </div>
              <Progress value={calculateProgress('testing')} />
              <div className="text-xs text-muted-foreground">
                Simulator & device testing
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Setup Steps */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1 text-xs">
              {category.icon}
              <span className="hidden sm:inline">{category.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{category.label}</h3>
              <Badge variant="outline">
                {getStepsByCategory(category.id).filter(s => s.completed).length} / {getStepsByCategory(category.id).length} completed
              </Badge>
            </div>

            <div className="space-y-4">
              {getStepsByCategory(category.id).map((step) => (
                <Card key={step.id} className={step.completed ? 'opacity-75' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={step.completed}
                        onCheckedChange={() => toggleStep(step.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {step.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(step.priority)}`} />
                            <span className="text-xs text-muted-foreground">{step.estimatedTime}</span>
                            {getCategoryIcon(step.category)}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        
                        <div className="space-y-3">
                          <div>
                            <h5 className="text-sm font-medium mb-2">Instructions:</h5>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                              {step.instructions.map((instruction, index) => (
                                <li key={index}>{instruction}</li>
                              ))}
                            </ol>
                          </div>

                          {step.tips && step.tips.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2 text-blue-600">💡 Tips:</h5>
                              <ul className="list-disc list-inside space-y-1 text-sm text-blue-600">
                                {step.tips.map((tip, index) => (
                                  <li key={index}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {step.troubleshooting && step.troubleshooting.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2 text-amber-600">🔧 Troubleshooting:</h5>
                              <ul className="list-disc list-inside space-y-1 text-sm text-amber-600">
                                {step.troubleshooting.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Code Examples & Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Essential Code Snippets
            </CardTitle>
            <CardDescription>
              Key code patterns for HealthKit integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">HealthKit Authorization:</h4>
              <div className="bg-muted p-3 rounded-lg text-xs font-mono">
                <pre>{`import HealthKit

let healthStore = HKHealthStore()

let readTypes: Set<HKObjectType> = [
    HKObjectType.quantityType(forIdentifier: .stepCount)!,
    HKObjectType.quantityType(forIdentifier: .heartRate)!,
    HKObjectType.quantityType(forIdentifier: .walkingSpeed)!
]

healthStore.requestAuthorization(
    toShare: nil, 
    read: readTypes
) { success, error in
    if success {
        // Start reading health data
    }
}`}</pre>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Watch Connectivity Setup:</h4>
              <div className="bg-muted p-3 rounded-lg text-xs font-mono">
                <pre>{`import WatchConnectivity

class WatchSessionManager: NSObject, WCSessionDelegate {
    static let shared = WatchSessionManager()
    
    override init() {
        super.init()
        if WCSession.isSupported() {
            WCSession.default.delegate = self
            WCSession.default.activate()
        }
    }
}`}</pre>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Developer Resources
            </CardTitle>
            <CardDescription>
              Essential documentation and tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Apple Documentation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3" />
                  <a href="https://developer.apple.com/documentation/healthkit" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    HealthKit Framework
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3" />
                  <a href="https://developer.apple.com/documentation/watchos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    watchOS Development
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3" />
                  <a href="https://developer.apple.com/documentation/watchconnectivity" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Watch Connectivity
                  </a>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Development Tools</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3 w-3" />
                  <span>Xcode Instruments for performance profiling</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bug className="h-3 w-3" />
                  <span>Health app on device for testing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Watch className="h-3 w-3" />
                  <span>Apple Watch app for real sensor testing</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Testing Requirements</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-3 w-3" />
                  <span>iPhone 8 or later for testing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Watch className="h-3 w-3" />
                  <span>Apple Watch Series 3 or later</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="h-3 w-3" />
                  <span>Valid Developer Account for device testing</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}