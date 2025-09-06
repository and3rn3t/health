import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ProcessedHealthData } from '@/types';
import { useKV } from '@github/spark/hooks';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Eye,
  FileText,
  Lock,
  Mail,
  Send,
  Share,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CommunityMember {
  id: string;
  name: string;
  email: string;
  relationship: 'family' | 'healthcare' | 'caregiver' | 'friend';
  permissions: {
    viewHealthScore: boolean;
    viewFallRisk: boolean;
    viewDailyActivity: boolean;
    viewTrends: boolean;
    receiveAlerts: boolean;
  };
  avatar?: string;
  lastViewed?: Date;
  joinedDate: Date;
}

interface HealthReport {
  id: string;
  type: 'weekly' | 'monthly' | 'emergency' | 'custom';
  title: string;
  summary: string;
  metrics: {
    healthScore: number;
    fallRiskLevel: 'low' | 'moderate' | 'high';
    activeMinutes: number;
    stepCount: number;
    sleepQuality: number;
  };
  insights: string[];
  concerns: string[];
  improvements: string[];
  createdAt: Date;
  sharedWith: string[];
  viewCount: number;
}

interface CommunityShareProps {
  healthData: ProcessedHealthData;
}

export default function CommunityShare({
  healthData,
}: Readonly<CommunityShareProps>) {
  // Optional Spark integration guard
  type SparkLike = {
    llmPrompt: (strings: TemplateStringsArray, ...expr: unknown[]) => string;
    llm: (prompt: string, model?: string, asJson?: boolean) => Promise<string>;
  };
  const spark = (globalThis as unknown as { spark?: SparkLike }).spark;

  const [communityMembers, setCommunityMembers] = useKV<CommunityMember[]>(
    'community-members',
    []
  );
  const [healthReports, setHealthReports] = useKV<HealthReport[]>(
    'health-reports',
    []
  );
  interface ShareSettings {
    autoShareWeekly: boolean;
    emergencyAutoShare: boolean;
    publicProfile: boolean;
  }
  const DEFAULT_SHARE_SETTINGS: ShareSettings = {
    autoShareWeekly: false,
    emergencyAutoShare: true,
    publicProfile: false,
  };
  const [shareSettings, setShareSettings] = useKV<ShareSettings>(
    'share-settings',
    DEFAULT_SHARE_SETTINGS
  );

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    'members' | 'reports' | 'settings'
  >('members');

  type NewMember = Pick<
    CommunityMember,
    'name' | 'email' | 'relationship' | 'permissions'
  >;
  const [newMember, setNewMember] = useState<NewMember>({
    name: '',
    email: '',
    relationship: 'family' as const,
    permissions: {
      viewHealthScore: true,
      viewFallRisk: true,
      viewDailyActivity: true,
      viewTrends: true,
      receiveAlerts: false,
    },
  });

  // Safe fallbacks for possibly undefined KV values
  const safeMembers = communityMembers ?? [];
  const safeReports = healthReports ?? [];
  const safeShareSettings = shareSettings ?? DEFAULT_SHARE_SETTINGS;

  const addCommunityMember = () => {
    if (!newMember.name || !newMember.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const member: CommunityMember = {
      id: Date.now().toString(),
      ...newMember,
      joinedDate: new Date(),
    };

    setCommunityMembers((current = []) => [...current, member]);
    setNewMember({
      name: '',
      email: '',
      relationship: 'family',
      permissions: {
        viewHealthScore: true,
        viewFallRisk: true,
        viewDailyActivity: true,
        viewTrends: true,
        receiveAlerts: false,
      },
    });
    setIsAddingMember(false);
    toast.success(`${member.name} added to your health community`);
  };

  const generateHealthReport = async () => {
    const prompt = (spark?.llmPrompt ||
      ((s: TemplateStringsArray) => s.join('')))`
      Generate a comprehensive health report based on this data:
      Health Score: ${healthData.healthScore || 0}/100
      Fall Risk Factors: ${JSON.stringify(healthData.fallRiskFactors || [])}
      Recent Insights: ${JSON.stringify(healthData.insights || [])}

      Create a report with:
      1. A brief summary (2-3 sentences)
      2. 3-5 key insights about health trends
      3. Any areas of concern
      4. Positive improvements or achievements

      Format as JSON with summary, insights[], concerns[], improvements[] fields.
    `;

    try {
      const response = spark?.llm
        ? await spark.llm(prompt, 'gpt-4o', true)
        : '{}';
      const reportData = JSON.parse(response || '{}') as Partial<{
        summary: string;
        insights: string[];
        concerns: string[];
        improvements: string[];
      }>;

      const hasHighRisk = !!healthData.fallRiskFactors?.some(
        (f) => f.risk === 'high'
      );
      const hasModerateRisk = !!healthData.fallRiskFactors?.some(
        (f) => f.risk === 'moderate'
      );
      let computedRiskLevel: HealthReport['metrics']['fallRiskLevel'];
      if (hasHighRisk) {
        computedRiskLevel = 'high';
      } else if (hasModerateRisk) {
        computedRiskLevel = 'moderate';
      } else {
        computedRiskLevel = 'low';
      }

      const report: HealthReport = {
        id: Date.now().toString(),
        type: 'custom',
        title: `Health Report - ${new Date().toLocaleDateString()}`,
        summary: String(reportData.summary || 'Summary not available.'),
        metrics: {
          healthScore: healthData.healthScore || 0,
          fallRiskLevel: computedRiskLevel,
          // Approximate active minutes from steps (simple heuristic)
          activeMinutes: Math.max(
            0,
            Math.round((healthData.metrics?.steps?.average || 0) / 100)
          ),
          stepCount: Math.max(
            0,
            Math.round(healthData.metrics?.steps?.average || 0)
          ),
          // Derive sleep quality as percentage of 8 hours target
          sleepQuality: Math.max(
            0,
            Math.min(
              100,
              Math.round(
                ((healthData.metrics?.sleepHours?.average || 0) / 8) * 100
              )
            )
          ),
        },
        insights: Array.isArray(reportData.insights) ? reportData.insights : [],
        concerns: Array.isArray(reportData.concerns) ? reportData.concerns : [],
        improvements: Array.isArray(reportData.improvements)
          ? reportData.improvements
          : [],
        createdAt: new Date(),
        sharedWith: [],
        viewCount: 0,
      };

      setHealthReports((current = []) => [report, ...(current || [])]);
      toast.success('Health report generated successfully');
    } catch (_err) {
      console.error('Failed to generate health report', _err);
      toast.error('Failed to generate health report');
    }
  };

  const shareReport = (reportId: string, memberIds: string[]) => {
    setHealthReports((current = []) =>
      (current || []).map((report) =>
        report.id === reportId
          ? {
              ...report,
              sharedWith: [...new Set([...report.sharedWith, ...memberIds])],
            }
          : report
      )
    );
    toast.success('Report shared successfully');
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'healthcare':
        return 'bg-blue-100 text-blue-800';
      case 'family':
        return 'bg-green-100 text-green-800';
      case 'caregiver':
        return 'bg-purple-100 text-purple-800';
      case 'friend':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (level: HealthReport['metrics']['fallRiskLevel']) => {
    switch (level) {
      case 'high':
        return 'text-destructive';
      case 'moderate':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Community & Sharing
          </h2>
          <p className="text-muted-foreground">
            Share your health progress with family and healthcare providers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary border-primary">
            {safeMembers.length} Members
          </Badge>
          <Badge variant="outline" className="text-secondary border-secondary">
            {safeReports.length} Reports
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-muted flex space-x-1 rounded-lg p-1">
        {(
          [
            { id: 'members', label: 'Community Members', icon: Users },
            { id: 'reports', label: 'Health Reports', icon: FileText },
            { id: 'settings', label: 'Privacy Settings', icon: Lock },
          ] as const
        ).map((tab) => {
          const IconComponent = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab(tab.id)}
              className="flex-1 justify-center"
            >
              <IconComponent className="mr-2 h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Community Members Tab */}
      {selectedTab === 'members' && (
        <div className="space-y-6">
          {/* Add Member Form */}
          {isAddingMember && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add Community Member
                </CardTitle>
                <CardDescription>
                  Invite family members, healthcare providers, or caregivers to
                  view your health progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="member-name">Name</Label>
                    <Input
                      id="member-name"
                      value={newMember.name}
                      onChange={(e) =>
                        setNewMember((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-email">Email</Label>
                    <Input
                      id="member-email"
                      type="email"
                      value={newMember.email}
                      onChange={(e) =>
                        setNewMember((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Select
                    value={newMember.relationship}
                    onValueChange={(value) =>
                      setNewMember((prev) => ({
                        ...prev,
                        relationship: value as CommunityMember['relationship'],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Family Member</SelectItem>
                      <SelectItem value="healthcare">
                        Healthcare Provider
                      </SelectItem>
                      <SelectItem value="caregiver">Caregiver</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(newMember.permissions).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <Label htmlFor={key} className="text-sm capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </Label>
                          <Switch
                            id={key}
                            checked={value}
                            onCheckedChange={(checked) =>
                              setNewMember((prev) => ({
                                ...prev,
                                permissions: {
                                  ...prev.permissions,
                                  [key]: checked,
                                },
                              }))
                            }
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={addCommunityMember} className="flex-1">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingMember(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members List */}
          <div className="grid gap-4">
            {/* Add Member Button */}
            {!isAddingMember && (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center p-6">
                  <Button
                    variant="ghost"
                    onClick={() => setIsAddingMember(true)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-5 w-5" />
                    Add Community Member
                  </Button>
                </CardContent>
              </Card>
            )}

            {safeMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-muted-foreground text-sm">
                          {member.email}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={getRelationshipColor(
                              member.relationship
                            )}
                          >
                            {member.relationship}
                          </Badge>
                          {member.lastViewed && (
                            <span className="text-muted-foreground text-xs">
                              Last viewed{' '}
                              {new Date(member.lastViewed).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <h5 className="mb-2 text-sm font-medium">
                      Access Permissions
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(member.permissions)
                        .filter(([_, allowed]) => allowed)
                        .map(([permission]) => (
                          <Badge
                            key={permission}
                            variant="outline"
                            className="text-xs"
                          >
                            {permission
                              .replace(/([A-Z])/g, ' $1')
                              .toLowerCase()}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Health Reports Tab */}
      {selectedTab === 'reports' && (
        <div className="space-y-6">
          {/* Generate Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Health Report
              </CardTitle>
              <CardDescription>
                Create a comprehensive report to share with your community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={generateHealthReport} className="w-full">
                <TrendingUp className="mr-2 h-4 w-4" />
                Generate New Report
              </Button>
            </CardContent>
          </Card>

          {/* Reports List */}
          <div className="space-y-4">
            {safeReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {report.summary}
                      </CardDescription>
                      <div className="text-muted-foreground mt-2 flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {report.viewCount} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Share className="h-4 w-4" />
                          Shared with {report.sharedWith.length}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={getRiskColor(report.metrics.fallRiskLevel)}
                    >
                      {report.metrics.fallRiskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-primary text-2xl font-bold">
                        {report.metrics.healthScore}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Health Score
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {report.metrics.stepCount.toLocaleString()}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Daily Steps
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {report.metrics.activeMinutes}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Active Minutes
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {report.metrics.sleepQuality}%
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Sleep Quality
                      </div>
                    </div>
                  </div>

                  {/* Insights */}
                  {report.insights.length > 0 && (
                    <div>
                      <h5 className="mb-2 flex items-center gap-2 font-medium text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        Key Insights
                      </h5>
                      <ul className="space-y-1 text-sm">
                        {report.insights.map((insight) => (
                          <li
                            key={`${report.id}-insight-${insight.slice(0, 24)}`}
                            className="flex items-start gap-2"
                          >
                            <span className="mt-0.5 text-green-600">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Concerns */}
                  {report.concerns.length > 0 && (
                    <div>
                      <h5 className="mb-2 flex items-center gap-2 font-medium text-yellow-700">
                        <AlertCircle className="h-4 w-4" />
                        Areas of Concern
                      </h5>
                      <ul className="space-y-1 text-sm">
                        {report.concerns.map((concern) => (
                          <li
                            key={`${report.id}-concern-${concern.slice(0, 24)}`}
                            className="flex items-start gap-2"
                          >
                            <span className="mt-0.5 text-yellow-600">•</span>
                            {concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Share Actions */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-2">
                      {report.sharedWith.length > 0 && (
                        <div className="flex -space-x-2">
                          {report.sharedWith.slice(0, 3).map((memberId) => {
                            const member = safeMembers.find(
                              (m) => m.id === memberId
                            );
                            return member ? (
                              <Avatar
                                key={memberId}
                                className="h-6 w-6 border-2 border-background"
                              >
                                <AvatarFallback className="text-xs">
                                  {member.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </AvatarFallback>
                              </Avatar>
                            ) : null;
                          })}
                          {report.sharedWith.length > 3 && (
                            <div className="bg-muted flex h-6 w-6 items-center justify-center rounded-full border-2 border-background">
                              <span className="text-xs">
                                +{report.sharedWith.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Simple share to all members for demo
                        const allMemberIds = safeMembers.map((m) => m.id);
                        shareReport(report.id, allMemberIds);
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Share Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Settings Tab */}
      {selectedTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacy & Sharing Settings
              </CardTitle>
              <CardDescription>
                Control how your health data is shared and who can access it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto-sharing Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Automatic Sharing</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-weekly">Weekly Health Reports</Label>
                      <p className="text-muted-foreground text-sm">
                        Automatically generate and share weekly summaries
                      </p>
                    </div>
                    <Switch
                      id="auto-weekly"
                      checked={safeShareSettings.autoShareWeekly}
                      onCheckedChange={(checked) =>
                        setShareSettings((prev) => {
                          const base = prev ?? DEFAULT_SHARE_SETTINGS;
                          return { ...base, autoShareWeekly: checked };
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emergency-share">
                        Emergency Fall Alerts
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        Immediately notify community members of fall incidents
                      </p>
                    </div>
                    <Switch
                      id="emergency-share"
                      checked={safeShareSettings.emergencyAutoShare}
                      onCheckedChange={(checked) =>
                        setShareSettings((prev) => {
                          const base = prev ?? DEFAULT_SHARE_SETTINGS;
                          return { ...base, emergencyAutoShare: checked };
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Visibility Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Profile Visibility</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="public-profile">
                        Public Health Profile
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        Allow others to discover your health journey
                        (anonymized)
                      </p>
                    </div>
                    <Switch
                      id="public-profile"
                      checked={safeShareSettings.publicProfile}
                      onCheckedChange={(checked) =>
                        setShareSettings((prev) => {
                          const base = prev ?? DEFAULT_SHARE_SETTINGS;
                          return { ...base, publicProfile: checked };
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Data Export */}
              <div className="space-y-4">
                <h4 className="font-medium">Data Management</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button variant="outline" className="justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Export Health Data
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Share className="mr-2 h-4 w-4" />
                    Generate Sharing Link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Community Insights</CardTitle>
              <CardDescription>
                Your health sharing activity overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-primary text-2xl font-bold">
                    {safeMembers.length}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Community Members
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {safeReports.length}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Reports Shared
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {safeReports.reduce(
                      (sum, report) => sum + report.viewCount,
                      0
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Total Views
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
