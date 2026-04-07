/**
 * LiDAR Controls — Protocol/mode selection and recording controls.
 */

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import type {
  LiDARPreferences,
  LiDARSession,
  ProtocolType,
} from './lidar-types';

export interface ControlsProps {
  readonly preferences?: LiDARPreferences;
  readonly setPreferences: (next: LiDARPreferences) => void;
  readonly selectedProtocol: ProtocolType;
  readonly setSelectedProtocol: (p: ProtocolType) => void;
  readonly selectedAnalysisType: 'quick' | 'comprehensive';
  readonly setSelectedAnalysisType: (t: 'quick' | 'comprehensive') => void;
  readonly lidarReady: boolean;
  readonly currentSession: LiDARSession | null;
  readonly recordingProgress: number;
  readonly liveCadence: number | null;
  readonly targetLabel: string;
  readonly startSession: () => void;
  readonly completeSession: (id: string) => void;
}

export function LiDARControls(props: Readonly<ControlsProps>) {
  const {
    preferences,
    setPreferences,
    selectedProtocol,
    setSelectedProtocol,
    selectedAnalysisType,
    setSelectedAnalysisType,
    lidarReady,
    currentSession,
    recordingProgress,
    liveCadence,
    targetLabel,
    startSession,
    completeSession,
  } = props;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span aria-hidden="true" className="mr-1 select-none">
            📊
          </span>
          <span>Analysis Controls</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Guided Protocols */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Protocol:</span>
            <div className="flex gap-1">
              <Button
                variant={selectedProtocol === 'none' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProtocol('none')}
              >
                None
              </Button>
              <Button
                variant={selectedProtocol === 'TUG' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProtocol('TUG')}
              >
                TUG
              </Button>
              <Button
                variant={selectedProtocol === '10MWT' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProtocol('10MWT')}
              >
                10m Walk
              </Button>
              <Button
                variant={selectedProtocol === '6MWT' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProtocol('6MWT')}
              >
                6-Min Walk
              </Button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mode:</span>
            <div className="flex gap-1">
              <Button
                variant={preferences?.simulate ? 'outline' : 'default'}
                size="sm"
                onClick={() =>
                  setPreferences({
                    ...(preferences ?? {
                      environment: 'indoor',
                      demoDurations: true,
                      autoSave: true,
                      simulate: false,
                    }),
                    simulate: false,
                  })
                }
              >
                Device
              </Button>
              <Button
                variant={preferences?.simulate ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setPreferences({
                    ...(preferences ?? {
                      environment: 'indoor',
                      demoDurations: true,
                      autoSave: true,
                      simulate: false,
                    }),
                    simulate: true,
                  })
                }
              >
                Simulate
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Environment:</span>
            <div className="flex gap-1">
              <Button
                variant={
                  preferences?.environment === 'indoor' ? 'default' : 'outline'
                }
                size="sm"
                onClick={() =>
                  setPreferences({
                    ...(preferences ?? {
                      environment: 'indoor',
                      demoDurations: true,
                      autoSave: true,
                    }),
                    environment: 'indoor',
                  })
                }
              >
                Indoor
              </Button>
              <Button
                variant={
                  preferences?.environment === 'outdoor' ? 'default' : 'outline'
                }
                size="sm"
                onClick={() =>
                  setPreferences({
                    ...(preferences ?? {
                      environment: 'indoor',
                      demoDurations: true,
                      autoSave: true,
                    }),
                    environment: 'outdoor',
                  })
                }
              >
                Outdoor
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Duration:</span>
            <div className="flex gap-1">
              <Button
                variant={preferences?.demoDurations ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setPreferences({
                    ...(preferences ?? {
                      environment: 'indoor',
                      demoDurations: true,
                      autoSave: true,
                    }),
                    demoDurations: true,
                  })
                }
              >
                Demo (30s/90s)
              </Button>
              <Button
                variant={!preferences?.demoDurations ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setPreferences({
                    ...(preferences ?? {
                      environment: 'indoor',
                      demoDurations: true,
                      autoSave: true,
                    }),
                    demoDurations: false,
                  })
                }
              >
                Realistic (5m/30m)
              </Button>
            </div>
          </div>
        </div>

        {/* Protocol Instructions */}
        {selectedProtocol !== 'none' && (
          <div className="bg-muted/30 rounded border border-muted p-3 text-sm">
            {selectedProtocol === 'TUG' && (
              <p>
                Timed Up and Go: Start seated, stand up, walk 3 meters, turn,
                return, and sit. The timer runs from the go signal until you sit
                again.
              </p>
            )}
            {selectedProtocol === '10MWT' && (
              <p>
                10 Meter Walk Test: Walk a straight 10 meter path at a
                comfortable pace. Focus on consistent speed and posture.
              </p>
            )}
            {selectedProtocol === '6MWT' && (
              <p>
                6-Minute Walk Test: Walk continuously for the duration at a
                comfortable pace. You can slow down or rest if needed.
              </p>
            )}
          </div>
        )}

        {selectedProtocol === 'none' && (
          <div className="flex gap-2">
            <Button
              variant={selectedAnalysisType === 'quick' ? 'default' : 'outline'}
              onClick={() => setSelectedAnalysisType('quick')}
            >
              {`Quick`}
            </Button>
            <Button
              variant={
                selectedAnalysisType === 'comprehensive' ? 'default' : 'outline'
              }
              onClick={() => setSelectedAnalysisType('comprehensive')}
            >
              {`Comprehensive`}
            </Button>
          </div>
        )}

        {currentSession ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Recording Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(recordingProgress)}%
              </span>
            </div>
            <Progress value={recordingProgress} className="w-full" />
            {liveCadence !== null && (
              <div className="text-xs text-muted-foreground">
                Live cadence:{' '}
                <span className="font-mono">{Math.round(liveCadence)} spm</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Target: {targetLabel}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  currentSession?.id && completeSession(currentSession.id)
                }
              >
                End Session Now
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Keep walking naturally. The LiDAR sensor is analyzing your
              movement patterns.
            </p>
          </div>
        ) : (
          <Button
            onClick={startSession}
            disabled={!lidarReady}
            className="w-full"
          >
            {selectedProtocol === 'none'
              ? '▶️ Start LiDAR Gait Analysis'
              : `▶️ Start ${selectedProtocol}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
