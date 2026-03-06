import { useMicroCoaching } from '@/hooks/useMicroCoaching';
import { useEffect } from 'react';

interface Props {
  ws: WebSocket | null;
}

const severityColors: Record<string, string> = {
  info: 'bg-teal-600',
  warn: 'bg-amber-600',
  critical: 'bg-rose-600',
};

export function MicroCoachToasts({ ws }: Props) {
  const messages = useMicroCoaching(ws);
  // Auto-trim older than 5 minutes client-side (soft hygiene)
  useEffect(() => {
    const id = setInterval(() => {
      // no-op; hook already slices size
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="top-20 w-80 fixed right-4 z-40 flex max-w-[90vw] flex-col gap-2">
      {messages.slice(0, 3).map((m) => (
        <div
          key={m.id + m.ts}
          className={`p-3 flex flex-col rounded-lg text-sm text-white shadow-lg ${severityColors[m.severity] || 'bg-teal-600'} animate-fade-in`}
        >
          <div className="mb-1 font-semibold">{m.message}</div>
          <div className="text-xs flex justify-between opacity-80">
            <span>
              {m.metric}: {m.value}
            </span>
            <span>{new Date(m.ts).toLocaleTimeString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
