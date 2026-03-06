import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  BarChart2,
  Download,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AnalyticsData {
  date: string;
  steps: number;
  heartRate: number;
  walkingSteadiness: number;
  sleepHours: number;
  healthScore: number;
  fallRisk: number;
  activityLevel: 'low' | 'moderate' | 'high';
}

interface AdvancedAnalyticsProps {
  userId: string;
  timeRange: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange: (range: '7d' | '30d' | '90d' | '1y') => void;
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',
};

export default function AdvancedAnalytics({
  userId,
  timeRange,
  onTimeRangeChange,
}: Readonly<AdvancedAnalyticsProps>) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');

  // Generate mock analytics data
  useEffect(() => {
    setIsLoading(true);

    setTimeout(() => {
      let days: number;
      if (timeRange === '7d') {
        days = 7;
      } else if (timeRange === '30d') {
        days = 30;
      } else if (timeRange === '90d') {
        days = 90;
      } else {
        days = 365;
      }

      const data: AnalyticsData[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const baseSteps =
          7500 + Math.sin(i * 0.1) * 1500 + (Math.random() - 0.5) * 2000;
        const baseHeartRate =
          68 + Math.sin(i * 0.05) * 5 + (Math.random() - 0.5) * 8;
        const baseSteadiness =
          75 + Math.cos(i * 0.08) * 10 + (Math.random() - 0.5) * 15;
        const baseSleep =
          7.2 + Math.sin(i * 0.12) * 1 + (Math.random() - 0.5) * 1.5;

        const healthScore =
          Math.max(
            0,
            Math.min(
              100,
              baseSteps / 100 +
                (85 - baseHeartRate) +
                baseSteadiness +
                baseSleep * 10
            )
          ) / 4;

        const fallRisk = Math.max(0, 100 - baseSteadiness);

        let activityLevel: 'low' | 'moderate' | 'high';
        if (baseSteps > 8000) {
          activityLevel = 'high';
        } else if (baseSteps > 5000) {
          activityLevel = 'moderate';
        } else {
          activityLevel = 'low';
        }

        data.push({
          date: date.toISOString().split('T')[0],
          steps: Math.max(0, Math.round(baseSteps)),
          heartRate: Math.max(50, Math.round(baseHeartRate)),
          walkingSteadiness: Math.max(
            0,
            Math.min(100, Math.round(baseSteadiness))
          ),
          sleepHours: Math.max(
            4,
            Math.min(12, Math.round(baseSleep * 10) / 10)
          ),
          healthScore: Math.round(healthScore),
          fallRisk: Math.round(fallRisk),
          activityLevel,
        });
      }

      setAnalyticsData(data);
      setIsLoading(false);
    }, 1000);
  }, [timeRange, userId]);

  const getMetricConfig = (metric: string) => {
    const configs = {
      steps: {
        color: COLORS.primary,
        format: (val: number) => val.toLocaleString(),
      },
      heartRate: {
        color: COLORS.danger,
        format: (val: number) => `${val} BPM`,
      },
      walkingSteadiness: {
        color: COLORS.secondary,
        format: (val: number) => `${val}%`,
      },
      sleepHours: { color: COLORS.purple, format: (val: number) => `${val}h` },
      healthScore: {
        color: COLORS.indigo,
        format: (val: number) => `${val}/100`,
      },
      fallRisk: { color: COLORS.warning, format: (val: number) => `${val}%` },
    };
    return configs[metric as keyof typeof configs] || configs.steps;
  };

  const calculateTrend = (data: number[]) => {
    if (data.length < 2) return 0;
    const recent =
      data.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, data.length);
    const previous =
      data.slice(-14, -7).reduce((a, b) => a + b, 0) /
      Math.min(7, data.slice(-14, -7).length);
    return recent - previous;
  };

  const exportData = () => {
    const csvContent = [
      [
        'Date',
        'Steps',
        'Heart Rate',
        'Walking Steadiness',
        'Sleep Hours',
        'Health Score',
        'Fall Risk',
      ].join(','),
      ...analyticsData.map((d) =>
        [
          d.date,
          d.steps,
          d.heartRate,
          d.walkingSteadiness,
          d.sleepHours,
          d.healthScore,
          d.fallRisk,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-analytics-${timeRange}-${userId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderChart = () => {
    const config = getMetricConfig(selectedMetric);

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={analyticsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={config.format} />
            <Brush dataKey="date" height={30} />
            {selectedMetric === 'overview' ? (
              <>
                <Line dataKey="steps" stroke={COLORS.primary} strokeWidth={2} />
                <Line
                  dataKey="healthScore"
                  stroke={COLORS.secondary}
                  strokeWidth={2}
                />
                <Line
                  dataKey="walkingSteadiness"
                  stroke={COLORS.warning}
                  strokeWidth={2}
                />
              </>
            ) : (
              <Line
                dataKey={selectedMetric}
                stroke={config.color}
                strokeWidth={2}
              />
            )}
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={analyticsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={config.format} />
            <Bar dataKey={selectedMetric} fill={config.color} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={analyticsData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={config.format} />
          <Area
            dataKey={selectedMetric}
            fill={config.color}
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderSummaryCards = () => {
    if (analyticsData.length === 0) return null;

    const latest = analyticsData[analyticsData.length - 1];
    const stepsTrend = calculateTrend(analyticsData.map((d) => d.steps));
    const healthTrend = calculateTrend(analyticsData.map((d) => d.healthScore));

    return (
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Daily Steps</p>
                <p className="text-2xl font-bold">
                  {latest.steps.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {stepsTrend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${stepsTrend > 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {Math.abs(Math.round(stepsTrend))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Health Score</p>
                <p className="text-2xl font-bold">{latest.healthScore}/100</p>
              </div>
              <div className="flex items-center gap-1">
                {healthTrend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${healthTrend > 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {Math.abs(Math.round(healthTrend))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Walking Steadiness
                </p>
                <p className="text-2xl font-bold">
                  {latest.walkingSteadiness}%
                </p>
              </div>
              <Badge
                variant={
                  latest.walkingSteadiness > 70 ? 'default' : 'destructive'
                }
              >
                {latest.walkingSteadiness > 70 ? 'Good' : 'At Risk'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Sleep Hours</p>
                <p className="text-2xl font-bold">{latest.sleepHours}h</p>
              </div>
              <Badge
                variant={latest.sleepHours >= 7 ? 'default' : 'destructive'}
              >
                {latest.sleepHours >= 7 ? 'Good' : 'Poor'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderActivityDistribution = () => {
    const activityCounts = analyticsData.reduce(
      (acc, d) => {
        acc[d.activityLevel] = (acc[d.activityLevel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const pieData = Object.entries(activityCounts).map(([level, count]) => ({
      name: level.charAt(0).toUpperCase() + level.slice(1),
      value: count,
      percentage: Math.round((count / analyticsData.length) * 100),
    }));

    const colorKeys = Object.keys(COLORS);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Level Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={
                      COLORS[
                        colorKeys[
                          index % colorKeys.length
                        ] as keyof typeof COLORS
                      ]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} days`,
                  name,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const getChartTitle = () => {
    if (selectedMetric === 'overview') {
      return 'Health Metrics Overview';
    }
    return `${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Analytics`;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="steps">Steps</SelectItem>
              <SelectItem value="heartRate">Heart Rate</SelectItem>
              <SelectItem value="walkingSteadiness">
                Walking Steadiness
              </SelectItem>
              <SelectItem value="sleepHours">Sleep Hours</SelectItem>
              <SelectItem value="healthScore">Health Score</SelectItem>
              <SelectItem value="fallRisk">Fall Risk</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              Line
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              Bar
            </Button>
            <Button
              variant={chartType === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('area')}
            >
              Area
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            {getChartTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            renderChart()
          )}
        </CardContent>
      </Card>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {renderActivityDistribution()}

        <Card>
          <CardHeader>
            <CardTitle>Health Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData.length > 0 && (
              <>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your walking steadiness has shown a{' '}
                    {calculateTrend(
                      analyticsData.map((d) => d.walkingSteadiness)
                    ) > 0
                      ? 'positive'
                      : 'negative'}{' '}
                    trend over the selected period.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h4 className="font-medium">Key Recommendations:</h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Maintain consistent daily activity levels</li>
                    <li>• Monitor walking steadiness patterns</li>
                    <li>• Consider balance exercises if steadiness declines</li>
                    <li>• Ensure adequate sleep for recovery</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
