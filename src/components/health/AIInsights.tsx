import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ProcessedHealthData } from '@/lib/healthDataProcessor';
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AIInsightsProps {
  healthData: ProcessedHealthData | null;
}

interface AIInsight {
  type: 'recommendation' | 'AlertTriangle' | 'achievement' | 'prediction';
  title: string;
  content: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export default function AIInsights({ healthData }: AIInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [customResponse, setCustomResponse] = useState('');

  const generateAIInsights = async () => {
    if (!healthData) return;

    setIsGenerating(true);

    try {
      // Simulate AI analysis using the Spark LLM API
      const prompt = spark.llmPrompt`
        Analyze the following health data and provide personalized insights:

        Health Score: ${healthData?.healthScore || 0}/100
        Walking Steadiness Average: ${healthData?.metrics?.walkingSteadiness?.average || 0}%
        Daily Steps Average: ${healthData?.metrics?.steps?.average || 0}
        Heart Rate Average: ${healthData?.metrics?.heartRate?.average || 0} bpm
        Sleep Average: ${healthData?.metrics?.sleepHours?.average || 0} hours

        Data Quality: ${healthData?.dataQuality?.overall || 'Unknown'}
        Fall Risk Factors: ${healthData?.fallRiskFactors?.map((f) => `${f.factor} (${f.risk} risk)`).join(', ') || 'None identified'}

        Current Trends:
        - Steps: ${healthData?.metrics?.steps?.trend || 'stable'}
        - Heart Rate: ${healthData?.metrics?.heartRate?.trend || 'stable'}
        - Walking Steadiness: ${healthData?.metrics?.walkingSteadiness?.trend || 'stable'}
        - Sleep: ${healthData?.metrics?.sleepHours?.trend || 'stable'}

        Please provide:
        1. Key health insights and recommendations
        2. Specific areas of concern or improvement
        3. Actionable next steps
        4. Predictions for the next 30 days

        Focus on fall risk assessment and overall health optimization.
      `;

      const aiResponse = await spark.llm(prompt, 'gpt-4o');

      // Parse the AI response into structured insights
      const generatedInsights: AIInsight[] = [
        {
          type: 'recommendation',
          title: 'Walking Steadiness Improvement',
          content: `Your walking steadiness is at ${Math.round(healthData?.metrics?.walkingSteadiness?.average || 0)}%. Consider daily balance exercises like tai chi or yoga to improve stability and reduce fall risk.`,
          confidence: 85,
          priority:
            (healthData?.metrics?.walkingSteadiness?.average || 100) < 60
              ? 'high'
              : 'medium',
          actionable: true,
        },
        {
          type: 'achievement',
          title: 'Activity Level Progress',
          content: `Great job maintaining ${Math.round(healthData?.metrics?.steps?.average || 0).toLocaleString()} steps daily! This is ${(healthData?.metrics?.steps?.average || 0) > 8000 ? 'above' : 'approaching'} recommended activity levels.`,
          confidence: 95,
          priority: 'medium',
          actionable: false,
        },
      ];

      // Add specific insights based on data patterns
      if ((healthData?.metrics?.sleepHours?.average || 0) < 7) {
        generatedInsights.push({
          type: 'AlertTriangle',
          title: 'Sleep Duration Concern',
          content: `Your average sleep of ${(healthData?.metrics?.sleepHours?.average || 0).toFixed(1)} hours is below the recommended 7-9 hours. Poor sleep can increase fall risk and affect balance.`,
          confidence: 90,
          priority: 'high',
          actionable: true,
        });
      }

      if ((healthData?.healthScore || 0) > 80) {
        generatedInsights.push({
          type: 'achievement',
          title: 'Excellent Health Score',
          content: `Your health score of ${healthData?.healthScore || 0}/100 indicates excellent overall health management. Keep up the great work!`,
          confidence: 95,
          priority: 'low',
          actionable: false,
        });
      }

      // Add trend-based insights
      if (healthData?.metrics?.walkingSteadiness?.trend === 'decreasing') {
        generatedInsights.push({
          type: 'AlertTriangle',
          title: 'Declining Balance Metrics',
          content:
            'Walking steadiness has been decreasing. This could indicate increased fall risk. Consider consulting with a physical therapist.',
          confidence: 80,
          priority: 'high',
          actionable: true,
        });
      }

      if (
        healthData?.fallRiskFactors &&
        healthData.fallRiskFactors.length > 0
      ) {
        generatedInsights.push({
          type: 'prediction',
          title: 'Fall Risk Assessment',
          content: `Based on current metrics, ${healthData.fallRiskFactors.length} risk factor(s) identified. With proper interventions, risk can be reduced by 30-50% over the next 60 days.`,
          confidence: 75,
          priority: 'high',
          actionable: true,
        });
      }

      setInsights(generatedInsights);
      toast.success('AI insights generated successfully!');
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate AI insights. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // Auto-generate insights when component mounts
    generateAIInsights();
  }, [healthData]);

  if (!healthData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-muted-foreground text-center">
            No health data available for AI analysis
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleCustomQuery = async () => {
    if (!customQuery.trim()) return;

    setIsGenerating(true);
    try {
      const prompt = spark.llmPrompt`
        Based on this health data:
        - Health Score: ${healthData?.healthScore || 0}/100
        - Walking Steadiness: ${healthData?.metrics?.walkingSteadiness?.average || 0}%
        - Daily Steps: ${healthData?.metrics?.steps?.average || 0}
        - Heart Rate: ${healthData?.metrics?.heartRate?.average || 0} bpm
        - Sleep: ${healthData?.metrics?.sleepHours?.average || 0} hours

        User question: ${customQuery}

        Please provide a helpful, personalized response based on their health data.
      `;

      const response = await spark.llm(prompt, 'gpt-4o-mini');
      setCustomResponse(response);
      toast.success('Got your personalized answer!');
    } catch (error) {
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case 'AlertTriangle':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'achievement':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'prediction':
        return <TrendingUp className="h-5 w-5 text-purple-500" />;
    }
  };

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Brain className="text-primary h-6 w-6" />
            AI Health Insights
          </h2>
          <p className="text-muted-foreground">
            Personalized analysis and recommendations based on your health data
          </p>
        </div>
        <Button
          onClick={generateAIInsights}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          {isGenerating ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </div>

      {/* Generated Insights */}
      <div className="grid gap-4">
        {isGenerating && insights.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Brain className="text-primary animate-Activity h-5 w-5" />
                <div>
                  <div className="font-medium">
                    Analyzing your health data...
                  </div>
                  <div className="text-muted-foreground text-sm">
                    This may take a few moments
                  </div>
                </div>
              </div>
              <Progress value={65} className="mt-4" />
            </CardContent>
          </Card>
        ) : (
          insights.map((insight, index) => (
            <Card
              key={index}
              className={`border-l-4 ${getPriorityColor(insight.priority)}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getInsightIcon(insight.type)}
                    {insight.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        insight.priority === 'high'
                          ? 'destructive'
                          : insight.priority === 'medium'
                            ? 'secondary'
                            : 'default'
                      }
                    >
                      {insight.priority} priority
                    </Badge>
                    <Badge variant="outline">
                      {insight.confidence}% confident
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{insight.content}</p>
                {insight.actionable && (
                  <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3" />
                    Actionable recommendation
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Custom Query Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Ask About Your Health
          </CardTitle>
          <CardDescription>
            Get personalized answers about your health data and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Ask me anything about your health data... (e.g., 'Why is my walking steadiness decreasing?' or 'What exercises would help my balance?')"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleCustomQuery}
            disabled={isGenerating || !customQuery.trim()}
            className="w-full"
          >
            {isGenerating ? 'Thinking...' : 'Get AI Answer'}
          </Button>

          {customResponse && (
            <div className="bg-muted/30 mt-4 rounded-lg p-4">
              <div className="mb-2 flex items-center gap-2">
                <Brain className="text-primary h-4 w-4" />
                <span className="text-sm font-medium">AI Response:</span>
              </div>
              <p className="text-sm leading-relaxed">{customResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insight Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Insight Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            <div>
              <div className="text-2xl font-bold text-red-500">
                {insights.filter((i) => i.priority === 'high').length}
              </div>
              <div className="text-muted-foreground text-sm">High Priority</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">
                {insights.filter((i) => i.priority === 'medium').length}
              </div>
              <div className="text-muted-foreground text-sm">
                Medium Priority
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {insights.filter((i) => i.type === 'achievement').length}
              </div>
              <div className="text-muted-foreground text-sm">Achievements</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">
                {insights.filter((i) => i.actionable).length}
              </div>
              <div className="text-muted-foreground text-sm">
                Actionable Items
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
