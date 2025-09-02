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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Apple,
  Heart,
  Watch,
  Smartphone,
  Shield,
  Code,
  Database,
  CloudUpload,
  Settings,
  FlaskConical,
  FileText,
  Key,
  Download,
  Terminal,
  Bug,
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface HealthKitComponent {
  id: string;
  title: string;
  description: string;
  category:
    | 'setup'
    | 'data'
    | 'permissions'
    | 'realtime'
    | 'security'
    | 'testing';
  implementation: 'required' | 'recommended' | 'optional';
  complexity: 'basic' | 'intermediate' | 'advanced';
  estimatedHours: number;
  dependencies: string[];
  completed: boolean;
  codeExample?: string;
  documentation?: string;
  notes?: string[];
}

interface HealthDataType {
  identifier: string;
  displayName: string;
  category:
    | 'vitals'
    | 'activity'
    | 'body'
    | 'reproductive'
    | 'nutrition'
    | 'sleep';
  appleWatchAvailable: boolean;
  backgroundDelivery: boolean;
  description: string;
  requiredForFallRisk: boolean;
}

export default function ComprehensiveAppleHealthKitGuide() {
  const [components, setComponents] = useKV<HealthKitComponent[]>(
    'healthkit-components',
    [
      // Setup Components
      {
        id: 'developer-account',
        title: 'Apple Developer Program Setup',
        description:
          'Enroll in Apple Developer Program and configure certificates',
        category: 'setup',
        implementation: 'required',
        complexity: 'basic',
        estimatedHours: 3,
        dependencies: [],
        completed: false,
        documentation: 'https://developer.apple.com/programs/',
        notes: [
          'Required for App Store submission',
          'Costs $99/year for individual developers',
          'Business entity recommended for commercial apps',
        ],
      },
      {
        id: 'xcode-project',
        title: 'iOS Project with HealthKit',
        description: 'Create iOS project with HealthKit capability enabled',
        category: 'setup',
        implementation: 'required',
        complexity: 'basic',
        estimatedHours: 2,
        dependencies: ['developer-account'],
        completed: false,
        codeExample: `// Add to project capabilities
// 1. Select target > Signing & Capabilities
// 2. Add HealthKit capability
// 3. Configure Info.plist with usage descriptions`,
        notes: [
          'HealthKit capability adds required entitlements',
          'Must provide clear usage descriptions',
          'Clinical Health Records require additional approval',
        ],
      },
      {
        id: 'watchos-target',
        title: 'Apple Watch Target Setup',
        description: 'Add watchOS app target for advanced sensor access',
        category: 'setup',
        implementation: 'required',
        complexity: 'intermediate',
        estimatedHours: 2,
        dependencies: ['xcode-project'],
        completed: false,
        notes: [
          'Required for accessing advanced Watch sensors',
          'Enables real-time fall detection capabilities',
          'Bundle ID must follow specific pattern',
        ],
      },

      // Data Management Components
      {
        id: 'healthstore-manager',
        title: 'HealthStore Manager',
        description: 'Core class for managing HealthKit data operations',
        category: 'data',
        implementation: 'required',
        complexity: 'intermediate',
        estimatedHours: 8,
        dependencies: ['xcode-project'],
        completed: false,
        codeExample: `import HealthKit

class HealthStoreManager: ObservableObject {
    private let healthStore = HKHealthStore()
    
    func requestAuthorization(completion: @escaping (Bool, Error?) -> Void) {
        let readTypes: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .walkingSpeed)!,
            HKObjectType.quantityType(forIdentifier: .walkingStepLength)!,
            HKObjectType.quantityType(forIdentifier: .walkingAsymmetryPercentage)!,
            HKObjectType.quantityType(forIdentifier: .walkingSteadiness)!
        ]
        
        healthStore.requestAuthorization(toShare: nil, read: readTypes, completion: completion)
    }
    
    func fetchHealthData<T: HKSample>(
        for type: HKSampleType,
        predicate: NSPredicate? = nil,
        completion: @escaping ([T]?, Error?) -> Void
    ) {
        let query = HKSampleQuery(
            sampleType: type,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
        ) { _, samples, error in
            completion(samples as? [T], error)
        }
        
        healthStore.execute(query)
    }
}`,
        notes: [
          'Singleton pattern recommended for HealthStore access',
          'Handle authorization gracefully - users can deny specific data types',
          'Implement proper error handling for all queries',
        ],
      },
      {
        id: 'background-delivery',
        title: 'Background Health Monitoring',
        description:
          'Enable background app refresh for real-time health monitoring',
        category: 'realtime',
        implementation: 'recommended',
        complexity: 'advanced',
        estimatedHours: 6,
        dependencies: ['healthstore-manager'],
        completed: false,
        codeExample: `func enableBackgroundDelivery() {
    let stepType = HKObjectType.quantityType(forIdentifier: .stepCount)!
    
    healthStore.enableBackgroundDelivery(
        for: stepType,
        frequency: .immediate
    ) { success, error in
        if success {
            // Set up observer query for real-time updates
            self.setupObserverQuery(for: stepType)
        }
    }
}

private func setupObserverQuery(for type: HKSampleType) {
    let query = HKObserverQuery(sampleType: type, predicate: nil) { _, _, error in
        // Handle new data arrival
        DispatchQueue.main.async {
            self.fetchLatestData(for: type)
        }
    }
    
    healthStore.execute(query)
}`,
        notes: [
          'Requires Background App Refresh capability',
          'Battery impact consideration for users',
          'Not all data types support background delivery',
        ],
      },
      {
        id: 'fall-detection-algorithm',
        title: 'Advanced Fall Detection Algorithm',
        description:
          'Multi-sensor fall detection using accelerometer and gyroscope',
        category: 'realtime',
        implementation: 'required',
        complexity: 'advanced',
        estimatedHours: 20,
        dependencies: ['watchos-target', 'background-delivery'],
        completed: false,
        codeExample: `import CoreMotion
import HealthKit

class FallDetectionManager: ObservableObject {
    private let motionManager = CMMotionManager()
    private let healthStore = HKHealthStore()
    
    func startFallDetection() {
        // Configure motion updates
        motionManager.accelerometerUpdateInterval = 0.1
        motionManager.gyroUpdateInterval = 0.1
        
        // Start accelerometer monitoring
        motionManager.startAccelerometerUpdates(to: .main) { data, error in
            guard let acceleration = data?.acceleration else { return }
            self.analyzeAcceleration(acceleration)
        }
        
        // Start gyroscope monitoring  
        motionManager.startGyroUpdates(to: .main) { data, error in
            guard let rotation = data?.rotationRate else { return }
            self.analyzeRotation(rotation)
        }
    }
    
    private func analyzeAcceleration(_ acceleration: CMAcceleration) {
        let magnitude = sqrt(
            acceleration.x * acceleration.x + 
            acceleration.y * acceleration.y + 
            acceleration.z * acceleration.z
        )
        
        // Fall detection threshold (adjust based on testing)
        if magnitude > 2.5 {
            detectPotentialFall()
        }
    }
    
    private func detectPotentialFall() {
        // Implement fall confirmation logic
        // Check for impact followed by stillness
        // Trigger emergency response if confirmed
    }
}`,
        notes: [
          'Requires extensive testing to minimize false positives',
          'Consider user context (exercise vs. daily activities)',
          'Implement confirmation dialog before emergency alert',
        ],
      },

      // Permissions & Security
      {
        id: 'privacy-permissions',
        title: 'Privacy & Permissions Management',
        description: 'Implement proper permission flows and privacy controls',
        category: 'permissions',
        implementation: 'required',
        complexity: 'intermediate',
        estimatedHours: 4,
        dependencies: ['healthstore-manager'],
        completed: false,
        codeExample: `// Info.plist entries required
<key>NSHealthShareUsageDescription</key>
<string>This app reads your health data to provide personalized fall risk assessment and emergency monitoring features.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>This app may update your health data with fall detection events and emergency response information.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Location access is used for emergency response to share your location with emergency contacts.</string>`,
        notes: [
          'Be specific about data usage in permission descriptions',
          'Users can grant/deny individual data types',
          'Gracefully handle partial permissions',
        ],
      },
      {
        id: 'data-encryption',
        title: 'Health Data Encryption & Security',
        description:
          'Implement end-to-end encryption for health data transmission',
        category: 'security',
        implementation: 'required',
        complexity: 'advanced',
        estimatedHours: 12,
        dependencies: ['healthstore-manager'],
        completed: false,
        codeExample: `import CryptoKit

class HealthDataEncryption {
    private let symmetricKey = SymmetricKey(size: .bits256)
    
    func encryptHealthData<T: Codable>(_ data: T) throws -> Data {
        let jsonData = try JSONEncoder().encode(data)
        let encryptedData = try AES.GCM.seal(jsonData, using: symmetricKey)
        return encryptedData.combined!
    }
    
    func decryptHealthData<T: Codable>(_ encryptedData: Data, type: T.Type) throws -> T {
        let sealedBox = try AES.GCM.SealedBox(combined: encryptedData)
        let decryptedData = try AES.GCM.open(sealedBox, using: symmetricKey)
        return try JSONDecoder().decode(type, from: decryptedData)
    }
}`,
        notes: [
          'HIPAA compliance considerations for health data',
          'Encrypt data in transit and at rest',
          'Implement proper key management',
        ],
      },

      // Integration Components
      {
        id: 'websocket-bridge',
        title: 'WebSocket Bridge to Web App',
        description:
          'Real-time data streaming from native app to web application',
        category: 'realtime',
        implementation: 'required',
        complexity: 'advanced',
        estimatedHours: 16,
        dependencies: ['healthstore-manager', 'data-encryption'],
        completed: false,
        codeExample: `import Network

class HealthDataWebSocketBridge: ObservableObject {
    private var webSocketTask: URLSessionWebSocketTask?
    private let urlSession = URLSession(configuration: .default)
    
    func connect(to url: URL) {
        webSocketTask = urlSession.webSocketTask(with: url)
        webSocketTask?.resume()
        receiveMessages()
    }
    
    func sendHealthData<T: Codable>(_ data: T) {
        guard let webSocketTask = webSocketTask else { return }
        
        do {
            let jsonData = try JSONEncoder().encode(data)
            let message = URLSessionWebSocketTask.Message.data(jsonData)
            
            webSocketTask.send(message) { error in
                if let error = error {
                    print("WebSocket send error: \\(error)")
                }
            }
        } catch {
            print("JSON encoding error: \\(error)")
        }
    }
    
    private func receiveMessages() {
        webSocketTask?.receive { result in
            switch result {
            case .success(let message):
                // Handle incoming messages
                self.receiveMessages() // Continue listening
            case .failure(let error):
                print("WebSocket receive error: \\(error)")
            }
        }
    }
}`,
        notes: [
          'Implement reconnection logic for Network interruptions',
          'Handle authentication for secure WebSocket connections',
          'Consider using Socket.IO for more robust messaging',
        ],
      },

      // Testing Components
      {
        id: 'simulator-testing',
        title: 'Simulator Health Data Testing',
        description: 'Set up mock health data for development and testing',
        category: 'testing',
        implementation: 'recommended',
        complexity: 'basic',
        estimatedHours: 3,
        dependencies: ['healthstore-manager'],
        completed: false,
        codeExample: `class MockHealthDataGenerator {
    static func generateMockData() -> [HKQuantitySample] {
        var samples: [HKQuantitySample] = []
        let calendar = Calendar.current
        
        // Generate step count data for last 7 days
        for day in 0..<7 {
            let date = calendar.date(byAdding: .day, value: -day, to: Date())!
            let steps = Double.random(in: 3000...12000)
            
            if let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) {
                let quantity = HKQuantity(unit: HKUnit.count(), doubleValue: steps)
                let sample = HKQuantitySample(
                    type: stepType,
                    quantity: quantity,
                    start: date,
                    end: date
                )
                samples.append(sample)
            }
        }
        
        return samples
    }
}`,
        notes: [
          "Simulators don't have real health data",
          'Create realistic test scenarios for different user profiles',
          'Test edge cases like missing data or sensor failures',
        ],
      },
      {
        id: 'device-testing',
        title: 'Physical Device Testing Protocol',
        description: 'Comprehensive testing on real iPhone and Apple Watch',
        category: 'testing',
        implementation: 'required',
        complexity: 'intermediate',
        estimatedHours: 8,
        dependencies: ['fall-detection-algorithm', 'websocket-bridge'],
        completed: false,
        notes: [
          'Test with real health data from volunteers',
          'Validate fall detection accuracy with controlled scenarios',
          'Test battery impact of continuous monitoring',
          'Verify emergency response system functionality',
        ],
      },
    ]
  );

  const [healthDataTypes] = useKV<HealthDataType[]>('health-data-types', [
    {
      identifier: 'stepCount',
      displayName: 'Step Count',
      category: 'activity',
      appleWatchAvailable: true,
      backgroundDelivery: true,
      description: 'Daily step count for activity monitoring',
      requiredForFallRisk: true,
    },
    {
      identifier: 'walkingSpeed',
      displayName: 'Walking Speed',
      category: 'activity',
      appleWatchAvailable: true,
      backgroundDelivery: true,
      description: 'Average walking speed - key fall risk indicator',
      requiredForFallRisk: true,
    },
    {
      identifier: 'walkingSteadiness',
      displayName: 'Walking Steadiness',
      category: 'activity',
      appleWatchAvailable: true,
      backgroundDelivery: true,
      description: 'Gait stability measurement - primary fall risk factor',
      requiredForFallRisk: true,
    },
    {
      identifier: 'heartRate',
      displayName: 'Heart Rate',
      category: 'vitals',
      appleWatchAvailable: true,
      backgroundDelivery: true,
      description: 'Real-time heart rate monitoring',
      requiredForFallRisk: false,
    },
    {
      identifier: 'heartRateVariability',
      displayName: 'Heart Rate Variability',
      category: 'vitals',
      appleWatchAvailable: true,
      backgroundDelivery: false,
      description: 'HRV for stress and recovery monitoring',
      requiredForFallRisk: false,
    },
    {
      identifier: 'walkingAsymmetryPercentage',
      displayName: 'Walking Asymmetry',
      category: 'activity',
      appleWatchAvailable: true,
      backgroundDelivery: true,
      description: 'Gait asymmetry - indicates balance issues',
      requiredForFallRisk: true,
    },
    {
      identifier: 'walkingStepLength',
      displayName: 'Step Length',
      category: 'activity',
      appleWatchAvailable: true,
      backgroundDelivery: true,
      description: 'Average step length measurement',
      requiredForFallRisk: true,
    },
    {
      identifier: 'bloodOxygenSaturation',
      displayName: 'Blood Oxygen',
      category: 'vitals',
      appleWatchAvailable: true,
      backgroundDelivery: false,
      description: 'Blood oxygen saturation levels',
      requiredForFallRisk: false,
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleComponent = (componentId: string) => {
    setComponents((currentComponents) =>
      currentComponents.map((comp) =>
        comp.id === componentId ? { ...comp, completed: !comp.completed } : comp
      )
    );
  };

  const getComponentsByCategory = (category: string) => {
    if (category === 'all') return components;
    return components.filter((comp) => comp.category === category);
  };

  const calculateProgress = (category?: string) => {
    const relevantComponents = category
      ? components.filter((c) => c.category === category)
      : components;
    const completedComponents = relevantComponents.filter(
      (c) => c.completed
    ).length;
    return Math.round((completedComponents / relevantComponents.length) * 100);
  };

  const getTotalHours = (category?: string) => {
    const relevantComponents = category
      ? components.filter((c) => c.category === category)
      : components;
    return relevantComponents.reduce(
      (total, comp) => total + comp.estimatedHours,
      0
    );
  };

  const getImplementationColor = (implementation: string) => {
    switch (implementation) {
      case 'required':
        return 'bg-red-500';
      case 'recommended':
        return 'bg-yellow-500';
      case 'optional':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'basic':
        return 'text-green-600';
      case 'intermediate':
        return 'text-yellow-600';
      case 'advanced':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const categories = [
    {
      id: 'all',
      label: 'All Components',
      icon: <FileText className="h-4 w-4" />,
    },
    { id: 'setup', label: 'Setup', icon: <Settings className="h-4 w-4" /> },
    {
      id: 'data',
      label: 'Data Management',
      icon: <Database className="h-4 w-4" />,
    },
    {
      id: 'permissions',
      label: 'Permissions',
      icon: <Shield className="h-4 w-4" />,
    },
    {
      id: 'realtime',
      label: 'Real-time',
      icon: <CloudUpload className="h-4 w-4" />,
    },
    { id: 'security', label: 'Security', icon: <Key className="h-4 w-4" /> },
    { id: 'testing', label: 'Testing', icon: <FlaskConical className="h-4 w-4" /> },
  ];

  const overallProgress = calculateProgress();
  const requiredComponents = components.filter(
    (c) => c.implementation === 'required'
  );
  const requiredCompleted = requiredComponents.filter(
    (c) => c.completed
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-6 w-6" />
            Comprehensive Apple HealthKit & Watch Integration Guide
          </CardTitle>
          <CardDescription>
            Production-ready implementation guide for full Apple Health
            ecosystem integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="text-center">
              <div className="text-primary text-2xl font-bold">
                {overallProgress}%
              </div>
              <div className="text-muted-foreground text-sm">
                Overall Progress
              </div>
            </div>
            <div className="text-center">
              <div className="text-destructive text-2xl font-bold">
                {requiredCompleted}/{requiredComponents.length}
              </div>
              <div className="text-muted-foreground text-sm">
                Required Complete
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{getTotalHours()}h</div>
              <div className="text-muted-foreground text-sm">
                Total Est. Time
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {healthDataTypes.filter((t) => t.requiredForFallRisk).length}
              </div>
              <div className="text-muted-foreground text-sm">
                Critical Data Types
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {healthDataTypes.filter((t) => t.appleWatchAvailable).length}
              </div>
              <div className="text-muted-foreground text-sm">
                Watch Available
              </div>
            </div>
          </div>
          <Progress value={overallProgress} className="w-full" />

          {requiredCompleted < requiredComponents.length && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {requiredComponents.length - requiredCompleted} required
                components remaining for basic functionality.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Health Data Types Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-6 w-6" />
            HealthKit Data Types for Fall Risk Assessment
          </CardTitle>
          <CardDescription>
            Critical health metrics available through Apple HealthKit and Apple
            Watch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {healthDataTypes.map((dataType) => (
              <div
                key={dataType.identifier}
                className={`rounded-lg border p-4 ${dataType.requiredForFallRisk ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-medium">{dataType.displayName}</h4>
                  <div className="flex items-center gap-2">
                    {dataType.appleWatchAvailable && (
                      <Watch className="h-4 w-4 text-blue-600" />
                    )}
                    {dataType.backgroundDelivery && (
                      <CloudUpload className="h-4 w-4 text-green-600" />
                    )}
                    {dataType.requiredForFallRisk && (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground mb-2 text-sm">
                  {dataType.description}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {dataType.category}
                  </Badge>
                  {dataType.requiredForFallRisk && (
                    <Badge variant="destructive" className="text-xs">
                      Fall Risk Critical
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 text-blue-600" />
              <div>
                <h4 className="mb-2 font-medium text-blue-900">
                  Data Type Legend
                </h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <Watch className="h-4 w-4" />
                    <span>Available on Apple Watch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CloudUpload className="h-4 w-4" />
                    <span>Supports background delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Critical for fall risk assessment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Components */}
      <Tabs
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-7">
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
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {
                    getComponentsByCategory(category.id).filter(
                      (c) => c.completed
                    ).length
                  }{' '}
                  / {getComponentsByCategory(category.id).length} completed
                </Badge>
                <Badge variant="secondary">
                  {getTotalHours(
                    category.id === 'all' ? undefined : category.id
                  )}
                  h estimated
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {getComponentsByCategory(category.id).map((component) => (
                <Card
                  key={component.id}
                  className={component.completed ? 'opacity-75' : ''}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={component.completed}
                            onChange={() => toggleComponent(component.id)}
                            className="text-primary h-4 w-4"
                          />
                          <h4
                            className={`font-medium ${component.completed ? 'text-muted-foreground line-through' : ''}`}
                          >
                            {component.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${getImplementationColor(component.implementation)}`}
                          />
                          <span className="text-muted-foreground text-xs">
                            {component.estimatedHours}h
                          </span>
                          <span
                            className={`text-xs font-medium ${getComplexityColor(component.complexity)}`}
                          >
                            {component.complexity}
                          </span>
                        </div>
                      </div>

                      <p className="text-muted-foreground text-sm">
                        {component.description}
                      </p>

                      {component.dependencies.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="h-3 w-3" />
                          <span className="text-muted-foreground">
                            Depends on:
                          </span>
                          {component.dependencies.map((depId) => {
                            const depComponent = components.find(
                              (c) => c.id === depId
                            );
                            return (
                              <Badge
                                key={depId}
                                variant="outline"
                                className="text-xs"
                              >
                                {depComponent?.title}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      {component.codeExample && (
                        <div className="space-y-2">
                          <h5 className="flex items-center gap-2 text-sm font-medium">
                            <Code className="h-4 w-4" />
                            Code Example:
                          </h5>
                          <div className="bg-muted overflow-x-auto rounded-lg p-4 font-mono text-xs">
                            <pre>{component.codeExample}</pre>
                          </div>
                        </div>
                      )}

                      {component.notes && component.notes.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="flex items-center gap-2 text-sm font-medium">
                            <Lightbulb className="h-4 w-4" />
                            Implementation Notes:
                          </h5>
                          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                            {component.notes.map((note, index) => (
                              <li key={index}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {component.documentation && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <a
                            href={component.documentation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm hover:underline"
                          >
                            Official Documentation
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-6 w-6" />
            Quick Start Implementation Order
          </CardTitle>
          <CardDescription>
            Recommended implementation sequence for fastest time to working
            prototype
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-3">
                <h4 className="text-primary font-medium">
                  Phase 1: Foundation (8-10h)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>Apple Developer Account</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>iOS Project with HealthKit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>HealthStore Manager</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>Privacy Permissions</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-primary font-medium">
                  Phase 2: Core Features (25-30h)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>Apple Watch Target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>Fall Detection Algorithm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>WebSocket Bridge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>Data Encryption</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-primary font-medium">
                  Phase 3: Production (15-20h)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>Background Monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>Device Testing Protocol</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>Performance Optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>App Store Submission</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Apple HealthKit integration requires
                physical iOS devices for full testing. Budget for iPhone and
                Apple Watch hardware costs. App Store review process typically
                takes 1-3 business days.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
