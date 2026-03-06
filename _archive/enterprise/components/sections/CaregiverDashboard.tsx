/**
 * Caregiver Dashboard Component
 * Dashboard for caregivers to monitor patient health
 */
import { Heart, Phone, Shield, Users } from 'lucide-react';

export default function CaregiverDashboard() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <Users className="h-12 w-12 text-teal-600 mx-auto mb-4" />
          <h1 className="text-foreground mb-2 text-3xl font-bold">
            Caregiver Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage patient health information and alerts
          </p>
        </div>

        <div className="md:grid-cols-2 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="bg-card border-border rounded-lg border p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <Heart className="text-red-500 h-8 w-8" />
              <span className="text-green-600 text-sm font-semibold">
                Normal
              </span>
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">
              Patient Status
            </h3>
            <p className="text-muted-foreground text-sm">
              All vital signs within normal ranges
            </p>
          </div>

          <div className="bg-card border-border rounded-lg border p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <Shield className="text-teal-500 h-8 w-8" />
              <span className="text-sm text-gray-500">No alerts</span>
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">
              Emergency Alerts
            </h3>
            <p className="text-muted-foreground text-sm">
              No active emergency situations
            </p>
          </div>

          <div className="bg-card border-border rounded-lg border p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <Phone className="text-blue-500 h-8 w-8" />
              <span className="text-sm text-gray-500">Available</span>
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">
              Emergency Contacts
            </h3>
            <p className="text-muted-foreground text-sm">
              3 contacts configured
            </p>
          </div>
        </div>

        <div className="bg-card border-border mt-8 rounded-lg border p-6 shadow-md">
          <h2 className="text-foreground mb-4 text-xl font-bold">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <div className="border-border flex items-center justify-between border-b py-2">
              <span className="text-foreground">Last health data sync</span>
              <span className="text-muted-foreground text-sm">
                5 minutes ago
              </span>
            </div>
            <div className="border-border flex items-center justify-between border-b py-2">
              <span className="text-foreground">Medication reminder sent</span>
              <span className="text-muted-foreground text-sm">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-foreground">Emergency drill completed</span>
              <span className="text-muted-foreground text-sm">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
