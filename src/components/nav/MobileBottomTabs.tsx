import {
  Activity,
  BarChart3,
  Calendar,
  Heart,
  Home,
  Settings,
  Shield,
  Users,
} from '@/lib/icons';
import React from 'react';

import { cn } from '@/lib/utils';

interface MobileBottomTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  navigationItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  className?: string;
}

// Map common tab IDs to more mobile-friendly icons and labels
const mobileTabConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  dashboard: { icon: Home, label: 'Home' },
  'health-overview': { icon: Heart, label: 'Health' },
  analytics: { icon: BarChart3, label: 'Analytics' },
  'live-monitoring': { icon: Activity, label: 'Live' },
  'emergency-contacts': { icon: Users, label: 'Contacts' },
  'fall-detection': { icon: Shield, label: 'Safety' },
  calendar: { icon: Calendar, label: 'Calendar' },
  settings: { icon: Settings, label: 'Settings' },
};

export function MobileBottomTabs({
  activeTab,
  onTabChange,
  navigationItems,
  className: _className,
}: MobileBottomTabsProps) {
  // Show only the most important 4-5 tabs on mobile bottom bar
  const primaryTabs = navigationItems
    .filter((item) =>
      [
        'dashboard',
        'health-overview',
        'analytics',
        'live-monitoring',
        'settings',
      ].includes(item.id)
    )
    .slice(0, 5);

  const handleTabClick = (tabId: string) => {
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onTabChange(tabId);
  };

  return (
    <div className="vs-glass-thick fixed bottom-0 left-0 right-0 z-50 border-t border-border/30">
      <div
        className="h-18 flex items-center justify-center gap-1 px-2 py-2"
        role="tablist"
        aria-label="Main navigation"
      >
        {primaryTabs.map((item) => {
          const config = mobileTabConfig[item.id] || {
            icon: item.icon,
            label: item.label,
          };
          const Icon = config.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive ? 'true' : 'false'}
              aria-label={`${config.label} tab`}
              onClick={() => handleTabClick(item.id)}
              className={cn(
                'flex w-16 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200',
                'cursor-pointer touch-manipulation select-none',
                'hover:scale-105 active:scale-95 active:bg-vitalsense-teal/20',
                'focus:outline-none focus:ring-2 focus:ring-vitalsense-teal/50',
                isActive
                  ? 'bg-vitalsense-teal/15 text-vitalsense-teal shadow-sm'
                  : 'text-muted-foreground hover:bg-vitalsense-teal/5 hover:text-vitalsense-teal hover:shadow-sm'
              )}
            >
              <Icon
                className={cn('h-5 w-5', isActive && 'text-vitalsense-teal')}
              />
              <span className="truncate leading-tight">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
