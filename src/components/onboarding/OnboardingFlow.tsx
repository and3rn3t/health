import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useKV } from '@/hooks/useCloudflareKV';
import type { ProcessedHealthData } from '@/types';
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Smartphone,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';

const HealthDataImport = lazy(
  () => import('@/components/health/HealthDataImport')
);

type OnboardingState = {
  dismissed?: boolean;
  completedSteps?: string[]; // ['import', 'contacts', 'device', 'analytics']
};

interface OnboardingFlowProps {
  onNavigate: (tabId: string) => void;
  onHealthDataImported?: (data: ProcessedHealthData) => void;
}

export default function OnboardingFlow({
  onNavigate,
  onHealthDataImported,
}: OnboardingFlowProps) {
  const [healthData, setHealthData] = useKV<ProcessedHealthData | null>(
    'health-data',
    null
  );
  const [contacts] = useKV<Array<{ id: string }>>('emergency-contacts', []);
  const [state, setState] = useKV<OnboardingState>('onboarding', {
    dismissed: false,
    completedSteps: [],
  });

  const contactsCount = contacts?.length ?? 0;

  const steps = useMemo(
    () => [
      {
        id: 'import',
        title: 'Import your Apple Health data',
        description: 'Upload your Health app export to unlock insights',
        done: Boolean(healthData),
      },
      {
        id: 'contacts',
        title: 'Add emergency contacts',
        description: 'Choose who gets notified if something looks wrong',
        done: contactsCount > 0,
      },
      {
        id: 'device',
        title: 'Connect live monitoring',
        description: 'Enable live updates from your device',
        done: Boolean(state?.completedSteps?.includes('device')),
      },
      {
        id: 'analytics',
        title: 'Review your analytics',
        description: 'See trends and personalized insights',
        done: Boolean(
          state?.completedSteps?.includes('analytics') || healthData
        ),
      },
    ],
    [contactsCount, healthData, state?.completedSteps]
  );

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const percent = Math.round((completed / total) * 100);

  const [expandedStep, setExpandedStep] = useState<string | null>(() => {
    const firstIncomplete = steps.find((s) => !s.done)?.id ?? null;
    return firstIncomplete;
  });

  useEffect(() => {
    // Keep expanded step pointed at next required one as status changes
    const firstIncomplete = steps.find((s) => !s.done)?.id ?? null;
    setExpandedStep((curr) =>
      curr && !steps.find((s) => s.id === curr)?.done ? curr : firstIncomplete
    );
  }, [steps]);

  const markDone = (id: string) => {
    setState((prev) => ({
      dismissed: prev?.dismissed ?? false,
      completedSteps: Array.from(
        new Set([...(prev?.completedSteps ?? []), id])
      ),
    }));
  };

  const handleImported = (data: ProcessedHealthData) => {
    setHealthData(data);
    onHealthDataImported?.(data);
    markDone('import');
    setExpandedStep('contacts');
  };

  const dismiss = () => setState((prev) => ({ ...prev, dismissed: true }));

  if (state?.dismissed) return null;

  return (
    <Card className="mb-4 border-vitalsense-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Getting started</CardTitle>
            <div className="mt-1 text-xs text-muted-foreground">
              {completed === total
                ? 'All set! Explore VitalSense.'
                : 'Follow these steps to get the best experience.'}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Dismiss onboarding"
            onClick={dismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Progress value={percent} />
          <div className="mt-1 text-xs text-muted-foreground">
            {completed} of {total} completed
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {/* Step 1: Import */}
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{steps[0].title}</div>
                <div className="text-xs text-muted-foreground">
                  {steps[0].description}
                </div>
              </div>
              {steps[0].done ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Upload className="h-5 w-5 text-vitalsense-primary" />
              )}
            </div>
            {!steps[0].done && (
              <div className="mt-3">
                <Suspense
                  fallback={
                    <div className="text-xs text-muted-foreground">
                      Loading uploader…
                    </div>
                  }
                >
                  {expandedStep === 'import' ? (
                    <HealthDataImport onDataImported={handleImported} />
                  ) : (
                    <Button size="sm" onClick={() => setExpandedStep('import')}>
                      Start
                    </Button>
                  )}
                </Suspense>
              </div>
            )}
          </div>

          {/* Step 2: Contacts */}
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{steps[1].title}</div>
                <div className="text-xs text-muted-foreground">
                  {steps[1].description}
                </div>
              </div>
              {steps[1].done ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Users className="h-5 w-5 text-vitalsense-primary" />
              )}
            </div>
            {!steps[1].done && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onNavigate('emergency-contacts')}
                >
                  Open Contacts
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markDone('contacts')}
                >
                  Ill do this later
                </Button>
              </div>
            )}
          </div>

          {/* Step 3: Device */}
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{steps[2].title}</div>
                <div className="text-xs text-muted-foreground">
                  {steps[2].description}
                </div>
              </div>
              {steps[2].done ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Smartphone className="h-5 w-5 text-vitalsense-primary" />
              )}
            </div>
            {!steps[2].done && (
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" onClick={() => onNavigate('device-sync')}>
                  Connect Device
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markDone('device')}
                >
                  Mark as done
                </Button>
              </div>
            )}
          </div>

          {/* Step 4: Analytics */}
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{steps[3].title}</div>
                <div className="text-xs text-muted-foreground">
                  {steps[3].description}
                </div>
              </div>
              {steps[3].done ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <BarChart3 className="h-5 w-5 text-vitalsense-primary" />
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                variant={steps[3].done ? 'outline' : 'default'}
                onClick={() => {
                  onNavigate('analytics');
                  markDone('analytics');
                }}
              >
                Open Analytics
              </Button>
              {!steps[3].done && (
                <Alert className="py-2">
                  <AlertDescription className="text-xs">
                    Analytics work best with imported data. You can still
                    explore without it.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>

        {completed < total && (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={dismiss}>
              Skip for now
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const next = steps.find((s) => !s.done)?.id;
                if (next === 'import') setExpandedStep('import');
                if (next === 'contacts') onNavigate('emergency-contacts');
                if (next === 'device') onNavigate('device-sync');
                if (next === 'analytics') onNavigate('analytics');
              }}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
