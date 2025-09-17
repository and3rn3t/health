import type { EnvironmentRisk } from '@/lib/lidar/processing';

export interface FallRiskLike {
  probability: number; // 0..1
  riskLevel: 'low' | 'moderate' | 'high';
}

export interface FusedRisk extends FallRiskLike {
  components: {
    physiological: number;
    environment: number;
  };
  explanation: string;
}

export function fuseRisks(
  physiological: FallRiskLike,
  environment: EnvironmentRisk,
  weights: { phys: number; env: number } = { phys: 0.7, env: 0.3 }
): FusedRisk {
  const p = Math.min(
    1,
    Math.max(
      0,
      weights.phys * physiological.probability +
        weights.env * environment.probability
    )
  );
  let riskLevel: FusedRisk['riskLevel'] = 'low';
  if (p >= 0.7) riskLevel = 'high';
  else if (p >= 0.4) riskLevel = 'moderate';
  return {
    probability: p,
    riskLevel,
    components: {
      physiological: physiological.probability,
      environment: environment.probability,
    },
    explanation: `Fused risk with weights phys=${weights.phys}, env=${weights.env} (slope ${environment.surface.slopeDeg.toFixed(
      1
    )}°, roughness ${environment.surface.roughness.toFixed(3)}m, obstacles ${environment.surface.obstacleDensity.toFixed(2)}/m^2)`,
  };
}
