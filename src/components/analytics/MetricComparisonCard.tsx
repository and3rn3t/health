/**
 * Metric Comparison Card Component
 * Compares current period with previous period
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import React, { useMemo } from 'react';
import type { ProcessedHealthData } from '@/lib/healthDataProcessor';
import type { MetricComparison } from '@/lib/analytics';
import { comparePeriods, extractTimeSeries } from '@/lib/analytics';

interface MetricComparisonCardProps {
  healthData: ProcessedHealthData;
  metric: 'steps' | 'heartRate' | 'walkingSteadiness' | 'sleepHours';
  period: '7d' | '30d' | '90d';
  onNavigate?: (metric: string) => void;
}

export default function MetricComparisonCard({
  healthData,
  metric,
  period,
  onNavigate,
}: MetricComparisonCardProps) {
  const comparison = useMemo(() => {
    const metricData = healthData.metrics[metric];
    if (!metricData) return null;

    // Get current period
    const current = extractTimeSeries(metricData, period);

    // Get previous period (same length, before current)
    const cutoff = new Date();
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    cutoff.setDate(cutoff.getDate() - periodDays);
    const previousCutoff = new Date(cutoff);
    previousCutoff.setDate(previousCutoff.getDate() - periodDays);

    const allData = extractTimeSeries(metricData, 'all');
    const previous = allData.filter(
      (d) => d.date >= previousCutoff && d.date < cutoff
    );

    if (current.length === 0 || previous.length === 0) return null;

    const comp = comparePeriods(current, previous);
    return {
      ...comp,
      metric: metric.replace(/([A-Z])/g, ' $1').trim(),
    };
  }, [healthData, metric, period]);

  if (!comparison) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Insufficient data for comparison
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    switch (comparison.trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (comparison.trend) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleClick = () => {
    if (onNavigate) {
      onNavigate(metric);
    }
  };

  return (
    <Card
      className={onNavigate ? 'cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]' : ''}
      onClick={onNavigate ? handleClick : undefined}
      role={onNavigate ? 'button' : undefined}
      tabIndex={onNavigate ? 0 : undefined}
      onKeyDown={onNavigate ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-medium capitalize">{comparison.metric}</span>
          <Badge
            variant={
              comparison.trend === 'improving'
                ? 'default'
                : comparison.trend === 'declining'
                  ? 'destructive'
                  : 'secondary'
            }
          >
            {comparison.trend}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Current</div>
            <div className="text-xl font-bold">{comparison.current.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Previous</div>
            <div className="text-xl font-bold text-gray-600">
              {comparison.previous.toFixed(1)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {comparison.change > 0 ? '+' : ''}
              {comparison.change.toFixed(1)} ({comparison.changePercent.toFixed(1)}%)
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {comparison.percentile}th percentile
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
