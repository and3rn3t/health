/**
 * Pattern Detection Panel Component
 * Identifies patterns in health data (daily, weekly, seasonal)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import React, { useMemo } from 'react';
import type { ProcessedHealthData } from '@/lib/healthDataProcessor';
import type { PatternDetection } from '@/lib/analytics';
import { detectPatterns, extractTimeSeries } from '@/lib/analytics';

interface PatternDetectionPanelProps {
  healthData: ProcessedHealthData;
  metric: 'steps' | 'heartRate' | 'walkingSteadiness' | 'sleepHours';
}

export default function PatternDetectionPanel({
  healthData,
  metric,
}: PatternDetectionPanelProps) {
  const patterns = useMemo(() => {
    const metricData = healthData.metrics[metric];
    if (!metricData) return [];

    const timeSeries = extractTimeSeries(metricData, '90d');
    return detectPatterns(timeSeries);
  }, [healthData, metric]);

  const getPatternIcon = (pattern: PatternDetection['pattern']) => {
    switch (pattern) {
      case 'daily':
        return <Clock className="h-4 w-4" />;
      case 'weekly':
        return <Calendar className="h-4 w-4" />;
      case 'seasonal':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPatternColor = (pattern: PatternDetection['pattern']) => {
    switch (pattern) {
      case 'daily':
        return 'bg-blue-500';
      case 'weekly':
        return 'bg-green-500';
      case 'seasonal':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Pattern Detection - {metric.replace(/([A-Z])/g, ' $1').trim()}
        </CardTitle>
        <CardDescription>
          Identified patterns in your health data
        </CardDescription>
      </CardHeader>
      <CardContent>
        {patterns.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No patterns detected
          </div>
        ) : (
          <div className="space-y-4">
            {patterns.map((pattern, i) => (
              <div
                key={i}
                className="rounded-lg border p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPatternIcon(pattern.pattern)}
                    <span className="font-medium capitalize">{pattern.pattern} Pattern</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={getPatternColor(pattern.pattern)}
                      variant="default"
                    >
                      {(pattern.strength * 100).toFixed(0)}% strength
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{pattern.description}</p>

                {pattern.peakTimes && pattern.peakTimes.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-500 mb-1">Peak Times:</div>
                    <div className="flex flex-wrap gap-1">
                      {pattern.peakTimes.map((time, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {pattern.lowTimes && pattern.lowTimes.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Low Times:</div>
                    <div className="flex flex-wrap gap-1">
                      {pattern.lowTimes.map((time, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strength indicator */}
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span>Pattern Strength</span>
                    <span>{(pattern.strength * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${getPatternColor(pattern.pattern)}`}
                      style={{ width: `${pattern.strength * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Insights */}
        {patterns.length > 0 && (
          <div className="mt-4 rounded-lg border bg-blue-50 p-4">
            <h4 className="mb-2 font-semibold text-blue-900">Insights</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              {patterns
                .filter((p) => p.strength > 0.5)
                .map((pattern, i) => (
                  <li key={i}>
                    • {pattern.description}
                    {pattern.peakTimes && pattern.peakTimes.length > 0 && (
                      <span>
                        {' '}
                        Peak activity on {pattern.peakTimes.join(', ')}
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
