import { useRouterState } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from '@/lib/icons';
import { useThemeMode } from '@/hooks/useThemeMode';
import { NAV_ITEMS } from '@/lib/navigation';
import { APP_NAME } from '@/lib/branding';
import { cn } from '@/lib/utils';

/**
 * Mobile header — sticky glass bar with page title + theme toggle.
 * All primary navigation lives in MobileBottomTabs; header is for context only.
 */
export function MobileHeader({ className }: { className?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { themeMode, toggleThemeMode } = useThemeMode();

  const currentItem = NAV_ITEMS.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
  );
  const pageLabel = currentItem?.label ?? APP_NAME;
  const ThemeIcon = themeMode === 'dark' ? Sun : Moon;

  return (
    <header
      className={cn(
        'vs-glass-thick sticky top-0 z-40 border-b border-border/30 pt-safe-top',
        className
      )}
    >
      <div className="flex h-11 items-center justify-between px-4">
        <h1 className="truncate text-base font-semibold text-foreground">
          {pageLabel}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleThemeMode}
          aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
        >
          <ThemeIcon className="size-4" />
        </Button>
      </div>
    </header>
  );
}
