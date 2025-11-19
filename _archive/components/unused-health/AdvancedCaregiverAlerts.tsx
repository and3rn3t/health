/**
 * Advanced Caregiver Alert & Notification System
 * Enhanced emergency response with intelligent escalation
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Brain,
  Heart,
  MapPin,
  MessageSquare,
  Phone,
  Shield,
  Smartphone,
  Users,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string;
  priority: 'primary' | 'secondary' | 'emergency';
  availability: {
    [key: string]: { start: string; end: string };
  };
  preferredContactMethod: 'call' | 'sms' | 'email' | 'app';
  responseTime: number; // average minutes
  isHealthcareProvider: boolean;
  hasAppAccess: boolean;
  notificationTypes: string[];
}

interface FallEvent {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    address: string;
    indoorLocation?: string;
  };
  sensorData: {
    impactForce: number;
    heartRate: number;
    duration: number; // seconds until movement detected
  };
  aiConfidence: number;
  userResponse: 'confirmed' | 'false_alarm' | 'no_response';
  responseTime?: number; // seconds
  emergencyServices: boolean;
  caregiverNotifications: CaregiverNotification[];
}

interface CaregiverNotification {
  id: string;
  contactId: string;
  method: 'call' | 'sms' | 'email' | 'push' | 'video_call';
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  respondedAt?: Date;
  response?: string;
  status: 'pending' | 'delivered' | 'read' | 'responded' | 'failed';
  escalationLevel: number;
}

interface SmartEscalation {
  enabled: boolean;
  levels: EscalationLevel[];
  aiOptimized: boolean;
  contextAware: boolean;
}

interface EscalationLevel {
  level: number;
  delay: number; // minutes
  contactIds: string[];
  methods: ('call' | 'sms' | 'email' | 'push')[];
  emergencyServices: boolean;
  autoConfirm: boolean;
  requiredResponses: number;
}

function CaregiverContactsManager({
  contacts,
  onAddContact,
}: {
  contacts: EmergencyContact[];
  onAddContact: (contact: Omit<EmergencyContact, 'id'>) => void;
}) {
  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({
    name: '',
    relationship: '',
    phoneNumber: '',
    email: '',
    priority: 'secondary',
    preferredContactMethod: 'call',
    isHealthcareProvider: false,
    hasAppAccess: false,
    notificationTypes: ['fall_detected', 'high_risk_alert'],
  });

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phoneNumber) {
      toast.error('Name and phone number are required');
      return;
    }

    onAddContact({
      name: newContact.name,
      relationship: newContact.relationship || 'Contact',
      phoneNumber: newContact.phoneNumber,
      email: newContact.email || '',
      priority: newContact.priority || 'secondary',
      availability: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '10:00', end: '16:00' },
        sunday: { start: '10:00', end: '16:00' },
      },
      preferredContactMethod: newContact.preferredContactMethod || 'call',
      responseTime: 5,
      isHealthcareProvider: newContact.isHealthcareProvider || false,
      hasAppAccess: newContact.hasAppAccess || false,
      notificationTypes: newContact.notificationTypes || ['fall_detected'],
    });

    setNewContact({
      name: '',
      relationship: '',
      phoneNumber: '',
      email: '',
      priority: 'secondary',
      preferredContactMethod: 'call',
      isHealthcareProvider: false,
      hasAppAccess: false,
      notificationTypes: ['fall_detected', 'high_risk_alert'],
    });

    toast.success('Emergency contact added successfully');
  };

  const getPriorityBadge = (priority: EmergencyContact['priority']) => {
    switch (priority) {
      case 'primary':
        return <Badge variant="destructive">Primary</Badge>;
      case 'emergency':
        return <Badge variant="default">Emergency</Badge>;
      default:
        return <Badge variant="secondary">Secondary</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newContact.name || ''}
                onChange={(e) =>
                  setNewContact({ ...newContact, name: e.target.value })
                }
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Input
                id="relationship"
                value={newContact.relationship || ''}
                onChange={(e) =>
                  setNewContact({ ...newContact, relationship: e.target.value })
                }
                placeholder="e.g., Spouse, Child, Doctor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={newContact.phoneNumber || ''}
                onChange={(e) =>
                  setNewContact({ ...newContact, phoneNumber: e.target.value })
                }
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newContact.email || ''}
                onChange={(e) =>
                  setNewContact({ ...newContact, email: e.target.value })
                }
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="healthcare"
                checked={newContact.isHealthcareProvider || false}
                onCheckedChange={(checked) =>
                  setNewContact({
                    ...newContact,
                    isHealthcareProvider: checked,
                  })
                }
              />
              <Label htmlFor="healthcare">Healthcare Provider</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="app-access"
                checked={newContact.hasAppAccess || false}
                onCheckedChange={(checked) =>
                  setNewContact({ ...newContact, hasAppAccess: checked })
                }
              />
              <Label htmlFor="app-access">Has App Access</Label>
            </div>
          </div>

          <Button onClick={handleAddContact} className="w-full">
            Add Contact
          </Button>
        </CardContent>
      </Card>

      {/* Existing Contacts */}
      <div className="space-y-4">
        {contacts.map((contact) => (
          <Card key={contact.id}>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{contact.name}</h4>
                  <p className="text-muted-foreground text-sm">
                    {contact.relationship} • {contact.phoneNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(contact.priority)}
                  {contact.isHealthcareProvider && (
                    <Badge variant="outline">
                      <Heart className="mr-1 h-3 w-3" />
                      Healthcare
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    Preferred Method
                  </span>
                  <p className="capitalize">{contact.preferredContactMethod}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Response</span>
                  <p>{contact.responseTime} minutes</p>
                </div>
                <div>
                  <span className="text-muted-foreground">App Access</span>
                  <p>{contact.hasAppAccess ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FallEventResponse({ event }: { event: FallEvent }) {
  const getSeverityColor = (severity: FallEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getResponseStatus = (status: CaregiverNotification['status']) => {
    switch (status) {
      case 'responded':
        return <Badge variant="default">Responded</Badge>;
      case 'read':
        return <Badge variant="secondary">Read</Badge>;
      case 'delivered':
        return <Badge variant="outline">Delivered</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card className={`border-2 ${getSeverityColor(event.severity)}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Fall Event Detected
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              AI: {(event.aiConfidence * 100).toFixed(0)}% confident
            </Badge>
            <Badge
              className={
                event.severity === 'critical' ? 'bg-red-600' : 'bg-orange-600'
              }
            >
              {event.severity.toUpperCase()}
            </Badge>
          </div>
        </div>
        <CardDescription>
          {event.timestamp.toLocaleString()} • {event.location.address}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event Details */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Impact Data</h4>
            <div className="space-y-1 text-sm">
              <p>Force: {event.sensorData.impactForce}G</p>
              <p>Heart Rate: {event.sensorData.heartRate} bpm</p>
              <p>Duration: {event.sensorData.duration}s</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Location</h4>
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.location.address}
              </p>
              {event.location.indoorLocation && (
                <p className="text-muted-foreground">
                  {event.location.indoorLocation}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Response</h4>
            <div className="space-y-1 text-sm">
              <p>User: {event.userResponse.replace('_', ' ')}</p>
              <p>
                Emergency Services:{' '}
                {event.emergencyServices ? 'Called' : 'Not called'}
              </p>
              {event.responseTime && (
                <p>Response Time: {event.responseTime}s</p>
              )}
            </div>
          </div>
        </div>

        {/* Caregiver Notifications */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Caregiver Notifications</h4>
          <div className="space-y-2">
            {event.caregiverNotifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {notification.method === 'call' && (
                      <Phone className="h-4 w-4" />
                    )}
                    {notification.method === 'sms' && (
                      <MessageSquare className="h-4 w-4" />
                    )}
                    {notification.method === 'video_call' && (
                      <Video className="h-4 w-4" />
                    )}
                    {notification.method === 'push' && (
                      <Smartphone className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      Contact {notification.contactId}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    via {notification.method}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {getResponseStatus(notification.status)}
                  <span className="text-muted-foreground text-xs">
                    {notification.sentAt.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SmartEscalationConfig({
  escalation,
  onUpdateEscalation,
}: {
  escalation: SmartEscalation;
  onUpdateEscalation: (updates: Partial<SmartEscalation>) => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Smart Escalation Settings
          </CardTitle>
          <CardDescription>
            AI-optimized emergency response with intelligent contact
            prioritization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Smart Escalation</Label>
              <p className="text-muted-foreground text-sm">
                Automatically escalate notifications based on response patterns
              </p>
            </div>
            <Switch
              checked={escalation.enabled}
              onCheckedChange={(enabled) => onUpdateEscalation({ enabled })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>AI Optimization</Label>
              <p className="text-muted-foreground text-sm">
                Use machine learning to optimize contact timing and methods
              </p>
            </div>
            <Switch
              checked={escalation.aiOptimized}
              onCheckedChange={(aiOptimized) =>
                onUpdateEscalation({ aiOptimized })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Context-Aware Notifications</Label>
              <p className="text-muted-foreground text-sm">
                Consider time of day, contact availability, and urgency level
              </p>
            </div>
            <Switch
              checked={escalation.contextAware}
              onCheckedChange={(contextAware) =>
                onUpdateEscalation({ contextAware })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Escalation Levels */}
      <div className="space-y-4">
        {escalation.levels.map((level) => (
          <Card key={level.level}>
            <CardHeader>
              <CardTitle className="text-lg">
                Level {level.level} Escalation
              </CardTitle>
              <CardDescription>
                Triggered after {level.delay} minutes without response
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Delay (minutes)</Label>
                  <Input
                    type="number"
                    value={level.delay}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Required Responses</Label>
                  <Input
                    type="number"
                    value={level.requiredResponses}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notification Methods</Label>
                <div className="flex gap-2">
                  {level.methods.map((method) => (
                    <Badge key={method} variant="outline">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch checked={level.emergencyServices} disabled />
                  <Label>Emergency Services</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={level.autoConfirm} disabled />
                  <Label>Auto-confirm Fall</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdvancedCaregiverAlerts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      relationship: 'Daughter',
      phoneNumber: '+1 (555) 123-4567',
      email: 'sarah@example.com',
      priority: 'primary',
      availability: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '10:00', end: '16:00' },
        sunday: { start: '10:00', end: '16:00' },
      },
      preferredContactMethod: 'call',
      responseTime: 3,
      isHealthcareProvider: false,
      hasAppAccess: true,
      notificationTypes: [
        'fall_detected',
        'high_risk_alert',
        'medication_reminder',
      ],
    },
  ]);

  const [recentEvent] = useState<FallEvent>({
    id: 'event-1',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    severity: 'high',
    location: {
      latitude: 40.7128,
      longitude: -74.006,
      address: '123 Main St, New York, NY 10001',
      indoorLocation: 'Living Room',
    },
    sensorData: {
      impactForce: 8.5,
      heartRate: 95,
      duration: 8,
    },
    aiConfidence: 0.92,
    userResponse: 'no_response',
    responseTime: 45,
    emergencyServices: false,
    caregiverNotifications: [
      {
        id: 'notif-1',
        contactId: '1',
        method: 'call',
        sentAt: new Date(Date.now() - 10 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 9 * 60 * 1000),
        readAt: new Date(Date.now() - 8 * 60 * 1000),
        respondedAt: new Date(Date.now() - 7 * 60 * 1000),
        response: 'On my way!',
        status: 'responded',
        escalationLevel: 1,
      },
    ],
  });

  const [escalation, setEscalation] = useState<SmartEscalation>({
    enabled: true,
    aiOptimized: true,
    contextAware: true,
    levels: [
      {
        level: 1,
        delay: 2,
        contactIds: ['1'],
        methods: ['call', 'push'],
        emergencyServices: false,
        autoConfirm: false,
        requiredResponses: 1,
      },
      {
        level: 2,
        delay: 5,
        contactIds: ['1', '2'],
        methods: ['call', 'sms', 'push'],
        emergencyServices: false,
        autoConfirm: false,
        requiredResponses: 1,
      },
      {
        level: 3,
        delay: 10,
        contactIds: ['1', '2', '3'],
        methods: ['call', 'sms'],
        emergencyServices: true,
        autoConfirm: true,
        requiredResponses: 1,
      },
    ],
  });

  const addContact = (contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: `contact-${Date.now()}`,
    };
    setContacts([...contacts, newContact]);
  };

  const updateEscalation = (updates: Partial<SmartEscalation>) => {
    setEscalation({ ...escalation, ...updates });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Advanced Caregiver Alert System
          </CardTitle>
          <CardDescription>
            AI-powered emergency response with intelligent notification
            escalation
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="recent-events" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recent-events">Recent Events</TabsTrigger>
          <TabsTrigger value="contacts">Emergency Contacts</TabsTrigger>
          <TabsTrigger value="escalation">Smart Escalation</TabsTrigger>
          <TabsTrigger value="settings">Alert Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="recent-events" className="space-y-6">
          <FallEventResponse event={recentEvent} />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <CaregiverContactsManager
            contacts={contacts}
            onAddContact={addContact}
          />
        </TabsContent>

        <TabsContent value="escalation" className="space-y-6">
          <SmartEscalationConfig
            escalation={escalation}
            onUpdateEscalation={updateEscalation}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure when and how alerts are sent to caregivers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Fall Detection Alerts</Label>
                    <p className="text-muted-foreground text-sm">
                      Immediate notification when a fall is detected
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>High Risk Alerts</Label>
                    <p className="text-muted-foreground text-sm">
                      Notify when fall risk becomes elevated
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Daily Summary Reports</Label>
                    <p className="text-muted-foreground text-sm">
                      Daily health and activity summaries
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Medication Reminders</Label>
                    <p className="text-muted-foreground text-sm">
                      Alert caregivers about missed medications
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quiet Hours</Label>
                <p className="text-muted-foreground mb-2 text-sm">
                  Limit non-emergency notifications during these hours
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" defaultValue="22:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" defaultValue="07:00" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
