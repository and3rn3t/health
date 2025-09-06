import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ProcessedHealthData } from '@/types';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  Database,
  Shield,
  Smartphone,
  Users,
  Zap,
} from 'lucide-react';
import { useCallback, useState } from 'react';

// Import the new components
// import AdvancedAnalytics from './AdvancedAnalytics';
// import DataSync from './DataSync';
import { EnhancedHealthDataUpload } from './EnhancedHealthDataUpload';
// import LiveDataStream from './LiveDataStream';
import MLAnalytics from './MLAnalytics';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'available' | 'processing' | 'new' | 'beta';
  benefits: string[];
  // Allow heterogeneous component prop signatures – callers spread a loose object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

interface HealthSystemIntegrationProps {
  readonly userId: string;
  readonly initialData?: ProcessedHealthData[];
}

export default function HealthSystemIntegration({
  userId,
  initialData = [],
}: HealthSystemIntegrationProps) {
  const [activeFeature, setActiveFeature] = useState<string>('overview');
  const [healthData, setHealthData] =
    useState<ProcessedHealthData[]>(initialData);
  const [systemMetrics, setSystemMetrics] = useState({
    totalRecords: 45230,
    activeConnections: 3,
    mlModelsActive: 7,
    realTimeStreams: 2,
    dailyAnalytics: 156,
    securityScore: 98,
  });

  const features: FeatureCard[] = [
    {
      id: 'processor',
      title: 'Enhanced Health Data Processing',
      description:
        'Advanced validation, transformation, and analytics pipeline with real-time monitoring',
      icon: Activity,
      status: 'available',
      benefits: [
        'Real-time data validation',
        'Advanced fall risk scoring',
        'Comprehensive health insights',
        'Automated anomaly detection',
      ],
      component: EnhancedHealthDataUpload,
    },
    {
      id: 'streaming',
      title: 'Live Data Streaming',
      description:
        'Real-time health data streaming with WebSocket connections and live monitoring',
      icon: Zap,
      status: 'new',
      benefits: [
        'Real-time data feeds',
        'Connection monitoring',
        'Stream quality metrics',
        'Instant alerts',
      ],
      component: LiveDataStream,
    },
    {
      id: 'analytics',
      title: 'Advanced Analytics Dashboard',
      description:
        'Comprehensive data visualization with trends, distributions, and exportable reports',
      icon: BarChart3,
      status: 'available',
      benefits: [
        'Multi-dimensional visualizations',
        'Trend analysis',
        'Data export capabilities',
        'Interactive dashboards',
      ],
      component: AdvancedAnalytics,
    },
    {
      id: 'ml',
      title: 'Machine Learning Analytics',
      description:
        'AI-powered predictive analytics, anomaly detection, and personalized insights',
      icon: Brain,
      status: 'beta',
      benefits: [
        'Predictive modeling',
        'Anomaly detection',
        'Personalized recommendations',
        'Advanced pattern recognition',
      ],
      component: MLAnalytics,
    },
    {
      id: 'sync',
      title: 'Data Import/Export & API Integration',
      description:
        'Seamless data synchronization with multiple health platforms and export capabilities',
      icon: Database,
      status: 'available',
      benefits: [
        'Multi-platform sync',
        'Secure data import/export',
        'API integrations',
        'HIPAA-compliant processing',
      ],
      component: DataSync,
    },
  ];

  const handleDataUpdate = useCallback((newData: ProcessedHealthData[]) => {
    setHealthData((prev) => [...prev, ...newData]);
    setSystemMetrics((prev) => ({
      ...prev,
      totalRecords: prev.totalRecords + newData.length,
    }));
  }, []);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {systemMetrics.totalRecords.toLocaleString()}
              </div>
              <div className="text-muted-foreground text-sm">
                Health Records
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemMetrics.activeConnections}
              </div>
              <div className="text-muted-foreground text-sm">
                Active Connections
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {systemMetrics.mlModelsActive}
              </div>
              <div className="text-muted-foreground text-sm">ML Models</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {systemMetrics.realTimeStreams}
              </div>
              <div className="text-muted-foreground text-sm">Live Streams</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {systemMetrics.dailyAnalytics}
              </div>
              <div className="text-muted-foreground text-sm">
                Daily Insights
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {systemMetrics.securityScore}%
              </div>
              <div className="text-muted-foreground text-sm">
                Security Score
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Card
              key={feature.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  {(() => {
                    let variant: 'default' | 'secondary' | 'outline' =
                      'outline';
                    if (feature.status === 'new') variant = 'default';
                    else if (feature.status === 'beta') variant = 'secondary';
                    return <Badge variant={variant}>{feature.status}</Badge>;
                  })()}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Key Benefits:</h4>
                  <ul className="space-y-1">
                    {feature.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => setActiveFeature(feature.id)}
                  className="w-full"
                  variant="outline"
                >
                  Open Feature
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Integrated Health Ecosystem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium">Multi-Device Sync</h3>
              <p className="text-muted-foreground text-sm">
                Seamlessly sync data from Apple Health, Fitbit, and other
                platforms
              </p>
            </div>

            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Brain className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-medium">AI-Powered Insights</h3>
              <p className="text-muted-foreground text-sm">
                Machine learning models provide predictive analytics and
                personalized recommendations
              </p>
            </div>

            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-medium">Real-Time Monitoring</h3>
              <p className="text-muted-foreground text-sm">
                Live data streaming with instant alerts for critical health
                events
              </p>
            </div>

            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-medium">Enterprise Security</h3>
              <p className="text-muted-foreground text-sm">
                HIPAA-compliant data processing with end-to-end encryption
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setActiveFeature('processor')}
              variant="outline"
            >
              Process New Data
            </Button>
            <Button
              onClick={() => setActiveFeature('streaming')}
              variant="outline"
            >
              Start Live Stream
            </Button>
            <Button
              onClick={() => setActiveFeature('analytics')}
              variant="outline"
            >
              View Analytics
            </Button>
            <Button onClick={() => setActiveFeature('ml')} variant="outline">
              ML Predictions
            </Button>
            <Button onClick={() => setActiveFeature('sync')} variant="outline">
              Sync Devices
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActiveFeature = () => {
    const feature = features.find((f) => f.id === activeFeature);
    if (!feature) return null;

    const Component = feature.component;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <feature.icon className="h-6 w-6" />
            <h2 className="text-2xl font-bold">{feature.title}</h2>
            {(() => {
              let variant: 'default' | 'secondary' | 'outline' = 'outline';
              if (feature.status === 'new') variant = 'default';
              else if (feature.status === 'beta') variant = 'secondary';
              return <Badge variant={variant}>{feature.status}</Badge>;
            })()}
          </div>
          <Button
            onClick={() => setActiveFeature('overview')}
            variant="outline"
          >
            Back to Overview
          </Button>
        </div>

        <Alert>
          <AlertDescription>{feature.description}</AlertDescription>
        </Alert>

        <Component
          {...({
            userId,
            data: healthData,
            onDataProcessed: handleDataUpdate,
            onDataImported: handleDataUpdate,
            onExportComplete: () => {},
            timeRange: '7d',
            onTimeRangeChange: () => {},
            onDataReceived: handleDataUpdate,
          } as Record<string, unknown>)}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold">Health Data Platform</h1>
        <p className="text-muted-foreground text-xl">
          Comprehensive health data processing, analytics, and insights platform
        </p>
      </div>

      <Tabs
        value={activeFeature}
        onValueChange={setActiveFeature}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="processor">Processor</TabsTrigger>
          <TabsTrigger value="streaming">Streaming</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ml">ML Insights</TabsTrigger>
          <TabsTrigger value="sync">Data Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{renderOverview()}</TabsContent>

        {features.map((feature) => (
          <TabsContent key={feature.id} value={feature.id}>
            {renderActiveFeature()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
