import { useTelemetry } from '@/hooks/useTelemetry';
import { clearNormalizationCache } from '@/lib/normalizeHealthInput';
import { recordTelemetry } from '@/lib/telemetry';
import React from 'react';

interface TelemetryPanelProps {
  eventFilter?: string;
  showNormalizationStats?: boolean;
  limit?: number;
  className?: string;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  eventFilter,
  showNormalizationStats = true,
  limit = 100,
  className,
}) => {
  const { events, normalizationStats } = useTelemetry({
    filter: eventFilter,
    includeNormalizationStats: showNormalizationStats,
    limit,
    refreshIntervalMs: 3000,
  });

  return (
    <div
      className={
        'rounded-md border border-border bg-background p-4 text-sm font-mono space-y-4 ' +
        (className || '')
      }
    >
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Telemetry</h2>
        <div className="flex gap-2">
          {showNormalizationStats && (
            <button
              onClick={() => {
                clearNormalizationCache();
                recordTelemetry('action', { type: 'clear_normalization_cache' });
              }}
              className="px-2 py-1 rounded bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 transition"
            >
              Clear Cache
            </button>
          )}
        </div>
      </header>
      {showNormalizationStats && normalizationStats && (
        <section>
          <h3 className="font-semibold mb-1">Normalization Cache</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="Size" value={normalizationStats.size} />
            <Stat label="Hits" value={normalizationStats.hits} />
            <Stat label="Misses" value={normalizationStats.misses} />
            <Stat
              label="Hit Rate"
              value={(normalizationStats.hitRate * 100).toFixed(1) + '%'}
            />
          </div>
          {normalizationStats.entries.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer select-none">
                Top Entries ({normalizationStats.entries.length})
              </summary>
              <ul className="mt-2 space-y-1 max-h-40 overflow-auto pr-1">
                {normalizationStats.entries.map((e) => (
                  <li
                    key={e.key}
                    className="flex items-center justify-between rounded bg-muted px-2 py-1"
                  >
                    <span className="truncate max-w-[60%]" title={e.key}>
                      {e.key}
                    </span>
                    <span className="text-xs tabular-nums">{e.hits} hits</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
      <section>
        <h3 className="font-semibold mb-1">Events{eventFilter ? `: ${eventFilter}` : ''}</h3>
        <ul className="space-y-1 max-h-60 overflow-auto pr-1">
          {events.slice().reverse().map((evt) => (
            <li
              key={evt.timestamp + evt.name + Math.random().toString(36).slice(2)}
              className="rounded bg-muted px-2 py-1"
            >
              <div className="flex items-center justify-between text-[10px] opacity-70">
                <span>{evt.name}</span>
                <time>{new Date(evt.timestamp).toLocaleTimeString()}</time>
              </div>
              <pre className="whitespace-pre-wrap break-words text-[10px] mt-1">{JSON.stringify(evt.data)}</pre>
            </li>
          ))}
          {events.length === 0 && (
            <li className="text-xs text-muted-foreground">No events</li>
          )}
        </ul>
      </section>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div className="flex flex-col rounded bg-muted p-2">
    <span className="text-[10px] uppercase tracking-wide opacity-60">{label}</span>
    <span className="text-sm tabular-nums">{value}</span>
  </div>
);

export default TelemetryPanel;
