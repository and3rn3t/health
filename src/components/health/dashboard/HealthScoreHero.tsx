import { Card, CardContent } from '@/components/ui/card';
import { Heart, TrendingUp, TrendingDown } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface HealthScoreHeroProps {
  readonly score: number;
  readonly label: string;
  readonly className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return 'stroke-green-500';
  if (score >= 60) return 'stroke-yellow-500';
  return 'stroke-red-500';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Attention';
}

export function HealthScoreHero({
  score,
  label,
  className,
}: HealthScoreHeroProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 54; // r=54
  const dashOffset = circumference - (clampedScore / 100) * circumference;
  const TrendIcon = clampedScore >= 60 ? TrendingUp : TrendingDown;

  return (
    <Card variant="glass" className={cn('py-6', className)}>
      <CardContent className="flex flex-col items-center gap-4 px-6">
        {/* Circular score ring */}
        <div className="relative flex h-36 w-36 items-center justify-center">
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 120 120"
            aria-hidden="true"
          >
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="8"
              className="stroke-muted/30"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={cn(
                'transition-[stroke-dashoffset] duration-700 ease-out',
                getScoreRingColor(clampedScore)
              )}
            />
          </svg>
          <div className="z-10 flex flex-col items-center">
            <Heart
              className={cn('mb-1 h-5 w-5', getScoreColor(clampedScore))}
              aria-hidden="true"
            />
            <span
              className={cn(
                'text-4xl font-bold tabular-nums',
                getScoreColor(clampedScore)
              )}
            >
              {clampedScore}
            </span>
          </div>
        </div>

        {/* Label and trend */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-semibold text-foreground">
            {label}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {getScoreLabel(clampedScore)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
