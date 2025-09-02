import { useState } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Heart,
  Shield,
  Activity,
  Phone,
  MessageCircle,
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  Users,
  Zap,
  MapPin,
  Bell,
} from 'lucide-react';
import { ProcessedHealthData } from '@/lib/healthDataProcessor';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  avatar?: string;
  lastSeen: Date;
  permissions: string[];
  notificationPreferences: {
    emergencyAlerts: boolean;
    weeklyReports: boolean;
    milestones: boolean;
  };
}

interface ProgressShare {
  id: string;
  type: 'milestone' | 'improvement' | 'concern' | 'achievement';
  title: string;
  description: string;
  value?: number;
  previousValue?: number;
  unit?: string;
  date: Date;
  celebrateWith: string[];
  reactions: { memberId: string; reaction: string }[];
}

interface FamilyDashboardProps {
  healthData: ProcessedHealthData;
}

export default function FamilyDashboard({ healthData }: FamilyDashboardProps) {
  const [familyMembers, setFamilyMembers] = useKV<FamilyMember[]>(
    'family-members',
    [
      {
        id: '1',
        name: 'Sarah Johnson',
        relationship: 'Daughter',
        lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        permissions: ['view-health', 'receive-alerts'],
        notificationPreferences: {
          emergencyAlerts: true,
          weeklyReports: true,
          milestones: true,
        },
      },
      {
        id: '2',
        name: 'Michael Johnson',
        relationship: 'Son',
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        permissions: ['view-health', 'receive-alerts'],
        notificationPreferences: {
          emergencyAlerts: true,
          weeklyReports: false,
          milestones: true,
        },
      },
    ]
  );

  const [progressShares, setProgressShares] = useKV<ProgressShare[]>(
    'progress-shares',
    [
      {
        id: '1',
        type: 'achievement',
        title: 'Daily Step Goal Achieved!',
        description: 'Completed 10,000 steps for 7 consecutive days',
        value: 10247,
        unit: 'steps',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        celebrateWith: ['1', '2'],
        reactions: [
          { memberId: '1', reaction: '🎉' },
          { memberId: '2', reaction: '👏' },
        ],
      },
      {
        id: '2',
        type: 'improvement',
        title: 'Fall Risk Score Improved',
        description:
          'Your balance and stability metrics have improved this week',
        value: 72,
        previousValue: 65,
        unit: 'score',
        date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        celebrateWith: ['1'],
        reactions: [{ memberId: '1', reaction: '❤️' }],
      },
    ]
  );

  const addReaction = (shareId: string, memberId: string, reaction: string) => {
    setProgressShares((current) =>
      current.map((share) =>
        share.id === shareId
          ? {
              ...share,
              reactions: [
                ...share.reactions.filter((r) => r.memberId !== memberId),
                { memberId, reaction },
              ],
            }
          : share
      )
    );
  };

  const shareProgress = async () => {
    // Generate a new progress share based on current health data
    const newShare: ProgressShare = {
      id: Date.now().toString(),
      type: 'milestone',
      title: 'Weekly Health Summary',
      description: `Health score: ${healthData.healthScore || 0}/100. Keep up the great work!`,
      value: healthData.healthScore || 0,
      unit: 'health score',
      date: new Date(),
      celebrateWith: familyMembers.map((m) => m.id),
      reactions: [],
    };

    setProgressShares((current) => [newShare, ...current]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return CheckCircle;
      case 'improvement':
        return TrendingUp;
      case 'milestone':
        return Star;
      case 'concern':
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'text-green-600';
      case 'improvement':
        return 'text-blue-600';
      case 'milestone':
        return 'text-purple-600';
      case 'concern':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Calculate family engagement metrics
  const activeFamilyMembers = familyMembers.filter(
    (member) =>
      new Date().getTime() - member.lastSeen.getTime() < 1000 * 60 * 60 * 24 // Active in last 24h
  ).length;

  const totalReactions = progressShares.reduce(
    (sum, share) => sum + share.reactions.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-foreground text-2xl font-bold">
            Family Dashboard
          </h2>
          <p className="text-muted-foreground">
            Share your health journey with loved ones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={shareProgress} className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Share Update
          </Button>
        </div>
      </div>

      {/* Family Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-primary text-2xl font-bold">
              {familyMembers.length}
            </div>
            <div className="text-muted-foreground text-sm">Family Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {activeFamilyMembers}
            </div>
            <div className="text-muted-foreground text-sm">Active Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {totalReactions}
            </div>
            <div className="text-muted-foreground text-sm">Total Support</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Health Status - Simplified for Family */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Current Health Status
          </CardTitle>
          <CardDescription>
            A simple overview of your health for your family
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Health</span>
                <span className="text-muted-foreground text-sm">
                  {healthData.healthScore || 0}/100
                </span>
              </div>
              <Progress value={healthData.healthScore || 0} className="h-2" />
              <p className="text-muted-foreground text-xs">
                {(healthData.healthScore || 0) >= 80
                  ? 'Excellent health status! Keep it up!'
                  : (healthData.healthScore || 0) >= 60
                    ? 'Good health with room for improvement'
                    : 'Health needs attention - consider consulting with healthcare providers'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fall Risk</span>
                <Badge
                  variant={
                    healthData.fallRiskFactors?.some((f) => f.risk === 'high')
                      ? 'destructive'
                      : healthData.fallRiskFactors?.some(
                            (f) => f.risk === 'medium'
                          )
                        ? 'default'
                        : 'secondary'
                  }
                >
                  {healthData.fallRiskFactors?.some((f) => f.risk === 'high')
                    ? 'HIGH'
                    : healthData.fallRiskFactors?.some(
                          (f) => f.risk === 'medium'
                        )
                      ? 'MEDIUM'
                      : 'LOW'}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                {healthData.fallRiskFactors?.some((f) => f.risk === 'high')
                  ? 'Higher fall risk detected - extra care recommended'
                  : 'Fall risk is well managed'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Care Circle
          </CardTitle>
          <CardDescription>
            Family members following your health journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
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
                      {member.relationship}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-1 flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        new Date().getTime() - member.lastSeen.getTime() <
                        1000 * 60 * 60
                          ? 'bg-green-500'
                          : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-muted-foreground text-xs">
                      {getRelativeTime(member.lastSeen)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Phone className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress & Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Recent Progress & Achievements
          </CardTitle>
          <CardDescription>
            Share your health milestones with your family
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progressShares.map((share) => {
              const IconComponent = getTypeIcon(share.type);
              return (
                <div key={share.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full bg-gray-100 p-2 ${getTypeColor(share.type)}`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{share.title}</h4>
                        <p className="text-muted-foreground text-sm">
                          {share.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {getRelativeTime(share.date)}
                    </span>
                  </div>

                  {share.value && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-primary text-2xl font-bold">
                          {share.value}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {share.unit}
                        </span>
                        {share.previousValue && (
                          <Badge variant="secondary" className="text-green-600">
                            +{share.value - share.previousValue}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {share.reactions.map((reaction) => (
                        <span key={reaction.memberId} className="text-lg">
                          {reaction.reaction}
                        </span>
                      ))}
                      {share.reactions.length === 0 && (
                        <span className="text-muted-foreground text-sm">
                          No reactions yet
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addReaction(share.id, '1', '❤️')}
                        className="h-8 px-2"
                      >
                        ❤️
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addReaction(share.id, '1', '🎉')}
                        className="h-8 px-2"
                      >
                        🎉
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addReaction(share.id, '1', '👏')}
                        className="h-8 px-2"
                      >
                        👏
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Emergency & Safety */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Emergency & Safety
          </CardTitle>
          <CardDescription>
            Quick access to emergency features for peace of mind
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="flex h-16 flex-col gap-2">
              <Phone className="h-6 w-6 text-red-600" />
              <span className="text-sm">Emergency Call</span>
            </Button>
            <Button variant="outline" className="flex h-16 flex-col gap-2">
              <MessageCircle className="h-6 w-6 text-blue-600" />
              <span className="text-sm">Send Check-in</span>
            </Button>
            <Button variant="outline" className="flex h-16 flex-col gap-2">
              <MapPin className="h-6 w-6 text-green-600" />
              <span className="text-sm">Share Location</span>
            </Button>
            <Button variant="outline" className="flex h-16 flex-col gap-2">
              <Bell className="h-6 w-6 text-purple-600" />
              <span className="text-sm">Test Alert System</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
