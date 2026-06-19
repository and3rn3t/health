import { Link, useRouterState } from '@tanstack/react-router';
import { AppleSidebarTrigger } from '@/components/nav/AppleSidebar';
import { DeviceStatusIndicator } from '@/components/health/DeviceStatusIndicator';
import { LiveConnectionStatus } from '@/components/live/LiveConnectionStatus';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeMode } from '@/hooks/useThemeMode';
import { NAV_ITEMS } from '@/lib/navigation';
import { APP_NAME } from '@/lib/branding';
import {
  Bell,
  Moon,
  MoreHorizontal,
  Settings,
  Sun,
  User,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import { memo } from 'react';

/**
 * Desktop navigation header — breadcrumbs, status indicators, actions.
 * Only rendered on md+ breakpoints (mobile uses MobileHeader).
 */
function NavigationHeaderInner({ className }: { className?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { themeMode, toggleThemeMode } = useThemeMode();

  const currentItem = NAV_ITEMS.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
  );
  const pageLabel = currentItem?.label ?? 'Dashboard';
  const ThemeIcon = themeMode === 'dark' ? Sun : Moon;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-sm',
        className
      )}
    >
      {/* Primary bar */}
      <div className="flex items-center justify-between px-4 py-2 md:px-6">
        {/* Left: sidebar trigger + breadcrumbs */}
        <div className="flex items-center gap-3">
          <AppleSidebarTrigger />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {pathname !== '/' && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right: status + actions */}
        <div className="flex items-center gap-2">
          <LiveConnectionStatus />
          <DeviceStatusIndicator />

          <div className="mx-2 h-5 w-px bg-border" />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleThemeMode}
            aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
          >
            <ThemeIcon className="size-4" />
          </Button>

          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>

          {/* Quick actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{APP_NAME}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 size-4" /> Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="User menu">
                <User className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 size-4" /> Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

const NavigationHeader = memo(NavigationHeaderInner);
export default NavigationHeader;
