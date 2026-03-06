import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useKV } from '@github/spark/hooks';
import { Clock, Plus, Target, Trophy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'steps' | 'activity' | 'sleep' | 'heart_rate' | 'custom';
  target: number;
  unit: string;
  duration: number;
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

interface Props {
  onChallengeCreated?: (challenge: Challenge) => void;
}

export default function ChallengeCreator({
  onChallengeCreated,
}: Readonly<Props>) {
  const [challenges, setChallenges] = useKV<Challenge[]>(
    'created-challenges',
    []
  );
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'steps' as Challenge['type'],
    target: '',
    duration: '',
    rewards: {
      points: '',
      badge: '',
      title: '',
    },
  });

  const challengeTypes = [
    { value: 'steps', label: 'Daily Steps', unit: 'steps/day' },
    { value: 'activity', label: 'Active Minutes', unit: 'minutes/day' },
    { value: 'sleep', label: 'Sleep Hours', unit: 'hours/night' },
    { value: 'heart_rate', label: 'Heart Rate Zone', unit: 'minutes/day' },
    { value: 'custom', label: 'Custom Goal', unit: 'custom' },
  ];

  const getTypeUnit = (type: string) => {
    return challengeTypes.find((t) => t.value === type)?.unit || 'units';
  };

  const createChallenge = () => {
    if (!formData.title || !formData.target || !formData.duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + parseInt(formData.duration));

    const newChallenge: Challenge = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      type: formData.type,
      target: parseInt(formData.target),
      unit: getTypeUnit(formData.type),
      duration: parseInt(formData.duration),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      participants: ['creator'],
      creator: 'current-user',
      rewards: {
        points: parseInt(formData.rewards.points) || 100,
        badge: formData.rewards.badge || undefined,
        title: formData.rewards.title || undefined,
      },
      status: 'upcoming',
    };

    setChallenges((current) => [...(current ?? []), newChallenge]);
    onChallengeCreated?.(newChallenge);

    // Reset form
    setFormData({
      title: '',
      description: '',
      type: 'steps',
      target: '',
      duration: '',
      rewards: {
        points: '',
        badge: '',
        title: '',
      },
    });

    setIsOpen(false);
    toast.success('Challenge created successfully!');
  };

  const challengePresets = [
    {
      title: '10K Steps Daily',
      description: 'Reach 10,000 steps every day',
      type: 'steps' as const,
      target: 10000,
      duration: 7,
      points: 500,
    },
    {
      title: 'Sleep Champion',
      description: 'Get 8+ hours of sleep nightly',
      type: 'sleep' as const,
      target: 8,
      duration: 5,
      points: 300,
    },
    {
      title: 'Active Hour',
      description: '60 minutes of activity daily',
      type: 'activity' as const,
      target: 60,
      duration: 7,
      points: 400,
    },
  ];

  const applyPreset = (preset: (typeof challengePresets)[0]) => {
    setFormData({
      title: preset.title,
      description: preset.description,
      type: preset.type,
      target: preset.target.toString(),
      duration: preset.duration.toString(),
      rewards: {
        points: preset.points.toString(),
        badge: '',
        title: '',
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Challenge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create New Challenge
          </DialogTitle>
          <DialogDescription>
            Design a custom health challenge for your family to compete in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Presets */}
          <div>
            <Label className="text-sm font-medium">Quick Presets</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {challengePresets.map((preset) => (
                <Button
                  key={preset.title}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="h-auto flex-col gap-1 p-2 text-xs"
                >
                  <span className="font-medium">{preset.title}</span>
                  <span className="text-muted-foreground">
                    {preset.duration} days
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Challenge Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Family Step Challenge"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what participants need to do..."
                rows={3}
              />
            </div>
          </div>

          {/* Challenge Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="type">Challenge Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: Challenge['type']) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select challenge type" />
                </SelectTrigger>
                <SelectContent>
                  {challengeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target">Target Goal *</Label>
              <div className="flex gap-2">
                <Input
                  id="target"
                  type="number"
                  value={formData.target}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, target: e.target.value }))
                  }
                  placeholder="e.g., 10000"
                />
                <div className="bg-muted text-muted-foreground min-w-fit rounded-md px-3 py-2 text-sm">
                  {getTypeUnit(formData.type)}
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="duration">Duration (Days) *</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, duration: e.target.value }))
              }
              placeholder="e.g., 7"
              min="1"
              max="30"
            />
          </div>

          {/* Rewards */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="h-4 w-4" />
              Rewards
            </Label>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.rewards.points}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      rewards: { ...prev.rewards, points: e.target.value },
                    }))
                  }
                  placeholder="100"
                />
              </div>

              <div>
                <Label htmlFor="badge">Badge Name</Label>
                <Input
                  id="badge"
                  value={formData.rewards.badge}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      rewards: { ...prev.rewards, badge: e.target.value },
                    }))
                  }
                  placeholder="e.g., Step Master"
                />
              </div>

              <div>
                <Label htmlFor="title">Special Title</Label>
                <Input
                  id="title"
                  value={formData.rewards.title}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      rewards: { ...prev.rewards, title: e.target.value },
                    }))
                  }
                  placeholder="e.g., Walking Warrior"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {formData.title && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium">{formData.title}</h3>
                    {formData.description && (
                      <p className="text-muted-foreground text-sm">
                        {formData.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Target className="text-primary h-4 w-4" />
                      <span>
                        {formData.target} {getTypeUnit(formData.type)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock className="text-muted-foreground h-4 w-4" />
                      <span>{formData.duration} days</span>
                    </div>

                    {formData.rewards.points && (
                      <div className="flex items-center gap-1">
                        <Trophy className="text-accent h-4 w-4" />
                        <span>{formData.rewards.points} points</span>
                      </div>
                    )}
                  </div>

                  {(formData.rewards.badge || formData.rewards.title) && (
                    <div className="flex gap-2">
                      {formData.rewards.badge && (
                        <Badge variant="outline">
                          {formData.rewards.badge}
                        </Badge>
                      )}
                      {formData.rewards.title && (
                        <Badge variant="secondary">
                          {formData.rewards.title}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={createChallenge} className="flex-1">
              <Target className="mr-2 h-4 w-4" />
              Create Challenge
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
