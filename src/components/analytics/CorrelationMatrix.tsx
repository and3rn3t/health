/**
 * Correlation Matrix Component
 * Visualizes correlations between multiple health metrics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import React, { useMemo } from 'react';
import type { ProcessedHealthData } from '@/lib/healthDataProcessor';
import type { CorrelationAnalysis } from '@/lib/analytics';
import { calculateCorrelation, extractTimeSeries } from '@/lib/analytics';

interface CorrelationMatrixProps {
  healthData: ProcessedHealthData;
  metrics?: string[];
}

const DEFAULT_METRICS = ['steps', 'heartRate', 'walkingSteadiness', 'sleepHours'];

export default function CorrelationMatrix({
  healthData,
  metrics = DEFAULT_METRICS,
}: CorrelationMatrixProps) {
  const correlations = useMemo(() => {
    const results: Array<CorrelationAnalysis & { metric1: string; metric2: string }> = [];

    // Extract time series for each metric
    const timeSeriesMap = new Map<string, ReturnType<typeof extractTimeSeries>>();
    metrics.forEach((metric) => {
      const metricData = healthData.metrics[metric as keyof typeof healthData.metrics];
      if (metricData) {
        timeSeriesMap.set(metric, extractTimeSeries(metricData));
      }
    });

    // Calculate correlations between all pairs
    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const metric1 = metrics[i];
        const metric2 = metrics[j];
        const data1 = timeSeriesMap.get(metric1);
        const data2 = timeSeriesMap.get(metric2);

        if (data1 && data2 && data1.length > 0 && data2.length > 0) {
          const correlation = calculateCorrelation(data1, data2);
          results.push({
            ...correlation,
            metric1,
            metric2,
          });
        }
      }
    }

    return results.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, [healthData, metrics]);

  const getCorrelationColor = (correlation: number): string => {
    const abs = Math.abs(correlation);
    if (abs > 0.7) return correlation > 0 ? '#10b981' : '#ef4444';
    if (abs > 0.4) return correlation > 0 ? '#84cc16' : '#f59e0b';
    if (abs > 0.2) return '#94a3b8';
    return '#e5e7eb';
  };

  const getStrengthBadge = (strength: CorrelationAnalysis['strength']) => {
    const variants = {
      strong: 'default',
      moderate: 'secondary',
      weak: 'outline',
      none: 'outline',
    } as const;

    return (
      <Badge variant={variants[strength]} className="text-xs">
        {strength}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metric Correlations</CardTitle>
        <CardDescription>
          How your health metrics relate to each other
        </CardDescription>
      </CardHeader>
      <CardContent>
        {correlations.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Insufficient data for correlation analysis
          </div>
        ) : (
          <div className="space-y-4">
            {/* Correlation matrix visualization */}
            <div className="grid grid-cols-2 gap-4">
              {correlations.map((corr) => (
                <div
                  key={`${corr.metric1}-${corr.metric2}`}
                  className="rounded-lg border p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">
                        {corr.metric1.replace(/([A-Z])/g, ' $1').trim()} ↔{' '}
                        {corr.metric2.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {corr.sampleSize} data points
                      </div>
                    </div>
                    {getStrengthBadge(corr.strength)}
                  </div>

                  {/* Correlation value bar */}
                  <div className="mb-2">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-600">Correlation</span>
                      <span className="font-semibold">
                        {corr.correlation > 0 ? '+' : ''}
                        {corr.correlation.toFixed(3)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.abs(corr.correlation) * 100}%`,
                          backgroundColor: getCorrelationColor(corr.correlation),
                          marginLeft: corr.correlation < 0 ? 'auto' : '0',
                        }}
                      />
                    </div>
                  </div>

                  {/* Interpretation */}
                  <div className="text-xs text-gray-600">
                    {corr.interpretation}
                  </div>

                  {/* Significance */}
                  <div className="mt-2 text-xs text-gray-500">
                    Significance: {(corr.significance * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>

            {/* Summary insights */}
            <div className="rounded-lg border bg-blue-50 p-4">
              <h4 className="mb-2 font-semibold text-blue-900">Key Insights</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                {correlations
                  .filter((c) => Math.abs(c.correlation) > 0.5)
                  .slice(0, 3)
                  .map((corr) => (
                    <li key={`${corr.metric1}-${corr.metric2}`}>
                      • {corr.metric1} and {corr.metric2} show{' '}
                      {Math.abs(corr.correlation) > 0.7 ? 'strong' : 'moderate'}{' '}
                      {corr.correlation > 0 ? 'positive' : 'negative'} correlation
                    </li>
                  ))}
                {correlations.filter((c) => Math.abs(c.correlation) > 0.5).length === 0 && (
                  <li>No strong correlations detected between metrics</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
