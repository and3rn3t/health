import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from '@/lib/icons';
import type { LucideIcon } from '@/lib/icons';

type TrendDirection = 'up' | 'down' | 'stable';

interface MetricPillProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly value: string;
  readonly trend?: TrendDirection;
  readonly trendLabel?: string;
  readonly iconColor?: string;
  readonly className?: string;
}

const TREND_ICONS: Record<TrendDirection, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const TREND_COLORS: Record<TrendDirection, string> = {
  up: 'text-green-500',
  down: 'text-red-500',
  stable: 'text-muted-foreground',
};

export function MetricPill({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  iconColor = 'text-primary',
  className,
}: MetricPillProps) {
  const TrendIcon = trend ? TREND_ICONS[trend] : null;

  return (
    <div
      className={cn(
        'vs-glass flex min-w-[140px] shrink-0 flex-col gap-1.5 rounded-2xl px-4 py-3',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', iconColor)} aria-hidden="true" />
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <span className="text-xl font-bold tabular-nums text-foreground">
        {value}
      </span>
      {trend && (
        <span
          className={cn(
            'flex items-center gap-1 text-xs',
            TREND_COLORS[trend]
          )}
        >
          {TrendIcon && (
            <TrendIcon className="h-3 w-3" aria-hidden="true" />
          )}
          {trendLabel}
        </span>
      )}
    </div>
  );
}
