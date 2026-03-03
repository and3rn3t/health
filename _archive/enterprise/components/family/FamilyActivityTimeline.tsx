/**
 * Family Activity Timeline Component
 * Displays recent family-related activities
 */

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Users,
} from 'lucide-react';
import React from 'react';
import type { FamilyActivity, FamilyMember } from '@/lib/familyDashboard';
import {
  formatRelativeTime,
  getActivityIcon,
  getActivityColor,
} from '@/lib/familyDashboard';

interface FamilyActivityTimelineProps {
  activities: FamilyActivity[];
  members: FamilyMember[];
  onMarkRead?: (id: string) => void;
}

export default function FamilyActivityTimeline({
  activities,
  members,
  onMarkRead,
}: FamilyActivityTimelineProps) {
  const getMemberName = (memberId?: string) => {
    if (!memberId) return 'System';
    return members.find((m) => m.id === memberId)?.name || 'Unknown';
  };

  const unreadCount = activities.filter((a) => !a.read).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Timeline
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Recent family health activities and updates
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Activity className="mx-auto mb-2 h-8 w-8" />
            <p>No activities yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {activities
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${
                      !activity.read ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => onMarkRead && !activity.read && onMarkRead(activity.id)}
                  >
                    <div className="text-2xl">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        {!activity.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {activity.memberName && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {activity.memberName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                        {activity.severity && (
                          <Badge
                            variant={
                              activity.severity === 'critical'
                                ? 'destructive'
                                : activity.severity === 'high'
                                  ? 'default'
                                  : 'secondary'
                            }
                            className="text-xs"
                          >
                            {activity.severity}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
