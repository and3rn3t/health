/**
 * Enhanced Emergency Contacts Management Component
 * Comprehensive emergency contact management with notification history
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Bell,
  Edit,
  Mail,
  Phone,
  Plus,
  Shield,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts';
import type {
  EmergencyContact,
  ContactMethod,
  ContactPriority,
} from '@/lib/emergencyContacts';
import {
  formatPhoneNumber,
  validatePhoneNumber,
  validateEmail,
  createEmergencyContact,
} from '@/lib/emergencyContacts';
import EmergencyContactForm from './EmergencyContactForm';
import EmergencyNotificationHistory from './EmergencyNotificationHistory';
import EmergencyContactSettings from './EmergencyContactSettings';

export default function EnhancedEmergencyContacts() {
  const {
    contacts,
    settings,
    events,
    isLoading,
    addContact,
    updateContact,
    deleteContact,
    setContactPriority,
    toggleContactActive,
    getSortedActiveContacts,
    updateSettings,
  } = useEmergencyContacts();

  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);

  const sortedContacts = getSortedActiveContacts();

  const handleAddContact = (contactData: Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt' | 'notificationCount'>) => {
    try {
      addContact(contactData);
      setIsAddingContact(false);
      toast.success('Emergency contact added successfully');
    } catch (error) {
      toast.error('Failed to add contact');
      console.error(error);
    }
  };

  const handleUpdateContact = (id: string, updates: Partial<EmergencyContact>) => {
    try {
      updateContact(id, updates);
      setEditingContact(null);
      toast.success('Contact updated successfully');
    } catch (error) {
      toast.error('Failed to update contact');
      console.error(error);
    }
  };

  const handleDeleteContact = (id: string) => {
    if (window.confirm('Are you sure you want to delete this emergency contact?')) {
      deleteContact(id);
      toast.success('Contact removed');
    }
  };

  const handleSetPriority = (id: string, priority: ContactPriority) => {
    setContactPriority(id, priority);
    toast.success('Contact priority updated');
  };

  const handleToggleActive = (id: string) => {
    toggleContactActive(id);
    toast.success('Contact status updated');
  };

  const testNotification = async () => {
    if (sortedContacts.length === 0) {
      toast.error('No active emergency contacts configured');
      return;
    }

    toast.success(`Test notification sent to ${sortedContacts.length} contact(s)`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin border-blue-600 h-8 w-8 rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Emergency Contacts</h1>
          <p className="text-gray-600 mt-1">
            Manage contacts who will be notified in case of an emergency
          </p>
        </div>
        <Dialog open={isAddingContact} onOpenChange={setIsAddingContact}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Emergency Contact</DialogTitle>
              <DialogDescription>
                Add someone who should be notified in case of an emergency
              </DialogDescription>
            </DialogHeader>
            <EmergencyContactForm
              onSubmit={handleAddContact}
              onCancel={() => setIsAddingContact(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="contacts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="contacts">
            Contacts ({sortedContacts.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Notification History ({events.length})
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-6">
          {sortedContacts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="text-gray-400 mx-auto mb-4 h-16 w-16" />
                <h3 className="text-lg font-semibold mb-2">No Emergency Contacts</h3>
                <p className="text-gray-600 mb-6">
                  Add emergency contacts to receive notifications in case of a fall or
                  emergency
                </p>
                <Button onClick={() => setIsAddingContact(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Contact
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {sortedContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className={contact.isActive ? '' : 'opacity-60'}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 flex h-12 w-12 items-center justify-center rounded-full">
                          <Users className="text-blue-600 h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {contact.name}
                            {contact.priority === 'primary' && (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            )}
                          </CardTitle>
                          <CardDescription className="capitalize">
                            {contact.relationship}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={
                            contact.priority === 'primary'
                              ? 'default'
                              : contact.priority === 'secondary'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {contact.priority}
                        </Badge>
                        {!contact.isActive && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{formatPhoneNumber(contact.phone)}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-gray-500" />
                        <span className="capitalize">
                          {contact.preferredMethods.join(', ')}
                        </span>
                      </div>
                      {contact.notificationCount > 0 && (
                        <div className="text-xs text-gray-500">
                          Notified {contact.notificationCount} time(s)
                          {contact.lastNotified && (
                            <span>
                              {' '}
                              (last:{' '}
                              {contact.lastNotified.toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingContact(contact)}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(contact.id)}
                      >
                        {contact.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          {sortedContacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={testNotification} variant="outline" className="w-full">
                  <Bell className="mr-2 h-4 w-4" />
                  Send Test Notification
                </Button>
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                  <strong>How it works:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Fall detection automatically triggers emergency alerts</li>
                    <li>You have {settings.countdownSeconds} seconds to cancel false alarms</li>
                    <li>Primary contacts are notified first, then secondary, then tertiary</li>
                    <li>Your location is shared with emergency contacts</li>
                    <li>Manual emergency button is always available</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Notification History Tab */}
        <TabsContent value="history">
          <EmergencyNotificationHistory events={events} contacts={contacts} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <EmergencyContactSettings
            settings={settings}
            onUpdate={updateSettings}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Contact Dialog */}
      {editingContact && (
        <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Emergency Contact</DialogTitle>
              <DialogDescription>
                Update contact information and preferences
              </DialogDescription>
            </DialogHeader>
            <EmergencyContactForm
              contact={editingContact}
              onSubmit={(data) => {
                handleUpdateContact(editingContact.id, data);
                setEditingContact(null);
              }}
              onCancel={() => setEditingContact(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
