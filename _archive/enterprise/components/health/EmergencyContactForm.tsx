/**
 * Emergency Contact Form Component
 * Reusable form for adding/editing emergency contacts
 */

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import type { EmergencyContact, ContactMethod, ContactPriority } from '@/lib/emergencyContacts';
import { validatePhoneNumber, validateEmail } from '@/lib/emergencyContacts';

interface EmergencyContactFormProps {
  contact?: EmergencyContact;
  onSubmit: (data: Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt' | 'notificationCount'>) => void;
  onCancel: () => void;
}

export default function EmergencyContactForm({
  contact,
  onSubmit,
  onCancel,
}: EmergencyContactFormProps) {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    phone: contact?.phone || '',
    email: contact?.email || '',
    relationship: contact?.relationship || '',
    priority: (contact?.priority || 'secondary') as ContactPriority,
    preferredMethods: (contact?.preferredMethods || ['all']) as ContactMethod[],
    isActive: contact?.isActive ?? true,
    notes: contact?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.relationship) {
      newErrors.relationship = 'Relationship is required';
    }

    if (formData.preferredMethods.length === 0) {
      newErrors.preferredMethods = 'At least one notification method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const toggleMethod = (method: ContactMethod) => {
    if (method === 'all') {
      setFormData((prev) => ({
        ...prev,
        preferredMethods: prev.preferredMethods.includes('all') ? [] : ['all'],
      }));
    } else {
      setFormData((prev) => {
        const methods = prev.preferredMethods.includes('all')
          ? []
          : [...prev.preferredMethods];
        if (methods.includes(method)) {
          return { ...prev, preferredMethods: methods.filter((m) => m !== method) };
        } else {
          return { ...prev, preferredMethods: [...methods, method] };
        }
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Full Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter full name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="(555) 123-4567"
          className={errors.phone ? 'border-red-500' : ''}
        />
        {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@example.com"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="relationship">
          Relationship <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.relationship}
          onValueChange={(value) => setFormData({ ...formData, relationship: value })}
        >
          <SelectTrigger className={errors.relationship ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select relationship" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spouse">Spouse/Partner</SelectItem>
            <SelectItem value="child">Child</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
            <SelectItem value="sibling">Sibling</SelectItem>
            <SelectItem value="friend">Friend</SelectItem>
            <SelectItem value="caregiver">Caregiver</SelectItem>
            <SelectItem value="neighbor">Neighbor</SelectItem>
            <SelectItem value="healthcare_provider">Healthcare Provider</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.relationship && (
          <p className="text-sm text-red-500">{errors.relationship}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={formData.priority}
          onValueChange={(value) =>
            setFormData({ ...formData, priority: value as ContactPriority })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary (notified first)</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
            <SelectItem value="tertiary">Tertiary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Preferred Notification Methods</Label>
        <div className="space-y-2 rounded-lg border p-3">
          {(['all', 'sms', 'call', 'email', 'notification'] as ContactMethod[]).map(
            (method) => (
              <div key={method} className="flex items-center space-x-2">
                <Checkbox
                  id={`method-${method}`}
                  checked={formData.preferredMethods.includes(method)}
                  onCheckedChange={() => toggleMethod(method)}
                />
                <Label
                  htmlFor={`method-${method}`}
                  className="text-sm font-normal capitalize cursor-pointer"
                >
                  {method === 'all' ? 'All Methods' : method.toUpperCase()}
                </Label>
              </div>
            )
          )}
        </div>
        {errors.preferredMethods && (
          <p className="text-sm text-red-500">{errors.preferredMethods}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional information about this contact"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-active"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked === true })
          }
        />
        <Label htmlFor="is-active" className="text-sm font-normal cursor-pointer">
          Active (contact will receive notifications)
        </Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {contact ? 'Update Contact' : 'Add Contact'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
