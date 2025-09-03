/*
 * ARCHIVED COMPONENT - CloudInfrastructureStatus
 *
 * Archived on: September 3, 2025
 * Reason: Removed developer-focused components from main app UI
 *
 * This component showed cloud infrastructure monitoring status and was
 * removed as part of cleaning up developer progress tracking components.
 * GitHub is now used for project management instead.
 *
 * Component functionality:
 * - Cloud service status monitoring
 * - Infrastructure metrics dashboard
 * - Architecture overview
 * - Real-time service health checks
 *
 * Dependencies:
 * - Used @github/spark/hooks (which is being migrated away from)
 * - Lucide icons for UI
 * - Toast notifications
 *
 * This component can be restored if needed for future infrastructure monitoring.
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@github/spark/hooks';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  CloudUpload,
  Database,
  Globe,
  Monitor,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CloudService {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  uptime: number;
  responseTime: number;
  lastCheck: string;
}

interface InfrastructureMetric {
  label: string;
  value: string | number;
  unit: string;
  status: 'good' | 'AlertTriangle' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

export default function CloudInfrastructureStatus() {
  const [infrastructureEnabled, setInfrastructureEnabled] = useKV(
    'cloud-infrastructure-enabled',
    false
  );
  const [lastSync, setLastSync] = useKV(
    'last-infrastructure-sync',
    new Date().toISOString()
  );

  // Simulated cloud services status
  const [services] = useState<CloudService[]>([
    {
      id: 'api-gateway',
      name: 'API Gateway',
      status: 'online',
      uptime: 99.9,
      responseTime: 45,
      lastCheck: new Date().toISOString(),
    },
    {
      id: 'real-time-db',
      name: 'Real-time Database',
      status: 'online',
      uptime: 99.8,
      responseTime: 12,
      lastCheck: new Date().toISOString(),
    },
    {
      id: 'websocket-service',
      name: 'WebSocket Service',
      status: 'online',
      uptime: 99.7,
      responseTime: 8,
      lastCheck: new Date().toISOString(),
    },
    {
      id: 'alert-processor',
      name: 'Alert Processing Engine',
      status: 'online',
      uptime: 99.9,
      responseTime: 23,
      lastCheck: new Date().toISOString(),
    },
    {
      id: 'push-notifications',
      name: 'Push Notification Service',
      status: 'degraded',
      uptime: 98.5,
      responseTime: 156,
      lastCheck: new Date().toISOString(),
    },
    {
      id: 'monitoring-service',
      name: 'Health Monitoring Service',
      status: 'online',
      uptime: 99.6,
      responseTime: 67,
      lastCheck: new Date().toISOString(),
    },
  ]);

  // Infrastructure metrics
  const metrics: InfrastructureMetric[] = [
    {
      label: 'Total Requests/min',
      value: 1847,
      unit: '/min',
      status: 'good',
      trend: 'up',
    },
    {
      label: 'Error Rate',
      value: 0.02,
      unit: '%',
      status: 'good',
      trend: 'down',
    },
    {
      label: 'Avg Response Time',
      value: 52,
      unit: 'ms',
      status: 'good',
      trend: 'stable',
    },
    {
      label: 'Active Connections',
      value: 234,
      unit: '',
      status: 'good',
      trend: 'up',
    },
    {
      label: 'Data Processed',
      value: 15.7,
      unit: 'GB/day',
      status: 'good',
      trend: 'up',
    },
    {
      label: 'Uptime',
      value: 99.7,
      unit: '%',
      status: 'good',
      trend: 'stable',
    },
  ];

  const toggleInfrastructure = () => {
    const newStatus = !infrastructureEnabled;
    setInfrastructureEnabled(newStatus);
    setLastSync(new Date().toISOString());

    if (newStatus) {
      toast.success('Cloud infrastructure monitoring enabled');
    } else {
      toast.info('Cloud infrastructure monitoring disabled');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'offline':
        return 'text-red-500';
      case 'maintenance':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'degraded':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>
        );
      case 'offline':
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
      case 'maintenance':
        return <Badge className="bg-blue-100 text-blue-800">Maintenance</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'AlertTriangle':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const onlineServices = services.filter((s) => s.status === 'online').length;
  const totalServices = services.length;
  const overallHealth = (onlineServices / totalServices) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground flex items-center gap-2 text-2xl font-bold">
            <CloudUpload className="h-6 w-6" />
            Cloud Infrastructure Status
          </h2>
          <p className="text-muted-foreground">
            Real-time monitoring of cloud services and infrastructure
          </p>
        </div>
        <Button
          onClick={toggleInfrastructure}
          variant={infrastructureEnabled ? 'destructive' : 'default'}
        >
          {infrastructureEnabled ? 'Disable Monitoring' : 'Enable Monitoring'}
        </Button>
      </div>

      {/* Phase 5 Status Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Phase 5 Infrastructure:</strong> This represents the planned
          cloud infrastructure for 24/7 monitoring. Implementation includes
          real-time databases, WebSocket services, and scalable alert processing
          systems.
        </AlertDescription>
      </Alert>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Overall Health
                </p>
                <p className="text-2xl font-bold">
                  {overallHealth.toFixed(1)}%
                </p>
              </div>
              <CheckCircle
                className={`h-8 w-8 ${overallHealth > 95 ? 'text-green-500' : 'text-yellow-500'}`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Services Online
                </p>
                <p className="text-2xl font-bold">
                  {onlineServices}/{totalServices}
                </p>
              </div>
              <Activity className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Avg Uptime
                </p>
                <p className="text-2xl font-bold">99.7%</p>
              </div>
              <Clock className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Response Time
                </p>
                <p className="text-2xl font-bold">52ms</p>
              </div>
              <Zap className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Infrastructure View */}
      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {services.map((service) => (
              <Card key={service.id}>
                <CardContent className="pt-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{service.name}</h4>
                      <p className="text-muted-foreground text-sm">
                        Last checked:{' '}
                        {new Date(service.lastCheck).toLocaleTimeString()}
                      </p>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uptime</span>
                      <span className="font-semibold">{service.uptime}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Response Time</span>
                      <span className="font-semibold">
                        {service.responseTime}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Status</span>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${getStatusColor(service.status)}`}
                        />
                        <span className="capitalize">{service.status}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-muted-foreground text-sm font-medium">
                      {metric.label}
                    </p>
                    <div className="flex items-center gap-1">
                      {metric.trend === 'up' && (
                        <div className="text-green-500">↗</div>
                      )}
                      {metric.trend === 'down' && (
                        <div className="text-red-500">↘</div>
                      )}
                      {metric.trend === 'stable' && (
                        <div className="text-gray-500">→</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p
                      className={`text-2xl font-bold ${getMetricStatusColor(metric.status)}`}
                    >
                      {metric.value}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {metric.unit}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="architecture" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Layer
                </CardTitle>
                <CardDescription>Database and storage services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time Database</span>
                    <Badge
                      variant="outline"
                      className="border-green-200 text-green-700"
                    >
                      Firebase
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analytics Database</span>
                    <Badge
                      variant="outline"
                      className="border-blue-200 text-blue-700"
                    >
                      BigQuery
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">File Storage</span>
                    <Badge
                      variant="outline"
                      className="border-purple-200 text-purple-700"
                    >
                      Cloud Storage
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  API Layer
                </CardTitle>
                <CardDescription>
                  API and communication services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Gateway</span>
                    <Badge
                      variant="outline"
                      className="border-green-200 text-green-700"
                    >
                      Cloud Run
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">WebSocket Service</span>
                    <Badge
                      variant="outline"
                      className="border-blue-200 text-blue-700"
                    >
                      Socket.IO
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Authentication</span>
                    <Badge
                      variant="outline"
                      className="border-orange-200 text-orange-700"
                    >
                      Firebase Auth
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Processing Layer
                </CardTitle>
                <CardDescription>
                  Real-time processing and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Alert Processing</span>
                    <Badge
                      variant="outline"
                      className="border-red-200 text-red-700"
                    >
                      Cloud Functions
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ML Inference</span>
                    <Badge
                      variant="outline"
                      className="border-green-200 text-green-700"
                    >
                      Vertex AI
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Monitoring</span>
                    <Badge
                      variant="outline"
                      className="border-blue-200 text-blue-700"
                    >
                      Cloud Monitoring
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Layer
                </CardTitle>
                <CardDescription>
                  Security and compliance services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Encryption</span>
                    <Badge
                      variant="outline"
                      className="border-green-200 text-green-700"
                    >
                      AES-256
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">HIPAA Compliance</span>
                    <Badge
                      variant="outline"
                      className="border-blue-200 text-blue-700"
                    >
                      Enabled
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Access Control</span>
                    <Badge
                      variant="outline"
                      className="border-purple-200 text-purple-700"
                    >
                      IAM
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Architecture Diagram Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>System Architecture Overview</CardTitle>
              <CardDescription>
                High-level view of the monitoring infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-8 text-center">
                <Monitor className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
                <h3 className="mb-2 font-semibold">Architecture Diagram</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Interactive system architecture visualization would be
                  implemented here
                </p>
                <div className="text-muted-foreground text-xs">
                  User Devices → Load Balancer → API Gateway → Microservices →
                  Databases
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Implementation Requirements
          </CardTitle>
          <CardDescription>
            Key components needed for Phase 5 completion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 font-semibold">Technical Requirements</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  Cloud platform setup (Firebase/AWS)
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  Real-time database configuration
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  WebSocket service deployment
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  Load balancer and API gateway setup
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  Monitoring and alerting infrastructure
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 font-semibold">Operational Requirements</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  24/7 monitoring team or automated systems
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Incident response procedures
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Data backup and disaster recovery
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  HIPAA compliance implementation
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Performance testing and optimization
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
