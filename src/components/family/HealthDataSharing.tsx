/**
 * Health Data Sharing Component
 * Configure what health data is shared with family members
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  Heart,
  MapPin,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import type { FamilyMember, HealthDataShare } from '@/lib/familyDashboard';
import { hasPermission } from '@/lib/familyDashboard';

interface HealthDataSharingProps {
  members: FamilyMember[];
  shares: HealthDataShare[];
  onUpdateShare: (memberId: string, share: Partial<HealthDataShare>) => void;
}

const AVAILABLE_METRICS = [
  { id: 'healthScore', label: 'Health Score', icon: Heart },
  { id: 'steps', label: 'Steps & Activity', icon: Activity },
  { id: 'heartRate', label: 'Heart Rate', icon: Heart },
  { id: 'walkingSteadiness', label: 'Walking Steadiness', icon: TrendingUp },
  { id: 'sleepHours', label: 'Sleep Hours', icon: Activity },
  { id: 'fallRisk', label: 'Fall Risk', icon: Shield },
];

export default function HealthDataSharing({
  members,
  shares,
  onUpdateShare,
}: HealthDataSharingProps) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const getShareForMember = (memberId: string): HealthDataShare | undefined => {
    return shares.find((s) => s.memberId === memberId);
  };

  const updateShare = (memberId: string, updates: Partial<HealthDataShare>) => {
    const existing = getShareForMember(memberId);
    if (existing) {
      onUpdateShare(memberId, { ...existing, ...updates });
    } else {
      // Create new share
      onUpdateShare(memberId, {
        id: `share-${Date.now()}`,
        memberId,
        sharedMetrics: [],
        lastShared: new Date(),
        frequency: 'daily',
        includeLocation: false,
        includeEmergencyData: false,
        ...updates,
      });
    }
    toast.success('Sharing settings updated');
  };

  const toggleMetric = (memberId: string, metricId: string) => {
    const share = getShareForMember(memberId);
    const currentMetrics = share?.sharedMetrics || [];
    const newMetrics = currentMetrics.includes(metricId)
      ? currentMetrics.filter((m) => m !== metricId)
      : [...currentMetrics, metricId];

    updateShare(memberId, { sharedMetrics: newMetrics });
  };

  const activeMembers = members.filter((m) => m.isActive);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Health Data Sharing
        </CardTitle>
        <CardDescription>
          Control what health information is shared with each family member
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeMembers.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Users className="mx-auto mb-2 h-8 w-8" />
            <p>No active family members to share with</p>
          </div>
        ) : (
          activeMembers.map((member) => {
            const share = getShareForMember(member.id);
            const canViewHealth = hasPermission(member, 'view-health');

            if (!canViewHealth) {
              return (
                <div
                  key={member.id}
                  className="rounded-lg border p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{member.name}</h4>
                      <p className="text-sm text-gray-600">
                        No health data access
                      </p>
                    </div>
                    <Badge variant="outline">No Permissions</Badge>
                  </div>
                </div>
              );
            }

            return (
              <div key={member.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{member.name}</h4>
                    <p className="text-sm text-gray-600">{member.relationship}</p>
                  </div>
                  <Badge variant="default">{member.role}</Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="mb-2 block">Shared Metrics</Label>
                    <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
                      {AVAILABLE_METRICS.map((metric) => {
                        const Icon = metric.icon;
                        const isShared = share?.sharedMetrics.includes(metric.id) || false;
                        return (
                          <div
                            key={metric.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`${member.id}-${metric.id}`}
                              checked={isShared}
                              onCheckedChange={() => toggleMetric(member.id, metric.id)}
                            />
                            <Label
                              htmlFor={`${member.id}-${metric.id}`}
                              className="text-sm font-normal cursor-pointer flex items-center gap-1"
                            >
                              <Icon className="h-3 w-3" />
                              {metric.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Update Frequency</Label>
                    <Select
                      value={share?.frequency || 'daily'}
                      onValueChange={(value) =>
                        updateShare(member.id, {
                          frequency: value as HealthDataShare['frequency'],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="daily">Daily Summary</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                        <SelectItem value="on-demand">On Demand Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${member.id}-location`}
                        checked={share?.includeLocation || false}
                        onCheckedChange={(checked) =>
                          updateShare(member.id, {
                            includeLocation: checked === true,
                          })
                        }
                      />
                      <Label
                        htmlFor={`${member.id}-location`}
                        className="text-sm font-normal cursor-pointer flex items-center gap-1"
                      >
                        <MapPin className="h-3 w-3" />
                        Include Location
                      </Label>
                    </div>

                    {hasPermission(member, 'view-emergency') && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${member.id}-emergency`}
                          checked={share?.includeEmergencyData || false}
                          onCheckedChange={(checked) =>
                            updateShare(member.id, {
                              includeEmergencyData: checked === true,
                            })
                          }
                        />
                        <Label
                          htmlFor={`${member.id}-emergency`}
                          className="text-sm font-normal cursor-pointer flex items-center gap-1"
                        >
                          <Shield className="h-3 w-3" />
                          Include Emergency Data
                        </Label>
                      </div>
                    )}
                  </div>

                  {share?.lastShared && (
                    <p className="text-xs text-gray-500">
                      Last shared: {share.lastShared.toLocaleString()}
                    </p>
                  )}
                </div>

                <Separator />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
