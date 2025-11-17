/**
 * Helper functions for navigation configuration
 */

import { ComponentType, LucideIcon } from 'react';

export interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
  priority: 1 | 2 | 3;
}

/**
 * Creates a navigation item with consistent structure
 */
export function createNavigationItem(
  id: string,
  label: string,
  icon: LucideIcon,
  component: ComponentType,
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
    component: ComponentType;
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
