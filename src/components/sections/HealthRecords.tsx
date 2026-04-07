/**
 * Health Records Component
 * Manage and view health records and medical history
 */
import { Calendar, CloudUpload, Download, FileText } from '@/lib/icons';

export default function HealthRecords() {
  const records = [
    {
      id: 1,
      name: 'Annual Physical Exam',
      date: '2024-01-15',
      type: 'Medical Report',
      provider: 'Dr. Smith - Family Medicine',
      size: '2.4 MB',
    },
    {
      id: 2,
      name: 'Blood Test Results',
      date: '2024-01-10',
      type: 'Lab Results',
      provider: 'City Medical Lab',
      size: '1.1 MB',
    },
    {
      id: 3,
      name: 'Heart Rate Monitoring Data',
      date: '2024-01-05',
      type: 'Health Data',
      provider: 'VitalSense App',
      size: '856 KB',
    },
  ];

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <CloudUpload className="mx-auto mb-4 h-12 w-12 text-teal-600" />
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Health Records
          </h1>
          <p className="text-muted-foreground">
            Securely store and manage your medical records and health data
          </p>
        </div>

        <div className="mb-8">
          <button className="hover:bg-vitalsense-teal-dark rounded-lg bg-vitalsense-teal px-6 py-3 text-white transition-colors">
            Upload New Record
          </button>
        </div>

        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="rounded-lg border border-border bg-card p-6 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {record.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {record.type} • {record.provider}
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{record.date}</span>
                      </span>
                      <span>{record.size}</span>
                    </div>
                  </div>
                </div>
                <button className="hover:text-vitalsense-teal-dark flex items-center space-x-2 text-vitalsense-teal">
                  <Download className="h-5 w-5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Secure Storage
          </h2>
          <p className="text-muted-foreground">
            All your health records are encrypted and stored securely. Only you
            and authorized healthcare providers can access this information.
          </p>
        </div>
      </div>
    </div>
  );
}
