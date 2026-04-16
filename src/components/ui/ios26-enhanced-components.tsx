import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';

type CardType = 'health' | 'fallRisk';
type CardStatus = 'excellent' | 'good' | 'fair' | 'poor';
type TrendDirection = 'up' | 'down' | 'stable';

interface EnhancedVitalSenseStatusCardProps {
  readonly type: CardType;
  readonly status: CardStatus;
  readonly title: string;
  readonly value: string;
  readonly subtitle?: string;
  readonly showTrend?: boolean;
  readonly trendDirection?: TrendDirection;
  readonly trendValue?: string;
  readonly interactive?: boolean;
  readonly onCardClick?: () => void;
  readonly className?: string;
}

const statusConfig: Record<
  CardStatus,
  { badge: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'; ring: string }
> = {
  excellent: {
    badge: 'Excellent',
    badgeVariant: 'default',
    ring: 'ring-green-500/20',
  },
  good: {
    badge: 'Good',
    badgeVariant: 'secondary',
    ring: 'ring-blue-500/20',
  },
  fair: {
    badge: 'Fair',
    badgeVariant: 'outline',
    ring: 'ring-yellow-500/20',
  },
  poor: {
    badge: 'Poor',
    badgeVariant: 'destructive',
    ring: 'ring-red-500/20',
  },
};

const trendColors: Record<TrendDirection, string> = {
  up: 'text-green-600 dark:text-green-400',
  down: 'text-red-600 dark:text-red-400',
  stable: 'text-muted-foreground',
};

const TrendIcon = ({ direction }: { readonly direction: TrendDirection }) => {
  const iconClass = cn('h-3.5 w-3.5', trendColors[direction]);
  switch (direction) {
    case 'up':
      return <TrendingUp className={iconClass} />;
    case 'down':
      return <TrendingDown className={iconClass} />;
    case 'stable':
      return <Minus className={iconClass} />;
  }
};

function EnhancedVitalSenseStatusCard({
  type,
  status,
  title,
  value,
  subtitle,
  showTrend = false,
  trendDirection = 'stable',
  trendValue,
  interactive = false,
  onCardClick,
  className,
}: Readonly<EnhancedVitalSenseStatusCardProps>) {
  const config = statusConfig[status];
  const isFallRisk = type === 'fallRisk';

  const content = (
    <>
      {/* Header row: title + badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        <Badge variant={config.badgeVariant} className="text-[10px]">
          {config.badge}
        </Badge>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            'text-3xl font-bold tracking-tight text-foreground',
            isFallRisk && status === 'poor' && 'text-red-600 dark:text-red-400'
          )}
        >
          {value}
        </span>
        {interactive && (
          <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </div>

      {/* Subtitle + Trend */}
      <div className="flex items-center gap-2">
        {showTrend && trendDirection && (
          <div className="flex items-center gap-1">
            <TrendIcon direction={trendDirection} />
            {trendValue && (
              <span
                className={cn('text-xs font-medium', trendColors[trendDirection])}
              >
                {trendValue}
              </span>
            )}
          </div>
        )}
        {subtitle && !trendValue && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </>
  );

  const sharedStyles = cn(
    'relative flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left text-card-foreground transition-all duration-200',
    'vs-elevation-raised',
    config.ring,
    className
  );

  if (interactive) {
    return (
      <button
        data-slot="enhanced-status-card"
        type="button"
        onClick={onCardClick}
        className={cn(
          sharedStyles,
          'cursor-pointer select-none hover:vs-elevation-grouped active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2'
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      data-slot="enhanced-status-card"
      className={sharedStyles}
    >
      {content}
    </div>
  );
}

export { EnhancedVitalSenseStatusCard };
export type { EnhancedVitalSenseStatusCardProps, CardType, CardStatus, TrendDirection };
