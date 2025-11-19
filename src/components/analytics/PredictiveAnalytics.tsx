/**
 * Predictive Analytics Component
 * Forecasts future health trends based on historical data
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingDown, TrendingUp, Target } from 'lucide-react';
import React, { useMemo } from 'react';
import type { ProcessedHealthData } from '@/lib/healthDataProcessor';
import type { TrendAnalysis } from '@/lib/analytics';
import { calculateTrend, extractTimeSeries } from '@/lib/analytics';

interface PredictiveAnalyticsProps {
  healthData: ProcessedHealthData;
  forecastDays?: number;
}

export default function PredictiveAnalytics({
  healthData,
  forecastDays = 30,
}: PredictiveAnalyticsProps) {
  const predictions = useMemo(() => {
    const metrics: Array<{
      name: string;
      key: keyof ProcessedHealthData['metrics'];
      trend: TrendAnalysis | null;
    }> = [];

    const metricKeys: Array<keyof ProcessedHealthData['metrics']> = [
      'steps',
      'heartRate',
      'walkingSteadiness',
      'sleepHours',
    ];

    metricKeys.forEach((key) => {
      const metricData = healthData.metrics[key];
      if (metricData) {
        const timeSeries = extractTimeSeries(metricData, '90d');
        if (timeSeries.length >= 7) {
          const trend = calculateTrend(timeSeries);
          metrics.push({
            name: key.replace(/([A-Z])/g, ' $1').trim(),
            key,
            trend,
          });
        }
      }
    });

    return metrics;
  }, [healthData]);

  const getForecastColor = (trend: TrendAnalysis | null) => {
    if (!trend) return 'text-gray-500';
    if (trend.direction === 'improving') return 'text-green-600';
    if (trend.direction === 'declining') return 'text-red-600';
    return 'text-gray-600';
  };

  const getForecastIcon = (trend: TrendAnalysis | null) => {
    if (!trend) return null;
    if (trend.direction === 'improving') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    if (trend.direction === 'declining') {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Predictive Analytics
        </CardTitle>
        <CardDescription>
          {forecastDays}-day forecasts based on historical trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        {predictions.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Insufficient data for predictions
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((pred) => {
              if (!pred.trend || !pred.trend.prediction) return null;

              const { prediction, direction, confidence } = pred.trend;
              const currentValue = extractTimeSeries(
                healthData.metrics[pred.key],
                '7d'
              )[0]?.value || 0;

              return (
                <div
                  key={pred.key}
                  className="rounded-lg border p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getForecastIcon(pred.trend)}
                      <span className="font-medium capitalize">{pred.name}</span>
                    </div>
                    <Badge
                      variant={
                        direction === 'improving'
                          ? 'default'
                          : direction === 'declining'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {direction}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Current</div>
                      <div className="text-lg font-semibold">
                        {currentValue.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Forecast ({forecastDays}d)
                      </div>
                      <div
                        className={`text-lg font-semibold ${getForecastColor(pred.trend)}`}
                      >
                        {prediction.nextValue.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Change indicator */}
                  <div className="mb-3">
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Projected Change</span>
                      <span
                        className={getForecastColor(pred.trend)}
                      >
                        {prediction.nextValue > currentValue ? '+' : ''}
                        {((prediction.nextValue - currentValue) / currentValue * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          direction === 'improving'
                            ? 'bg-green-500'
                            : direction === 'declining'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            Math.abs(
                              ((prediction.nextValue - currentValue) / currentValue) * 100
                            ),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Confidence and date */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {prediction.nextDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      Confidence: {(confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {predictions.length > 0 && (
          <div className="mt-4 rounded-lg border bg-blue-50 p-4">
            <h4 className="mb-2 font-semibold text-blue-900">Forecast Summary</h4>
            <p className="text-sm text-blue-800">
              Based on current trends, your health metrics are projected to{' '}
              {predictions.filter((p) => p.trend?.direction === 'improving').length >
              predictions.filter((p) => p.trend?.direction === 'declining').length
                ? 'improve'
                : predictions.filter((p) => p.trend?.direction === 'declining').length >
                    predictions.filter((p) => p.trend?.direction === 'improving').length
                  ? 'decline'
                  : 'remain stable'}{' '}
              over the next {forecastDays} days. These predictions are based on
              historical patterns and should be used as guidance, not medical
              advice.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
