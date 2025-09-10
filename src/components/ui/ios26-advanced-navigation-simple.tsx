/**
 * iOS 26 HIG Advanced Navigation System
 *
 * Priority 3: Advanced navigation patterns following iOS 26 design guidelines
 * Features: Floating tab bar, enhanced breadcrumbs, sidebar navigation, advanced search
 */

import { cn } from '@/lib/utils';
import { ChevronRight, Filter, Home, Search, X } from '@phosphor-icons/react';
import React, { useEffect, useState } from 'react';

// ===== TYPES =====

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  disabled?: boolean;
}

interface FloatingTabBarProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  position?: 'top' | 'bottom';
  className?: string;
}

interface BreadcrumbItem {
  id: string;
  label: string;
  path: string;
}

interface EnhancedBreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem) => void;
  showHome?: boolean;
  maxItems?: number;
  className?: string;
}

// ===== FLOATING TAB BAR =====

const iOS26FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  items,
  activeTab,
  onTabChange,
  position = 'bottom',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  let transformClass;
  if (isVisible) {
    transformClass = 'translate-y-0 opacity-100';
  } else {
    transformClass =
      position === 'bottom'
        ? 'translate-y-full opacity-0'
        : '-translate-y-full opacity-0';
  }

  return (
    <nav
      className={cn(
        'fixed z-50 mx-auto max-w-md',
        'ios-26-surface-elevated rounded-2xl border border-white/10 p-2 shadow-2xl backdrop-blur-xl',
        'transition-all duration-300 ease-out',
        transformClass,
        positionClasses[position],
        className
      )}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between space-x-1">
        {items.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
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
              />
              <span className="truncate leading-none">{item.label}</span>

              {item.badge && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-vitalsense-error text-[10px] font-bold text-white">
                  {item.badge > 99 ? '99+' : item.badge}
                </div>
              )}

              {isActive && (
                <div className="absolute bottom-0 left-1/2 h-1 w-6 -translate-x-1/2 transform rounded-full bg-vitalsense-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// ===== ENHANCED BREADCRUMB =====

const iOS26EnhancedBreadcrumb: React.FC<EnhancedBreadcrumbProps> = ({
  items,
  onNavigate,
  showHome = true,
  maxItems = 4,
  className,
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [showOverflow, setShowOverflow] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;

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
          <div
            key={`breadcrumb-${item.id}-${index}`}
            className="flex items-center space-x-1"
          >
            {(index > 0 || showHome) && (
              <ChevronRight className="ios-label-secondary h-3 w-3" />
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
              >
                {item.label}
              </button>
            )}
          </div>
        );
      })}

      {showOverflow && (
        <div className="ios-26-surface-elevated absolute right-0 top-full z-50 mt-1 min-w-48 rounded-lg border border-white/10 p-1 shadow-xl backdrop-blur-xl">
          {items.slice(1, -2).map((item, index) => (
            <button
              key={`overflow-${item.id}-${index}`}
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
};

// ===== SIMPLE DEMO COMPONENT =====

/**
 * iOS26AdvancedNavigation - Demo component showcasing Priority 3 features
 */
const iOS26AdvancedNavigation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Demo tab items
  const tabItems: TabItem[] = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'health', label: 'Health', icon: Search, badge: 3 },
    { id: 'insights', label: 'Insights', icon: Filter },
    { id: 'settings', label: 'Settings', icon: X },
  ];

  // Demo breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'health', label: 'Health', path: '/health' },
    { id: 'metrics', label: 'Metrics', path: '/health/metrics' },
    { id: 'current', label: 'Heart Rate', path: '/health/metrics/heart-rate' },
  ];

  const handleBreadcrumbNavigate = (item: BreadcrumbItem) => {
    console.log('Navigate to:', item.path);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="ios-label-primary mb-2 text-2xl font-bold">
          iOS 26 Advanced Navigation
        </h2>
        <p className="ios-label-secondary text-sm">
          Priority 3: Premium navigation patterns with iOS 26 design guidelines
        </p>
      </div>

      {/* Enhanced Breadcrumb Demo */}
      <div className="space-y-2">
        <h3 className="ios-label-primary text-lg font-semibold">
          Enhanced Breadcrumb Navigation
        </h3>
        <iOS26EnhancedBreadcrumb
          items={breadcrumbItems}
          onNavigate={handleBreadcrumbNavigate}
          showHome={true}
          maxItems={4}
        />
      </div>

      {/* Floating Tab Bar Demo */}
      <div className="space-y-2">
        <h3 className="ios-label-primary text-lg font-semibold">
          Floating Tab Bar (Preview)
        </h3>
        <div className="ios-26-surface relative h-32 rounded-lg border border-white/10">
          <iOS26FloatingTabBar
            items={tabItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            position="bottom"
            className="relative mx-auto w-80"
          />
        </div>
        <p className="ios-label-secondary text-xs">Active tab: {activeTab}</p>
      </div>

      <div className="ios-26-surface rounded-lg border border-white/10 p-4">
        <h4 className="ios-label-primary mb-2 font-medium">
          Priority 3 Features:
        </h4>
        <ul className="ios-label-secondary space-y-1 text-sm">
          <li>✅ Floating Tab Bar with auto-hide on scroll</li>
          <li>✅ Enhanced Breadcrumb with gesture support</li>
          <li>🚧 Sidebar Navigation (structure ready)</li>
          <li>🚧 Advanced Search with scopes (structure ready)</li>
        </ul>
      </div>
    </div>
  );
};

// ===== EXPORTS =====

export {
  iOS26AdvancedNavigation,
  iOS26EnhancedBreadcrumb,
  iOS26FloatingTabBar,
};

export type {
  BreadcrumbItem,
  EnhancedBreadcrumbProps,
  FloatingTabBarProps,
  TabItem,
};
