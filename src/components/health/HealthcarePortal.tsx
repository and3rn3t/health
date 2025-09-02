import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Heart,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Shield,
  Phone,
  Mail,
  Plus,
  Edit,
  Archive,
  Flag,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProcessedHealthData } from '@/lib/healthDataProcessor';

interface HealthcareProvider {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  clinic: string;
  accessLevel: 'full' | 'limited' | 'emergency-only';
  verificationStatus: 'verified' | 'pending' | 'unverified';
  lastAccess?: Date;
  joinedDate: Date;
}

interface MedicalNote {
  id: string;
  providerId: string;
  type: 'assessment' | 'recommendation' | 'concern' | 'followup';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
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
}: HealthcarePortalProps) {
  const [providers, setProviders] = useKV<HealthcareProvider[]>(
    'healthcare-providers',
    []
  );
  const [medicalNotes, setMedicalNotes] = useKV<MedicalNote[]>(
    'medical-notes',
    []
  );
  const [careTasks, setCareTasks] = useKV<CareTask[]>('care-tasks', []);

  const [selectedTab, setSelectedTab] = useState<
    'providers' | 'notes' | 'tasks' | 'timeline'
  >('providers');
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const [newProvider, setNewProvider] = useState({
    name: '',
    specialization: '',
    email: '',
    phone: '',
    clinic: '',
    accessLevel: 'limited' as const,
  });

  const [newNote, setNewNote] = useState({
    type: 'assessment' as const,
    title: '',
    content: '',
    priority: 'medium' as const,
    actionRequired: false,
    patientVisible: true,
    followupDate: '',
  });

  // Generate AI-powered medical insights
  const generateMedicalInsights = async () => {
    const prompt = spark.llmPrompt`
      As a healthcare AI assistant, analyze this patient's health data and generate clinical insights:
      
      Health Score: ${healthData.healthScore || 0}/100
      Fall Risk Factors: ${JSON.stringify(healthData.fallRiskFactors || [])}
      Activity Data: ${JSON.stringify(healthData.recentActivities || [])}
      
      Provide:
      1. Clinical assessment summary
      2. Risk factors that need medical attention
      3. Recommended interventions or follow-ups
      4. Monitoring priorities
      
      Format as JSON with assessment, riskFactors[], recommendations[], priorities[] fields.
    `;

    try {
      const response = await spark.llm(prompt, 'gpt-4o', true);
      const insights = JSON.parse(response);

      const note: MedicalNote = {
        id: Date.now().toString(),
        providerId: 'ai-assistant',
        type: 'assessment',
        title: 'AI Clinical Assessment',
        content: insights.assessment,
        priority: insights.riskFactors?.length > 2 ? 'high' : 'medium',
        actionRequired: insights.recommendations?.length > 0,
        patientVisible: true,
        createdAt: new Date(),
      };

      setMedicalNotes((current) => [note, ...current]);
      toast.success('Medical insights generated successfully');
    } catch (error) {
      toast.error('Failed to generate medical insights');
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

    setProviders((current) => [...current, provider]);
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

    setMedicalNotes((current) => [note, ...current]);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
  const urgentNotesCount = medicalNotes.filter(
    (note) => note.priority === 'urgent' || note.actionRequired
  ).length;
  const overdueTasks = careTasks.filter(
    (task) => task.status === 'overdue'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header with Alert Summary */}
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-foreground text-2xl font-bold">
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
              onClick={() => setSelectedTab(tab.id as any)}
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
                    onValueChange={(value) =>
                      setNewProvider((prev) => ({
                        ...prev,
                        accessLevel: value as any,
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
            {providers.map((provider) => (
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
                            className={
                              provider.verificationStatus === 'verified'
                                ? 'bg-green-100 text-green-800'
                                : provider.verificationStatus === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                            }
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
                      onValueChange={(value) =>
                        setNewNote((prev) => ({ ...prev, type: value as any }))
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
                      onValueChange={(value) =>
                        setNewNote((prev) => ({
                          ...prev,
                          priority: value as any,
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
            {medicalNotes.map((note) => (
              <Card
                key={note.id}
                className={note.actionRequired ? 'border-orange-200' : ''}
              >
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          note.priority === 'urgent'
                            ? 'bg-red-500'
                            : note.priority === 'high'
                              ? 'bg-orange-500'
                              : note.priority === 'medium'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                        }`}
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
                    {careTasks.filter((t) => t.status === 'pending').length}
                  </div>
                  <div className="text-muted-foreground text-sm">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {careTasks.filter((t) => t.status === 'in-progress').length}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    In Progress
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {careTasks.filter((t) => t.status === 'completed').length}
                  </div>
                  <div className="text-muted-foreground text-sm">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {careTasks.filter((t) => t.status === 'overdue').length}
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
