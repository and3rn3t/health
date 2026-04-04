/**
 * Risk Factor Detail View Component
 * Provides detailed explanations and actionable insights for each risk factor
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Lightbulb,
  Shield,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import React from 'react';
import type { RiskFactor, ProtectiveFactor } from '@/lib/advanced-fall-risk-engine';

interface RiskFactorDetailViewProps {
  riskFactor: RiskFactor;
  onInterventionClick?: (interventionId: string) => void;
  showInterventions?: boolean;
}

interface ProtectiveFactorDetailViewProps {
  protectiveFactor: ProtectiveFactor;
}

export function RiskFactorDetailView({
  riskFactor,
  onInterventionClick,
  showInterventions = true,
}: RiskFactorDetailViewProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'moderate':
        return 'bg-orange-500';
      case 'low':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'high') {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
    return <Info className="h-5 w-5 text-orange-600" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getSeverityIcon(riskFactor.severity)}
              {riskFactor.description}
            </CardTitle>
            <CardDescription className="mt-2">
              {riskFactor.explanation}
            </CardDescription>
          </div>
          <Badge
            className={`${getSeverityColor(riskFactor.severity)} text-white`}
          >
            {riskFactor.severity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
          <div>
            <div className="text-xs text-gray-500">Impact Weight</div>
            <div className="mt-1 text-lg font-semibold">
              {Math.round(riskFactor.weight * 100)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Modifiable</div>
            <div className="mt-1 text-sm font-medium">
              {riskFactor.modifiable ? (
                <span className="text-green-600">Yes - Can be improved</span>
              ) : (
                <span className="text-gray-600">No - Fixed factor</span>
              )}
            </div>
          </div>
        </div>

        {/* Category and Trend */}
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <Shield className="h-4 w-4 text-blue-500" />
          <div className="flex-1 text-sm">
            <span className="font-medium">Category:</span>{' '}
            <span className="capitalize">{riskFactor.category}</span>
            {' • '}
            <span className="font-medium">Trend:</span>{' '}
            <span className="capitalize">{riskFactor.trend}</span>
          </div>
        </div>

        {/* Detailed Explanation */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>Learn More</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 font-semibold">Category</h4>
              <Badge variant="outline" className="capitalize">
                {riskFactor.category}
              </Badge>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="mb-2 font-semibold">Trend</h4>
              <div className="flex items-center gap-2">
                {riskFactor.trend === 'improving' && (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                )}
                {riskFactor.trend === 'worsening' && (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                )}
                {riskFactor.trend === 'stable' && (
                  <Minus className="h-4 w-4 text-gray-600" />
                )}
                <span className="capitalize">{riskFactor.trend}</span>
              </div>
            </div>

            {riskFactor.interventions && riskFactor.interventions.length > 0 && (
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold">Related Interventions</h4>
                <div className="flex flex-wrap gap-2">
                  {riskFactor.interventions.map((interventionId, idx) => (
                    <Badge key={idx} variant="outline">
                      {interventionId}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Recommended Interventions */}
        {showInterventions && riskFactor.interventions && riskFactor.interventions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <h4 className="font-semibold">Related Interventions</h4>
            </div>
            <div className="space-y-2">
              {riskFactor.interventions.map((interventionId) => (
                <Alert key={interventionId} className="border-blue-200 bg-blue-50">
                  <AlertDescription className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">Intervention: {interventionId}</div>
                      <div className="text-xs text-gray-600">
                        Click to view details and start this intervention
                      </div>
                    </div>
                    {onInterventionClick && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onInterventionClick(interventionId)}
                        className="ml-4"
                      >
                        Start
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Modifiability Notice */}
        {!riskFactor.modifiable && (
          <Alert className="border-gray-200 bg-gray-50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm text-gray-600">
              This is a non-modifiable risk factor. While you cannot change this
              factor directly, you can focus on other modifiable factors and
              protective measures to reduce your overall fall risk.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export function ProtectiveFactorDetailView({
  protectiveFactor,
}: ProtectiveFactorDetailViewProps) {
  return (
    <Card className="w-full border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-green-800">
          <Shield className="h-5 w-5" />
          {protectiveFactor.description}
        </CardTitle>
        <CardDescription className="text-green-700 capitalize">
          Category: {protectiveFactor.category}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-green-300 bg-white p-3">
          <div className="text-xs text-gray-500">Protective Strength</div>
          <div className="mt-1 text-lg font-semibold text-green-700">
            {Math.round(protectiveFactor.strength * 100)}%
          </div>
        </div>

        {protectiveFactor.recommendations && protectiveFactor.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-green-800">Keep It Up!</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm text-green-700">
              {protectiveFactor.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
