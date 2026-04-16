/**
 * LiDAR History — Session history table with import/export and tag filtering.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp } from '@/lib/icons';
import {
  Card,
  CardContent,
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
import { useMemo, useRef, useState } from 'react';

import type { LiDARSession } from './lidar-types';
import { lidarSessionSchema } from './lidar-types';

export interface HistoryProps {
  readonly sessionHistory: LiDARSession[];
  readonly sessionHistoryRaw: LiDARSession[];
  readonly setSessionHistory: (
    next:
      | LiDARSession[]
      | ((prev: LiDARSession[] | undefined) => LiDARSession[])
  ) => void;
  readonly availableTags: string[];
  readonly selectedTag: string | null;
  readonly setSelectedTag: (t: string | null) => void;
  readonly showMessage: (message: string, type?: 'success' | 'error') => void;
}

export function LiDARHistory(props: Readonly<HistoryProps>) {
  const {
    sessionHistory,
    sessionHistoryRaw,
    setSessionHistory,
    availableTags,
    selectedTag,
    setSelectedTag,
    showMessage,
  } = props;
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [itemOpen, setItemOpen] = useState(false);
  const [itemContent, setItemContent] = useState('');
  const filtered = useMemo(() => {
    if (selectedTag === null) return sessionHistory;
    return sessionHistory.filter((s) => (s.tags ?? []).includes(selectedTag));
  }, [selectedTag, sessionHistory]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp aria-hidden="true" className="mr-1 h-4 w-4 select-none" />
            <span>Recent Sessions</span>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => importInputRef.current?.click()}
            >
              Import JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                try {
                  const data = JSON.stringify(sessionHistoryRaw, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `lidar-sessions-${new Date().toISOString()}.json`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                  showMessage('Exported session history');
                } catch (_err) {
                  console.error('Failed to export history', _err);
                  showMessage('Failed to export history', 'error');
                }
              }}
            >
              Export JSON
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    try {
                      const json = JSON.stringify(
                        sessionHistoryRaw,
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
                  <DialogTitle>Session History JSON</DialogTitle>
                  <DialogDescription>
                    Exportable JSON for recent sessions (timestamps in ISO)
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
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setSessionHistory([]);
                showMessage('History cleared');
              }}
            >
              Clear
            </Button>
          </div>
        </div>
        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Filter:</span>
            <button
              className={`rounded border px-2 py-1 text-xs ${selectedTag === null ? 'bg-muted' : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              All
            </button>
            {availableTags.map((t) => (
              <button
                key={t}
                className={`rounded border px-2 py-1 text-xs ${selectedTag === t ? 'bg-muted' : ''}`}
                onClick={() => setSelectedTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filtered.slice(0, 3).map((session) => (
            <div
              key={session.id}
              className="flex w-full items-center justify-between gap-2 rounded border p-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {session.analysisType === 'quick' ? 'Quick' : 'Comprehensive'}{' '}
                  Analysis
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.startTime.toLocaleDateString()} at{' '}
                  {session.startTime.toLocaleTimeString()}
                </p>
                {session.protocol && (
                  <p className="text-xs text-muted-foreground">
                    Protocol: {session.protocol}
                  </p>
                )}
                {session.tags && session.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {session.tags.slice(0, 6).map((t) => (
                      <span
                        key={`${session.id}-${t}`}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {session.qualityGrade && (
                  <Badge variant="secondary">{session.qualityGrade}</Badge>
                )}
                <Badge variant="outline">
                  {session.status === 'completed' ? 'Completed' : 'In Progress'}
                </Badge>
                <Dialog open={itemOpen} onOpenChange={setItemOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        try {
                          const json = JSON.stringify(
                            session,
                            (_k, v) =>
                              v instanceof Date ? v.toISOString() : v,
                            2
                          );
                          setItemContent(json);
                          setItemOpen(true);
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
                      {itemContent}
                    </pre>
                    <DialogFooter>
                      <div className="flex w-full items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(itemContent);
                              showMessage('Copied to clipboard');
                            } catch (e) {
                              console.error('Copy failed', e);
                              showMessage('Copy failed', 'error');
                            }
                          }}
                        >
                          Copy JSON
                        </Button>
                        <Button size="sm" onClick={() => setItemOpen(false)}>
                          Close
                        </Button>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
        {/* Hidden file input for import */}
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          title="Import LiDAR session history JSON"
          placeholder="Import LiDAR session history JSON"
          onChange={async (e) => {
            try {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const data = JSON.parse(text);
              const arr: unknown[] = Array.isArray(data) ? data : [data];
              const parsed: LiDARSession[] = [];
              for (const item of arr) {
                const res = lidarSessionSchema.safeParse(item);
                if (res.success) parsed.push(res.data as LiDARSession);
              }
              if (parsed.length === 0) {
                showMessage('No valid sessions found in file', 'error');
                return;
              }
              // Merge and dedupe by id, keep most recent first
              setSessionHistory((prev) => {
                const map = new Map<string, LiDARSession>();
                [...parsed, ...(prev ?? [])].forEach((s) => map.set(s.id, s));
                return Array.from(map.values())
                  .sort(
                    (a, b) =>
                      (b.startTime?.getTime?.() ?? 0) -
                      (a.startTime?.getTime?.() ?? 0)
                  )
                  .slice(0, 50);
              });
              showMessage(`Imported ${parsed.length} session(s)`);
            } catch (err) {
              console.error('Import failed', err);
              showMessage('Failed to import JSON', 'error');
            } finally {
              if (e.target) (e.target as HTMLInputElement).value = '';
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
