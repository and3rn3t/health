/**
 * Enhanced Family Dashboard Component
 * Comprehensive family health sharing and management
 */

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Bell,
  Heart,
  MessageCircle,
  Phone,
  Shield,
  Star,
  Users,
} from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useKV } from '@/hooks/useCloudflareKV';
import type { ProcessedHealthData } from '@/lib/healthDataProcessor';
import type {
  FamilyMember,
  ProgressShare,
  FamilyActivity,
  HealthDataShare,
} from '@/lib/familyDashboard';
import {
  getActiveMembers,
  formatRelativeTime,
  createDefaultNotificationPreferences,
  getDefaultPermissionsForRole,
} from '@/lib/familyDashboard';
// Lazy load family components to reduce initial bundle size
import { lazy, Suspense } from 'react';

const FamilyMemberManager = lazy(() => import('./FamilyMemberManager'));
const FamilyActivityTimeline = lazy(() => import('./FamilyActivityTimeline'));
const HealthDataSharing = lazy(() => import('./HealthDataSharing'));
const ProgressSharing = lazy(() => import('./ProgressSharing'));

// Loading fallback component
const FamilyComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);

interface EnhancedFamilyDashboardProps {
  healthData: ProcessedHealthData | null;
}

export default function EnhancedFamilyDashboard({
  healthData,
}: EnhancedFamilyDashboardProps) {
  const [familyMembers, setFamilyMembers] = useKV<FamilyMember[]>(
    'family-members',
    []
  );
  const [progressShares, setProgressShares] = useKV<ProgressShare[]>(
    'progress-shares',
    []
  );
  const [activities, setActivities] = useKV<FamilyActivity[]>(
    'family-activities',
    []
  );
  const [healthShares, setHealthShares] = useKV<HealthDataShare[]>(
    'health-data-shares',
    []
  );

  // Add family member
  const handleAddMember = useCallback(
    (memberData: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newMember: FamilyMember = {
        ...memberData,
        id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setFamilyMembers((current) => [...(current || []), newMember]);

      // Add activity
      addActivity({
        type: 'member_added',
        title: 'Family Member Added',
        description: `${memberData.name} was added to your care circle`,
        memberId: newMember.id,
        memberName: memberData.name,
        timestamp: new Date(),
        read: false,
      });

      toast.success(`${memberData.name} added to your care circle`);
    },
    [setFamilyMembers]
  );

  // Update family member
  const handleUpdateMember = useCallback(
    (id: string, updates: Partial<FamilyMember>) => {
      setFamilyMembers((current) =>
        (current || []).map((member) =>
          member.id === id
            ? { ...member, ...updates, updatedAt: new Date() }
            : member
        )
      );

      // Add activity if permissions changed
      if (updates.permissions) {
        const member = familyMembers?.find((m) => m.id === id);
        if (member) {
          addActivity({
            type: 'permission_changed',
            title: 'Permissions Updated',
            description: `Permissions updated for ${member.name}`,
            memberId: id,
            memberName: member.name,
            timestamp: new Date(),
            read: false,
          });
        }
      }

      toast.success('Family member updated');
    },
    [setFamilyMembers, familyMembers]
  );

  // Delete family member
  const handleDeleteMember = useCallback(
    (id: string) => {
      const member = familyMembers?.find((m) => m.id === id);
      setFamilyMembers((current) => (current || []).filter((m) => m.id !== id));

      if (member) {
        addActivity({
          type: 'member_added',
          title: 'Family Member Removed',
          description: `${member.name} was removed from your care circle`,
          timestamp: new Date(),
          read: false,
        });
      }
    },
    [setFamilyMembers, familyMembers]
  );

  // Add progress share
  const handleAddShare = useCallback(
    (shareData: Omit<ProgressShare, 'id'>) => {
      const newShare: ProgressShare = {
        ...shareData,
        id: `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      setProgressShares((current) => [newShare, ...(current || [])]);

      // Add activity
      addActivity({
        type: 'milestone',
        title: 'Progress Shared',
        description: shareData.title,
        timestamp: new Date(),
        read: false,
      });

      toast.success('Progress shared with family!');
    },
    [setProgressShares]
  );

  // Add reaction
  const handleAddReaction = useCallback(
    (shareId: string, memberId: string, reaction: string) => {
      setProgressShares((current) =>
        (current || []).map((share) =>
          share.id === shareId
            ? {
                ...share,
                reactions: [
                  ...share.reactions.filter((r) => r.memberId !== memberId),
                  {
                    memberId,
                    memberName: 'You',
                    reaction,
                    timestamp: new Date(),
                  },
                ],
              }
            : share
        )
      );
    },
    [setProgressShares]
  );

  // Update health data share
  const handleUpdateShare = useCallback(
    (memberId: string, shareData: Partial<HealthDataShare>) => {
      setHealthShares((current) => {
        const existing = (current || []).find((s) => s.memberId === memberId);
        if (existing) {
          return (current || []).map((s) =>
            s.memberId === memberId
              ? { ...s, ...shareData, lastShared: new Date() }
              : s
          );
        } else {
          return [
            ...(current || []),
            {
              id: `share-${Date.now()}`,
              memberId,
              sharedMetrics: [],
              lastShared: new Date(),
              frequency: 'daily',
              includeLocation: false,
              includeEmergencyData: false,
              ...shareData,
            },
          ];
        }
      });
    },
    [setHealthShares]
  );

  // Add activity
  const addActivity = useCallback(
    (activity: Omit<FamilyActivity, 'id'>) => {
      const newActivity: FamilyActivity = {
        ...activity,
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      setActivities((current) => [newActivity, ...(current || [])].slice(0, 50)); // Keep last 50
    },
    [setActivities]
  );

  // Mark activity as read
  const handleMarkRead = useCallback(
    (id: string) => {
      setActivities((current) =>
        (current || []).map((activity) =>
          activity.id === id ? { ...activity, read: true } : activity
        )
      );
    },
    [setActivities]
  );

  // Statistics - must be before early return to satisfy React Hooks rules
  const stats = useMemo(() => {
    const active = getActiveMembers(familyMembers || []);
    const totalReactions = (progressShares || []).reduce(
      (sum, share) => sum + share.reactions.length,
      0
    );
    const unreadActivities = (activities || []).filter((a) => !a.read).length;

    return {
      totalMembers: (familyMembers || []).length,
      activeMembers: active.length,
      totalReactions,
      unreadActivities,
    };
  }, [familyMembers, progressShares, activities]);

  // Early return check - must be after all hooks
  if (!healthData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <Users className="text-gray-400 mx-auto mb-4 h-16 w-16" />
          <h2 className="text-2xl font-bold mb-2">No Health Data</h2>
          <p className="text-gray-600">
            Import your health data to share with family members
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Family Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Share your health journey with loved ones
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Family Members</div>
            <div className="text-2xl font-bold text-primary">
              {stats.totalMembers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Active Today</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.activeMembers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Total Support</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalReactions}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">New Activities</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.unreadActivities}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members">
          <Suspense fallback={<FamilyComponentLoader />}>
            <FamilyMemberManager
              members={familyMembers || []}
              onAdd={handleAddMember}
              onUpdate={handleUpdateMember}
              onDelete={handleDeleteMember}
            />
          </Suspense>
        </TabsContent>

        {/* Sharing Tab */}
        <TabsContent value="sharing">
          <Suspense fallback={<FamilyComponentLoader />}>
            <HealthDataSharing
              members={familyMembers || []}
              shares={healthShares || []}
              onUpdateShare={handleUpdateShare}
            />
          </Suspense>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress">
          <Suspense fallback={<FamilyComponentLoader />}>
            <ProgressSharing
              shares={progressShares || []}
              members={familyMembers || []}
              onAdd={handleAddShare}
              onAddReaction={handleAddReaction}
            />
          </Suspense>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Suspense fallback={<FamilyComponentLoader />}>
            <FamilyActivityTimeline
              activities={activities || []}
              members={familyMembers || []}
              onMarkRead={handleMarkRead}
            />
          </Suspense>
        </TabsContent>

        {/* Emergency Tab */}
        <TabsContent value="emergency">
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
                  <Bell className="h-6 w-6 text-purple-600" />
                  <span className="text-sm">Test Alert System</span>
                </Button>
                <Button variant="outline" className="flex h-16 flex-col gap-2">
                  <Activity className="h-6 w-6 text-green-600" />
                  <span className="text-sm">Health Status</span>
                </Button>
              </div>

              {/* Current Health Status for Family */}
              {healthData && (
                <div className="mt-6 rounded-lg border p-4">
                  <h4 className="font-semibold mb-3">Current Health Status</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Health Score</span>
                        <span className="font-semibold">
                          {healthData.healthScore || 0}/100
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${healthData.healthScore || 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {healthData.healthScore >= 80
                        ? 'Excellent health status!'
                        : healthData.healthScore >= 60
                          ? 'Good health with room for improvement'
                          : 'Health needs attention'}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
