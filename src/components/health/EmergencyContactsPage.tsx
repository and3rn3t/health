import EmergencyContacts from '@/components/health/EmergencyContacts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useKV } from '@/hooks/useCloudflareKV';

// Local shape matching EmergencyContacts internal Contact type (structurally compatible)
interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
}

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useKV<Contact[]>('emergency-contacts', []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contacts</CardTitle>
          <CardDescription>
            Manage the contacts who will be notified in case of an emergency.
            These are stored locally for your privacy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmergencyContacts
            contacts={contacts ?? []}
            setContacts={setContacts}
          />
        </CardContent>
      </Card>
    </div>
  );
}
