import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ProcessedHealthData } from '@/types';

interface DataVisualizationProps {
  healthData: ProcessedHealthData | null;
  metric: 'steps' | 'heartRate' | 'walkingSteadiness' | 'sleepHours';
  timeframe: 'daily' | 'weekly' | 'monthly';
  className?: string;
}

export default function DataVisualization({
  healthData,
  metric,
  timeframe = 'daily',
  className,
}: DataVisualizationProps) {
  if (!healthData?.metrics?.[metric]) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-muted-foreground text-center">
            No data available for {metric}
          </div>
        </CardContent>
      </Card>
    );
  }

  const metricData = healthData.metrics[metric][timeframe];

  if (!metricData || metricData.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-muted-foreground text-center">
            No data available for {metric}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...metricData.map((d) => d.value));
  const minValue = Math.min(...metricData.map((d) => d.value));
  const avgValue =
    metricData.reduce((sum, d) => sum + d.value, 0) / metricData.length;

  const getMetricConfig = () => {
    switch (metric) {
      case 'steps':
        return {
          title: 'Daily Steps',
          unit: ' steps',
          color: 'bg-blue-500',
          target: 10000,
          goodRange: [8000, 15000],
        };
      case 'heartRate':
        return {
          title: 'Heart Rate',
          unit: ' bpm',
          color: 'bg-red-500',
          target: 70,
          goodRange: [60, 80],
        };
      case 'walkingSteadiness':
        return {
          title: 'Walking Steadiness',
          unit: '%',
          color: 'bg-green-500',
          target: 80,
          goodRange: [70, 100],
        };
      case 'sleepHours':
        return {
          title: 'Sleep Duration',
          unit: ' hrs',
          color: 'bg-purple-500',
          target: 8,
          goodRange: [7, 9],
        };
    }
  };

  const config = getMetricConfig();

  const getValueStatus = (value: number) => {
    if (value >= config.goodRange[0] && value <= config.goodRange[1]) {
      return 'good';
    }
    return value < config.goodRange[0] ? 'low' : 'high';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    switch (timeframe) {
      case 'daily':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      case 'weekly':
        return `Week ${Math.ceil(date.getDate() / 7)}`;
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'short' });
      default:
        return date.toLocaleDateString();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{config.title}</CardTitle>
          <Badge
            variant={
              getValueStatus(avgValue) === 'good' ? 'default' : 'secondary'
            }
          >
            Avg: {avgValue.toFixed(1)}
            {config.unit}
          </Badge>
        </div>
        <CardDescription>
          {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} trend over
          last {metricData.length}{' '}
          {timeframe === 'daily'
            ? 'days'
            : timeframe === 'weekly'
              ? 'weeks'
              : 'months'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart Area */}
          <div className="relative">
            {/* Target line if applicable */}
            {config.target && (
              <div
                className="border-muted-foreground/30 absolute z-10 w-full border-t-2 border-dashed"
                style={{
                  top: `${100 - (config.target / maxValue) * 100}%`,
                }}
              >
                <span className="text-muted-foreground bg-background px-1 text-xs">
                  Target: {config.target}
                  {config.unit}
                </span>
              </div>
            )}

            {/* Chart bars */}
            <div className="flex h-32 items-end gap-1 p-2">
              {metricData.slice(-20).map((point, index) => {
                const height = (point.value / maxValue) * 100;
                const status = getValueStatus(point.value);

                return (
                  <div
                    key={index}
                    className="group relative flex flex-1 flex-col justify-end"
                  >
                    <div
                      className={`
                        ${config.color} rounded-t-sm opacity-70 transition-all duration-200 hover:opacity-100
                        ${status === 'good' ? 'opacity-90' : status === 'low' ? 'opacity-60' : 'opacity-80'}
                      `}
                      style={{ height: `${height}%` }}
                    />

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {formatDate(point.date)}: {point.value.toFixed(1)}
                      {config.unit}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-muted-foreground">Min</div>
              <div className="font-medium">
                {minValue.toFixed(1)}
                {config.unit}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Average</div>
              <div className="font-medium">
                {avgValue.toFixed(1)}
                {config.unit}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Max</div>
              <div className="font-medium">
                {maxValue.toFixed(1)}
                {config.unit}
              </div>
            </div>
          </div>

          {/* Trend indicator */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <div
              className={`h-2 w-2 rounded-full ${
                healthData.metrics[metric].trend === 'increasing'
                  ? 'bg-green-500'
                  : healthData.metrics[metric].trend === 'decreasing'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
              }`}
            />
            <span className="text-muted-foreground capitalize">
              {healthData.metrics[metric].trend} trend
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple line chart component for correlations
export function CorrelationChart({
  data1,
  data2,
  label1,
  label2,
  className,
}: {
  data1: { date: string; value: number }[];
  data2: { date: string; value: number }[];
  label1: string;
  label2: string;
  className?: string;
}) {
  if (!data1.length || !data2.length) return null;

  const max1 = Math.max(...data1.map((d) => d.value));
  const max2 = Math.max(...data2.map((d) => d.value));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">
          Correlation: {label1} vs {label2}
        </CardTitle>
        <CardDescription>Comparing trends over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-32">
          {/* Data1 line */}
          <svg className="absolute inset-0 h-full w-full">
            <polyline
              points={data1
                .slice(-20)
                .map((point, index) => {
                  const x = (index / (data1.slice(-20).length - 1)) * 100;
                  const y = 100 - (point.value / max1) * 100;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              className="opacity-80"
            />
          </svg>

          {/* Data2 line */}
          <svg className="absolute inset-0 h-full w-full">
            <polyline
              points={data2
                .slice(-20)
                .map((point, index) => {
                  const x = (index / (data2.slice(-20).length - 1)) * 100;
                  const y = 100 - (point.value / max2) * 100;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="rgb(239, 68, 68)"
              strokeWidth="2"
              className="opacity-80"
            />
          </svg>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-3 bg-blue-500" />
            <span>{label1}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-3 bg-red-500" />
            <span>{label2}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
