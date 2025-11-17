import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';
import { HIGIcon, IOSHIGIcons } from '@/components/ui/ios-hig-icons';
import {
  IOS26Button,
  IOS26ButtonGroup,
  IOS26FAB,
} from '@/components/ui/ios26-button-system';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@/hooks/useCloudflareKV';
import { iOS26MotionAccessibility } from '@/lib/ios26-accessibility-enhanced';
import { getiOS26TypographyClass } from '@/lib/ios26-dynamic-type';
import { Clock, Eye, MousePointerClick, Sparkles, Target } from 'lucide-react';
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
        <p className="mb-2 text-sm text-muted-foreground">
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
        className={`h-24 w-full rounded-md border border-border transition-colors duration-150 ${bgClass}`}
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
      <div className="grid grid-cols-2 gap-3">
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

// Attention Control (Go/No-Go) mini assessment
function AttentionGoNoGoTest({
  onComplete,
}: {
  onComplete: (attentionScore: number) => void;
}) {
  const [running, setRunning] = useState(false);
  const [trialIndex, setTrialIndex] = useState(0);
  const [stimulus, setStimulus] = useState<'go' | 'nogo' | 'idle'>('idle');
  const [acceptedInput, setAcceptedInput] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [falsePositives, setFalsePositives] = useState(0);
  const totalTrials = 20;
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    []
  );

  const scheduleNext = (nextIndex: number) => {
    if (nextIndex >= totalTrials) {
      setRunning(false);
      setStimulus('idle');
      // Simple accuracy-based attention score
      const accuracy = Math.max(0, correct - falsePositives);
      const score = Math.round((accuracy / totalTrials) * 100);
      onComplete(score);
      return;
    }

    const delay = 600 + Math.floor(Math.random() * 900); // 0.6s - 1.5s
    timerRef.current = window.setTimeout(() => {
      // 70% GO, 30% NOGO
      const isGo = (crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)) < 0.7;
      setStimulus(isGo ? 'go' : 'nogo');
      setAcceptedInput(false);

      // Stimulus visible for 1200ms, then evaluate miss
      timerRef.current = window.setTimeout(() => {
        if (isGo && !acceptedInput) {
          // Missed a GO
        }
        setStimulus('idle');
        setTrialIndex(nextIndex + 1);
        scheduleNext(nextIndex + 1);
      }, 1200);
    }, delay);
  };

  const start = () => {
    setRunning(true);
    setTrialIndex(0);
    setCorrect(0);
    setFalsePositives(0);
    setStimulus('idle');
    scheduleNext(0);
  };

  const handleTap = () => {
    if (!running) return;
    if (stimulus === 'go' && !acceptedInput) {
      setCorrect((c) => c + 1);
      setAcceptedInput(true);
    } else if (stimulus === 'nogo' && !acceptedInput) {
      setFalsePositives((f) => f + 1);
      setAcceptedInput(true);
    }
  };

  // Liquid glass styles for stimulus panel
  const motionClasses = iOS26MotionAccessibility.getAnimationClasses(
    'transform hover:scale-[1.01] active:scale-95',
    ''
  );
  const panelClass = `ios-26-surface-elevated border border-white/10 backdrop-blur-md h-28 w-full rounded-xl flex items-center justify-center transition-colors ${motionClasses} ${
    stimulus === 'go'
      ? 'bg-green-500/15'
      : stimulus === 'nogo'
        ? 'bg-red-500/15'
        : 'bg-white/5'
  }`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Trial {Math.min(trialIndex + 1, totalTrials)} / {totalTrials}
        </div>
        <IOS26Button
          variant="tinted"
          onClick={running ? undefined : start}
          disabled={running}
        >
          {running ? 'Running…' : 'Start'}
        </IOS26Button>
      </div>

      <button
        aria-label="Attention tap area"
        onClick={handleTap}
        className={panelClass}
      >
        <div className="text-center">
          {stimulus === 'go' && (
            <span className="font-semibold text-foreground">Tap!</span>
          )}
          {stimulus === 'nogo' && (
            <span className="text-muted-foreground">Do not tap</span>
          )}
          {stimulus === 'idle' && (
            <span className="text-muted-foreground">Get ready…</span>
          )}
        </div>
      </button>

      <div className="ios-26-surface rounded-lg border border-white/10 p-3 text-xs text-muted-foreground backdrop-blur-sm">
        <div>Correct taps: {correct}</div>
        <div>False positives: {falsePositives}</div>
      </div>
    </div>
  );
}

export default function CognitiveHealth() {
  // Persisted settings and results
  const [practiceMode, setPracticeMode] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [summary, setSummary] = useState<{
    reactionAvgMs?: number;
    memoryMaxLevel?: number;
    attentionScore?: number;
    compositeScore?: number;
  } | null>(null);
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
    // Update session summary view
    setSummary({
      reactionAvgMs: record.reactionAvgMs,
      memoryMaxLevel: record.memoryMaxLevel,
      attentionScore: record.attentionScore,
      compositeScore: record.compositeScore,
    });
    setShowSummary(true);
  };

  // Wrapper to handle practice mode routing
  const onAssessmentComplete = (partial: Partial<CognitiveResult>) => {
    if (practiceMode) {
      // Compute preview summary but do not persist
      const reaction = partial.reactionAvgMs ?? last?.reactionAvgMs ?? 0;
      const memory = partial.memoryMaxLevel ?? last?.memoryMaxLevel ?? 0;
      const attention = partial.attentionScore ?? last?.attentionScore ?? 0;
      const reactionScore = Math.max(
        0,
        Math.min(100, 100 - (reaction - 200) / 3)
      );
      const memoryScore = Math.min(100, (memory ?? 0) * 20);
      const attentionScore = Math.max(0, Math.min(100, attention ?? 0));
      const composite = Math.round(
        reactionScore * 0.45 + memoryScore * 0.35 + attentionScore * 0.2
      );
      setSummary({
        reactionAvgMs: partial.reactionAvgMs ?? undefined,
        memoryMaxLevel: partial.memoryMaxLevel ?? undefined,
        attentionScore: partial.attentionScore ?? undefined,
        compositeScore: composite,
      });
      setShowSummary(true);
      return;
    }
    saveResult(partial);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1
              className={`text-3xl font-bold ${getiOS26TypographyClass('large-title')}`}
            >
              Cognitive Health
            </h1>
            <p
              className={`mt-2 text-muted-foreground ${getiOS26TypographyClass('body')}`}
            >
              Measure memory, attention, and reaction time to monitor cognitive
              wellness.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <IOS26Button
              variant={practiceMode ? 'tinted' : 'secondary'}
              size="small"
              onClick={() => setPracticeMode((v) => !v)}
            >
              {practiceMode ? 'Practice: On' : 'Practice: Off'}
            </IOS26Button>
            <Badge className={`${riskLevel.className}`}>
              {riskLevel.label}
            </Badge>
          </div>
        </div>

        {/* Overview cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="ios-26-surface-elevated border border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HIGIcon
                  icon={IOSHIGIcons.health.brain}
                  className="h-5 w-5 text-vitalsense-primary"
                />{' '}
                Composite Score
              </CardTitle>
              <CardDescription>Latest assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold">
                    {last?.compositeScore ?? '—'}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
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

          <Card className="ios-26-surface-elevated border border-white/10 backdrop-blur-md">
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
                <span className="ml-1 text-lg font-normal text-muted-foreground">
                  ms
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Lower is better
              </div>
            </CardContent>
          </Card>

          <Card className="ios-26-surface-elevated border border-white/10 backdrop-blur-md">
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
              <div className="mt-1 text-xs text-muted-foreground">
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
            <Card
              id="reaction-test"
              className="ios-26-surface-elevated border border-white/10 backdrop-blur-md"
            >
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
                  onComplete={(avg) =>
                    onAssessmentComplete({ reactionAvgMs: avg })
                  }
                />
              </CardContent>
            </Card>

            <Card
              id="memory-test"
              className="ios-26-surface-elevated border border-white/10 backdrop-blur-md"
            >
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
                  onComplete={(level) =>
                    onAssessmentComplete({ memoryMaxLevel: level })
                  }
                />
              </CardContent>
            </Card>

            <Card
              id="attention-test"
              className="ios-26-surface-elevated border border-white/10 backdrop-blur-md"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HIGIcon
                    icon={IOSHIGIcons.health.activity}
                    className="h-5 w-5 text-vitalsense-primary"
                  />{' '}
                  Attention Control Test
                </CardTitle>
                <CardDescription>
                  Tap on GO stimuli, avoid tapping on NO-GO
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttentionGoNoGoTest
                  onComplete={(score) =>
                    onAssessmentComplete({ attentionScore: score })
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card className="ios-26-surface-elevated border border-white/10 backdrop-blur-md">
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
                  <div className="text-center text-muted-foreground">
                    No trend data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="ios-26-surface-elevated border border-white/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Assessment Settings</CardTitle>
                <CardDescription>
                  Configure reminders and sharing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Weekly Frequency</div>
                    <div className="text-sm text-muted-foreground">
                      Assessments per week
                    </div>
                  </div>
                  <IOS26ButtonGroup>
                    <IOS26Button
                      variant="secondary"
                      size="small"
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
                      −
                    </IOS26Button>
                    <div className="w-10 text-center">
                      {settings?.assessmentsPerWeek ?? 3}
                    </div>
                    <IOS26Button
                      variant="secondary"
                      size="small"
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
                    </IOS26Button>
                  </IOS26ButtonGroup>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Reminders</div>
                    <div className="text-sm text-muted-foreground">
                      Enable in-app reminders
                    </div>
                  </div>
                  <IOS26Button
                    variant="tinted"
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
                  </IOS26Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Share with Caregivers</div>
                    <div className="text-sm text-muted-foreground">
                      Allow caregivers to view results
                    </div>
                  </div>
                  <IOS26Button
                    variant="tinted"
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
                  </IOS26Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* Floating FAB: Guided Session */}
      <IOS26FAB
        icon="zap"
        label="Start Guided Session"
        onClick={() => setGuidedOpen(true)}
        position="bottom-right"
      />

      {/* Guided Session Dialog */}
      <Dialog open={guidedOpen} onOpenChange={setGuidedOpen}>
        <DialogContent className="ios-26-surface-elevated border border-white/10 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className={getiOS26TypographyClass('title-2')}>
              Start Guided Cognitive Session
            </DialogTitle>
            <DialogDescription className={getiOS26TypographyClass('callout')}>
              Complete all three assessments in sequence. You can enable
              Practice Mode to try without saving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="ios-26-surface rounded-lg border border-white/10 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HIGIcon icon={IOSHIGIcons.system.clock} />
                  <span>1. Reaction Time</span>
                </div>
                <IOS26Button
                  onClick={() => scrollTo('reaction-test')}
                  size="small"
                >
                  Go
                </IOS26Button>
              </div>
            </div>
            <div className="ios-26-surface rounded-lg border border-white/10 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HIGIcon icon={IOSHIGIcons.health.brain} />
                  <span>2. Memory Sequence</span>
                </div>
                <IOS26Button
                  onClick={() => scrollTo('memory-test')}
                  size="small"
                >
                  Go
                </IOS26Button>
              </div>
            </div>
            <div className="ios-26-surface rounded-lg border border-white/10 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HIGIcon icon={IOSHIGIcons.health.activity} />
                  <span>3. Attention Control</span>
                </div>
                <IOS26Button
                  onClick={() => scrollTo('attention-test')}
                  size="small"
                >
                  Go
                </IOS26Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <IOS26Button
              variant={practiceMode ? 'tinted' : 'secondary'}
              onClick={() => setPracticeMode((v) => !v)}
            >
              {practiceMode ? 'Practice Mode: On' : 'Practice Mode: Off'}
            </IOS26Button>
            <IOS26Button onClick={() => setGuidedOpen(false)}>
              Close
            </IOS26Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="ios-26-surface-elevated border border-white/10 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className={getiOS26TypographyClass('title-2')}>
              Session Summary
            </DialogTitle>
            <DialogDescription className={getiOS26TypographyClass('callout')}>
              Review your latest results.{' '}
              {practiceMode ? 'Practice results are not saved.' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="ios-26-surface rounded-lg border border-white/10 p-3">
              <div className="text-xs text-muted-foreground">Reaction</div>
              <div className="text-2xl font-semibold">
                {summary?.reactionAvgMs != null ? (
                  <>
                    {summary.reactionAvgMs}
                    <span className="ml-1 text-sm text-muted-foreground">
                      ms
                    </span>
                  </>
                ) : (
                  '—'
                )}
              </div>
            </div>
            <div className="ios-26-surface rounded-lg border border-white/10 p-3">
              <div className="text-xs text-muted-foreground">Memory</div>
              <div className="text-2xl font-semibold">
                {summary?.memoryMaxLevel ?? '—'}
              </div>
            </div>
            <div className="ios-26-surface rounded-lg border border-white/10 p-3">
              <div className="text-xs text-muted-foreground">Attention</div>
              <div className="text-2xl font-semibold">
                {summary?.attentionScore ?? '—'}
              </div>
            </div>
          </div>

          <div className="ios-26-surface rounded-lg border border-white/10 p-3">
            <div className="text-xs text-muted-foreground">Composite</div>
            <div className="text-2xl font-semibold">
              {summary?.compositeScore ?? last?.compositeScore ?? '—'}
            </div>
          </div>

          <DialogFooter>
            <IOS26Button onClick={() => setShowSummary(false)}>
              Close
            </IOS26Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
