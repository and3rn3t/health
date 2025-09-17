/**
 * Enhanced Navigation Header
 * Optimized header with breadcrumbs, search, and quick actions
 */

import EmergencyButton from '@/components/health/EmergencyButton';
import { LiveConnectionStatus } from '@/components/live/LiveConnectionStatus';
import { AppleSidebarTrigger } from '@/components/nav/AppleSidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { isDev } from '@/lib/env';
import {
  Bell,
  Home,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  MoreHorizontal,
  Search,
  Settings,
  Shield,
  Sun,
  User,
} from 'lucide-react';
import { memo, useState } from 'react';

interface NavigationHeaderProps {
  // Optional for backwards compatibility with older tests using onToggleSidebar
  onSidebarToggle?: () => void;
  currentPageInfo?: {
    label: string;
    category: string;
  };
  themeMode?: 'light' | 'dark' | 'system';
  onThemeToggle?: () => void;
  onNavigate?: (tab: string) => void;
  sidebarCollapsed?: boolean;
  healthScore?: number;
  hasAlerts?: boolean;
}

function NavigationHeader({
  onSidebarToggle: _onSidebarToggle,
  currentPageInfo = { label: 'Dashboard', category: 'Health' },
  themeMode = 'light',
  onThemeToggle = () => {},
  onNavigate = () => {},
  sidebarCollapsed: _sidebarCollapsed = false,
  healthScore = 85,
  hasAlerts = false,
  ...rest
}: Readonly<NavigationHeaderProps> & { onToggleSidebar?: () => void }) {
  // Back-compat: support older prop name onToggleSidebar
  const _unusedOnSidebarToggle =
    _onSidebarToggle ??
    (rest as { onToggleSidebar?: () => void })?.onToggleSidebar;
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  if (isDev()) {
    console.log('🧭 NavigationHeader rendering...'); // Debug log
  }

  const initials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getPageDescription = () => {
    const { category, label } = currentPageInfo;

    if (category === 'Main') {
      switch (label) {
        case 'Dashboard':
          return 'Your personalized health overview and insights';
        case 'Fall Risk & Walking':
          return 'AI-powered fall prevention and gait analysis';
        case 'Insights':
          return 'Comprehensive health trends and analytics';
        case 'Recommendations':
          return 'Personalized suggestions powered by machine learning';
        default:
          return 'Advanced health monitoring and analysis';
      }
    }

    const descriptions: Record<string, string> = {
      Monitoring: 'Real-time health monitoring and alert systems',
      'AI & ML':
        'Advanced artificial intelligence and machine learning features',
      Advanced: 'Advanced monitoring and integration capabilities',
      Gamification: 'Health challenges and motivational features',
      Community: 'Share progress with your care network',
      Setup: 'Configuration and integration guides',
      Profile: 'Account settings and preferences',
    };

    return descriptions[category] || 'Health monitoring and wellness tools';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('search');
      // Pass search query to search component
    }
  };

  return (
    <header className="border-border bg-card sticky top-0 z-40 mb-1 w-full border-b">
      {/* Primary bar: Sidebar, title (mobile), search, key actions */}
      <div className="px-3 md:px-6 flex items-center justify-between gap-2 py-1">
        {/* Left: Sidebar trigger + mobile title */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <AppleSidebarTrigger
            aria-controls="app-sidebar"
            className="hover:bg-muted shrink-0"
          />
          {/* Mobile title */}
          <div className="md:hidden min-w-0">
            <h1 className="truncate text-base font-semibold leading-tight">
              {currentPageInfo.label}
            </h1>
            <p className="text-muted-foreground text-xs truncate leading-tight">
              {currentPageInfo.category}
            </p>
          </div>
        </div>

        {/* Center: Search (large screens) */}
        <div className="mx-4 hidden max-w-xl flex-1 lg:flex">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="text-muted-foreground left-3 absolute top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search health data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 pr-4"
            />
          </form>
        </div>

        {/* Right: prioritized actions */}
        <div className="md:gap-3 flex shrink-0 items-center gap-2">
          {/* Mobile search */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('search')}
            className="lg:hidden"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('alerts')}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {hasAlerts && (
              <span className="bg-red-500 absolute -right-1 -top-1 h-2 w-2 rounded-full" />
            )}
          </Button>

          {/* Emergency */}
          <EmergencyButton
            className="w-28 md:w-32 min-w-[112px]"
            onClick={() => onNavigate('emergency')}
          />

          {/* Quick actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate('settings')}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('system-status')}>
                <Monitor className="mr-2 h-4 w-4" /> System Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('healthkit-guide')}>
                <Shield className="mr-2 h-4 w-4" /> Setup Guide
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onThemeToggle}>
                {themeMode === 'dark' && <Moon className="mr-2 h-4 w-4" />}
                {themeMode === 'light' && <Sun className="mr-2 h-4 w-4" />}
                {themeMode === 'system' && <Monitor className="mr-2 h-4 w-4" />}
                Theme: {themeMode}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                {isAuthenticated && user ? (
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={user?.picture ?? undefined}
                      alt={user?.name || 'User'}
                    />
                    <AvatarFallback className="text-xs">
                      {initials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  {isAuthenticated && user ? (
                    <>
                      <p className="text-sm font-medium">
                        {user?.name || 'Signed in'}
                      </p>
                      {user?.email && (
                        <p className="text-muted-foreground text-xs">
                          {user?.email}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Not signed in</p>
                      <p className="text-muted-foreground text-xs">
                        Sign in to access all features
                      </p>
                    </>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Profile navigation */}
              <DropdownMenuItem onClick={() => onNavigate('user-profile')}>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!isLoading &&
                (isAuthenticated ? (
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => login()}>
                    <LogIn className="mr-2 h-4 w-4" /> Sign in
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Secondary bar: breadcrumbs & status */}
      <div className="px-3 md:px-6 md:flex hidden items-center justify-between pb-2">
        {/* Breadcrumbs */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1">
            <Breadcrumb>
              <BreadcrumbList className="text-sm">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => onNavigate('dashboard')}
                    className="gap-1.5 flex cursor-pointer items-center hover:text-vitalsense-primary"
                  >
                    <Home className="h-3.5 w-3.5" />
                    VitalSense
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {currentPageInfo.label !== 'Dashboard' && (
                  <>
                    <BreadcrumbSeparator className="mx-2" />
                    <BreadcrumbItem>
                      <BreadcrumbLink className="cursor-pointer hover:text-vitalsense-primary">
                        {currentPageInfo.category}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="mx-2" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-foreground font-medium">
                        {currentPageInfo.label}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
            <p className="text-muted-foreground text-xs truncate leading-tight">
              {getPageDescription()}
            </p>
          </div>
        </div>

        {/* Right: health & status */}
        <div className="gap-3 flex items-center">
          {healthScore !== undefined && (
            <Badge
              variant="outline"
              className="px-3 border-vitalsense-primary py-1 text-vitalsense-primary"
            >
              <Shield className="h-3 w-3 mr-2" />
              {healthScore}/100
            </Badge>
          )}
          <LiveConnectionStatus />
        </div>
      </div>
    </header>
  );
}

export default memo(NavigationHeader);
