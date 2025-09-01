import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DeviceMobile,
  WifiHigh,
  Cloud,
  Pulse,
  Gear,
  Lightning,
  Shield,
  Warning,
  CheckCircle,
  Clock,
  BellRinging,
  Heart,
  Activity,
  Phone,
} from '@phosphor-icons/react';

interface ToolingRequirement {
  name: string;
  description: string;
  status: 'available' | 'required' | 'optional';
  category: 'hardware' | 'software' | 'service';
  implementation: string;
  cost?: string;
}

const toolingRequirements: ToolingRequirement[] = [
  // Hardware Requirements
  {
    name: 'Apple Watch (Series 4+)',
    description:
      'Primary fall detection sensor with built-in accelerometer and gyroscope',
    status: 'required',
    category: 'hardware',
    implementation:
      'Apple Watch Fall Detection API - automatically detects hard falls',
    cost: '$249 - $799',
  },
  {
    name: 'iPhone (iOS 14+)',
    description: 'Data processing hub and emergency communication device',
    status: 'required',
    category: 'hardware',
    implementation:
      'HealthKit integration for sensor data and emergency calling',
    cost: '$429 - $1,199',
  },
  {
    name: 'Smart Home Sensors',
    description:
      'Motion sensors, cameras, or smart floor mats for comprehensive monitoring',
    status: 'optional',
    category: 'hardware',
    implementation: 'HomeKit-compatible sensors with motion/impact detection',
    cost: '$50 - $300 per sensor',
  },

  // Software Requirements
  {
    name: 'HealthKit Framework',
    description: "Apple's health data platform for accessing sensor readings",
    status: 'available',
    category: 'software',
    implementation:
      'HKHealthStore API for real-time accelerometer and motion data',
    cost: 'Free with iOS',
  },
  {
    name: 'Core Motion',
    description: 'Low-level access to device motion sensors and algorithms',
    status: 'available',
    category: 'software',
    implementation: 'CMMotionManager for custom fall detection algorithms',
    cost: 'Free with iOS',
  },
  {
    name: 'Machine Learning Model',
    description: 'AI model trained to distinguish falls from normal activities',
    status: 'required',
    category: 'software',
    implementation: 'Core ML model trained on accelerometer patterns',
    cost: 'Development: $10k - $50k',
  },
  {
    name: 'Background Processing',
    description: 'Continuous monitoring even when app is not active',
    status: 'required',
    category: 'software',
    implementation: 'Background App Refresh + Silent Push Notifications',
    cost: 'Included in app development',
  },

  // Service Requirements
  {
    name: 'Emergency Services Integration',
    description: 'Automatic 911 calling and emergency contact notification',
    status: 'required',
    category: 'service',
    implementation: 'CallKit framework + SMS/call APIs',
    cost: 'Per-use charges apply',
  },
  {
    name: 'Real-time Database',
    description: 'Cloud storage for immediate data sync and emergency alerts',
    status: 'required',
    category: 'service',
    implementation: 'Firebase Realtime Database or AWS DynamoDB',
    cost: '$25 - $100/month',
  },
  {
    name: 'Push Notification Service',
    description: 'Instant alerts to caregivers and emergency contacts',
    status: 'required',
    category: 'service',
    implementation: 'Apple Push Notification Service (APNs)',
    cost: 'Free up to 2M notifications/month',
  },
  {
    name: 'Location Services',
    description: 'GPS tracking for emergency responder location accuracy',
    status: 'required',
    category: 'service',
    implementation: 'Core Location with continuous background updates',
    cost: 'Included in iOS',
  },
];

interface MonitoringFlow {
  step: number;
  title: string;
  description: string;
  technology: string;
  timing: string;
  icon: React.ReactNode;
}

const monitoringFlow: MonitoringFlow[] = [
  {
    step: 1,
    title: 'Continuous Sensor Monitoring',
    description:
      'Apple Watch continuously monitors accelerometer, gyroscope, and motion patterns',
    technology: 'Core Motion + HealthKit',
    timing: '24/7 Background',
    icon: <Activity className="h-5 w-5" />,
  },
  {
    step: 2,
    title: 'Pattern Recognition',
    description:
      'ML model analyzes motion data to distinguish falls from normal activities',
    technology: 'Core ML + Custom Algorithm',
    timing: 'Real-time (~100ms)',
    icon: <Pulse className="h-5 w-5" />,
  },
  {
    step: 3,
    title: 'Fall Confirmation',
    description: 'System confirms fall detection and prompts user for response',
    technology: 'Local Processing + UI Alert',
    timing: '1-2 seconds',
    icon: <Warning className="h-5 w-5" />,
  },
  {
    step: 4,
    title: 'Emergency Response',
    description:
      'If no response, automatically contacts emergency services and caregivers',
    technology: 'CallKit + Push Notifications',
    timing: '10-60 seconds delay',
    icon: <Phone className="h-5 w-5" />,
  },
  {
    step: 5,
    title: 'Location Sharing',
    description:
      'Precise GPS coordinates shared with emergency contacts and responders',
    technology: 'Core Location + Cloud Sync',
    timing: 'Immediate',
    icon: <Lightning className="h-5 w-5" />,
  },
  {
    step: 6,
    title: 'Incident Documentation',
    description:
      'Fall details recorded for medical review and pattern analysis',
    technology: 'Cloud Database + HealthKit',
    timing: 'Post-incident',
    icon: <Heart className="h-5 w-5" />,
  },
];

export default function FallMonitoringTooling() {
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'hardware' | 'software' | 'service'
  >('all');

  const filteredRequirements =
    selectedCategory === 'all'
      ? toolingRequirements
      : toolingRequirements.filter((req) => req.category === selectedCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'required':
        return 'bg-red-100 text-red-800';
      case 'optional':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hardware':
        return <DeviceMobile className="h-4 w-4" />;
      case 'software':
        return <Gear className="h-4 w-4" />;
      case 'service':
        return <Cloud className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <Warning className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>
            Real-time fall monitoring requires comprehensive infrastructure.
          </strong>{' '}
          This page outlines the technical requirements, costs, and
          implementation details needed for actual fall detection.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="requirements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="workflow">Detection Workflow</TabsTrigger>
          <TabsTrigger value="implementation">Implementation Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Technical Requirements for Fall Monitoring
              </CardTitle>
              <CardDescription>
                Comprehensive list of hardware, software, and services needed
                for real-time fall detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All Requirements
                </Button>
                <Button
                  variant={
                    selectedCategory === 'hardware' ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setSelectedCategory('hardware')}
                >
                  <DeviceMobile className="mr-1 h-4 w-4" />
                  Hardware
                </Button>
                <Button
                  variant={
                    selectedCategory === 'software' ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setSelectedCategory('software')}
                >
                  <Gear className="mr-1 h-4 w-4" />
                  Software
                </Button>
                <Button
                  variant={
                    selectedCategory === 'service' ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setSelectedCategory('service')}
                >
                  <Cloud className="mr-1 h-4 w-4" />
                  Services
                </Button>
              </div>

              <div className="space-y-4">
                {filteredRequirements.map((req, index) => (
                  <div key={index} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(req.category)}
                        <h3 className="font-semibold">{req.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {req.cost && (
                          <span className="text-muted-foreground text-sm">
                            {req.cost}
                          </span>
                        )}
                        <Badge className={getStatusColor(req.status)}>
                          {req.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {req.description}
                    </p>
                    <div className="bg-muted/50 rounded p-3">
                      <p className="text-sm">
                        <strong>Implementation:</strong> {req.implementation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightning className="h-5 w-5" />
                Fall Detection Workflow
              </CardTitle>
              <CardDescription>
                Step-by-step process from initial detection to emergency
                response
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {monitoringFlow.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                        {step.step}
                      </div>
                      {index < monitoringFlow.length - 1 && (
                        <div className="bg-border mt-2 h-16 w-px" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="mb-2 flex items-center gap-2">
                        {step.icon}
                        <h3 className="font-semibold">{step.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          {step.timing}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2 text-sm">
                        {step.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Gear className="text-muted-foreground h-4 w-4" />
                        <span className="text-sm font-medium">
                          {step.technology}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementation" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Phase 1: Foundation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Hardware Setup</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Configure Apple Watch Fall Detection</li>
                      <li>• Enable Emergency SOS features</li>
                      <li>• Test device connectivity and battery life</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Basic Integration</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Implement HealthKit permissions</li>
                      <li>• Set up Core Motion monitoring</li>
                      <li>• Create emergency contact system</li>
                    </ul>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Estimated Cost: $500 - $1,500
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightning className="h-5 w-5" />
                  Phase 2: Advanced Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">AI Enhancement</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Train custom ML model for user patterns</li>
                      <li>• Implement false positive reduction</li>
                      <li>• Add contextual awareness (location, time)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Infrastructure</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Deploy cloud monitoring system</li>
                      <li>• Set up 24/7 alert processing</li>
                      <li>• Integrate with medical response services</li>
                    </ul>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    Estimated Cost: $15k - $75k
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Phase 3: Smart Home Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Environmental Sensors</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Install motion sensors in key areas</li>
                      <li>• Add smart floor mats near beds/bathrooms</li>
                      <li>• Deploy ambient monitoring cameras</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Comprehensive Monitoring</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Multi-sensor fusion algorithms</li>
                      <li>• Behavioral pattern recognition</li>
                      <li>• Predictive risk modeling</li>
                    </ul>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    Estimated Cost: $2k - $10k
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellRinging className="h-5 w-5" />
                  Critical Considerations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Warning className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Medical Device Regulations:</strong> Fall
                      detection systems may require FDA approval for medical
                      claims.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <h4 className="font-medium">Privacy & Security</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• HIPAA compliance for health data</li>
                      <li>• End-to-end encryption for all communications</li>
                      <li>• Secure storage of biometric patterns</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Reliability Requirements</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• 99.9% uptime for monitoring systems</li>
                      <li>• Battery backup for power outages</li>
                      <li>• Redundant communication pathways</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
