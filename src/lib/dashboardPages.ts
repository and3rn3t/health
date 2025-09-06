// VitalSense Dashboard Pages Configuration
export interface DashboardPage {
  label: string;
  path: string;
  category: string;
  icon: string;
  description?: string;
}

export const DASHBOARD_PAGES: DashboardPage[] = [
  {
    label: 'Health Overview',
    path: '/health',
    category: 'Analytics',
    icon: 'heart',
    description: 'Comprehensive health analytics and metrics',
  },
  {
    label: 'Fall Risk Monitor',
    path: '/fall-risk',
    category: 'Monitoring',
    icon: 'shield-check',
    description: 'Real-time fall risk assessment and alerts',
  },
  {
    label: 'Activity Tracking',
    path: '/activity',
    category: 'Analytics',
    icon: 'trending-up',
    description: 'Daily activity and exercise monitoring',
  },
  {
    label: 'Caregiver Dashboard',
    path: '/caregiver',
    category: 'Monitoring',
    icon: 'users',
    description: 'Family caregiver alerts and insights',
  },
  {
    label: 'Emergency Alerts',
    path: '/emergency',
    category: 'Monitoring',
    icon: 'alert-triangle',
    description: 'Emergency notification management',
  },
  {
    label: 'Health Trends',
    path: '/trends',
    category: 'Analytics',
    icon: 'bar-chart',
    description: 'Long-term health trend analysis',
  },
  {
    label: 'Settings',
    path: '/settings',
    category: 'Configuration',
    icon: 'settings',
    description: 'VitalSense app configuration and preferences',
  },
];

export default DASHBOARD_PAGES;
