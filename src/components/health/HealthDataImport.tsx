import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface HealthDataImportProps {
  onDataImported: (data: any) => void
}

export default function HealthDataImport({ onDataImported }: HealthDataImportProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setIsProcessing(true)

    try {
      // Simulate processing Apple Health export
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate mock health data
      const mockHealthData = {
        lastUpdated: new Date().toISOString(),
        metrics: {
          steps: {
            daily: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              value: Math.floor(Math.random() * 5000) + 3000
            })).reverse(),
            average: 6500,
            trend: 'increasing'
          },
          heartRate: {
            resting: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              value: Math.floor(Math.random() * 20) + 60
            })).reverse(),
            average: 68,
            trend: 'stable'
          },
          walkingSteadiness: {
            daily: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              value: Math.random() * 100
            })).reverse(),
            average: 75,
            trend: 'decreasing'
          },
          sleepHours: {
            daily: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              value: Math.random() * 3 + 6
            })).reverse(),
            average: 7.2,
            trend: 'stable'
          }
        },
        insights: [
          'Your walking steadiness has decreased by 15% over the past month',
          'Sleep quality appears to correlate with next-day activity levels',
          'Heart rate variability suggests good cardiovascular health',
          'Step count shows consistent improvement over the past week'
        ]
      }

      onDataImported(mockHealthData)
      toast.success('Health data imported successfully!')
      
    } catch (error) {
      toast.error('Failed to process health data. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Export your health data from the Health app on your iPhone: Health → Profile → Export All Health Data. 
          This will create a zip file that you can upload here.
        </AlertDescription>
      </Alert>

      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          {uploadedFile ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div>
                <p className="font-medium">File Ready</p>
                <p className="text-sm text-muted-foreground">{uploadedFile.name}</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium">Upload Apple Health Export</p>
                <p className="text-sm text-muted-foreground">
                  Select the exported zip file from your Health app
                </p>
              </div>
            </>
          )}
          
          <div className="space-y-4">
            <Label htmlFor="health-file" className="sr-only">
              Health Data File
            </Label>
            <Input
              id="health-file"
              type="file"
              accept=".zip,.xml"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="max-w-xs"
            />
            
            {uploadedFile && (
              <Button 
                onClick={() => handleFileUpload({ target: { files: [uploadedFile] } } as any)}
                disabled={isProcessing}
                className="w-full max-w-xs"
              >
                {isProcessing ? 'Processing...' : 'Process Health Data'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground space-y-2">
        <p><strong>What we analyze:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Activity metrics (steps, distance, exercise)</li>
          <li>Heart rate and cardiovascular data</li>
          <li>Walking steadiness and gait patterns</li>
          <li>Sleep quality and duration</li>
          <li>Balance and mobility indicators</li>
        </ul>
      </div>
    </div>
  )
}