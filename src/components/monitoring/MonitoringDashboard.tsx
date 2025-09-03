/**
 * Production Monitoring Dashboard
 * Real-time visibility into VitalSense infrastructure health and performance
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cloud,
  Database,
  Eye,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    kv: string;
    r2: string;
    analytics: string;
    auth: string;
  };
  analytics: {
    enabled: boolean;
    datasets: string[];
  };
}

interface AnalyticsData {
  period: string;
  metrics: {
    totalEvents: number;
    uniqueUsers: number;
    avgResponseTime: number;
    errorRate: number;
  };
  topEvents: Array<{
    type: string;
    count: number;
  }>;
}

interface SecurityData {
  period: string;
  metrics: {
    totalSecurityEvents: number;
    rateLimitHits: number;
    suspiciousActivity: number;
    blockedRequests: number;
  };
  topThreats: Array<{
    type: string;
    count: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export function MonitoringDashboard() {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(
    null
  );
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);

      const [healthRes, analyticsRes, securityRes] = await Promise.all([
        fetch('/health'),
        fetch('/api/analytics/health'),
        fetch('/api/analytics/security'),
      ]);

      if (!healthRes.ok) throw new Error('Health check failed');
      if (!analyticsRes.ok) throw new Error('Analytics fetch failed');
      if (!securityRes.ok) throw new Error('Security data fetch failed');

      const [health, analytics, security] = await Promise.all([
        healthRes.json(),
        analyticsRes.json(),
        securityRes.json(),
      ]);

      setHealthMetrics(health);
      setAnalyticsData(analytics);
      setSecurityData(security);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch monitoring data'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Wrap async function to handle promises properly
    const performFetch = () => {
      fetchData().catch((error) => {
        console.error('Unhandled error in data fetch:', error);
      });
    };

    performFetch();
    const interval = setInterval(performFetch, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'down':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p>Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mx-auto max-w-2xl">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Monitoring Error</AlertTitle>
        <AlertDescription>
          {error}
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            className="ml-4"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time infrastructure health and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Live Monitoring
          </Badge>
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {getStatusIcon(healthMetrics?.status || 'unknown')}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {healthMetrics?.status || 'Unknown'}
            </div>
            <p className="text-muted-foreground text-xs">
              Environment: {healthMetrics?.environment}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.metrics.uniqueUsers || 0}
            </div>
            <p className="text-muted-foreground text-xs">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.metrics.avgResponseTime || 0}ms
            </div>
            <p className="text-muted-foreground text-xs">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((analyticsData?.metrics.errorRate || 0) * 100).toFixed(2)}%
            </div>
            <p className="text-muted-foreground text-xs">Error rate (24h)</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Core Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {healthMetrics?.services &&
                  Object.entries(healthMetrics.services).map(
                    ([service, status]) => (
                      <div
                        key={service}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span className="capitalize">{service}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={getStatusColor(status)}
                        >
                          {status}
                        </Badge>
                      </div>
                    )
                  )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Analytics Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant="outline" className="text-green-600">
                    {healthMetrics?.analytics.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">
                    Active Datasets:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {healthMetrics?.analytics.datasets.map((dataset) => (
                      <Badge
                        key={dataset}
                        variant="secondary"
                        className="text-xs"
                      >
                        {dataset}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Event Analytics</CardTitle>
                <CardDescription>
                  Health data events in the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.topEvents.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm capitalize">
                        {event.type.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="bg-secondary h-2 w-20 rounded-full">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${(event.count / (analyticsData?.metrics.totalEvents || 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {event.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>System performance overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Response Time</span>
                    <span>{analyticsData?.metrics.avgResponseTime}ms</span>
                  </div>
                  <Progress
                    value={Math.min(
                      (analyticsData?.metrics.avgResponseTime || 0) / 10,
                      100
                    )}
                  />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Error Rate</span>
                    <span>
                      {((analyticsData?.metrics.errorRate || 0) * 100).toFixed(
                        2
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={(analyticsData?.metrics.errorRate || 0) * 100}
                    className="[&>div]:bg-red-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Events
                </CardTitle>
                <CardDescription>
                  Security monitoring in the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {securityData?.metrics.rateLimitHits || 0}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Rate Limit Hits
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {securityData?.metrics.suspiciousActivity || 0}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Suspicious Activity
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Analysis</CardTitle>
                <CardDescription>Top security threats detected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityData?.topThreats.map((threat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getSeverityColor(threat.severity)}
                        >
                          {threat.severity}
                        </Badge>
                        <span className="text-sm capitalize">
                          {threat.type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {threat.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure Performance</CardTitle>
              <CardDescription>
                Real-time performance monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <Activity className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <p className="text-muted-foreground">
                  Performance charts and detailed metrics will be displayed
                  here. Connect to Cloudflare Analytics API for real-time data.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MonitoringDashboard;
