import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface MobilityScoreCardProps {
  mobilityScore: number; // 0..100
  riskPercent: number; // 0..100
  topFactors?: Array<{ label: string; percent: number }>;
  onNavigate?: () => void;
}

function tone(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

export function MobilityScoreCard({
  mobilityScore,
  riskPercent,
  topFactors = [],
  onNavigate,
}: MobilityScoreCardProps) {
  const handleClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <Card
      className={onNavigate ? 'cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]' : ''}
      onClick={onNavigate ? handleClick : undefined}
      role={onNavigate ? 'button' : undefined}
      tabIndex={onNavigate ? 0 : undefined}
      onKeyDown={onNavigate ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      <CardHeader>
        <CardTitle>Mobility & Fall Risk</CardTitle>
        <CardDescription>
          Composite assessment from gait, posture, and stability
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="md:grid-cols-3 grid grid-cols-1 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="text-muted-foreground text-sm">Mobility Score</div>
            <div className={`text-3xl font-bold ${tone(mobilityScore)}`}>
              {mobilityScore}
            </div>
            <div className="text-xs text-muted-foreground">
              0–100 (higher is better)
            </div>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <div className="text-muted-foreground text-sm">
              Composite Fall Risk
            </div>
            <div className="text-3xl font-bold">{riskPercent.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">
              0–100% (lower is better)
            </div>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <div className="text-muted-foreground text-sm">
              Contributing Factors
            </div>
            <div className="text-xs text-muted-foreground">
              {topFactors.length === 0
                ? '—'
                : topFactors
                    .map((f) => `${f.label} ${f.percent.toFixed(0)}%`)
                    .join(' • ')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
