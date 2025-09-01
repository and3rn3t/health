import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Plus,
  MapPin,
  Clock,
  Activity,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface FallIncident {
  id: string;
  date: string;
  time: string;
  location: string;
  fallType: string;
  injuryLevel: string;
  injuryDescription: string;
  circumstances: string;
  helpReceived: boolean;
  hospitalVisit: boolean;
  notes: string;
}

export default function FallHistory() {
  const [fallHistory, setFallHistory] = useKV(
    'fall-history',
    [] as FallIncident[]
  );
  const [isAddingIncident, setIsAddingIncident] = useState(false);
  const [newIncident, setNewIncident] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    fallType: '',
    injuryLevel: '',
    injuryDescription: '',
    circumstances: '',
    helpReceived: false,
    hospitalVisit: false,
    notes: '',
  });

  const handleAddIncident = () => {
    if (
      !newIncident.location ||
      !newIncident.fallType ||
      !newIncident.injuryLevel
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    const incident: FallIncident = {
      id: Date.now().toString(),
      ...newIncident,
    };

    setFallHistory((currentHistory) => [incident, ...currentHistory]);
    setNewIncident({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      location: '',
      fallType: '',
      injuryLevel: '',
      injuryDescription: '',
      circumstances: '',
      helpReceived: false,
      hospitalVisit: false,
      notes: '',
    });
    setIsAddingIncident(false);
    toast.success('Fall incident recorded');
  };

  const getInjuryBadgeVariant = (level: string) => {
    switch (level) {
      case 'none':
        return 'default';
      case 'minor':
        return 'secondary';
      case 'moderate':
        return 'destructive';
      case 'severe':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getInsights = () => {
    if (fallHistory.length === 0) return [];

    const insights = [];

    // Location analysis
    const locationCounts: { [key: string]: number } = {};
    fallHistory.forEach((incident) => {
      locationCounts[incident.location] =
        (locationCounts[incident.location] || 0) + 1;
    });
    const mostCommonLocation = Object.entries(locationCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];
    if (mostCommonLocation && mostCommonLocation[1] > 1) {
      insights.push(
        `Most falls occur in: ${mostCommonLocation[0]} (${mostCommonLocation[1]} incidents)`
      );
    }

    // Time analysis
    const recentFalls = fallHistory.filter((incident) => {
      const incidentDate = new Date(incident.date);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return incidentDate > thirtyDaysAgo;
    });
    if (recentFalls.length > 0) {
      insights.push(`${recentFalls.length} fall(s) in the past 30 days`);
    }

    // Injury pattern
    const injuryLevels = fallHistory.map((i) => i.injuryLevel);
    const severeInjuries = injuryLevels.filter(
      (level) => level === 'moderate' || level === 'severe'
    ).length;
    if (severeInjuries > 0) {
      insights.push(
        `${severeInjuries} fall(s) resulted in moderate to severe injuries`
      );
    }

    return insights;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Fall History & Tracking
              </CardTitle>
              <CardDescription>
                Record and analyze fall incidents to identify patterns and
                improve safety
              </CardDescription>
            </div>
            <Dialog open={isAddingIncident} onOpenChange={setIsAddingIncident}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Fall
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Record Fall Incident</DialogTitle>
                  <DialogDescription>
                    Document details about the fall to help identify patterns
                    and improve prevention
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="incident-date">Date *</Label>
                      <Input
                        id="incident-date"
                        type="date"
                        value={newIncident.date}
                        onChange={(e) =>
                          setNewIncident({
                            ...newIncident,
                            date: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="incident-time">Time *</Label>
                      <Input
                        id="incident-time"
                        type="time"
                        value={newIncident.time}
                        onChange={(e) =>
                          setNewIncident({
                            ...newIncident,
                            time: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incident-location">Location *</Label>
                    <Select
                      value={newIncident.location}
                      onValueChange={(value) =>
                        setNewIncident({ ...newIncident, location: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Where did the fall occur?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bedroom">Bedroom</SelectItem>
                        <SelectItem value="bathroom">Bathroom</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="living-room">Living Room</SelectItem>
                        <SelectItem value="stairs">Stairs</SelectItem>
                        <SelectItem value="hallway">Hallway</SelectItem>
                        <SelectItem value="outdoors">Outdoors</SelectItem>
                        <SelectItem value="garage">Garage</SelectItem>
                        <SelectItem value="basement">Basement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fall-type">Type of Fall *</Label>
                    <Select
                      value={newIncident.fallType}
                      onValueChange={(value) =>
                        setNewIncident({ ...newIncident, fallType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How did the fall happen?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trip">
                          Tripped over something
                        </SelectItem>
                        <SelectItem value="slip">Slipped on surface</SelectItem>
                        <SelectItem value="balance">Lost balance</SelectItem>
                        <SelectItem value="dizziness">
                          Dizziness/fainting
                        </SelectItem>
                        <SelectItem value="weakness">Leg weakness</SelectItem>
                        <SelectItem value="stairs">Fell down stairs</SelectItem>
                        <SelectItem value="getting-up">
                          Getting up from chair/bed
                        </SelectItem>
                        <SelectItem value="walking">While walking</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="injury-level">Injury Level *</Label>
                    <Select
                      value={newIncident.injuryLevel}
                      onValueChange={(value) =>
                        setNewIncident({ ...newIncident, injuryLevel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Level of injury sustained" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No injury</SelectItem>
                        <SelectItem value="minor">
                          Minor (bruises, scratches)
                        </SelectItem>
                        <SelectItem value="moderate">
                          Moderate (sprains, cuts)
                        </SelectItem>
                        <SelectItem value="severe">
                          Severe (fractures, head injury)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newIncident.injuryLevel &&
                    newIncident.injuryLevel !== 'none' && (
                      <div className="space-y-2">
                        <Label htmlFor="injury-description">
                          Injury Description
                        </Label>
                        <Input
                          id="injury-description"
                          value={newIncident.injuryDescription}
                          onChange={(e) =>
                            setNewIncident({
                              ...newIncident,
                              injuryDescription: e.target.value,
                            })
                          }
                          placeholder="Describe the injuries (e.g., bruised left hip, cut on hand)"
                        />
                      </div>
                    )}

                  <div className="space-y-2">
                    <Label htmlFor="circumstances">Circumstances</Label>
                    <Textarea
                      id="circumstances"
                      value={newIncident.circumstances}
                      onChange={(e) =>
                        setNewIncident({
                          ...newIncident,
                          circumstances: e.target.value,
                        })
                      }
                      placeholder="What were you doing when you fell? Any contributing factors?"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="help-received"
                        checked={newIncident.helpReceived}
                        onChange={(e) =>
                          setNewIncident({
                            ...newIncident,
                            helpReceived: e.target.checked,
                          })
                        }
                        className="h-4 w-4"
                      />
                      <Label htmlFor="help-received" className="text-sm">
                        Received help from someone
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="hospital-visit"
                        checked={newIncident.hospitalVisit}
                        onChange={(e) =>
                          setNewIncident({
                            ...newIncident,
                            hospitalVisit: e.target.checked,
                          })
                        }
                        className="h-4 w-4"
                      />
                      <Label htmlFor="hospital-visit" className="text-sm">
                        Required medical attention/hospital visit
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={newIncident.notes}
                      onChange={(e) =>
                        setNewIncident({
                          ...newIncident,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Any other relevant information about this incident"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddIncident} className="flex-1">
                      Record Incident
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingIncident(false)}
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
          {fallHistory.length === 0 ? (
            <div className="py-8 text-center">
              <Activity className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground mb-2">
                No fall incidents recorded
              </p>
              <p className="text-muted-foreground text-sm">
                Recording fall incidents helps identify patterns and improve
                prevention strategies
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Insights */}
              {getInsights().length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Fall Pattern Insights
                  </h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    {getInsights().map((insight, index) => (
                      <li key={index}>• {insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fall History List */}
              {fallHistory.map((incident) => (
                <div
                  key={incident.id}
                  className="space-y-3 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-accent/10 flex h-12 w-12 items-center justify-center rounded-full">
                        <AlertTriangle className="text-accent h-6 w-6" />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <Clock className="text-muted-foreground h-4 w-4" />
                          <span className="font-medium">
                            {new Date(incident.date).toLocaleDateString()} at{' '}
                            {incident.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="text-muted-foreground h-4 w-4" />
                          <span className="text-muted-foreground text-sm capitalize">
                            {incident.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={getInjuryBadgeVariant(incident.injuryLevel)}
                    >
                      {incident.injuryLevel} injury
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div>
                      <span className="font-medium">Fall Type:</span>{' '}
                      {incident.fallType}
                    </div>
                    {incident.injuryDescription && (
                      <div>
                        <span className="font-medium">Injury:</span>{' '}
                        {incident.injuryDescription}
                      </div>
                    )}
                    {incident.circumstances && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Circumstances:</span>{' '}
                        {incident.circumstances}
                      </div>
                    )}
                    {incident.notes && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Notes:</span>{' '}
                        {incident.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 text-xs">
                    {incident.helpReceived && (
                      <Badge variant="outline">Help Received</Badge>
                    )}
                    {incident.hospitalVisit && (
                      <Badge variant="destructive">Medical Attention</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
