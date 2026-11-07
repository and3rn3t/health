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
        'vs-glass-thick border-border/30 pt-safe-top sticky top-0 z-40 border-b',
        className
      )}
    >
      <div className="flex h-11 items-center justify-between px-4">
        {/* Not a heading: each page renders its own <h1>, and a second one is an a11y defect */}
        <p className="text-foreground truncate text-base font-semibold">
          {pageLabel}
        </p>
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
