import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, CheckCircle, Brain, Activity } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { HealthDataProcessor, ProcessedHealthData } from '@/lib/healthDataProcessor'

interface HealthDataImportProps {
  onDataImported: (data: ProcessedHealthData) => void
}

export default function HealthDataImport({ onDataImported }: HealthDataImportProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [processingStage, setProcessingStage] = useState('')
  const [processingProgress, setProcessingProgress] = useState(0)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setIsProcessing(true)
    setProcessingProgress(0)

    try {
      // Stage 1: File validation
      setProcessingStage('Validating file format...')
      setProcessingProgress(10)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Stage 2: Data extraction
      setProcessingStage('Extracting health metrics...')
      setProcessingProgress(30)
      await new Promise(resolve => setTimeout(resolve, 800))

      // Stage 3: Data processing
      setProcessingStage('Analyzing patterns and trends...')
      setProcessingProgress(60)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Stage 4: Generating insights
      setProcessingStage('Generating AI insights...')
      setProcessingProgress(80)
      await new Promise(resolve => setTimeout(resolve, 700))

      // Stage 5: Final processing
      setProcessingStage('Finalizing analysis...')
      setProcessingProgress(95)
      
      const processedData = await HealthDataProcessor.processHealthData(file)
      
      setProcessingProgress(100)
      setProcessingStage('Complete!')
      
      onDataImported(processedData)
      toast.success(`Health data processed successfully! Health Score: ${processedData.healthScore}/100`)
      
    } catch (error) {
      console.error('Processing error:', error)
      toast.error('Failed to process health data. Please try again.')
      setProcessingStage('Error occurred')
    } finally {
      setTimeout(() => {
        setIsProcessing(false)
        setProcessingStage('')
        setProcessingProgress(0)
      }, 1000)
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Export your health data from the Health app on your iPhone: Health → Profile → Export All Health Data. 
          This will create a zip file that you can upload here for comprehensive analysis.
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
          
          <div className="space-y-4 w-full max-w-xs">
            <Label htmlFor="health-file" className="sr-only">
              Health Data File
            </Label>
            <Input
              id="health-file"
              type="file"
              accept=".zip,.xml"
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
            
            {isProcessing && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Brain className="h-4 w-4 animate-pulse" />
                  {processingStage}
                </div>
                <Progress value={processingProgress} className="w-full" />
                <div className="text-xs text-muted-foreground">
                  {processingProgress}% complete
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5" />
              What We Analyze
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Activity metrics (steps, distance, calories)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Heart rate and cardiovascular data
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Walking steadiness and gait patterns
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Sleep quality and duration
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Balance and mobility indicators
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                Fall risk assessment and scoring
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                Trend analysis and predictions
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                Personalized health recommendations
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                Data quality and reliability scoring
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                Correlation and pattern detection
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}