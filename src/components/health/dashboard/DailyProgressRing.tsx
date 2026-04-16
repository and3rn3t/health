import { cn } from '@/lib/utils';

interface ProgressSegment {
  label: string;
  current: number;
  goal: number;
  color: string; // Tailwind stroke class, e.g. 'stroke-red-500'
}

interface DailyProgressRingProps {
  readonly segments: ProgressSegment[];
  readonly className?: string;
}

const RING_CONFIG = [
  { radius: 54, width: 8 },
  { radius: 44, width: 8 },
  { radius: 34, width: 8 },
] as const;

export function DailyProgressRing({
  segments,
  className,
}: DailyProgressRingProps) {
  const visibleSegments = segments.slice(0, RING_CONFIG.length);

  return (
    <div
      className={cn(
        'vs-glass flex flex-col items-center gap-4 rounded-2xl p-5',
        className
      )}
    >
      {/* Concentric rings */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 120 120"
          aria-hidden="true"
        >
          {visibleSegments.map((seg, i) => {
            const config = RING_CONFIG[i] as (typeof RING_CONFIG)[number];
            const { radius, width } = config;
            const circ = 2 * Math.PI * radius;
            const pct = Math.min(seg.current / Math.max(seg.goal, 1), 1);
            const dashOffset = circ - pct * circ;

            return (
              <g key={seg.label}>
                {/* Background track */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  strokeWidth={width}
                  className="stroke-muted/20"
                />
                {/* Filled arc */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  strokeWidth={width}
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={dashOffset}
                  className={cn(
                    'transition-[stroke-dashoffset] duration-700 ease-out',
                    seg.color
                  )}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {visibleSegments.map((seg) => {
          // Convert stroke class to text class for the dot
          const dotColor = seg.color.replace('stroke-', 'bg-');
          return (
            <div key={seg.label} className="flex items-center gap-1.5">
              <span
                className={cn('h-2 w-2 rounded-full', dotColor)}
                aria-hidden="true"
              />
              <span className="text-xs text-muted-foreground">
                {seg.label}
              </span>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {Math.round((seg.current / Math.max(seg.goal, 1)) * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
