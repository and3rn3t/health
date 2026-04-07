/**
 * Helper functions for navigation configuration
 */

import type { ComponentType } from 'react';
import type { LucideIcon } from '@/lib/icons';

/** Maps feature IDs (from events / landing page) to tab IDs */
export const FEATURE_TAB_MAP: Record<string, string> = {
  insights: 'gait-analysis',
  analytics: 'gait-analysis',
  'fall-risk': 'fall-risk',
  'fall-detection': 'fall-risk',
  'realtime-scoring': 'dashboard',
  'live-monitoring': 'dashboard',
  import: 'dashboard',
  'device-sync': 'settings',
  'healthkit-guide': 'settings',
  'system-status': 'settings',
};

export interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  component: ComponentType<Record<string, unknown>>;
  priority: 1 | 2 | 3;
}

/**
 * Creates a navigation item with consistent structure
 */
export function createNavigationItem(
  id: string,
  label: string,
  icon: LucideIcon,
  component: ComponentType<Record<string, unknown>>,
  priority: 1 | 2 | 3
): NavigationItem {
  return {
    id,
    label,
    icon,
    component,
    priority,
  };
}

/**
 * Creates multiple navigation items from an array of configurations
 */
export function createNavigationItems(
  items: Array<{
    id: string;
    label: string;
    icon: LucideIcon;
    component: ComponentType<Record<string, unknown>>;
    priority: 1 | 2 | 3;
  }>
): NavigationItem[] {
  return items.map((item) => createNavigationItem(
    item.id,
    item.label,
    item.icon,
    item.component,
    item.priority
  ));
}
