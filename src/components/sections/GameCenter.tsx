// 🎮 VitalSense Game Center Section
// Code-split component for gamification features

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Heart, Play, Target, Trophy, Users } from 'lucide-react';

export default function GameCenter() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-vitalsense-primary">
          Game Center
        </h1>
        <p className="text-vitalsense-gray">
          Gamify your health journey with VitalSense challenges
        </p>
      </div>

      {/* Game Stats */}
      <div className="md:grid-cols-4 grid gap-6">
        <Card className="from-yellow-50 to-yellow-100 bg-gradient-to-br">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="text-yellow-600 h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-yellow-600 text-2xl font-bold">12</div>
            <p className="text-xs text-yellow-600/70">unlocked</p>
          </CardContent>
        </Card>

        <Card className="from-blue-50 to-blue-100 bg-gradient-to-br">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Challenges</CardTitle>
            <Target className="text-blue-600 h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-blue-600 text-2xl font-bold">5</div>
            <p className="text-xs text-blue-600/70">active</p>
          </CardContent>
        </Card>

        <Card className="from-green-50 to-green-100 bg-gradient-to-br">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Play className="text-green-600 h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-green-600 text-2xl font-bold">7</div>
            <p className="text-xs text-green-600/70">days</p>
          </CardContent>
        </Card>

        <Card className="from-purple-50 to-purple-100 bg-gradient-to-br">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leaderboard</CardTitle>
            <Users className="text-purple-600 h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-purple-600 text-2xl font-bold">#3</div>
            <p className="text-xs text-purple-600/70">this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Challenges */}
      <div className="md:grid-cols-2 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Challenges</CardTitle>
            <CardDescription>
              Complete challenges to earn rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-vitalsense-muted p-3 flex items-center justify-between rounded-lg">
                <div>
                  <h4 className="font-medium">10K Steps Daily</h4>
                  <p className="text-vitalsense-gray text-sm">
                    7,842 / 10,000 steps
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-20 bg-vitalsense-border h-2 rounded-full">
                    <div className="w-16 h-2 rounded-full bg-vitalsense-primary"></div>
                  </div>
                  <span className="text-xs text-vitalsense-gray">78%</span>
                </div>
              </div>

              <div className="bg-vitalsense-muted p-3 flex items-center justify-between rounded-lg">
                <div>
                  <h4 className="font-medium">Heart Rate Zone</h4>
                  <p className="text-vitalsense-gray text-sm">
                    30 min in target zone
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-20 bg-vitalsense-border h-2 rounded-full">
                    <div className="h-2 w-8 rounded-full bg-vitalsense-secondary"></div>
                  </div>
                  <span className="text-xs text-vitalsense-gray">40%</span>
                </div>
              </div>

              <div className="bg-vitalsense-muted p-3 flex items-center justify-between rounded-lg">
                <div>
                  <h4 className="font-medium">Sleep Quality</h4>
                  <p className="text-vitalsense-gray text-sm">
                    7+ hours quality sleep
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-20 h-2 rounded-full bg-vitalsense-success">
                    <div className="w-20 h-2 rounded-full bg-vitalsense-success"></div>
                  </div>
                  <span className="text-xs text-vitalsense-gray">100%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
            <CardDescription>Your latest accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-x-3 bg-yellow-50 p-3 flex items-center rounded-lg">
                <Trophy className="text-yellow-600 h-8 w-8" />
                <div>
                  <h4 className="font-medium">Week Warrior</h4>
                  <p className="text-vitalsense-gray text-sm">
                    7-day activity streak
                  </p>
                </div>
              </div>

              <div className="space-x-3 bg-blue-50 p-3 flex items-center rounded-lg">
                <Target className="text-blue-600 h-8 w-8" />
                <div>
                  <h4 className="font-medium">Goal Crusher</h4>
                  <p className="text-vitalsense-gray text-sm">
                    Exceeded daily steps goal
                  </p>
                </div>
              </div>

              <div className="space-x-3 bg-green-50 p-3 flex items-center rounded-lg">
                <Heart className="text-green-600 h-8 w-8" />
                <div>
                  <h4 className="font-medium">Heart Health Hero</h4>
                  <p className="text-vitalsense-gray text-sm">
                    Optimal heart rate zones
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-vitalsense-gray">
          🎮 Gamification features loaded on-demand for better performance
        </p>
      </div>
    </div>
  );
}
