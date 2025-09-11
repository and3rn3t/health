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
  onSidebarToggle: () => void;
  sidebarOpen: boolean;
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

export default function NavigationHeader({
  onSidebarToggle,
  sidebarOpen,
  currentPageInfo = { label: 'Dashboard', category: 'Health' },
  themeMode = 'light',
  onThemeToggle = () => {},
  onNavigate = () => {},
  sidebarCollapsed = false,
  healthScore = 85,
  hasAlerts = false,
}: Readonly<NavigationHeaderProps>) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  console.log('🧭 NavigationHeader rendering...'); // Debug log

  const handleSidebarToggle = () => {
    console.log('🍔 NavigationHeader: Hamburger menu clicked!'); // Debug log
    console.log(
      '🔍 NavigationHeader: onSidebarToggle function:',
      onSidebarToggle
    ); // Debug log
    onSidebarToggle();
  };

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
    <header className="border-gray-200 z-60 sticky top-0 mb-4 w-full border-b bg-white">
      <div className="h-16 flex items-center justify-between px-4 lg:px-8">
        {/* Left Section - Sidebar Toggle & Page Info */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {/* Sidebar Toggle - Always visible */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSidebarToggle}
            className="shrink-0 hover:bg-gray-100"
            aria-label="Toggle navigation sidebar"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Page Info Container */}
          <div className="min-w-0 flex-1">
            {/* Breadcrumb Navigation - Desktop */}
            <div className="md:flex md:flex-col md:gap-2 hidden">
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

              {/* Page Description */}
              <p className="text-muted-foreground text-xs truncate leading-tight">
                {getPageDescription()}
              </p>
            </div>

            {/* Mobile Page Title */}
            <div className="md:hidden">
              <h1 className="truncate text-base font-semibold leading-tight">
                {currentPageInfo.label}
              </h1>
              <p className="text-muted-foreground text-xs truncate leading-tight">
                {currentPageInfo.category}
              </p>
            </div>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="xl:mx-20 mx-8 hidden max-w-lg flex-1 lg:flex">
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

        {/* Right Section - Actions & User Menu */}
        <div className="gap-3 md:gap-4 flex shrink-0 items-center">
          {/* Health Score Badge */}
          {healthScore !== undefined && (
            <Badge
              variant="outline"
              className="px-3 hidden border-vitalsense-primary py-1 text-vitalsense-primary sm:flex"
            >
              <Shield className="h-3 w-3 mr-2" />
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
              <span className="bg-red-500 absolute -right-1 -top-1 h-2 w-2 rounded-full" />
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
              className="px-3 md:inline-flex hidden rounded-full"
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
