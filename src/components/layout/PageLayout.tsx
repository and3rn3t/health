import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PageLayoutProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

export function PageLayout({
  title,
  subtitle,
  actions,
  children,
  className,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <div className={cn('mx-auto max-w-6xl px-3 py-4 sm:px-4 lg:px-6', className)}>
        {/* Page header */}
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground sm:text-base">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
