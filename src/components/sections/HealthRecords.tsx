/**
 * Health Records Component
 * Manage and view health records and medical history
 */
import { CloudUpload, FileText, Download, Calendar } from 'lucide-react';

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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <CloudUpload className="mx-auto h-12 w-12 text-teal-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Health Records
          </h1>
          <p className="text-gray-600">
            Securely store and manage your medical records and health data
          </p>
        </div>

        <div className="mb-8">
          <button className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">
            Upload New Record
          </button>
        </div>

        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {record.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {record.type} • {record.provider}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{record.date}</span>
                      </span>
                      <span>{record.size}</span>
                    </div>
                  </div>
                </div>
                <button className="flex items-center space-x-2 text-teal-600 hover:text-teal-700">
                  <Download className="h-5 w-5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Secure Storage
          </h2>
          <p className="text-gray-600">
            All your health records are encrypted and stored securely. Only you and 
            authorized healthcare providers can access this information.
          </p>
        </div>
      </div>
    </div>
  );
}
