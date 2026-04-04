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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ProcessedHealthData } from '@/types';
import { useKV } from '@github/spark/hooks';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  FileText,
  Heart,
  Mail,
  MessageCircle,
  Phone,
  Plus,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type AccessLevel = 'full' | 'limited' | 'emergency-only';
type NoteType = 'assessment' | 'recommendation' | 'concern' | 'followup';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface HealthcareProvider {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  clinic: string;
  accessLevel: AccessLevel;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  lastAccess?: Date;
  joinedDate: Date;
}

interface MedicalNote {
  id: string;
  providerId: string;
  type: NoteType;
  title: string;
  content: string;
  priority: Priority;
  actionRequired: boolean;
  patientVisible: boolean;
  createdAt: Date;
  followupDate?: Date;
}

interface CareTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  category: 'medication' | 'exercise' | 'monitoring' | 'appointment';
  completedAt?: Date;
}

interface HealthcarePortalProps {
  healthData: ProcessedHealthData;
}

export default function HealthcarePortal({
  healthData,
}: Readonly<HealthcarePortalProps>) {
  const [providers, setProviders] = useKV<HealthcareProvider[]>(
    'healthcare-providers',
    []
  );
  const [medicalNotes, setMedicalNotes] = useKV<MedicalNote[]>(
    'medical-notes',
    []
  );
  const [careTasks, _setCareTasks] = useKV<CareTask[]>('care-tasks', []);

  const [selectedTab, setSelectedTab] = useState<
    'providers' | 'notes' | 'tasks' | 'timeline'
  >('providers');
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const [newProvider, setNewProvider] = useState<{
    name: string;
    specialization: string;
    email: string;
    phone: string;
    clinic: string;
    accessLevel: AccessLevel;
  }>({
    name: '',
    specialization: '',
    email: '',
    phone: '',
    clinic: '',
    accessLevel: 'limited',
  });

  const [newNote, setNewNote] = useState<{
    type: NoteType;
    title: string;
    content: string;
    priority: Priority;
    actionRequired: boolean;
    patientVisible: boolean;
    followupDate: string;
  }>({
    type: 'assessment',
    title: '',
    content: '',
    priority: 'medium',
    actionRequired: false,
    patientVisible: true,
    followupDate: '',
  });

  // Generate deterministic medical insights locally (Workers-safe)
  const generateMedicalInsights = async () => {
    try {
      const score = healthData.healthScore ?? 0;
      const highRiskCount = (healthData.fallRiskFactors || []).filter(
        (f) => f.risk === 'high'
      ).length;
      const hasConcerns = score < 60 || highRiskCount > 0;

      const assessmentParts: string[] = [];
      let statusMsg = 'Health status needs attention.';
      if (score >= 80) statusMsg = 'Excellent overall status.';
      else if (score >= 60)
        statusMsg = 'Good overall status with areas to improve.';
      assessmentParts.push(
        `Overall health score is ${score}/100. ${statusMsg}`
      );
      if (highRiskCount > 0) {
        assessmentParts.push(
          `${highRiskCount} high fall-risk factor${highRiskCount > 1 ? 's' : ''} detected.`
        );
      }

      const recommendations: string[] = [];
      if (score < 60) recommendations.push('Schedule a primary care check-in');
      if (highRiskCount > 0)
        recommendations.push('Review home fall hazards and add supports');
      recommendations.push('Maintain hydration and regular sleep schedule');

      const note: MedicalNote = {
        id: Date.now().toString(),
        providerId: 'ai-assistant',
        type: 'assessment',
        title: 'Clinical Assessment (Auto-generated)',
        content: assessmentParts.join(' '),
        priority: hasConcerns ? 'high' : 'medium',
        actionRequired: recommendations.length > 0,
        patientVisible: true,
        createdAt: new Date(),
        followupDate: hasConcerns
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : undefined,
      };

      setMedicalNotes((current) => [note, ...(current ?? [])]);
      toast.success('Medical insights generated');
    } catch (err) {
      console.error('generateMedicalInsights failed', err);
      toast.error('Unable to generate insights');
    }
  };

  const addProvider = () => {
    if (!newProvider.name || !newProvider.email) {
      toast.error('Please fill in required fields');
      return;
    }

    const provider: HealthcareProvider = {
      id: Date.now().toString(),
      ...newProvider,
      verificationStatus: 'pending',
      joinedDate: new Date(),
    };

    setProviders((current) => [...(current ?? []), provider]);
    setNewProvider({
      name: '',
      specialization: '',
      email: '',
      phone: '',
      clinic: '',
      accessLevel: 'limited',
    });
    setIsAddingProvider(false);
    toast.success('Healthcare provider invited successfully');
  };

  const addMedicalNote = () => {
    if (!newNote.title || !newNote.content) {
      toast.error('Please fill in title and content');
      return;
    }

    const note: MedicalNote = {
      id: Date.now().toString(),
      providerId: 'patient', // In real app, this would be current user ID
      ...newNote,
      followupDate: newNote.followupDate
        ? new Date(newNote.followupDate)
        : undefined,
      createdAt: new Date(),
    };

    setMedicalNotes((current) => [note, ...(current ?? [])]);
    setNewNote({
      type: 'assessment',
      title: '',
      content: '',
      priority: 'medium',
      actionRequired: false,
      patientVisible: true,
      followupDate: '',
    });
    setIsAddingNote(false);
    toast.success('Medical note added successfully');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // (status chips use inline mappings in UI; no dedicated helper needed here)

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'full':
        return 'bg-green-100 text-green-800';
      case 'limited':
        return 'bg-yellow-100 text-yellow-800';
      case 'emergency-only':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate urgent items count
  const urgentNotesCount = (medicalNotes ?? []).filter(
    (note) => note.priority === 'urgent' || note.actionRequired
  ).length;
  const overdueTasks = (careTasks ?? []).filter(
    (task) => task.status === 'overdue'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header with Alert Summary */}
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Healthcare Portal
            </h2>
            <p className="text-muted-foreground">
              Collaborate with your healthcare team for comprehensive care
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={generateMedicalInsights} variant="outline">
              <Activity className="mr-2 h-4 w-4" />
              AI Insights
            </Button>
          </div>
        </div>

        {/* Alert Summary */}
        {(urgentNotesCount > 0 || overdueTasks > 0) && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Attention Required:</strong> {urgentNotesCount} urgent
              medical notes and {overdueTasks} overdue tasks need your
              attention.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-muted flex space-x-1 rounded-lg p-1">
        {[
          { id: 'providers', label: 'Care Team', icon: Heart },
          { id: 'notes', label: 'Medical Notes', icon: FileText },
          { id: 'tasks', label: 'Care Tasks', icon: CheckCircle },
          { id: 'timeline', label: 'Timeline', icon: Clock },
        ].map((tab) => {
          const IconComponent = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
              className="flex-1 justify-center"
            >
              <IconComponent className="mr-2 h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Healthcare Providers Tab */}
      {selectedTab === 'providers' && (
        <div className="space-y-6">
          {/* Add Provider Button */}
          {!isAddingProvider && (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center p-6">
                <Button
                  variant="ghost"
                  onClick={() => setIsAddingProvider(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add Healthcare Provider
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Add Provider Form */}
          {isAddingProvider && (
            <Card>
              <CardHeader>
                <CardTitle>Add Healthcare Provider</CardTitle>
                <CardDescription>
                  Invite a healthcare professional to your care team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="provider-name">Name *</Label>
                    <Input
                      id="provider-name"
                      value={newProvider.name}
                      onChange={(e) =>
                        setNewProvider((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Dr. Jane Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      value={newProvider.specialization}
                      onChange={(e) =>
                        setNewProvider((prev) => ({
                          ...prev,
                          specialization: e.target.value,
                        }))
                      }
                      placeholder="Cardiologist, Primary Care, etc."
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="provider-email">Email *</Label>
                    <Input
                      id="provider-email"
                      type="email"
                      value={newProvider.email}
                      onChange={(e) =>
                        setNewProvider((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="doctor@clinic.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider-phone">Phone</Label>
                    <Input
                      id="provider-phone"
                      value={newProvider.phone}
                      onChange={(e) =>
                        setNewProvider((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic">Clinic/Hospital</Label>
                  <Input
                    id="clinic"
                    value={newProvider.clinic}
                    onChange={(e) =>
                      setNewProvider((prev) => ({
                        ...prev,
                        clinic: e.target.value,
                      }))
                    }
                    placeholder="General Hospital, Private Practice, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access-level">Access Level</Label>
                  <Select
                    value={newProvider.accessLevel}
                    onValueChange={(
                      value: 'full' | 'limited' | 'emergency-only'
                    ) =>
                      setNewProvider((prev) => ({
                        name: prev.name,
                        specialization: prev.specialization,
                        email: prev.email,
                        phone: prev.phone,
                        clinic: prev.clinic,
                        accessLevel: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">
                        Full Access - All health data
                      </SelectItem>
                      <SelectItem value="limited">
                        Limited Access - Basic metrics only
                      </SelectItem>
                      <SelectItem value="emergency-only">
                        Emergency Only - Critical alerts only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={addProvider} className="flex-1">
                    Send Invitation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingProvider(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Providers List */}
          <div className="grid gap-4">
            {(providers ?? []).map((provider) => (
              <Card key={provider.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                          <Heart className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{provider.name}</h4>
                          <p className="text-muted-foreground text-sm">
                            {provider.specialization}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {provider.email}
                          </span>
                          {provider.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {provider.phone}
                            </span>
                          )}
                        </div>

                        {provider.clinic && (
                          <p className="text-muted-foreground text-sm">
                            {provider.clinic}
                          </p>
                        )}

                        <div className="mt-3 flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={getAccessLevelColor(
                              provider.accessLevel
                            )}
                          >
                            {provider.accessLevel.replace('-', ' ')}
                          </Badge>
                          <Badge
                            variant={
                              provider.verificationStatus === 'verified'
                                ? 'default'
                                : 'outline'
                            }
                            className={(() => {
                              if (provider.verificationStatus === 'verified')
                                return 'bg-green-100 text-green-800';
                              if (provider.verificationStatus === 'pending')
                                return 'bg-yellow-100 text-yellow-800';
                              return 'bg-gray-100 text-gray-800';
                            })()}
                          >
                            {provider.verificationStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Medical Notes Tab */}
      {selectedTab === 'notes' && (
        <div className="space-y-6">
          {/* Add Note Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Medical Notes & Assessments</h3>
            <Button onClick={() => setIsAddingNote(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          </div>

          {/* Add Note Form */}
          {isAddingNote && (
            <Card>
              <CardHeader>
                <CardTitle>Add Medical Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="note-type">Type</Label>
                    <Select
                      value={newNote.type}
                      onValueChange={(
                        value:
                          | 'assessment'
                          | 'recommendation'
                          | 'concern'
                          | 'followup'
                      ) =>
                        setNewNote((prev) => ({
                          type: value,
                          title: prev.title,
                          content: prev.content,
                          priority: prev.priority,
                          actionRequired: prev.actionRequired,
                          patientVisible: prev.patientVisible,
                          followupDate: prev.followupDate,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assessment">
                          Clinical Assessment
                        </SelectItem>
                        <SelectItem value="recommendation">
                          Treatment Recommendation
                        </SelectItem>
                        <SelectItem value="concern">Health Concern</SelectItem>
                        <SelectItem value="followup">
                          Follow-up Required
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note-priority">Priority</Label>
                    <Select
                      value={newNote.priority}
                      onValueChange={(
                        value: 'low' | 'medium' | 'high' | 'urgent'
                      ) =>
                        setNewNote((prev) => ({
                          type: prev.type,
                          title: prev.title,
                          content: prev.content,
                          priority: value,
                          actionRequired: prev.actionRequired,
                          patientVisible: prev.patientVisible,
                          followupDate: prev.followupDate,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note-title">Title</Label>
                  <Input
                    id="note-title"
                    value={newNote.title}
                    onChange={(e) =>
                      setNewNote((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Brief description of the note"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note-content">Content</Label>
                  <Textarea
                    id="note-content"
                    value={newNote.content}
                    onChange={(e) =>
                      setNewNote((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="Detailed medical note or assessment"
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="action-required"
                        checked={newNote.actionRequired}
                        onCheckedChange={(checked) =>
                          setNewNote((prev) => ({
                            ...prev,
                            actionRequired: checked,
                          }))
                        }
                      />
                      <Label htmlFor="action-required">Action Required</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="patient-visible"
                        checked={newNote.patientVisible}
                        onCheckedChange={(checked) =>
                          setNewNote((prev) => ({
                            ...prev,
                            patientVisible: checked,
                          }))
                        }
                      />
                      <Label htmlFor="patient-visible">
                        Visible to Patient
                      </Label>
                    </div>
                  </div>

                  {newNote.actionRequired && (
                    <div className="space-y-2">
                      <Label htmlFor="followup-date">Follow-up Date</Label>
                      <Input
                        id="followup-date"
                        type="date"
                        value={newNote.followupDate}
                        onChange={(e) =>
                          setNewNote((prev) => ({
                            ...prev,
                            followupDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={addMedicalNote} className="flex-1">
                    Add Note
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingNote(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes List */}
          <div className="space-y-4">
            {(medicalNotes ?? []).map((note) => (
              <Card
                key={note.id}
                className={note.actionRequired ? 'border-orange-200' : ''}
              >
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${(() => {
                          if (note.priority === 'urgent') return 'bg-red-500';
                          if (note.priority === 'high') return 'bg-orange-500';
                          if (note.priority === 'medium')
                            return 'bg-yellow-500';
                          return 'bg-green-500';
                        })()}`}
                      />
                      <div>
                        <h4 className="font-medium">{note.title}</h4>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <span>
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="capitalize">
                            {note.type.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={getPriorityColor(note.priority)}
                      >
                        {note.priority}
                      </Badge>
                      {note.actionRequired && (
                        <Badge variant="destructive">Action Required</Badge>
                      )}
                    </div>
                  </div>

                  <p className="mb-3 text-sm">{note.content}</p>

                  {note.followupDate && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      Follow-up:{' '}
                      {new Date(note.followupDate).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Care Tasks Tab */}
      {selectedTab === 'tasks' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Care Task Management</CardTitle>
              <CardDescription>
                Track medication, exercise, and monitoring tasks assigned by
                your care team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 text-center md:grid-cols-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {
                      (careTasks ?? []).filter((t) => t.status === 'pending')
                        .length
                    }
                  </div>
                  <div className="text-muted-foreground text-sm">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {
                      (careTasks ?? []).filter(
                        (t) => t.status === 'in-progress'
                      ).length
                    }
                  </div>
                  <div className="text-muted-foreground text-sm">
                    In Progress
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {
                      (careTasks ?? []).filter((t) => t.status === 'completed')
                        .length
                    }
                  </div>
                  <div className="text-muted-foreground text-sm">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {
                      (careTasks ?? []).filter((t) => t.status === 'overdue')
                        .length
                    }
                  </div>
                  <div className="text-muted-foreground text-sm">Overdue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline Tab */}
      {selectedTab === 'timeline' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Healthcare Timeline</CardTitle>
              <CardDescription>
                Chronological view of your healthcare interactions and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground py-8 text-center">
                <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Healthcare timeline feature coming soon</p>
                <p className="text-sm">
                  Track appointments, treatments, and progress over time
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
