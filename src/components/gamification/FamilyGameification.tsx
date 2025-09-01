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
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Target,
  Crown,
  Medal,
  Flame,
  Star,
  TrendingUp,
  Calendar,
  Users,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface FamilyMember {
  id: string;
  name: string;
  avatar?: string;
  relationship: string;
  joinDate: string;
  isActive: boolean;
}

interface FamilyActivity {
  id: string;
  memberId: string;
  memberName: string;
  type:
    | 'challenge_completed'
    | 'goal_achieved'
    | 'streak_milestone'
    | 'level_up';
  description: string;
  points: number;
  timestamp: string;
  icon: string;
}

interface FamilyGoal {
  id: string;
  title: string;
  description: string;
  type: 'collective' | 'individual_avg';
  target: number;
  current: number;
  unit: string;
  endDate: string;
  participants: string[];
  reward: string;
}

export default function FamilyGameification() {
  const [familyMembers, setFamilyMembers] = useKV<FamilyMember[]>(
    'family-members',
    []
  );
  const [familyActivities, setFamilyActivities] = useKV<FamilyActivity[]>(
    'family-activities',
    []
  );
  const [familyGoals, setFamilyGoals] = useKV<FamilyGoal[]>('family-goals', []);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Sample data
  const sampleMembers: FamilyMember[] = [
    {
      id: 'user1',
      name: 'You',
      relationship: 'Self',
      joinDate: '2024-01-01',
      isActive: true,
    },
    {
      id: 'user2',
      name: 'Sarah (Mom)',
      relationship: 'Mother',
      joinDate: '2024-01-02',
      isActive: true,
    },
    {
      id: 'user3',
      name: 'David (Dad)',
      relationship: 'Father',
      joinDate: '2024-01-02',
      isActive: true,
    },
    {
      id: 'user4',
      name: 'Emma (Sister)',
      relationship: 'Sister',
      joinDate: '2024-01-05',
      isActive: false,
    },
  ];

  const sampleActivities: FamilyActivity[] = [
    {
      id: '1',
      memberId: 'user2',
      memberName: 'Sarah (Mom)',
      type: 'challenge_completed',
      description: 'Completed "10K Steps Daily" challenge',
      points: 500,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      icon: '🏃‍♀️',
    },
    {
      id: '2',
      memberId: 'user3',
      memberName: 'David (Dad)',
      type: 'streak_milestone',
      description: 'Reached 7-day activity streak',
      points: 350,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      icon: '🔥',
    },
    {
      id: '3',
      memberId: 'user1',
      memberName: 'You',
      type: 'level_up',
      description: 'Leveled up to Level 4',
      points: 200,
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      icon: '⭐',
    },
  ];

  const sampleGoals: FamilyGoal[] = [
    {
      id: '1',
      title: 'Family Fitness February',
      description: 'Collectively walk 1 million steps this month',
      type: 'collective',
      target: 1000000,
      current: 750000,
      unit: 'steps',
      endDate: '2024-02-29',
      participants: ['user1', 'user2', 'user3'],
      reward: 'Family movie night + 1000 bonus points each',
    },
    {
      id: '2',
      title: 'Sleep Champions',
      description: 'Everyone averages 8+ hours of sleep',
      type: 'individual_avg',
      target: 8,
      current: 7.5,
      unit: 'hours/night',
      endDate: '2024-02-15',
      participants: ['user1', 'user2', 'user3'],
      reward: 'Family breakfast out + Sleep Champion badges',
    },
  ];

  const currentMembers =
    familyMembers.length > 0 ? familyMembers : sampleMembers;
  const currentActivities =
    familyActivities.length > 0 ? familyActivities : sampleActivities;
  const currentGoals = familyGoals.length > 0 ? familyGoals : sampleGoals;

  const getFamilyStats = () => {
    return {
      totalMembers: currentMembers.length,
      activeMembers: currentMembers.filter((m) => m.isActive).length,
      totalPoints: 12450, // Would calculate from actual data
      activeGoals: currentGoals.filter((g) => new Date(g.endDate) > new Date())
        .length,
      completedChallenges: 23, // Would calculate from actual data
    };
  };

  const stats = getFamilyStats();

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const inviteMember = () => {
    toast.info('Invitation feature coming soon!');
  };

  return (
    <div className="space-y-6">
      {/* Family Overview Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="text-primary h-6 w-6" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-muted-foreground text-sm">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Flame className="text-destructive h-6 w-6" />
              <div>
                <p className="text-2xl font-bold">{stats.activeMembers}</p>
                <p className="text-muted-foreground text-sm">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Trophy className="text-accent h-6 w-6" />
              <div>
                <p className="text-2xl font-bold">
                  {stats.totalPoints.toLocaleString()}
                </p>
                <p className="text-muted-foreground text-sm">Total Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Target className="text-primary h-6 w-6" />
              <div>
                <p className="text-2xl font-bold">{stats.activeGoals}</p>
                <p className="text-muted-foreground text-sm">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Medal className="text-secondary-foreground h-6 w-6" />
              <div>
                <p className="text-2xl font-bold">
                  {stats.completedChallenges}
                </p>
                <p className="text-muted-foreground text-sm">Challenges</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Family Members</TabsTrigger>
          <TabsTrigger value="goals">Family Goals</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Family Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  This Week's Leaders
                </CardTitle>
                <CardDescription>
                  Family member rankings for this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentMembers.slice(0, 3).map((member, index) => (
                    <div
                      key={member.id}
                      className="bg-muted/50 flex items-center gap-3 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        {index === 1 && (
                          <Medal className="h-4 w-4 text-gray-400" />
                        )}
                        {index === 2 && (
                          <Medal className="h-4 w-4 text-orange-500" />
                        )}

                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {member.relationship}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold">
                          {Math.floor(Math.random() * 1000 + 500)} pts
                        </p>
                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                          <TrendingUp className="h-3 w-3" />+
                          {Math.floor(Math.random() * 50 + 10)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Family Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Active Family Goals
                </CardTitle>
                <CardDescription>
                  Collaborative challenges for the whole family
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentGoals.slice(0, 2).map((goal) => (
                    <div key={goal.id} className="space-y-3">
                      <div>
                        <h4 className="font-medium">{goal.title}</h4>
                        <p className="text-muted-foreground text-sm">
                          {goal.description}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            {goal.current.toLocaleString()} {goal.unit}
                          </span>
                          <span>
                            {goal.target.toLocaleString()} {goal.unit}
                          </span>
                        </div>
                        <Progress value={(goal.current / goal.target) * 100} />
                        <div className="text-muted-foreground flex justify-between text-xs">
                          <span>
                            {Math.round((goal.current / goal.target) * 100)}%
                            complete
                          </span>
                          <span>
                            Ends {new Date(goal.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <Badge variant="outline">{goal.reward}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Family Members</h2>
              <p className="text-muted-foreground">
                Manage your family health monitoring group
              </p>
            </div>
            <Button onClick={inviteMember}>
              <Users className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="space-y-3 text-center">
                    <Avatar className="mx-auto h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h3 className="font-bold">{member.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {member.relationship}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <Badge
                        variant={member.isActive ? 'default' : 'secondary'}
                      >
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Points this week:</span>
                        <span className="font-medium">
                          {Math.floor(Math.random() * 500 + 200)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current streak:</span>
                        <span className="font-medium">
                          {Math.floor(Math.random() * 10 + 1)} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Joined:</span>
                        <span className="font-medium">
                          {new Date(member.joinDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Family Goals</h2>
              <p className="text-muted-foreground">
                Collaborative health challenges for the entire family
              </p>
            </div>
            <Button>
              <Target className="mr-2 h-4 w-4" />
              Create Family Goal
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {currentGoals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="text-primary h-5 w-5" />
                    {goal.title}
                  </CardTitle>
                  <CardDescription>{goal.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">
                        {goal.current.toLocaleString()} /{' '}
                        {goal.target.toLocaleString()} {goal.unit}
                      </span>
                    </div>
                    <Progress value={(goal.current / goal.target) * 100} />
                    <p className="text-muted-foreground text-xs">
                      {Math.round((goal.current / goal.target) * 100)}% complete
                      • Ends {new Date(goal.endDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium">Participants</h4>
                    <div className="flex flex-wrap gap-2">
                      {goal.participants.map((participantId) => {
                        const member = currentMembers.find(
                          (m) => m.id === participantId
                        );
                        return member ? (
                          <Badge key={participantId} variant="outline">
                            {member.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Trophy className="text-accent h-4 w-4" />
                      <span className="text-sm font-medium">Reward</span>
                    </div>
                    <p className="text-sm">{goal.reward}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Family Activity Feed</h2>
            <p className="text-muted-foreground">
              Recent achievements and milestones from your family
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {currentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-muted/30 flex items-start gap-4 rounded-lg p-4"
                  >
                    <div className="text-2xl">{activity.icon}</div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {activity.memberName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          +{activity.points} pts
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {activity.description}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">
                        {getTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
