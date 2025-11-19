/**
 * Family Member Manager Component
 * Add, edit, and manage family members
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Edit,
  Plus,
  Settings,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import type {
  FamilyMember,
  FamilyPermission,
  NotificationPreferences,
} from '@/lib/familyDashboard';
import {
  createDefaultNotificationPreferences,
  getDefaultPermissionsForRole,
  validateFamilyMember,
  formatRelativeTime,
} from '@/lib/familyDashboard';

interface FamilyMemberManagerProps {
  members: FamilyMember[];
  onAdd: (member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, updates: Partial<FamilyMember>) => void;
  onDelete: (id: string) => void;
}

export default function FamilyMemberManager({
  members,
  onAdd,
  onUpdate,
  onDelete,
}: FamilyMemberManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    email: '',
    phone: '',
    role: 'secondary' as FamilyMember['role'],
    permissions: [] as FamilyPermission[],
    notificationPreferences: createDefaultNotificationPreferences(),
  });

  const handleAdd = () => {
    const validation = validateFamilyMember(formData);
    if (!validation.valid) {
      toast.error(validation.errors.join(', '));
      return;
    }

    onAdd({
      name: formData.name,
      relationship: formData.relationship,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      isActive: true,
      permissions: formData.permissions.length > 0
        ? formData.permissions
        : getDefaultPermissionsForRole(formData.role),
      notificationPreferences: formData.notificationPreferences,
      role: formData.role,
      lastSeen: new Date(),
    });

    // Reset form
    setFormData({
      name: '',
      relationship: '',
      email: '',
      phone: '',
      role: 'secondary',
      permissions: [],
      notificationPreferences: createDefaultNotificationPreferences(),
    });
    setIsAdding(false);
    toast.success('Family member added');
  };

  const handleUpdate = () => {
    if (!editingMember) return;

    const validation = validateFamilyMember(formData);
    if (!validation.valid) {
      toast.error(validation.errors.join(', '));
      return;
    }

    onUpdate(editingMember.id, {
      name: formData.name,
      relationship: formData.relationship,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      role: formData.role,
      permissions: formData.permissions.length > 0
        ? formData.permissions
        : getDefaultPermissionsForRole(formData.role),
      notificationPreferences: formData.notificationPreferences,
    });

    setEditingMember(null);
    toast.success('Family member updated');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this family member?')) {
      onDelete(id);
      toast.success('Family member removed');
    }
  };

  const startEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      relationship: member.relationship,
      email: member.email || '',
      phone: member.phone || '',
      role: member.role,
      permissions: member.permissions,
      notificationPreferences: member.notificationPreferences,
    });
  };

  const togglePermission = (permission: FamilyPermission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const toggleNotification = (key: keyof NotificationPreferences) => {
    setFormData((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: !prev.notificationPreferences[key],
      },
    }));
  };

  const availablePermissions: Array<{ value: FamilyPermission; label: string }> = [
    { value: 'view-health', label: 'View Health Data' },
    { value: 'view-location', label: 'View Location' },
    { value: 'receive-alerts', label: 'Receive Alerts' },
    { value: 'view-emergency', label: 'View Emergency Info' },
    { value: 'view-analytics', label: 'View Analytics' },
    { value: 'manage-settings', label: 'Manage Settings' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Members
            </CardTitle>
            <CardDescription>
              Manage who can view your health information
            </CardDescription>
          </div>
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Family Member</DialogTitle>
                <DialogDescription>
                  Add someone to your care circle
                </DialogDescription>
              </DialogHeader>
              <FamilyMemberForm
                formData={formData}
                setFormData={setFormData}
                onSave={handleAdd}
                onCancel={() => setIsAdding(false)}
                togglePermission={togglePermission}
                toggleNotification={toggleNotification}
                availablePermissions={availablePermissions}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="text-gray-400 mx-auto mb-4 h-12 w-12" />
            <p className="text-gray-600 mb-4">No family members added yet</p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Member
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Avatar>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{member.name}</h4>
                      <Badge variant={member.isActive ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      {!member.isActive && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{member.relationship}</p>
                    <p className="text-xs text-gray-500">
                      Last seen: {formatRelativeTime(member.lastSeen)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(member)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(member.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Family Member</DialogTitle>
              <DialogDescription>
                Update member information and permissions
              </DialogDescription>
            </DialogHeader>
            <FamilyMemberForm
              formData={formData}
              setFormData={setFormData}
              onSave={handleUpdate}
              onCancel={() => setEditingMember(null)}
              togglePermission={togglePermission}
              toggleNotification={toggleNotification}
              availablePermissions={availablePermissions}
            />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

interface FamilyMemberFormProps {
  formData: {
    name: string;
    relationship: string;
    email: string;
    phone: string;
    role: FamilyMember['role'];
    permissions: FamilyPermission[];
    notificationPreferences: NotificationPreferences;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSave: () => void;
  onCancel: () => void;
  togglePermission: (permission: FamilyPermission) => void;
  toggleNotification: (key: keyof NotificationPreferences) => void;
  availablePermissions: Array<{ value: FamilyPermission; label: string }>;
}

function FamilyMemberForm({
  formData,
  setFormData,
  onSave,
  onCancel,
  togglePermission,
  toggleNotification,
  availablePermissions,
}: FamilyMemberFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Full name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="relationship">
          Relationship <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.relationship}
          onValueChange={(value) => setFormData({ ...formData, relationship: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select relationship" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spouse">Spouse/Partner</SelectItem>
            <SelectItem value="child">Child</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
            <SelectItem value="sibling">Sibling</SelectItem>
            <SelectItem value="caregiver">Caregiver</SelectItem>
            <SelectItem value="friend">Friend</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => {
            const role = value as FamilyMember['role'];
            setFormData({
              ...formData,
              role,
              permissions: getDefaultPermissionsForRole(role),
            });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary (Full Access)</SelectItem>
            <SelectItem value="secondary">Secondary (Limited Access)</SelectItem>
            <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Permissions</Label>
        <div className="space-y-2 rounded-lg border p-3">
          {availablePermissions.map((perm) => (
            <div key={perm.value} className="flex items-center space-x-2">
              <Checkbox
                id={`perm-${perm.value}`}
                checked={formData.permissions.includes(perm.value)}
                onCheckedChange={() => togglePermission(perm.value)}
              />
              <Label
                htmlFor={`perm-${perm.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {perm.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notification Preferences</Label>
        <div className="space-y-2 rounded-lg border p-3">
          {Object.entries(formData.notificationPreferences).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`notif-${key}`}
                checked={value}
                onCheckedChange={() =>
                  toggleNotification(key as keyof NotificationPreferences)
                }
              />
              <Label
                htmlFor={`notif-${key}`}
                className="text-sm font-normal cursor-pointer capitalize"
              >
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={onSave} className="flex-1">
          Save
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
}
