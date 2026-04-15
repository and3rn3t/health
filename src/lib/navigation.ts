import {
  Activity,
  AlertTriangle,
  Footprints,
  Scan,
  Settings as SettingsIcon,
} from '@/lib/icons';
import type { LucideIcon } from '@/lib/icons';

export interface RouteNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: RouteNavItem[] = [
  { path: '/', label: 'Dashboard', icon: Activity },
  { path: '/gait-analysis', label: 'Gait Analysis', icon: Footprints },
  { path: '/lidar-posture', label: 'LiDAR & Posture', icon: Scan },
  { path: '/fall-risk', label: 'Fall Risk', icon: AlertTriangle },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];
