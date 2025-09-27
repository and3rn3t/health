import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  CheckCircle,
  Circle,
  Clock,
  Monitor,
  Smartphone,
} from 'lucide-react';

interface UIEnhancementStatus {
  component: string;
  status: 'completed' | 'in-progress' | 'planned';
  description: string;
  features: string[];
}

const enhancements: UIEnhancementStatus[] = [
  {
    component: 'Web Dashboard',
    status: 'completed',
    description:
      'Enhanced VitalSense dashboard with comprehensive real-time monitoring',
    features: [
      'Tabbed interface (Overview, Metrics, Alerts, Devices)',
      'Health metric cards with status indicators',
      'Real-time connection status',
      'Alert management system',
      'Device status monitoring',
      'Responsive design with improved UX',
    ],
  },
  {
    component: 'iOS App Interface',
    status: 'completed',
    description: 'Enhanced iOS health monitoring with modern SwiftUI design',
    features: [
      'Tabbed navigation (Overview, Metrics, Alerts, Settings)',
      'Interactive health metric cards',
      'Real-time status indicators',
      'Charts and trends (iOS 16+)',
      'Alert management',
      'Enhanced visual feedback',
    ],
  },
  {
    component: 'Real-time Data Flow',
    status: 'completed',
    description: 'Enhanced server and client integration',
    features: [
      'WebSocket server with SQLite persistence',
      'Apple HealthKit integration',
      'Emergency alert system',
      'Real-time metric streaming',
      'Data quality monitoring',
    ],
  },
];

export function UIEnhancementProgress() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            In Progress
          </Badge>
        );
      default:
        return <Badge variant="outline">Planned</Badge>;
    }
  };

  const getPlatformIcon = (component: string) => {
    if (component.includes('Web')) return <Monitor className="w-5 h-5" />;
    if (component.includes('iOS')) return <Smartphone className="w-5 h-5" />;
    return <Activity className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-gray-900">
          VitalSense UI Enhancement Progress
        </h2>
        <p className="text-gray-600">
          Enhanced user interface for both web dashboard and iOS app with
          comprehensive real-time health monitoring
        </p>
      </div>

      <div className="grid gap-6">
        {enhancements.map((enhancement) => (
          <Card key={enhancement.component} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-x-3 flex items-center">
                  {getPlatformIcon(enhancement.component)}
                  <CardTitle className="text-xl">
                    {enhancement.component}
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(enhancement.status)}
                  {getStatusIcon(enhancement.status)}
                </div>
              </div>
              <p className="text-gray-600 mt-2">{enhancement.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="mb-3 font-semibold text-gray-900">
                  Enhanced Features:
                </h4>
                <div className="grid gap-2">
                  {enhancement.features.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <CheckCircle className="text-green-500 h-4 w-4 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="space-x-3 mb-4 flex items-center">
            <CheckCircle className="text-green-600 h-6 w-6" />
            <h3 className="text-green-900 text-lg font-semibold">
              UI Enhancement Complete!
            </h3>
          </div>
          <p className="text-green-800 mb-4">
            Both web dashboard and iOS app have been significantly enhanced with
            modern, comprehensive interfaces for real-time health monitoring.
          </p>
          <div className="md:grid-cols-2 grid gap-4 text-sm">
            <div>
              <h4 className="text-green-900 mb-2 font-semibold">
                Web Dashboard Features:
              </h4>
              <ul className="text-green-800 space-y-1">
                <li>• Professional tabbed interface</li>
                <li>• Real-time health metric cards</li>
                <li>• Comprehensive alert system</li>
                <li>• Device connection monitoring</li>
              </ul>
            </div>
            <div>
              <h4 className="text-green-900 mb-2 font-semibold">
                iOS App Features:
              </h4>
              <ul className="text-green-800 space-y-1">
                <li>• Modern SwiftUI tabbed design</li>
                <li>• Interactive health cards</li>
                <li>• Chart visualizations (iOS 16+)</li>
                <li>• Enhanced user experience</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
