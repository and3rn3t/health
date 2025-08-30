import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Phone, Mail, Trash2, Shield } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Contact {
  id: string
  name: string
  phone: string
  email?: string
  relationship: string
  isPrimary: boolean
}

interface EmergencyContactsProps {
  contacts: Contact[]
  setContacts: (contacts: Contact[]) => void
}

export default function EmergencyContacts({ contacts, setContacts }: EmergencyContactsProps) {
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: '',
    isPrimary: false
  })

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone || !newContact.relationship) {
      toast.error('Please fill in all required fields')
      return
    }

    const contact: Contact = {
      id: Date.now().toString(),
      name: newContact.name,
      phone: newContact.phone,
      email: newContact.email,
      relationship: newContact.relationship,
      isPrimary: contacts.length === 0 || newContact.isPrimary
    }

    let updatedContacts = [...contacts, contact]
    
    // If this is set as primary, remove primary from others
    if (contact.isPrimary) {
      updatedContacts = updatedContacts.map(c => 
        c.id === contact.id ? c : { ...c, isPrimary: false }
      )
    }

    setContacts(updatedContacts)
    setNewContact({ name: '', phone: '', email: '', relationship: '', isPrimary: false })
    setIsAddingContact(false)
    toast.success('Emergency contact added successfully')
  }

  const handleDeleteContact = (contactId: string) => {
    const updatedContacts = contacts.filter(c => c.id !== contactId)
    setContacts(updatedContacts)
    toast.success('Contact removed')
  }

  const handleSetPrimary = (contactId: string) => {
    const updatedContacts = contacts.map(c => ({
      ...c,
      isPrimary: c.id === contactId
    }))
    setContacts(updatedContacts)
    toast.success('Primary contact updated')
  }

  const testEmergencyAlert = async () => {
    if (contacts.length === 0) {
      toast.error('No emergency contacts configured')
      return
    }

    // Simulate emergency alert
    toast.success('Test alert sent to emergency contacts')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Emergency Contacts
              </CardTitle>
              <CardDescription>
                Configure contacts who will be notified in case of a fall or emergency
              </CardDescription>
            </div>
            <Dialog open={isAddingContact} onOpenChange={setIsAddingContact}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Emergency Contact</DialogTitle>
                  <DialogDescription>
                    Add someone who should be notified in case of an emergency
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Full Name *</Label>
                    <Input
                      id="contact-name"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Phone Number *</Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email (Optional)</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact-relationship">Relationship *</Label>
                    <Select 
                      value={newContact.relationship} 
                      onValueChange={(value) => setNewContact({ ...newContact, relationship: value })}
                    >
                      <SelectTrigger>
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
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is-primary"
                      checked={newContact.isPrimary}
                      onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="is-primary" className="text-sm">
                      Set as primary contact (first to be notified)
                    </Label>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddContact} className="flex-1">
                      Add Contact
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddingContact(false)}
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
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No emergency contacts configured</p>
              <p className="text-sm text-muted-foreground">
                Add contacts who should be notified in case of a fall or emergency
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{contact.name}</h3>
                        {contact.isPrimary && (
                          <Badge variant="default" className="text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </div>
                        {contact.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </div>
                        )}
                        <p className="capitalize">{contact.relationship}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!contact.isPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(contact.id)}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Emergency Alert Settings
            </CardTitle>
            <CardDescription>
              Configure how emergency alerts are sent to your contacts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">How it works:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Fall detection automatically triggers emergency alert</li>
                <li>• You have 30 seconds to cancel false alarms</li>
                <li>• Primary contact is notified first, then others</li>
                <li>• Your location is shared with emergency contacts</li>
                <li>• Manual emergency button is always available</li>
              </ul>
            </div>
            
            <Button 
              onClick={testEmergencyAlert} 
              variant="outline" 
              className="w-full"
            >
              Test Emergency Alert
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}