import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@/hooks/useCloudflareKV';
import { ProcessedHealthData } from '@/types';
import {
  Calendar,
  Crown,
  Flame,
  Medal,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'steps' | 'activity' | 'sleep' | 'heart_rate' | 'custom';
  target: number;
  unit: string;
  duration: number; // days
  startDate: string;
  endDate: string;
  participants: string[];
  creator: string;
  rewards: {
    points: number;
    badge?: string;
    title?: string;
  };
  status: 'active' | 'completed' | 'upcoming';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;
  target: number;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  points: number;
  level: number;
  streak: number;
  badges: string[];
  weeklyProgress: number;
}

interface Props {
  readonly healthData: ProcessedHealthData;
}

function getAchievementVariant(
  type: Achievement['type']
): 'outline' | 'secondary' | 'default' | 'destructive' {
  switch (type) {
    case 'bronze':
      return 'outline';
    case 'silver':
      return 'secondary';
    case 'gold':
      return 'default';
    case 'platinum':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default function HealthGameCenter({ healthData: _healthData }: Props) {
  const [activeChallenges, setActiveChallenges] = useKV<Challenge[]>(
    'active-challenges',
    []
  );
  const [_completedChallenges] = useKV<Challenge[]>('completed-challenges', []);
  const [achievements, setAchievements] = useKV<Achievement[]>(
    'user-achievements',
    []
  );
  const [userPoints, setUserPoints] = useKV<number>('user-points', 0);
  const [userLevel] = useKV<number>('user-level', 1);
  const [currentStreak] = useKV<number>('current-streak', 0);
  const [leaderboard] = useKV<LeaderboardEntry[]>('family-leaderboard', []);

  // Sample challenges
  const sampleChallenges: Challenge[] = [
    {
      id: '1',
      title: 'Step Master Challenge',
      description: 'Reach 10,000 steps daily for 7 days',
      type: 'steps',
      target: 10000,
      unit: 'steps/day',
      duration: 7,
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      participants: ['user1', 'user2', 'user3'],
      creator: 'user1',
      rewards: { points: 500, badge: 'Step Master', title: 'Walking Warrior' },
      status: 'active',
    },
    {
      id: '2',
      title: 'Sleep Champion',
      description: 'Get 8+ hours of quality sleep for 5 nights',
      type: 'sleep',
      target: 8,
      unit: 'hours/night',
      duration: 5,
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      participants: ['user1', 'user2'],
      creator: 'user2',
      rewards: { points: 300, badge: 'Sleep Champion' },
      status: 'active',
    },
  ];

  // Sample achievements
  const sampleAchievements: Achievement[] = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first challenge',
      icon: '🏃',
      type: 'bronze',
      unlocked: true,
      unlockedDate: '2024-01-01',
      progress: 1,
      target: 1,
    },
    {
      id: '2',
      title: 'Streak Master',
      description: 'Maintain a 7-day activity streak',
      icon: '🔥',
      type: 'silver',
      unlocked: false,
      progress: 5,
      target: 7,
    },
    {
      id: '3',
      title: 'Health Legend',
      description: 'Reach level 10',
      icon: '👑',
      type: 'gold',
      unlocked: false,
      progress: 1,
      target: 10,
    },
  ];

  // Sample leaderboard
  const sampleLeaderboard: LeaderboardEntry[] = [
    {
      userId: 'user1',
      name: 'You',
      points: userPoints ?? 1250,
      level: userLevel ?? 3,
      streak: currentStreak ?? 5,
      badges: ['Step Master', 'Early Bird'],
      weeklyProgress: 85,
    },
    {
      userId: 'user2',
      name: 'Mom',
      points: 1100,
      level: 2,
      streak: 3,
      badges: ['Sleep Champion'],
      weeklyProgress: 78,
    },
    {
      userId: 'user3',
      name: 'Dad',
      points: 980,
      level: 2,
      streak: 7,
      badges: ['Consistency King'],
      weeklyProgress: 92,
    },
  ];

  const joinChallenge = (challengeId: string) => {
    setActiveChallenges((current) =>
      (current ?? []).map((challenge) =>
        challenge.id === challengeId
          ? {
              ...challenge,
              participants: [...challenge.participants, 'currentUser'],
            }
          : challenge
      )
    );
    toast.success('Joined challenge successfully!');
  };

  const createCustomChallenge = () => {
    toast.info('Challenge creation feature coming soon!');
  };

  const claimReward = (achievementId: string) => {
    setAchievements((current) =>
      (current ?? []).map((achievement) =>
        achievement.id === achievementId
          ? {
              ...achievement,
              unlocked: true,
              unlockedDate: new Date().toISOString(),
            }
          : achievement
      )
    );
    setUserPoints((current) => (current ?? 0) + 100);
    toast.success('Achievement unlocked! +100 points');
  };

  const getPointsToNextLevel = () => {
    const pointsPerLevel = 1000;
    const lvl = userLevel ?? 1;
    const pts = userPoints ?? 0;
    const nextLevelPoints = lvl * pointsPerLevel;
    return nextLevelPoints - pts;
  };

  const getLevelProgress = () => {
    const pointsPerLevel = 1000;
    const lvl = userLevel ?? 1;
    const pts = userPoints ?? 0;
    const currentLevelPoints = (lvl - 1) * pointsPerLevel;
    const progressInLevel = pts - currentLevelPoints;
    return (progressInLevel / pointsPerLevel) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Trophy className="text-primary h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userPoints}</p>
                <p className="text-muted-foreground text-sm">Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 rounded-lg p-2">
                <Star className="text-accent h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">Level {userLevel}</p>
                <p className="text-muted-foreground text-sm">
                  {getPointsToNextLevel()} to next
                </p>
              </div>
            </div>
            <Progress value={getLevelProgress()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 rounded-lg p-2">
                <Flame className="text-destructive h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{currentStreak}</p>
                <p className="text-muted-foreground text-sm">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/50 rounded-lg p-2">
                <Medal className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(achievements ?? []).filter((a) => a.unlocked).length}
                </p>
                <p className="text-muted-foreground text-sm">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="challenges" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="competitions">Family Competitions</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Active Challenges</h2>
              <p className="text-muted-foreground">
                Join challenges to earn points and badges
              </p>
            </div>
            <Button
              onClick={createCustomChallenge}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Create Challenge
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {((activeChallenges ?? []).length > 0
              ? (activeChallenges ?? [])
              : sampleChallenges
            ).map((challenge) => (
              <Card key={challenge.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {challenge.type === 'steps' && (
                          <Target className="text-primary h-5 w-5" />
                        )}
                        {challenge.type === 'sleep' && (
                          <Calendar className="text-accent h-5 w-5" />
                        )}
                        {challenge.title}
                      </CardTitle>
                      <CardDescription>{challenge.description}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        challenge.status === 'active' ? 'default' : 'secondary'
                      }
                    >
                      {challenge.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      Target: {challenge.target.toLocaleString()}{' '}
                      {challenge.unit}
                    </span>
                    <span>{challenge.duration} days</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-sm">
                      {challenge.participants.length} participants
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Trophy className="text-accent h-4 w-4" />
                    <span className="text-sm font-medium">
                      {challenge.rewards.points} points
                    </span>
                    {challenge.rewards.badge && (
                      <Badge variant="outline">{challenge.rewards.badge}</Badge>
                    )}
                  </div>

                  <Button
                    onClick={() => joinChallenge(challenge.id)}
                    disabled={challenge.participants.includes('currentUser')}
                    className="w-full"
                  >
                    {challenge.participants.includes('currentUser')
                      ? 'Joined'
                      : 'Join Challenge'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Family Leaderboard</h2>
            <p className="text-muted-foreground">
              See how you rank against family members this week
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {((leaderboard ?? []).length > 0
                  ? (leaderboard ?? [])
                  : sampleLeaderboard
                )
                  .sort((a, b) => b.points - a.points)
                  .map((entry, index) => (
                    <div
                      key={entry.userId}
                      className="bg-muted/50 flex items-center gap-4 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        {index === 0 && (
                          <Crown className="h-5 w-5 text-yellow-500" />
                        )}
                        {index === 1 && (
                          <Medal className="h-5 w-5 text-gray-400" />
                        )}
                        {index === 2 && (
                          <Medal className="h-5 w-5 text-orange-500" />
                        )}
                        {index > 2 && (
                          <span className="w-5 text-center font-bold">
                            {index + 1}
                          </span>
                        )}

                        <Avatar>
                          <AvatarFallback>
                            {entry.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <p className="font-medium">{entry.name}</p>
                          <div className="text-muted-foreground flex items-center gap-2 text-sm">
                            <span>Level {entry.level}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              {entry.streak} day streak
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1" />

                      <div className="text-right">
                        <p className="font-bold">
                          {entry.points.toLocaleString()} pts
                        </p>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <TrendingUp className="h-3 w-3" />
                          {entry.weeklyProgress}% this week
                        </div>
                      </div>

                      <div className="flex gap-1">
                        {entry.badges.slice(0, 3).map((badge) => (
                          <Badge
                            key={`${entry.userId}-${badge}`}
                            variant="outline"
                            className="text-xs"
                          >
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Achievements</h2>
            <p className="text-muted-foreground">
              Unlock badges and earn points for health milestones
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {((achievements ?? []).length > 0
              ? (achievements ?? [])
              : sampleAchievements
            ).map((achievement) => (
              <Card
                key={achievement.id}
                className={achievement.unlocked ? 'border-primary' : ''}
              >
                <CardContent className="p-6">
                  <div className="space-y-3 text-center">
                    <div className="text-4xl">{achievement.icon}</div>
                    <div>
                      <h3 className="font-bold">{achievement.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {achievement.description}
                      </p>
                    </div>

                    <Badge variant={getAchievementVariant(achievement.type)}>
                      {achievement.type.toUpperCase()}
                    </Badge>

                    {!achievement.unlocked && (
                      <div className="space-y-2">
                        <Progress
                          value={
                            (achievement.progress / achievement.target) * 100
                          }
                        />
                        <p className="text-muted-foreground text-xs">
                          {achievement.progress} / {achievement.target}
                        </p>
                      </div>
                    )}

                    {achievement.unlocked && achievement.unlockedDate && (
                      <p className="text-muted-foreground text-xs">
                        Unlocked{' '}
                        {new Date(
                          achievement.unlockedDate
                        ).toLocaleDateString()}
                      </p>
                    )}

                    {achievement.progress >= achievement.target &&
                      !achievement.unlocked && (
                        <Button
                          onClick={() => claimReward(achievement.id)}
                          size="sm"
                        >
                          <Zap className="mr-2 h-4 w-4" />
                          Claim Reward
                        </Button>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="competitions" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Family Competitions</h2>
            <p className="text-muted-foreground">
              Competitive events and tournaments with family members
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="text-primary h-5 w-5" />
                  Monthly Step Tournament
                </CardTitle>
                <CardDescription>
                  Compete for the most steps this month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Your Steps</span>
                    <span className="font-medium">385,420</span>
                  </div>
                  <Progress value={75} />
                  <p className="text-muted-foreground text-xs">
                    15 days remaining • Leading by 12,450 steps
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Current Standings</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <Crown className="h-3 w-3 text-yellow-500" />
                        You
                      </span>
                      <span>385,420</span>
                    </div>
                    <div className="text-muted-foreground flex justify-between">
                      <span>Dad</span>
                      <span>372,970</span>
                    </div>
                    <div className="text-muted-foreground flex justify-between">
                      <span>Mom</span>
                      <span>341,205</span>
                    </div>
                  </div>
                </div>

                <Badge variant="outline" className="w-full justify-center">
                  Prize: 1000 points + Family Champion Badge
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="text-accent h-5 w-5" />
                  Weekly Wellness Challenge
                </CardTitle>
                <CardDescription>
                  Complete daily wellness tasks together
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Morning Exercise</span>
                    <div className="flex gap-1">
                      <div className="bg-primary h-2 w-2 rounded-full" />
                      <div className="bg-primary h-2 w-2 rounded-full" />
                      <div className="bg-muted h-2 w-2 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Healthy Meals</span>
                    <div className="flex gap-1">
                      <div className="bg-primary h-2 w-2 rounded-full" />
                      <div className="bg-primary h-2 w-2 rounded-full" />
                      <div className="bg-primary h-2 w-2 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">8h Sleep</span>
                    <div className="flex gap-1">
                      <div className="bg-primary h-2 w-2 rounded-full" />
                      <div className="bg-muted h-2 w-2 rounded-full" />
                      <div className="bg-muted h-2 w-2 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-muted-foreground text-sm">
                    Family completion: 67%
                  </p>
                  <Progress value={67} className="mt-2" />
                </div>

                <Button className="w-full">
                  <Target className="mr-2 h-4 w-4" />
                  View Daily Tasks
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
