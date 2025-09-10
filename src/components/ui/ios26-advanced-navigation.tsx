/**
 * iOS 26 Advanced Navigation System - Priority 3 Implementation
 *
 * Features:
 * - Floating tab bar with adaptive positioning
 * - Enhanced breadcrumb with gesture support
 * - iOS 26 sidebar navigation
 * - Advanced search integration
 * - Native-like transitions and interactions
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ChevronRight, Home, Menu, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

// Navigation Types
export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  disabled?: boolean;
  category?: 'main' | 'ai' | 'setup' | 'admin';
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  path: string;
}

export interface NavigationProps {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  showSearch?: boolean;
  showSidebar?: boolean;
  className?: string;
}

export interface FloatingTabBarProps {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  position?: 'bottom' | 'top';
  className?: string;
}

interface EnhancedBreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem) => void;
  showHome?: boolean;
  maxItems?: number;
  className?: string;
}

export interface iOS26SidebarProps {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

/**
 * iOS 26 Floating Tab Bar - Premium mobile-first navigation
 */
export function iOS26FloatingTabBar({
  items,
  activeTab,
  onTabChange,
  position = 'bottom',
  className,
}: FloatingTabBarProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide on scroll for better mobile experience
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;

      setIsVisible(!isScrollingDown || currentScrollY < 100);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const positionClasses = {
    bottom: 'bottom-4 left-4 right-4',
    top: 'top-4 left-4 right-4',
  };

  return (
    <nav
      className={cn(
        'fixed z-50 mx-auto max-w-md',
        'ios-26-surface-elevated rounded-2xl border border-white/10 p-2 shadow-2xl backdrop-blur-xl',
        'transition-all duration-300 ease-out',
        isVisible
          ? 'translate-y-0 opacity-100'
          : position === 'bottom'
            ? 'translate-y-full opacity-0'
            : '-translate-y-full opacity-0',
        positionClasses[position],
        className
      )}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between space-x-1">
        {items.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${item.id}`}
              disabled={item.disabled}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium',
                'transition-all duration-200 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vitalsense-primary focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                isActive
                  ? 'ios-label-primary bg-vitalsense-primary/10 text-vitalsense-primary shadow-sm'
                  : 'ios-label-secondary hover:ios-label-primary hover:bg-black/5 active:bg-black/10',
                'ios-26-enhanced-contrast'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'
                )}
                aria-hidden="true"
              />
              <span className="truncate leading-none">{item.label}</span>

              {/* Badge for notifications */}
              {item.badge && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-vitalsense-error text-[10px] font-bold text-white">
                  {item.badge > 99 ? '99+' : item.badge}
                </div>
              )}

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 h-1 w-6 -translate-x-1/2 transform rounded-full bg-vitalsense-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Enhanced iOS 26 Breadcrumb Navigation with gesture support
 */
/**
 * iOS 26 Enhanced Breadcrumb - Smart navigation with gesture support
 */
export function iOS26EnhancedBreadcrumb({
  items,
  onNavigate,
  showHome = true,
  maxItems = 4,
  className,
}: EnhancedBreadcrumbProps): React.ReactElement {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [showOverflow, setShowOverflow] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;

    // Swipe left to go back
    if (distance > 50 && items.length > 1) {
      onNavigate(items[items.length - 2]);
    }

    setTouchStart(null);
  };

  const visibleItems =
    items.length > maxItems
      ? [
          ...items.slice(0, 1),
          { id: 'overflow', label: '...', path: '#' },
          ...items.slice(-2),
        ]
      : items;

  return (
    <nav
      className={cn(
        'ios-26-surface ios-label-secondary flex items-center space-x-1 rounded-lg px-3 py-2 text-sm',
        'border border-white/5 backdrop-blur-sm',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Breadcrumb navigation"
    >
      {showHome && (
        <button
          onClick={() => onNavigate({ id: 'home', label: 'Home', path: '/' })}
          className="ios-label-secondary hover:ios-label-primary flex items-center rounded p-1 transition-colors"
          aria-label="Go to home"
        >
          <Home className="h-4 w-4" />
        </button>
      )}

      {visibleItems.map((item, index) => {
        const isLast = index === visibleItems.length - 1;
        const isOverflow = item.id === 'overflow';

        return (
          <div key={item.id} className="flex items-center space-x-1">
            {(index > 0 || showHome) && (
              <ChevronRight
                className="ios-label-secondary h-3 w-3"
                aria-hidden="true"
              />
            )}

            {isOverflow ? (
              <button
                onClick={() => setShowOverflow(true)}
                className="ios-label-secondary hover:ios-label-primary rounded px-2 py-1 transition-colors"
                aria-label="Show more breadcrumb items"
              >
                {item.label}
              </button>
            ) : (
              <button
                onClick={() => !isLast && onNavigate(item)}
                disabled={isLast}
                className={cn(
                  'rounded px-2 py-1 transition-colors',
                  isLast
                    ? 'ios-label-primary cursor-default font-medium'
                    : 'ios-label-secondary hover:ios-label-primary'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </button>
            )}
          </div>
        );
      })}

      {/* Overflow menu */}
      {showOverflow && (
        <div className="ios-26-surface-elevated absolute right-0 top-full z-50 mt-1 min-w-48 rounded-lg border border-white/10 p-1 shadow-xl backdrop-blur-xl">
          {items.slice(1, -2).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item);
                setShowOverflow(false);
              }}
              className="ios-label-secondary hover:ios-label-primary block w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-white/5"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

/**
 * iOS 26 Sidebar Navigation - Modern desktop navigation
 */
export function iOS26Sidebar({
  items,
  activeTab,
  onTabChange,
  isOpen = false,
  onToggle,
  className,
}: iOS26SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);

  // Filter items based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter(
      (item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchQuery, items]);

  const categorizedItems = filteredItems.reduce(
    (acc, item) => {
      const category = item.category || 'main';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, NavItem[]>
  );

  const categoryLabels = {
    main: 'Main Features',
    ai: 'AI & Monitoring',
    setup: 'Setup & Configuration',
    admin: 'Administration',
  };

  return (
    <Sheet open={isOpen} onOpenChange={onToggle}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className={cn(
          'w-80 p-0',
          'ios-system-background border-r border-gray-200',
          className
        )}
      >
        <SheetHeader className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              VitalSense Navigation
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription className="sr-only">
            Navigate through VitalSense features and settings
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
          {Object.entries(categorizedItems).map(([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {categoryLabels[category as keyof typeof categoryLabels] ||
                  category}
              </h3>

              <div className="space-y-1">
                {categoryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        onToggle?.();
                      }}
                      disabled={item.disabled}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vitalsense-primary focus-visible:ring-offset-2',
                        'disabled:pointer-events-none disabled:opacity-50',
                        isActive
                          ? 'bg-vitalsense-primary/10 font-medium text-vitalsense-primary'
                          : 'ios-label-secondary hover:ios-label-primary hover:bg-gray-100'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className="flex-1 truncate">{item.label}</span>

                      {/* Badge */}
                      {item.badge && (
                        <Badge variant="secondary" className="h-5 text-xs">
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}

                      {/* Active indicator */}
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-vitalsense-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

/**
 * iOS 26 Advanced Search with scopes and suggestions
 */
export function iOS26AdvancedSearch({
  onSearch,
  placeholder = 'Search VitalSense...',
  scopes = [],
  suggestions = [],
  className,
}: {
  onSearch: (query: string, scope?: string) => void;
  placeholder?: string;
  scopes?: Array<{ id: string; label: string }>;
  suggestions?: string[];
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [activeScope, setActiveScope] = useState(scopes[0]?.id || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions
    .filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      onSearch(searchQuery, activeScope);
      setShowSuggestions(false);
    },
    [onSearch, activeScope]
  );

  return (
    <div className={cn('relative w-full max-w-md', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(query);
            } else if (e.key === 'Escape') {
              setShowSuggestions(false);
            }
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="ios-26-surface-elevated pl-9 pr-4"
        />
      </div>

      {/* Search Scopes */}
      {scopes.length > 0 && (
        <div className="mt-2 flex gap-1">
          {scopes.map((scope) => (
            <button
              key={scope.id}
              onClick={() => setActiveScope(scope.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                activeScope === scope.id
                  ? 'bg-vitalsense-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {scope.label}
            </button>
          ))}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (query || filteredSuggestions.length > 0) && (
        <div className="ios-26-surface-elevated absolute top-full z-10 mt-1 w-full rounded-lg border shadow-lg">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                setQuery(suggestion);
                handleSearch(suggestion);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-100"
            >
              <Search className="h-3 w-3 text-gray-400" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
