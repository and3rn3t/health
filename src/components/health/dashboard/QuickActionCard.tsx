import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from '@/lib/icons';
import type { LucideIcon } from '@/lib/icons';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly to: string;
  readonly iconBg?: string;
  readonly className?: string;
}

export function QuickActionCard({
  icon: Icon,
  title,
  description,
  to,
  iconBg = 'bg-primary/10',
  className,
}: QuickActionCardProps) {
  return (
    <Link to={to} className={cn('group block', className)}>
      <Card
        variant="glass"
        interactive
        className="h-full py-4 transition-shadow group-hover:shadow-md"
      >
        <CardContent className="flex items-center gap-4 px-4">
          <div
            className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconBg)}
          >
            <Icon className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {title}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {description}
            </p>
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </CardContent>
      </Card>
    </Link>
  );
}
