import { FALL_RISK_ANALYTICS_VERSION } from '@/lib/fallRiskConfig';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('fallRiskConfigSwiftParity', () => {
  it('Swift artifact version should match TS version hash', () => {
    const swiftPath = 'ios/HealthKitBridge/Generated/FallRiskConfig.swift';
    if (!fs.existsSync(swiftPath)) {
      throw new Error(
        'Swift fall risk config artifact missing — run fallrisk:sync'
      );
    }
    const content = fs.readFileSync(swiftPath, 'utf8');
    const m = content.match(/version: String = "([0-9a-f]{8})"/);
    expect(m).toBeTruthy();
    const swiftVersion = m![1];
    expect(swiftVersion).toBe(FALL_RISK_ANALYTICS_VERSION);
  });
  it('JSON artifact version should match TS version hash', () => {
    const jsonPath = 'src/fixtures/fall-risk-config-export.json';
    if (!fs.existsSync(jsonPath))
      throw new Error('JSON fall risk artifact missing — run fallrisk:sync');
    const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as {
      version: string;
    };
    expect(parsed.version).toBe(FALL_RISK_ANALYTICS_VERSION);
  });
});
