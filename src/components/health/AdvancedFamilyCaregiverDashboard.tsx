import RecentHealthHistory from '@/components/health/RecentHealthHistory';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCreateHealthData } from '@/hooks/useCreateHealthData';
import { processedHealthDataSchema } from '@/schemas/health';
import { ProcessedHealthData } from '@/types';
import { useKV } from '@github/spark/hooks';
import {
  Activity,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Phone,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface FamilyMember {
  id: string;
  name: string;
  relationship:
    | 'spouse'
    | 'child'
    | 'parent'
    | 'sibling'
    | 'caregiver'
    | 'other';
  role: 'primary-caregiver' | 'emergency-contact' | 'viewer' | 'health-partner';
  permissions: {
    viewHealthData: boolean;
    receiveAlerts: boolean;
    emergencyContact: boolean;
    canModifySettings: boolean;
  };
  contactInfo: {
    email: string;
    phone: string;
    address?: string;
  };
  lastActive: string | null;
  preferences: {
    alertTypes: string[];
    notificationMethod: 'email' | 'sms' | 'both';
    quietHours: { start: string; end: string };
  };
}

interface CaregiverAlert {
  id: string;
  type:
    | 'fall-detected'
    | 'health-decline'
    | 'missed-checkin'
    | 'emergency'
    | 'medication-reminder'
    | 'appointment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  recipientIds: string[];
  status: 'sent' | 'delivered' | 'acknowledged' | 'responded';
  responseTime?: number;
}

interface HealthInsight {
  id: string;
  type: 'improvement' | 'concern' | 'milestone' | 'trend';
  title: string;
  description: string;
  metric: string;
  value: number;
  timestamp: string;
  sharedWith: string[];
}

interface CaregiverTask {
  id: string;
  title: string;
  description: string;
  type:
    | 'medication'
    | 'appointment'
    | 'exercise'
    | 'checkup'
    | 'emergency-drill';
  assignedTo: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  completedBy?: string;
  completedAt?: string;
}

interface Props {
  healthData: ProcessedHealthData;
}

// Helpers to avoid deep nested function definitions in event handlers
function acknowledgeAlertList(list: CaregiverAlert[], id: string): CaregiverAlert[] {
  const result: CaregiverAlert[] = [];
  for (const a of list) {
    if (a.id === id) result.push({ ...a, status: 'acknowledged', responseTime: 5 });
    else result.push(a);
  }
  return result;
}

function completeTaskInList(list: CaregiverTask[], id: string): CaregiverTask[] {
  const result: CaregiverTask[] = [];
  for (const t of list) {
    if (t.id === id)
      result.push({
        ...t,
        status: 'completed',
        completedBy: 'Current User',
        completedAt: new Date().toISOString(),
      });
    else result.push(t);
  }
  return result;
}

export default function AdvancedFamilyCaregiverDashboard({
  healthData,
}: Readonly<Props>) {
  const [familyMembers, setFamilyMembers] = useKV<FamilyMember[]>(
    'family-members',
    []
  );
  const [caregiverAlerts, setCaregiverAlerts] = useKV<CaregiverAlert[]>(
    'caregiver-alerts',
    []
  );
  const [healthInsights, setHealthInsights] = useKV<HealthInsight[]>(
    'health-insights-shared',
    []
  );
  const [caregiverTasks, setCaregiverTasks] = useKV<CaregiverTask[]>(
    'caregiver-tasks',
    []
  );
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [metricTab, setMetricTab] = useState<
    'heart_rate' | 'steps' | 'walking_steadiness' | 'oxygen_saturation'
  >('heart_rate');
  const createMutation = useCreateHealthData();
  const addSample = () => {
    const now = new Date().toISOString();
    const payload: typeof processedHealthDataSchema._type = {
      type: 'heart_rate',
      value: Math.floor(55 + Math.random() * 30),
      timestamp: now,
      processedAt: now,
      validated: true,
      source: {
        userId: 'demo-user',
        collectedAt: now,
      },
      alert: null,
    };
    createMutation.mutate(payload, {
      onSuccess: () => toast.success('Sample heart rate added'),
      onError: () => toast.error('Failed to add sample'),
    });
  };

  // Initialize with sample data if empty
  useEffect(() => {
    if ((familyMembers?.length ?? 0) === 0) {
      const sampleFamily: FamilyMember[] = [
        {
          id: 'spouse-1',
          name: 'Sarah Johnson',
          relationship: 'spouse',
          role: 'primary-caregiver',
          permissions: {
            viewHealthData: true,
            receiveAlerts: true,
            emergencyContact: true,
            canModifySettings: true,
          },
          contactInfo: {
            email: 'sarah.johnson@email.com',
            phone: '(555) 123-4567',
            address: 'Same household',
          },
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          preferences: {
            alertTypes: ['fall-detected', 'health-decline', 'emergency'],
            notificationMethod: 'both',
            quietHours: { start: '22:00', end: '07:00' },
          },
        },
        {
          id: 'child-1',
          name: 'Michael Johnson',
          relationship: 'child',
          role: 'emergency-contact',
          permissions: {
            viewHealthData: true,
            receiveAlerts: true,
            emergencyContact: true,
            canModifySettings: false,
          },
          contactInfo: {
            email: 'michael.j@email.com',
            phone: '(555) 987-6543',
            address: '123 Oak Street, Another City',
          },
          lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          preferences: {
            alertTypes: ['fall-detected', 'emergency'],
            notificationMethod: 'sms',
            quietHours: { start: '23:00', end: '08:00' },
          },
        },
        {
          id: 'caregiver-1',
          name: 'Dr. Emily Chen',
          relationship: 'caregiver',
          role: 'health-partner',
          permissions: {
            viewHealthData: true,
            receiveAlerts: true,
            emergencyContact: false,
            canModifySettings: false,
          },
          contactInfo: {
            email: 'dr.chen@healthcenter.com',
            phone: '(555) 246-8135',
            address: 'City Health Center',
          },
          lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          preferences: {
            alertTypes: ['health-decline', 'missed-checkin'],
            notificationMethod: 'email',
            quietHours: { start: '18:00', end: '08:00' },
          },
        },
      ];
      setFamilyMembers(sampleFamily);

      // Sample alerts
      const sampleAlerts: CaregiverAlert[] = [
        {
          id: 'alert-1',
          type: 'health-decline',
          severity: 'medium',
          message: 'Health score declined from 78 to 72 over the past week',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          recipientIds: ['spouse-1', 'caregiver-1'],
          status: 'acknowledged',
          responseTime: 15,
        },
        {
          id: 'alert-2',
          type: 'missed-checkin',
          severity: 'low',
          message: 'Daily activity check-in was missed yesterday',
          timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
          recipientIds: ['spouse-1'],
          status: 'delivered',
        },
      ];
      setCaregiverAlerts(sampleAlerts);

      // Sample tasks
      const sampleTasks: CaregiverTask[] = [
        {
          id: 'task-1',
          title: 'Weekly Health Review',
          description:
            'Review weekly health metrics and trends with primary physician',
          type: 'checkup',
          assignedTo: 'caregiver-1',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'medium',
          status: 'pending',
        },
        {
          id: 'task-2',
          title: 'Emergency Contact Drill',
          description: 'Practice emergency response procedures with family',
          type: 'emergency-drill',
          assignedTo: 'spouse-1',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          status: 'pending',
        },
      ];
      setCaregiverTasks(sampleTasks);
    }
  }, [
    familyMembers?.length,
    setFamilyMembers,
    setCaregiverAlerts,
    setCaregiverTasks,
  ]);

  // Generate health insights based on current data
  useEffect(() => {
    if (healthData && (healthInsights?.length ?? 0) === 0) {
      const insights: HealthInsight[] = [
        {
          id: 'insight-1',
          type: 'improvement',
          title: 'Walking Stability Improved',
          description:
            'Step regularity has improved by 15% over the past month, indicating better balance',
          metric: 'step_regularity',
          value: 15,
          timestamp: new Date().toISOString(),
          sharedWith: ['spouse-1', 'caregiver-1'],
        },
        {
          id: 'insight-2',
          type: 'concern',
          title: 'Sleep Quality Decline',
          description:
            'Deep sleep duration has decreased by 20 minutes on average this week',
          metric: 'deep_sleep',
          value: -20,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          sharedWith: ['spouse-1'],
        },
      ];
    setHealthInsights(insights);
    }
  }, [healthData, healthInsights?.length, setHealthInsights]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'acknowledged':
      case 'responded':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      case 'sent':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'primary-caregiver':
        return <Heart className="h-4 w-4" />;
      case 'emergency-contact':
        return <Phone className="h-4 w-4" />;
      case 'health-partner':
        return <Heart className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const safeFamilyMembers = familyMembers ?? [];
  const safeCaregiverAlerts = caregiverAlerts ?? [];
  const safeCaregiverTasks = caregiverTasks ?? [];

  const activeAlerts = safeCaregiverAlerts.filter(
    (a) => a.status !== 'acknowledged' && a.status !== 'responded'
  );
  const pendingTasks = safeCaregiverTasks.filter((t) => t.status === 'pending');
  const emergencyContacts = safeFamilyMembers.filter(
    (m) => m.permissions.emergencyContact
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6" />
            Advanced Family & Caregiver Dashboard
          </h2>
          <p className="text-muted-foreground">
            Comprehensive care coordination and family health monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-blue-700"
          >
            {safeFamilyMembers.length} Care Team Members
          </Badge>
          {activeAlerts.length > 0 && (
            <Badge variant="destructive">
              {activeAlerts.length} Active Alert
              {activeAlerts.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Critical Alert Banner */}
      {activeAlerts.some((a) => a.severity === 'critical') && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical Alert:</strong> Emergency situation requires
            immediate family notification.
            <Button
              variant="link"
              className="ml-2 h-auto p-0 text-red-800 underline"
            >
              View Details →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-2 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="font-semibold">Health Score</span>
            </div>
            <p className="text-2xl font-bold">
              {healthData?.healthScore || 0}/100
            </p>
            <p className="text-muted-foreground text-sm">
              Shared with{' '}
              {safeFamilyMembers.filter((m) => m.permissions.viewHealthData).length}{' '}
              members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-2 flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              <span className="font-semibold">Active Alerts</span>
            </div>
            <p className="text-2xl font-bold">{activeAlerts.length}</p>
            <p className="text-muted-foreground text-sm">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">Pending Tasks</span>
            </div>
            <p className="text-2xl font-bold">{pendingTasks.length}</p>
            <p className="text-muted-foreground text-sm">For care team</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-2 flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Emergency Contacts</span>
            </div>
            <p className="text-2xl font-bold">{emergencyContacts.length}</p>
            <p className="text-muted-foreground text-sm">Ready to respond</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="family" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="family">Care Team</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
          <TabsTrigger value="insights">Health Insights</TabsTrigger>
          <TabsTrigger value="tasks">Care Tasks</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Response</TabsTrigger>
        </TabsList>

        <TabsContent value="family" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <RecentHealthHistory metric={metricTab} limit={10} />
            </div>
            <div className="pl-4">
              <div className="mb-2 text-right">
                <ToggleGroup
                  type="single"
                  value={metricTab}
                  onValueChange={(v) =>
                    v && setMetricTab(v as typeof metricTab)
                  }
                >
                  <ToggleGroupItem value="heart_rate">HR</ToggleGroupItem>
                  <ToggleGroupItem value="steps">Steps</ToggleGroupItem>
                  <ToggleGroupItem value="walking_steadiness">
                    Steady
                  </ToggleGroupItem>
                  <ToggleGroupItem value="oxygen_saturation">
                    SpO₂
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <Button
                variant="secondary"
                onClick={addSample}
                disabled={createMutation.isPending}
              >
                Add Sample HR
              </Button>
            </div>
          </div>
          <div className="grid gap-4">
            {(familyMembers ?? []).map((member) => (
              <Card
                key={member.id}
                className={
                  selectedMember === member.id ? 'ring-primary ring-2' : ''
                }
              >
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        {getRoleIcon(member.role)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{member.name}</h3>
                        <p className="text-muted-foreground text-sm capitalize">
                          {member.relationship} •{' '}
                          {member.role.replace('-', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.permissions.emergencyContact && (
                        <Badge variant="secondary" className="text-xs">
                          <Phone className="mr-1 h-3 w-3" />
                          Emergency
                        </Badge>
                      )}
                      <Badge
                        variant={
                          member.lastActive &&
                          new Date(member.lastActive) >
                            new Date(Date.now() - 24 * 60 * 60 * 1000)
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {member.lastActive
                          ? `Active ${new Date(member.lastActive).toLocaleDateString()}`
                          : 'Never active'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">
                        Contact Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div>{member.contactInfo.email}</div>
                        <div>{member.contactInfo.phone}</div>
                        {member.contactInfo.address && (
                          <div className="text-muted-foreground">
                            {member.contactInfo.address}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">
                        Permissions
                      </h4>
                      <div className="space-y-1">
                        {member.permissions.viewHealthData && (
                          <Badge variant="secondary" className="text-xs">
                            View Health Data
                          </Badge>
                        )}
                        {member.permissions.receiveAlerts && (
                          <Badge variant="secondary" className="text-xs">
                            Receive Alerts
                          </Badge>
                        )}
                        {member.permissions.canModifySettings && (
                          <Badge variant="secondary" className="text-xs">
                            Modify Settings
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">
                        Alert Preferences
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          Method: {member.preferences.notificationMethod}
                        </div>
                        <div>
                          Quiet hours: {member.preferences.quietHours.start} -{' '}
                          {member.preferences.quietHours.end}
                        </div>
                        <div>
                          {member.preferences.alertTypes.length} alert types
                          enabled
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline">
                      <Phone className="mr-2 h-4 w-4" />
                      Contact
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      View Activity
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        selectedMember === member.id ? 'default' : 'outline'
                      }
                      onClick={() =>
                        setSelectedMember(
                          selectedMember === member.id ? null : member.id
                        )
                      }
                    >
                      {selectedMember === member.id ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            {(caregiverAlerts ?? []).length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <h3 className="mb-2 text-lg font-semibold">
                    No Active Alerts
                  </h3>
                  <p className="text-muted-foreground">
                    All health indicators are within normal ranges
                  </p>
                </CardContent>
              </Card>
            ) : (
              (caregiverAlerts ?? [])
                .slice()
                .reverse()
                .map((alert) => (
                  <Card key={alert.id}>
                    <CardContent className="pt-6">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-red-100 p-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold capitalize">
                              {alert.type.replace('-', ' ')}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              {alert.message}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-xs ${getSeverityColor(alert.severity)}`}
                          >
                            {alert.severity}
                          </Badge>
                          <Badge
                            className={`text-xs ${getStatusColor(alert.status)}`}
                          >
                            {alert.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <Label className="text-muted-foreground text-xs">
                            Sent To
                          </Label>
                          <div className="text-sm">
                            {alert.recipientIds
                              .map((id) => {
                                const member = (familyMembers ?? []).find(
                                  (m) => m.id === id
                                );
                                return member ? member.name : 'Unknown';
                              })
                              .join(', ')}
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">
                            Timestamp
                          </Label>
                          <div className="text-sm">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">
                            Response Time
                          </Label>
                          <div className="text-sm">
                            {alert.responseTime
                              ? `${alert.responseTime} minutes`
                              : 'No response yet'}
                          </div>
                        </div>
                      </div>

                      {alert.status === 'sent' || alert.status === 'delivered' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCaregiverAlerts(acknowledgeAlertList((caregiverAlerts ?? []), alert.id))}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Acknowledged
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {alert.status === 'acknowledged'
                            ? 'Acknowledged'
                            : 'Responded'}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {(healthInsights ?? []).map((insight) => {
              const bgClass = (() => {
                switch (insight.type) {
                  case 'improvement':
                    return 'bg-green-100';
                  case 'concern':
                    return 'bg-red-100';
                  case 'milestone':
                    return 'bg-blue-100';
                  default:
                    return 'bg-yellow-100';
                }
              })();
              const badgeVariant = (() => {
                switch (insight.type) {
                  case 'improvement':
                    return 'default' as const;
                  case 'concern':
                    return 'destructive' as const;
                  default:
                    return 'secondary' as const;
                }
              })();
              let metricSuffix = '';
              if (insight.metric.includes('percent')) metricSuffix = '%';
              else if (insight.metric.includes('time')) metricSuffix = ' min';
              return (
                <Card key={insight.id}>
                  <CardContent className="pt-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${bgClass}`}>
                          {insight.type === 'improvement' && (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          )}
                          {insight.type === 'concern' && (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          )}
                          {insight.type === 'milestone' && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                          {insight.type === 'trend' && (
                            <Activity className="h-5 w-5 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{insight.title}</h3>
                          <p className="text-muted-foreground text-sm">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                      <Badge variant={badgeVariant}>
                        {insight.value > 0 ? '+' : ''}
                        {insight.value}
                        {metricSuffix}
                      </Badge>
                    </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Shared With
                      </Label>
                      <div className="text-sm">
                        {insight.sharedWith
                          .map((id) => {
                            const member = (familyMembers ?? []).find(
                              (m) => m.id === id
                            );
                            return member ? member.name : 'Unknown';
                          })
                          .join(', ')}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Generated
                      </Label>
                      <div className="text-sm">
                        {new Date(insight.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4">
            {(caregiverTasks ?? []).map((task) => (
              <Card key={task.id}>
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        {task.type === 'medication' && (
                          <Heart className="h-5 w-5 text-blue-600" />
                        )}
                        {task.type === 'appointment' && (
                          <Calendar className="h-5 w-5 text-blue-600" />
                        )}
                        {task.type === 'exercise' && (
                          <Activity className="h-5 w-5 text-blue-600" />
                        )}
                        {task.type === 'checkup' && (
                          <Heart className="h-5 w-5 text-blue-600" />
                        )}
                        {task.type === 'emergency-drill' && (
                          <Shield className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className="text-muted-foreground text-sm">
                          {task.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-xs ${getSeverityColor(task.priority)}`}
                      >
                        {task.priority}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Assigned To
                      </Label>
                      <div className="text-sm">
                        {(familyMembers ?? []).find((m) => m.id === task.assignedTo)
                          ?.name || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Due Date
                      </Label>
                      <div className="text-sm">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Type
                      </Label>
                      <div className="text-sm capitalize">
                        {task.type.replace('-', ' ')}
                      </div>
                    </div>
                  </div>

                  {task.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCaregiverTasks(completeTaskInList((caregiverTasks ?? []), task.id))}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Completed
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Emergency Response Protocol
              </CardTitle>
              <CardDescription>
                Automated emergency contact and response system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 font-semibold">
                    Emergency Contact Chain
                  </h3>
                  <div className="space-y-3">
                    {emergencyContacts.map((contact, index) => (
                      <div
                        key={contact.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <Badge variant="secondary" className="text-xs">
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-muted-foreground text-sm">
                            {contact.contactInfo.phone}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {contact.relationship}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">
                    Emergency Response Status
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Fall Detection</span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Active and monitoring
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Emergency Contacts</span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {(safeFamilyMembers.filter((m) => m.permissions.emergencyContact)).length} contacts ready
                      </p>
                    </div>
                  </div>
                </div>

                <Button variant="destructive" className="w-full">
                  <Phone className="mr-2 h-4 w-4" />
                  Test Emergency Alert System
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Label({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <label className={`text-sm font-medium ${className || ''}`}>
      {children}
    </label>
  );
}
