/**
 * Progress Sharing Component
 * Share health milestones and achievements with family
 */

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  Heart,
  Plus,
  Star,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import type { ProgressShare, FamilyMember } from '@/lib/familyDashboard';
import { formatRelativeTime } from '@/lib/familyDashboard';

interface ProgressSharingProps {
  shares: ProgressShare[];
  members: FamilyMember[];
  onAdd: (share: Omit<ProgressShare, 'id'>) => void;
  onAddReaction: (shareId: string, memberId: string, reaction: string) => void;
  onAddComment?: (shareId: string, memberId: string, content: string) => void;
}

const REACTION_OPTIONS = ['❤️', '🎉', '👏', '👍', '💪', '🌟'];

export default function ProgressSharing({
  shares,
  members,
  onAdd,
  onAddReaction,
  onAddComment,
}: ProgressSharingProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [formData, setFormData] = useState({
    type: 'achievement' as ProgressShare['type'],
    title: '',
    description: '',
    value: '',
    previousValue: '',
    unit: '',
    sharedWith: [] as string[],
    isPublic: false,
  });

  const handleShare = () => {
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    onAdd({
      type: formData.type,
      title: formData.title,
      description: formData.description,
      value: formData.value ? parseFloat(formData.value) : undefined,
      previousValue: formData.previousValue
        ? parseFloat(formData.previousValue)
        : undefined,
      unit: formData.unit || undefined,
      date: new Date(),
      sharedWith: formData.sharedWith.length > 0 ? formData.sharedWith : members.map((m) => m.id),
      reactions: [],
      comments: [],
      isPublic: formData.isPublic,
    });

    // Reset form
    setFormData({
      type: 'achievement',
      title: '',
      description: '',
      value: '',
      previousValue: '',
      unit: '',
      sharedWith: [],
      isPublic: false,
    });
    setIsSharing(false);
    toast.success('Progress shared with family!');
  };

  const getTypeIcon = (type: ProgressShare['type']) => {
    switch (type) {
      case 'achievement':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'improvement':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'milestone':
        return <Star className="h-5 w-5 text-purple-600" />;
      case 'concern':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default:
        return <Heart className="h-5 w-5 text-red-600" />;
    }
  };

  const getMemberName = (memberId: string) => {
    return members.find((m) => m.id === memberId)?.name || 'Unknown';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Progress & Achievements
            </CardTitle>
            <CardDescription>
              Share your health milestones with your family
            </CardDescription>
          </div>
          <Dialog open={isSharing} onOpenChange={setIsSharing}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Share Progress
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Share Progress</DialogTitle>
                <DialogDescription>
                  Share a health milestone or achievement with your family
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as ProgressShare['type'],
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="achievement">Achievement</option>
                    <option value="improvement">Improvement</option>
                    <option value="milestone">Milestone</option>
                    <option value="update">Update</option>
                    <option value="concern">Concern</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Reached 10,000 steps!"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Tell your family about this achievement..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      type="number"
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: e.target.value })
                      }
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="previousValue">Previous</Label>
                    <Input
                      id="previousValue"
                      type="number"
                      value={formData.previousValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          previousValue: e.target.value,
                        })
                      }
                      placeholder="80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      placeholder="steps"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleShare} className="flex-1">
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsSharing(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {shares.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Star className="mx-auto mb-2 h-8 w-8" />
            <p>No progress shared yet</p>
            <Button
              onClick={() => setIsSharing(true)}
              className="mt-4"
              variant="outline"
            >
              Share Your First Update
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {shares
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .map((share) => (
                <div key={share.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(share.type)}
                      <div>
                        <h4 className="font-medium">{share.title}</h4>
                        <p className="text-sm text-gray-600">{share.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(share.date)}
                    </span>
                  </div>

                  {share.value !== undefined && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">
                          {share.value}
                        </span>
                        {share.unit && (
                          <span className="text-sm text-gray-600">{share.unit}</span>
                        )}
                        {share.previousValue !== undefined && (
                          <Badge variant="secondary" className="text-green-600">
                            +{share.value - share.previousValue}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {share.reactions.map((reaction, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-sm"
                        >
                          <span>{reaction.reaction}</span>
                          <span className="text-xs text-gray-600">
                            {reaction.memberName}
                          </span>
                        </div>
                      ))}
                      {share.reactions.length === 0 && (
                        <span className="text-sm text-gray-500">No reactions yet</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {REACTION_OPTIONS.map((reaction) => (
                        <Button
                          key={reaction}
                          variant="ghost"
                          size="sm"
                          onClick={() => onAddReaction(share.id, 'current-user', reaction)}
                          className="h-8 px-2"
                        >
                          {reaction}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
