import { Link, useRouterState } from '@tanstack/react-router';
import { NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/utils';

/**
 * Mobile bottom tab bar — router-aware, glass background, 44px touch targets.
 * Fixed to viewport bottom with safe-area padding for notched devices.
 */
export function MobileBottomTabs({ className }: { className?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        'vs-glass-thick fixed inset-x-0 bottom-0 z-50 border-t border-border/30 pb-safe-bottom',
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === '/'
              ? pathname === '/'
              : pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors duration-150',
                'touch-manipulation select-none active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'size-5 transition-colors',
                  isActive && 'text-primary'
                )}
              />
              <span className="truncate leading-tight">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-0.5 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
