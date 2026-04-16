/**
 * LiDAR Overview — Displays current session results, sparkline, and comparison.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3 } from '@/lib/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

import type { LiDARSession } from './lidar-types';
import {
  getQualityBadgeVariant,
  getRiskBadgeVariant,
  renderChangeVsPrevious,
} from './lidar-types';

export interface OverviewProps {
  readonly currentSession: LiDARSession;
  readonly sessionHistory: LiDARSession[];
  readonly showMessage: (message: string, type?: 'success' | 'error') => void;
}

export function LiDAROverview(props: Readonly<OverviewProps>) {
  const { currentSession, sessionHistory, showMessage } = props;
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 aria-hidden="true" className="mr-1 h-4 w-4 select-none" />
          <span>Analysis Overview</span>
        </CardTitle>
        <CardDescription>
          Session completed at {currentSession.endTime?.toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!currentSession.metrics ? (
          <p className="text-sm text-muted-foreground">
            No metrics available for this session.
          </p>
        ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Step Length</p>
            <p className="text-2xl font-bold">
              {currentSession.metrics.spatialMetrics.stepLength} cm
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Cadence</p>
            <p className="text-2xl font-bold">
              {currentSession.metrics.temporalMetrics.cadence} steps/min
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Balance Score</p>
            <p className="text-2xl font-bold">
              {currentSession.metrics.stabilityMetrics.balanceScore}%
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Overall Status</p>
            <div className="flex items-center gap-2">
              <Badge variant="default">✅ Analysis Complete</Badge>
              {currentSession.qualityGrade && (
                <Badge
                  variant={getQualityBadgeVariant(currentSession.qualityGrade)}
                >
                  Quality: {currentSession.qualityGrade}
                </Badge>
              )}
              {currentSession.fusedRisk && (
                <Badge
                  variant={getRiskBadgeVariant(
                    currentSession.fusedRisk.riskLevel
                  )}
                  title={currentSession.fusedRisk.explanation}
                >
                  Fused Risk:{' '}
                  {Math.round(currentSession.fusedRisk.probability * 100)}%
                </Badge>
              )}
            </div>
          </div>
        </div>
        )}
        {/* Sparkline */}
        {sessionHistory.length > 0 &&
          (() => {
            const cadences = [
              currentSession.metrics?.temporalMetrics.cadence,
              ...sessionHistory
                .filter((s) => s.metrics)
                .map((s) => s.metrics!.temporalMetrics.cadence),
            ]
              .filter((v): v is number => typeof v === 'number')
              .slice(0, 8)
              .reverse();
            if (cadences.length < 2) return null;
            const w = 160;
            const h = 36;
            const min = Math.min(...cadences);
            const max = Math.max(...cadences);
            const range = Math.max(1, max - min);
            const step = w / (cadences.length - 1);
            const points = cadences
              .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
              .join(' ');
            return (
              <div className="mt-4">
                <p className="mb-1 text-sm font-medium">
                  Cadence Trend (recent)
                </p>
                <svg
                  width={w}
                  height={h}
                  viewBox={`0 0 ${w} ${h}`}
                  className="text-primary"
                  aria-label="Cadence sparkline"
                >
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    points={points}
                  />
                </svg>
              </div>
            );
          })()}
        {/* Compare to previous */}
        {sessionHistory.length > 0 && (() => {
          const change = renderChangeVsPrevious(currentSession, sessionHistory);
          if (!change) {
            return (
              <div className="mt-4 rounded border p-3">
                <p className="mb-2 text-sm font-medium">Change vs. last session</p>
                <p className="text-xs text-muted-foreground">
                  No previous session with metrics found.
                </p>
              </div>
            );
          }
          const F = (n: number) => (n > 0 ? `+${n}` : `${n}`);
          return (
            <div className="mt-4 rounded border p-3">
              <p className="mb-2 text-sm font-medium">Change vs. last session</p>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded bg-muted p-2">
                  <div className="text-muted-foreground">Step Length</div>
                  <div className={change.dLen >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {F(Math.round(change.dLen))} cm
                  </div>
                </div>
                <div className="rounded bg-muted p-2">
                  <div className="text-muted-foreground">Cadence</div>
                  <div className={change.dCad >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {F(Math.round(change.dCad))} spm
                  </div>
                </div>
                <div className="rounded bg-muted p-2">
                  <div className="text-muted-foreground">Balance</div>
                  <div className={change.dBal >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {F(Math.round(change.dBal))} %
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        {/* JSON viewer */}
        <div className="mt-4 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  try {
                    const json = JSON.stringify(
                      currentSession,
                      (_k, v) => (v instanceof Date ? v.toISOString() : v),
                      2
                    );
                    setContent(json);
                    setOpen(true);
                  } catch (e) {
                    console.error('Failed to open JSON', e);
                    showMessage('Failed to open JSON', 'error');
                  }
                }}
              >
                View JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Session JSON</DialogTitle>
                <DialogDescription>
                  Exact JSON for this session (timestamps in ISO)
                </DialogDescription>
              </DialogHeader>
              <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">
                {content}
              </pre>
              <DialogFooter>
                <div className="flex w-full items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(content);
                        showMessage('Copied to clipboard');
                      } catch (e) {
                        console.error('Copy failed', e);
                        showMessage('Copy failed', 'error');
                      }
                    }}
                  >
                    Copy JSON
                  </Button>
                  <Button size="sm" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
