/**
 * Enhanced Navigation Header
 * Optimized header with breadcrumbs, search, and quick actions
 */

import { DeviceStatusIndicator } from '@/components/health/DeviceStatusIndicator';
import { LiveConnectionStatus } from '@/components/live/LiveConnectionStatus';
import { AppleSidebarTrigger } from '@/components/nav/AppleSidebar';
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
import { isDev } from '@/lib/env';
import {
  Bell,
  Home,
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
}: Readonly<NavigationHeaderProps>) {
  const [searchQuery, setSearchQuery] = useState('');

  if (isDev()) {
    console.log('🧭 NavigationHeader rendering...'); // Debug log
  }

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
    <header className="sticky top-0 z-40 mb-2 w-full border-b border-border bg-card md:mb-3">
      {/* Primary bar: Sidebar, title (mobile), search, key actions */}
      <div className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3">
        {/* Left: Sidebar trigger + mobile title - better proportions */}
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <AppleSidebarTrigger
            aria-controls="app-sidebar"
            className="shrink-0 hover:bg-muted"
          />
          {/* Mobile title with improved spacing */}
          <div className="min-w-0 space-y-1 md:hidden">
            <h1 className="truncate text-base font-semibold leading-tight">
              {currentPageInfo.label}
            </h1>
            <p className="truncate text-xs leading-tight text-muted-foreground">
              {currentPageInfo.category}
            </p>
          </div>
        </div>

        {/* Center: Search (large screens) - better spacing */}
        <div className="mx-6 hidden max-w-lg flex-1 lg:flex">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search health data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 pr-4"
            />
          </form>
        </div>

        {/* Right: reorganized actions for better distribution */}
        <div className="flex shrink-0 items-center">
          {/* Priority actions - always visible */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile search */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('search')}
              className="lg:hidden"
            >
              <Search className="h-4 w-4" />
            </Button>

          </div>

          {/* Separator for visual balance */}
          <div className="mx-3 h-6 w-px bg-border md:mx-4" />

          {/* Secondary actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('alerts')}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {hasAlerts && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Button>

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
                  {themeMode === 'system' && (
                    <Monitor className="mr-2 h-4 w-4" />
                  )}
                  Theme: {themeMode}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>VitalSense</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate('settings')}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Secondary bar: breadcrumbs & status - improved balance */}
      <div className="border-border/50 hidden items-center justify-between border-t px-3 py-2 md:flex md:px-6 md:py-3">
        {/* Breadcrumbs with better spacing */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1.5">
            <Breadcrumb>
              <BreadcrumbList className="text-sm">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => onNavigate('dashboard')}
                    className="flex cursor-pointer items-center gap-1.5 hover:text-vitalsense-primary"
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
                      <BreadcrumbPage className="font-medium text-foreground">
                        {currentPageInfo.label}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
            <p className="truncate text-xs leading-tight text-muted-foreground">
              {getPageDescription()}
            </p>
          </div>
        </div>

        {/* Right: health & status with better spacing */}
        <div className="flex items-center gap-4">
          {healthScore !== undefined && (
            <Badge
              variant="outline"
              className="border-vitalsense-primary px-3 py-1.5 text-vitalsense-primary"
            >
              <Shield className="mr-2 h-3 w-3" />
              {healthScore}/100
            </Badge>
          )}
          <DeviceStatusIndicator />
          <LiveConnectionStatus />
        </div>
      </div>
    </header>
  );
}

export default memo(NavigationHeader);
