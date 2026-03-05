import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ChevronDown, Menu, Moon, MoreHorizontal, Sun } from 'lucide-react';
import React, { useState } from 'react';

interface MobileHeaderProps {
  activeTab: string;
  activeLabel?: string;
  themeMode: 'light' | 'dark' | 'system';
  onThemeToggle: () => void;
  onMenuToggle: () => void;
  navigationItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  onNavigate: (tabId: string) => void;
  className?: string;
}

export function MobileHeader({
  activeTab,
  activeLabel,
  themeMode,
  onThemeToggle,
  onMenuToggle,
  navigationItems,
  onNavigate,
  className,
}: MobileHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get secondary navigation items (those not in bottom tabs)
  const primaryTabIds = [
    'dashboard',
    'health-overview',
    'analytics',
    'live-monitoring',
    'settings',
  ];
  const secondaryItems = navigationItems.filter(
    (item) => !primaryTabIds.includes(item.id)
  );

  const ThemeIcon = themeMode === 'dark' ? Sun : Moon;

  return (
    <header
      className={cn(
        'vs-glass-thick sticky top-0 z-40 border-b border-border/50',
        'pt-safe-top',
        className
      )}
    >
      {/* Main header bar */}
      <div className="flex h-12 items-center justify-between px-4">
        {/* Left: App title or current section */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="truncate text-lg font-semibold text-foreground">
            {activeLabel || 'VitalSense'}
          </h1>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            className="h-9 w-9"
            aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
          >
            <ThemeIcon className="h-4 w-4" />
          </Button>

          {/* Secondary navigation menu */}
          {secondaryItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onMenuToggle}
                  className="flex items-center gap-2"
                >
                  <Menu className="h-4 w-4" />
                  All Navigation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Quick expand/collapse for secondary actions */}
          {secondaryItems.length > 2 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-9 w-9"
              aria-label={isExpanded ? 'Collapse options' : 'Show more options'}
            >
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isExpanded && 'rotate-180'
                )}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Expandable secondary actions */}
      {isExpanded && secondaryItems.length > 0 && (
        <div className="bg-muted/30 border-t border-border px-4 py-2">
          <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto">
            {secondaryItems.slice(0, 6).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    onNavigate(item.id);
                    setIsExpanded(false);
                  }}
                  className="flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Icon className="h-3 w-3" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
