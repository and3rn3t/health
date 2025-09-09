/**
 * Enhanced Navigation Header
 * Optimized header with breadcrumbs, search, and quick actions
 */

import EmergencyButton from '@/components/health/EmergencyButton';
import { LiveConnectionStatus } from '@/components/live/LiveConnectionStatus';
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
import {
  Bell,
  Home,
  LogIn,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Search,
  Settings,
  Shield,
  Sun,
  User,
} from 'lucide-react';
import { useState } from 'react';

interface NavigationHeaderProps {
  currentPageInfo: {
    label: string;
    category: string;
  };
  themeMode: 'light' | 'dark' | 'system';
  onThemeToggle: () => void;
  onNavigate: (tab: string) => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  healthScore?: number;
  hasAlerts?: boolean;
}

export default function NavigationHeader({
  currentPageInfo,
  themeMode,
  onThemeToggle,
  onNavigate,
  onToggleSidebar,
  sidebarCollapsed: _sidebarCollapsed,
  healthScore,
  hasAlerts = false,
}: Readonly<NavigationHeaderProps>) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

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
        case 'AI Recommendations':
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
      Management: 'Data and contact management tools',
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
    <header className="bg-card/95 supports-[backdrop-filter]:bg-card/60 sticky top-0 z-30 mb-3 w-full border-b border-border backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left Section - Sidebar Toggle & Page Info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="shrink-0 lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Page Info Container */}
          <div className="min-w-0 flex-1">
            {/* Breadcrumb Navigation - Desktop */}
            <div className="hidden md:flex md:flex-col md:gap-1">
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
                      <BreadcrumbSeparator className="mx-1" />
                      <BreadcrumbItem>
                        <BreadcrumbLink className="cursor-pointer hover:text-vitalsense-primary">
                          {currentPageInfo.category}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="mx-1" />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="font-medium text-foreground">
                          {currentPageInfo.label}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>

              {/* Page Description */}
              <p className="text-muted-foreground truncate text-xs leading-tight">
                {getPageDescription()}
              </p>
            </div>

            {/* Mobile Page Title */}
            <div className="md:hidden">
              <h1 className="truncate text-base font-semibold leading-tight">
                {currentPageInfo.label}
              </h1>
              <p className="text-muted-foreground truncate text-xs leading-tight">
                {currentPageInfo.category}
              </p>
            </div>
          </div>
        </div>

        {/* Center Section - Search */}
        <div
          className="mx-10 hidden max-w-md flex-1 lg:flex xl:mx-16"
          style={{ marginLeft: '2.5rem', marginRight: '2.5rem' }}
        >
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="text-muted-foreground absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search health data, insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-20 pr-6"
              style={{ paddingLeft: '4.25rem', paddingRight: '1.5rem' }}
            />
          </form>
        </div>

        {/* Right Section - Actions & User Menu */}
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          {/* Health Score Badge */}
          {healthScore !== undefined && (
            <Badge
              variant="outline"
              className="hidden border-vitalsense-primary text-vitalsense-primary sm:flex"
            >
              <Shield className="mr-1 h-3 w-3" />
              {healthScore}/100
            </Badge>
          )}

          {/* Search Button (Mobile) */}
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
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </Button>

          {/* Emergency Button - Takes available space */}
          <EmergencyButton
            className="w-32 min-w-[120px]"
            onClick={() => {
              // Switch to emergency tab
              if (typeof onNavigate === 'function') {
                onNavigate('emergency');
              }
            }}
          />

          {/* View Account chip (authenticated users) */}
          {isAuthenticated && user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('user-profile')}
              className="hidden rounded-full px-3 md:inline-flex"
            >
              View Account
            </Button>
          )}

          {/* Live Connection Status */}
          <LiveConnectionStatus />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                {isAuthenticated && user ? (
                  <Avatar className="h-6 w-6">
                    {user.picture && (
                      <AvatarImage
                        src={user.picture}
                        alt={user.name || 'User'}
                      />
                    )}
                    <AvatarFallback className="text-xs">
                      {initials(user.name)}
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
                        {user.name || 'Signed in'}
                      </p>
                      {user.email && (
                        <p className="text-muted-foreground text-xs">
                          {user.email}
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

              <DropdownMenuItem onClick={() => onNavigate('settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onNavigate('system-status')}>
                <Monitor className="mr-2 h-4 w-4" />
                System Status
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onNavigate('healthkit-guide')}>
                <Shield className="mr-2 h-4 w-4" />
                Setup Guide
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={onThemeToggle} className="sm:hidden">
                {themeMode === 'dark' && <Moon className="mr-2 h-4 w-4" />}
                {themeMode === 'light' && <Sun className="mr-2 h-4 w-4" />}
                {themeMode === 'system' && <Monitor className="mr-2 h-4 w-4" />}
                Theme: {themeMode}
              </DropdownMenuItem>

              {/* Auth actions */}
              {!isLoading && (
                <>
                  {/* Profile navigation */}
                  <DropdownMenuItem onClick={() => onNavigate('user-profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  {isAuthenticated ? (
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => login()}>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign in
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
