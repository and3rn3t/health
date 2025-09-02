import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Pill,
  Plus,
} from 'lucide-react';
import { useState } from 'react';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  nextDose?: string;
  taken: boolean;
  notes?: string;
}

export function MedicationTracker() {
  const [medications] = useState<Medication[]>([
    {
      id: '1',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      startDate: '2024-01-15',
      nextDose: '8:00 AM',
      taken: true,
      notes: 'Take with food',
    },
    {
      id: '2',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      startDate: '2024-02-01',
      nextDose: '2:00 PM',
      taken: false,
      notes: 'With meals',
    },
    {
      id: '3',
      name: 'Vitamin D3',
      dosage: '2000 IU',
      frequency: 'Once daily',
      startDate: '2024-01-01',
      nextDose: '9:00 AM',
      taken: true,
      notes: 'Supplement',
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  const todayTaken = medications.filter((med) => med.taken).length;
  const totalToday = medications.length;

  const getProgressWidth = () => {
    if (todayTaken === 0) return 'w-0';
    if (todayTaken === totalToday) return 'w-full';
    return 'w-2/3';
  };

  const progressWidth = getProgressWidth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Medication Tracker</h1>
        <p className="text-muted-foreground mt-2">
          Keep track of your medications, dosages, and schedules to maintain
          your health regimen.
        </p>
      </div>

      {/* Today's Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-vitalsense-primary" />
            Today's Medications
          </CardTitle>
          <CardDescription>
            Track your daily medication schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-vitalsense-primary">
                {todayTaken}/{totalToday}
              </div>
              <div className="text-muted-foreground text-sm">
                medications taken today
              </div>
            </div>
            <div className="flex items-center gap-2">
              {todayTaken === totalToday ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Complete
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Clock className="mr-1 h-3 w-3" />
                  In Progress
                </Badge>
              )}
            </div>
          </div>

          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full bg-vitalsense-primary transition-all ${progressWidth}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Medication List */}
      <div className="grid gap-4">
        {medications.map((medication) => (
          <Card
            key={medication.id}
            className={medication.taken ? 'bg-green-50' : ''}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-vitalsense-primary/10 rounded-lg p-2 text-vitalsense-primary">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{medication.name}</CardTitle>
                    <CardDescription>
                      {medication.dosage} • {medication.frequency}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {medication.taken ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Taken
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label className="text-muted-foreground text-sm">
                    Next Dose
                  </Label>
                  <div className="font-medium">{medication.nextDose}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">
                    Started
                  </Label>
                  <div className="font-medium">{medication.startDate}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">
                    Frequency
                  </Label>
                  <div className="font-medium">{medication.frequency}</div>
                </div>
                {medication.notes && (
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Notes
                    </Label>
                    <div className="font-medium">{medication.notes}</div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {!medication.taken ? (
                  <Button size="sm" className="flex-1">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Taken
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="flex-1">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Undo
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Bell className="mr-2 h-4 w-4" />
                  Set Reminder
                </Button>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Medication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-vitalsense-primary" />
            Add New Medication
          </CardTitle>
          <CardDescription>
            Add a new medication to your tracking list
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showAddForm ? (
            <Button onClick={() => setShowAddForm(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Medication
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="med-name">Medication Name</Label>
                  <Input id="med-name" placeholder="e.g., Lisinopril" />
                </div>
                <div>
                  <Label htmlFor="med-dosage">Dosage</Label>
                  <Input id="med-dosage" placeholder="e.g., 10mg" />
                </div>
                <div>
                  <Label htmlFor="med-frequency">Frequency</Label>
                  <Input id="med-frequency" placeholder="e.g., Once daily" />
                </div>
                <div>
                  <Label htmlFor="med-time">Time</Label>
                  <Input id="med-time" type="time" />
                </div>
              </div>
              <div>
                <Label htmlFor="med-notes">Notes (optional)</Label>
                <Input id="med-notes" placeholder="e.g., Take with food" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Save Medication</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MedicationTracker;
