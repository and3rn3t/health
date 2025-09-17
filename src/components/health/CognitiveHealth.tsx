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
import { useKV } from '@github/spark/hooks';
import {
  Brain,
  Clock,
  Eye,
  MousePointerClick,
  Sparkles,
  Target,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

// Data models and validation
const cognitiveResultSchema = z.object({
  date: z.string(),
  reactionAvgMs: z.number().optional(),
  memoryMaxLevel: z.number().optional(),
  attentionScore: z.number().optional(),
  compositeScore: z.number(),
});

type CognitiveResult = z.infer<typeof cognitiveResultSchema>;

const cognitiveSettingsSchema = z.object({
  reminders: z.boolean().default(false),
  assessmentsPerWeek: z.number().int().min(1).max(7).default(3),
  shareWithCaregivers: z.boolean().default(false),
});

type CognitiveSettings = z.infer<typeof cognitiveSettingsSchema>;

// Small sparkline component for trends
function Sparkline({ values }: { values: number[] }) {
  const width = 180;
  const height = 48;
  const padding = 6;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 100);
  const scaleX = (i: number) =>
    padding + (i * (width - padding * 2)) / Math.max(1, values.length - 1);
  const scaleY = (v: number) =>
    height -
    padding -
    ((v - min) / Math.max(1, max - min)) * (height - padding * 2);
  const path = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`)
    .join(' ');
  return (
    <svg width={width} height={height} className="text-vitalsense-primary/60">
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

// Reaction Time mini assessment
function ReactionTest({ onComplete }: { onComplete: (avgMs: number) => void }) {
  const [running, setRunning] = useState(false);
  const [prompt, setPrompt] = useState<'get-ready' | 'wait' | 'click' | 'done'>(
    'get-ready'
  );
  const [rounds, setRounds] = useState<number[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    []
  );

  const startRound = () => {
    setPrompt('wait');
    const delay = 800 + Math.floor(Math.random() * 1500); // 0.8s - 2.3s
    timerRef.current = window.setTimeout(() => {
      setPrompt('click');
      startTimeRef.current = performance.now();
    }, delay);
  };

  const start = () => {
    setRounds([]);
    setRunning(true);
    setPrompt('get-ready');
    startRound();
  };

  const handleClick = () => {
    if (!running) return;
    if (prompt === 'click') {
      const rt = Math.max(0, performance.now() - startTimeRef.current);
      const next = [...rounds, rt];
      setRounds(next);
      if (next.length >= 5) {
        setPrompt('done');
        setRunning(false);
        const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
        onComplete(avg);
      } else {
        startRound();
      }
    } else if (prompt === 'wait') {
      // clicked too early: ignore but restart round
      if (timerRef.current) window.clearTimeout(timerRef.current);
      startRound();
    }
  };

  // Compute background class without nested ternaries (lint)
  let bgClass = 'bg-card';
  if (prompt === 'click') {
    bgClass = 'bg-green-500/30';
  } else if (prompt === 'wait') {
    bgClass = 'bg-yellow-500/20';
  }

  return (
    <div className="space-y-3">
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-muted-foreground mb-2 text-sm">
          Click as soon as the prompt turns green. 5 tries.
        </p>
        <Button
          variant={running ? 'secondary' : 'default'}
          onClick={running ? undefined : start}
          disabled={running}
        >
          <Clock className="mr-2 h-4 w-4" />
          {running ? 'Running…' : 'Start'}
        </Button>
      </div>
      <button
        onClick={handleClick}
        className={`h-24 border-border w-full rounded-md border transition-colors duration-150 ${bgClass}`}
        aria-label="Reaction area"
      >
        <div className="text-center">
          {prompt === 'click' && <span className="font-semibold">Click!</span>}
          {prompt === 'wait' && (
            <span className="text-muted-foreground">Wait…</span>
          )}
          {prompt === 'get-ready' && (
            <span className="text-muted-foreground">Get Ready…</span>
          )}
          {prompt === 'done' && (
            <span className="text-muted-foreground">Done</span>
          )}
        </div>
      </button>
      {rounds.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Attempts: {rounds.length}/5
        </div>
      )}
    </div>
  );
}

// Memory Sequence mini assessment (4 tiles Simon-like)
function MemorySequenceTest({
  onComplete,
}: {
  onComplete: (maxLevel: number) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [maxLevel, setMaxLevel] = useState(0);

  const playSequence = async (seq: number[]) => {
    setPlaying(true);
    for (const step of seq) {
      setHighlight(step);
      await new Promise((r) => setTimeout(r, 500));
      setHighlight(null);
      await new Promise((r) => setTimeout(r, 150));
    }
    setPlaying(false);
  };

  const start = async () => {
    const level = Math.max(3, Math.min(6, maxLevel + 1));
    const seq = Array.from({ length: level }, () =>
      Math.floor(Math.random() * 4)
    );
    setSequence(seq);
    setInputIndex(0);
    await playSequence(seq);
  };

  const handleInput = async (tile: number) => {
    if (playing || sequence.length === 0) return;
    const correct = sequence[inputIndex] === tile;
    if (!correct) {
      onComplete(maxLevel);
      setSequence([]);
      setInputIndex(0);
      return;
    }
    const nextIndex = inputIndex + 1;
    setInputIndex(nextIndex);
    if (nextIndex >= sequence.length) {
      const newLevel = Math.max(maxLevel, sequence.length);
      setMaxLevel(newLevel);
      await new Promise((r) => setTimeout(r, 300));
      start();
    }
  };

  const tileClasses = (i: number) =>
    `h-14 rounded-md border flex items-center justify-center text-sm font-medium border-border ${
      highlight === i
        ? 'bg-vitalsense-primary/20 text-vitalsense-primary'
        : 'bg-card'
    }`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button onClick={start} disabled={playing}>
          <Sparkles className="mr-2 h-4 w-4" /> Start
        </Button>
        <div className="text-xs text-muted-foreground">
          Max Level: {maxLevel}
        </div>
      </div>
      <div className="gap-3 grid grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            className={tileClasses(i)}
            onClick={() => handleInput(i)}
          >
            {['A', 'B', 'C', 'D'][i]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CognitiveHealth() {
  // Persisted settings and results
  const [settings, setSettings] = useKV<CognitiveSettings>(
    'cognitive-settings',
    {
      reminders: false,
      assessmentsPerWeek: 3,
      shareWithCaregivers: false,
    }
  );
  const [results = [], setResults] = useKV<CognitiveResult[]>(
    'cognitive-results',
    []
  );
  // Ensure settings conform to schema (also references schema so it's not type-only)
  useEffect(() => {
    const parsed = cognitiveSettingsSchema.safeParse(settings ?? {});
    if (!parsed.success) {
      setSettings({
        reminders: false,
        assessmentsPerWeek: 3,
        shareWithCaregivers: false,
      });
    }
    // we intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const last = results.length > 0 ? results[results.length - 1] : null;
  const trendValues = results.map((r) => r.compositeScore).slice(-12);

  const riskLevel = useMemo(() => {
    const score = last?.compositeScore ?? 0;
    if (score >= 80)
      return { label: 'Low Risk', className: 'bg-green-500/15 text-green-600' };
    if (score >= 60)
      return {
        label: 'Moderate Risk',
        className: 'bg-yellow-500/15 text-yellow-700',
      };
    return { label: 'Elevated Risk', className: 'bg-red-500/15 text-red-600' };
  }, [last]);

  const saveResult = (partial: Partial<CognitiveResult>) => {
    // Build composite score with simple weighting
    const reaction = partial.reactionAvgMs ?? last?.reactionAvgMs ?? 0;
    const memory = partial.memoryMaxLevel ?? last?.memoryMaxLevel ?? 0;
    const attention = partial.attentionScore ?? last?.attentionScore ?? 0;
    // Normalize reaction (better when lower). Assume 200-500 ms range.
    const reactionScore = Math.max(
      0,
      Math.min(100, 100 - (reaction - 200) / 3)
    ); // 200ms → ~100, 500ms → ~0
    const memoryScore = Math.min(100, memory * 20); // level 5 → 100
    const attentionScore = Math.max(0, Math.min(100, attention));
    const composite = Math.round(
      reactionScore * 0.45 + memoryScore * 0.35 + attentionScore * 0.2
    );

    const record: CognitiveResult = {
      date: new Date().toISOString(),
      reactionAvgMs: reaction || undefined,
      memoryMaxLevel: memory || undefined,
      attentionScore: attention || undefined,
      compositeScore: composite,
    };
    const parsed = cognitiveResultSchema.safeParse(record);
    if (!parsed.success) return; // fail-closed silently; no logs of PII/metrics
    setResults([...(results ?? []), parsed.data]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cognitive Health</h1>
          <p className="text-muted-foreground mt-2">
            Measure memory, attention, and reaction time to monitor cognitive
            wellness.
          </p>
        </div>
        <Badge className={`${riskLevel.className}`}>{riskLevel.label}</Badge>
      </div>

      {/* Overview cards */}
      <div className="md:grid-cols-3 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-vitalsense-primary" /> Composite
              Score
            </CardTitle>
            <CardDescription>Latest assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {last?.compositeScore ?? '—'}
                </div>
                <div className="text-muted-foreground text-xs mt-1">
                  {last
                    ? new Date(last.date).toLocaleDateString()
                    : 'No data yet'}
                </div>
              </div>
              <div className="text-right">
                <Sparkline
                  values={trendValues.length > 1 ? trendValues : [0, 0, 0]}
                />
              </div>
            </div>
            <Progress className="mt-3" value={last?.compositeScore ?? 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-vitalsense-primary" />{' '}
              Reaction Time
            </CardTitle>
            <CardDescription>Avg across latest session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {last?.reactionAvgMs ?? '—'}
              <span className="text-muted-foreground ml-1 text-lg font-normal">
                ms
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Lower is better
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-vitalsense-primary" /> Memory
              Sequence
            </CardTitle>
            <CardDescription>Max level achieved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {last?.memoryMaxLevel ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Higher is better
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assessments" className="w-full">
        <TabsList>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointerClick className="h-5 w-5 text-vitalsense-primary" />{' '}
                Reaction Time Test
              </CardTitle>
              <CardDescription>
                Measure response speed to visual cues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReactionTest
                onComplete={(avg) => saveResult({ reactionAvgMs: avg })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-vitalsense-primary" /> Memory
                Sequence Test
              </CardTitle>
              <CardDescription>
                Repeat the flashing sequence to progress levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemorySequenceTest
                onComplete={(level) => saveResult({ memoryMaxLevel: level })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Recent cognitive scores</CardDescription>
            </CardHeader>
            <CardContent>
              {trendValues.length > 0 ? (
                <div className="flex items-center justify-between">
                  <Sparkline values={trendValues} />
                  <div className="text-sm">
                    <div className="text-muted-foreground">
                      Last {trendValues.length} assessments
                    </div>
                    <div>
                      Avg:{' '}
                      <span className="font-medium">
                        {Math.round(
                          trendValues.reduce((a, b) => a + b, 0) /
                            trendValues.length
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-center">
                  No trend data yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Settings</CardTitle>
              <CardDescription>Configure reminders and sharing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Weekly Frequency</div>
                  <div className="text-muted-foreground text-sm">
                    Assessments per week
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSettings({
                        ...(settings ?? {
                          reminders: false,
                          assessmentsPerWeek: 3,
                          shareWithCaregivers: false,
                        }),
                        assessmentsPerWeek: Math.max(
                          1,
                          Math.min(7, (settings?.assessmentsPerWeek ?? 3) - 1)
                        ),
                      })
                    }
                  >
                    -
                  </Button>
                  <div className="w-10 text-center">
                    {settings?.assessmentsPerWeek ?? 3}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSettings({
                        ...(settings ?? {
                          reminders: false,
                          assessmentsPerWeek: 3,
                          shareWithCaregivers: false,
                        }),
                        assessmentsPerWeek: Math.max(
                          1,
                          Math.min(7, (settings?.assessmentsPerWeek ?? 3) + 1)
                        ),
                      })
                    }
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Reminders</div>
                  <div className="text-muted-foreground text-sm">
                    Enable in-app reminders
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    setSettings({
                      ...(settings ?? {
                        reminders: false,
                        assessmentsPerWeek: 3,
                        shareWithCaregivers: false,
                      }),
                      reminders: !settings?.reminders,
                    })
                  }
                >
                  {settings?.reminders ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Share with Caregivers</div>
                  <div className="text-muted-foreground text-sm">
                    Allow caregivers to view results
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    setSettings({
                      ...(settings ?? {
                        reminders: false,
                        assessmentsPerWeek: 3,
                        shareWithCaregivers: false,
                      }),
                      shareWithCaregivers: !settings?.shareWithCaregivers,
                    })
                  }
                >
                  {settings?.shareWithCaregivers ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
