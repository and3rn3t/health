/**
 * Fall Risk History Chart Component
 * Visualizes historical fall risk trends over time
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingDown, TrendingUp, Minus, Calendar, Activity } from 'lucide-react';
import React from 'react';
import type { AdvancedFallRiskPrediction } from '@/lib/advanced-fall-risk-engine';

export interface FallRiskHistoryDataPoint {
  date: Date;
  riskScore: number;
  riskLevel: AdvancedFallRiskPrediction['riskLevel'];
  gaitRisk: number;
  balanceRisk: number;
  environmentalRisk: number;
  physiologicalRisk: number;
  behavioralRisk: number;
  prediction: AdvancedFallRiskPrediction;
}

interface FallRiskHistoryChartProps {
  historyData: FallRiskHistoryDataPoint[];
  timeRange?: '7d' | '30d' | '90d' | '1y' | 'all';
  showTrends?: boolean;
  showBreakdown?: boolean;
}

export default function FallRiskHistoryChart({
  historyData,
  timeRange = '30d',
  showTrends = true,
  showBreakdown = true,
}: FallRiskHistoryChartProps) {
  const [selectedRange, setSelectedRange] = React.useState(timeRange);

  // Sync selectedRange with timeRange prop when it changes
  React.useEffect(() => {
    setSelectedRange(timeRange);
  }, [timeRange]);

  // Filter data based on selected time range
  const filteredData = React.useMemo(() => {
    if (!historyData || historyData.length === 0) return [];

    const now = new Date();
    const cutoffDate = new Date();

    switch (selectedRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        return historyData;
    }

    return historyData.filter((point) => point.date >= cutoffDate);
  }, [historyData, selectedRange]);

  // Calculate trend statistics
  const trendStats = React.useMemo(() => {
    if (filteredData.length < 2) {
      return {
        trend: 'stable' as const,
        change: 0,
        changePercent: 0,
        average: filteredData[0]?.riskScore || 0,
        min: filteredData[0]?.riskScore || 0,
        max: filteredData[0]?.riskScore || 0,
      };
    }

    const sorted = [...filteredData].sort((a, b) => a.date.getTime() - b.date.getTime());
    const first = sorted[0].riskScore;
    const last = sorted[sorted.length - 1].riskScore;
    const change = last - first;
    const changePercent = first > 0 ? (change / first) * 100 : 0;
    const average = sorted.reduce((sum, p) => sum + p.riskScore, 0) / sorted.length;
    const scores = sorted.map((p) => p.riskScore);
    const min = Math.min(...scores);
    const max = Math.max(...scores);

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (changePercent < -5) trend = 'improving';
    else if (changePercent > 5) trend = 'declining';

    return {
      trend,
      change,
      changePercent: Math.abs(changePercent),
      average,
      min,
      max,
    };
  }, [filteredData]);

  // Generate chart data points for visualization
  // Limit to max 200 points for performance (sample large datasets)
  const chartData = React.useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => a.date.getTime() - b.date.getTime());

    // If we have too many points, sample them for better performance
    const maxPoints = 200;
    let sampled = sorted;
    if (sorted.length > maxPoints) {
      const step = Math.ceil(sorted.length / maxPoints);
      sampled = sorted.filter((_, index) => index % step === 0 || index === sorted.length - 1);
    }

    return sampled.map((point, index) => ({
      x: index,
      date: point.date,
      riskScore: point.riskScore,
      riskLevel: point.riskLevel,
    }));
  }, [filteredData]);

  // Simple SVG line chart
  const renderLineChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex h-64 items-center justify-center text-gray-500">
          No historical data available
        </div>
      );
    }

    const width = 800;
    const height = 200;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxScore = Math.max(...chartData.map((d) => d.riskScore), 100);
    const minScore = Math.min(...chartData.map((d) => d.riskScore), 0);
    const scoreRange = maxScore - minScore || 100;

    const points = chartData.map((d, i) => {
      // Handle single point case to avoid division by zero
      const divisor = chartData.length > 1 ? chartData.length - 1 : 1;
      const xCoord = padding + (i / divisor) * chartWidth;
      const y =
        padding +
        chartHeight -
        ((d.riskScore - minScore) / scoreRange) * chartHeight;
      return { x: xCoord, y, riskScore: d.riskScore, date: d.date, riskLevel: d.riskLevel };
    });

    // Generate path for line
    const pathData = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    // Risk level zones
    const getRiskZoneY = (threshold: number) => {
      return padding + chartHeight - ((threshold - minScore) / scoreRange) * chartHeight;
    };

    return (
      <div className="w-full overflow-x-auto">
        <svg width={width} height={height} className="w-full">
          {/* Risk level zones */}
          <rect
            x={padding}
            y={getRiskZoneY(60)}
            width={chartWidth}
            height={getRiskZoneY(0) - getRiskZoneY(60)}
            fill="#fee2e2"
            opacity={0.3}
          />
          <rect
            x={padding}
            y={getRiskZoneY(40)}
            width={chartWidth}
            height={getRiskZoneY(60) - getRiskZoneY(40)}
            fill="#fed7aa"
            opacity={0.3}
          />
          <rect
            x={padding}
            y={getRiskZoneY(20)}
            width={chartWidth}
            height={getRiskZoneY(40) - getRiskZoneY(20)}
            fill="#fef3c7"
            opacity={0.3}
          />
          <rect
            x={padding}
            y={getRiskZoneY(0)}
            width={chartWidth}
            height={getRiskZoneY(20) - getRiskZoneY(0)}
            fill="#d1fae5"
            opacity={0.3}
          />

          {/* Grid lines */}
          {[0, 20, 40, 60, 80, 100].map((score) => {
            const y = getRiskZoneY(score);
            return (
              <g key={score}>
                <line
                  x1={padding}
                  y1={y}
                  x2={padding + chartWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {score}
                </text>
              </g>
            );
          })}

          {/* Line path */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r={4}
              fill="#3b82f6"
              className="hover:r-6 transition-all"
            >
              <title>
                {point.date.toLocaleDateString()}: {point.riskScore.toFixed(1)} (
                {point.riskLevel})
              </title>
            </circle>
          ))}

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            Time
          </text>
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            className="text-xs fill-gray-600"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            Risk Score
          </text>
        </svg>
      </div>
    );
  };

  // Render breakdown chart
  const renderBreakdownChart = () => {
    if (filteredData.length === 0) return null;

    const sorted = [...filteredData].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
    const latest = sorted[0];
    const previous = sorted[1];

    const categories = [
      { name: 'Gait', value: latest.gaitRisk, previous: previous?.gaitRisk },
      { name: 'Balance', value: latest.balanceRisk, previous: previous?.balanceRisk },
      {
        name: 'Environmental',
        value: latest.environmentalRisk,
        previous: previous?.environmentalRisk,
      },
      {
        name: 'Physiological',
        value: latest.physiologicalRisk,
        previous: previous?.physiologicalRisk,
      },
      {
        name: 'Behavioral',
        value: latest.behavioralRisk,
        previous: previous?.behavioralRisk,
      },
    ];

    return (
      <div className="space-y-4">
        {categories.map((cat) => {
          const change = previous ? cat.value - cat.previous! : 0;
          const changePercent = previous && cat.previous! > 0
            ? (change / cat.previous!) * 100
            : 0;

          return (
            <div key={cat.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{cat.value.toFixed(1)}%</span>
                  {previous && (
                    <span
                      className={`text-xs ${
                        change < 0 ? 'text-green-600' : change > 0 ? 'text-red-600' : 'text-gray-500'
                      }`}
                    >
                      {change < 0 ? '↓' : change > 0 ? '↑' : '→'}{' '}
                      {Math.abs(changePercent).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(cat.value, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Fall Risk History
            </CardTitle>
            <CardDescription>
              Track your fall risk trends over time
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', '1y', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  selectedRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === 'all' ? 'All' : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {showBreakdown && <TabsTrigger value="breakdown">Breakdown</TabsTrigger>}
            {showTrends && <TabsTrigger value="trends">Trends</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Trend summary */}
            {showTrends && trendStats && (
              <div className="grid grid-cols-4 gap-4 rounded-lg border p-4">
                <div>
                  <div className="text-xs text-gray-500">Trend</div>
                  <div className="mt-1 flex items-center gap-1">
                    {trendStats.trend === 'improving' && (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    )}
                    {trendStats.trend === 'declining' && (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    )}
                    {trendStats.trend === 'stable' && (
                      <Minus className="h-4 w-4 text-gray-600" />
                    )}
                    <span
                      className={`font-semibold ${
                        trendStats.trend === 'improving'
                          ? 'text-green-600'
                          : trendStats.trend === 'declining'
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {trendStats.trend === 'improving'
                        ? 'Improving'
                        : trendStats.trend === 'declining'
                          ? 'Declining'
                          : 'Stable'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Average</div>
                  <div className="mt-1 text-lg font-semibold">
                    {trendStats.average.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Range</div>
                  <div className="mt-1 text-lg font-semibold">
                    {trendStats.min.toFixed(1)} - {trendStats.max.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Change</div>
                  <div
                    className={`mt-1 text-lg font-semibold ${
                      trendStats.change < 0
                        ? 'text-green-600'
                        : trendStats.change > 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {trendStats.change < 0 ? '-' : '+'}
                    {Math.abs(trendStats.change).toFixed(1)} (
                    {trendStats.changePercent.toFixed(1)}%)
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            {renderLineChart()}
          </TabsContent>

          {showBreakdown && (
            <TabsContent value="breakdown">{renderBreakdownChart()}</TabsContent>
          )}

          {showTrends && (
            <TabsContent value="trends">
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <strong>Trend Analysis:</strong> Your fall risk has{' '}
                  {trendStats.trend === 'improving'
                    ? 'improved'
                    : trendStats.trend === 'declining'
                      ? 'increased'
                      : 'remained stable'}{' '}
                  over the selected period.
                  {trendStats.changePercent > 5 && (
                    <span className="mt-2 block text-orange-600">
                      ⚠️ Significant change detected. Consider reviewing your
                      interventions.
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-gray-500">Data Points</div>
                    <div className="mt-1 text-2xl font-bold">
                      {filteredData.length}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-gray-500">Period</div>
                    <div className="mt-1 text-lg font-semibold">
                      {selectedRange === 'all'
                        ? 'All Time'
                        : selectedRange === '7d'
                          ? '7 Days'
                          : selectedRange === '30d'
                            ? '30 Days'
                            : selectedRange === '90d'
                              ? '90 Days'
                              : '1 Year'}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
