/**
 * Time Series Chart Component
 * Interactive line/area chart for health metrics over time
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useMemo } from 'react';
import type { TimeSeriesDataPoint } from '@/lib/analytics';
import { calculateTrend } from '@/lib/analytics';

interface TimeSeriesChartProps {
  title: string;
  data: TimeSeriesDataPoint[];
  unit?: string;
  color?: string;
  showTrend?: boolean;
  showPrediction?: boolean;
  height?: number;
}

export default function TimeSeriesChart({
  title,
  data,
  unit = '',
  color = '#3b82f6',
  showTrend = true,
  showPrediction = false,
  height = 200,
}: TimeSeriesChartProps) {
  const trend = useMemo(() => {
    if (!showTrend || data.length < 2) return null;
    return calculateTrend(data);
  }, [data, showTrend]);

  // Chart dimensions
  const width = 800;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate scales
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 1);
  const valueRange = maxValue - minValue || 1;

  // Generate path
  const points = data.map((point, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
    return { x, y, ...point };
  });

  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Area path (for area chart variant)
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

  // Grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    // Horizontal lines (value grid)
    for (let i = 0; i <= 4; i++) {
      const value = minValue + (valueRange / 4) * i;
      const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
      lines.push({ type: 'horizontal' as const, y, value });
    }
    // Vertical lines (date grid) - show 5 evenly spaced
    for (let i = 0; i <= 4; i++) {
      const index = Math.floor((data.length - 1) * (i / 4));
      const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
      lines.push({ type: 'vertical' as const, x, date: data[index]?.date });
    }
    return lines;
  }, [data, minValue, valueRange, chartWidth, chartHeight, padding]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {data.length} data points
              {trend && (
                <span className="ml-2">
                  • {trend.direction} ({trend.changePercent.toFixed(1)}%)
                </span>
              )}
            </CardDescription>
          </div>
          {trend && (
            <div className="flex items-center gap-2">
              {trend.direction === 'improving' && (
                <TrendingUp className="h-4 w-4 text-green-600" />
              )}
              {trend.direction === 'declining' && (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              {trend.direction === 'stable' && (
                <Minus className="h-4 w-4 text-gray-600" />
              )}
              <Badge
                variant={
                  trend.direction === 'improving'
                    ? 'default'
                    : trend.direction === 'declining'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {trend.direction}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg width={width} height={height} className="w-full">
            {/* Grid lines */}
            {gridLines.map((line, i) => {
              if (line.type === 'horizontal') {
                return (
                  <g key={`h-${i}`}>
                    <line
                      x1={padding}
                      y1={line.y}
                      x2={padding + chartWidth}
                      y2={line.y}
                      stroke="#e5e7eb"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding - 10}
                      y={line.y + 4}
                      textAnchor="end"
                      className="text-xs fill-gray-500"
                    >
                      {line.value.toFixed(1)}
                    </text>
                  </g>
                );
              } else {
                return (
                  <g key={`v-${i}`}>
                    <line
                      x1={line.x}
                      y1={padding}
                      x2={line.x}
                      y2={padding + chartHeight}
                      stroke="#e5e7eb"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                  </g>
                );
              }
            })}

            {/* Area fill */}
            <path
              d={areaPath}
              fill={color}
              fillOpacity={0.1}
            />

            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke={color}
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
                r={3}
                fill={color}
                className="hover:r-5 transition-all"
              >
                <title>
                  {point.date.toLocaleDateString()}: {point.value.toFixed(1)} {unit}
                </title>
              </circle>
            ))}

            {/* Prediction line (if enabled) */}
            {showPrediction && trend?.prediction && (
              <g>
                <line
                  x1={points[points.length - 1].x}
                  y1={points[points.length - 1].y}
                  x2={padding + chartWidth}
                  y2={padding + chartHeight - ((trend.prediction.nextValue - minValue) / valueRange) * chartHeight}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  opacity={0.6}
                />
                <circle
                  cx={padding + chartWidth}
                  cy={padding + chartHeight - ((trend.prediction.nextValue - minValue) / valueRange) * chartHeight}
                  r={4}
                  fill={color}
                  opacity={0.6}
                >
                  <title>
                    Predicted: {trend.prediction.nextValue.toFixed(1)} {unit}
                  </title>
                </circle>
              </g>
            )}

            {/* Axis labels */}
            <text
              x={width / 2}
              y={height - 5}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              Date
            </text>
            <text
              x={15}
              y={height / 2}
              textAnchor="middle"
              className="text-xs fill-gray-600"
              transform={`rotate(-90, 15, ${height / 2})`}
            >
              Value {unit && `(${unit})`}
            </text>
          </svg>
        </div>

        {/* Trend statistics */}
        {trend && (
          <div className="mt-4 grid grid-cols-4 gap-4 rounded-lg border p-3 text-sm">
            <div>
              <div className="text-xs text-gray-500">Slope</div>
              <div className="font-semibold">{trend.slope.toFixed(3)}/day</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">R²</div>
              <div className="font-semibold">{(trend.rSquared * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Confidence</div>
              <div className="font-semibold">{(trend.confidence * 100).toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Volatility</div>
              <div className="font-semibold">{(trend.volatility * 100).toFixed(1)}%</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
