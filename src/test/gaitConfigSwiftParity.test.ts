import { gaitConfig } from '@/lib/gaitConfig';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Simple regex helpers to extract assigned Double literals
function extractSwiftValue(swift: string, name: string): number | null {
  // Match static let <name>: Double = <number>, allowing indentation and optional sign
  // NOSONAR: Test file - name is from hardcoded test data, not user input
  // Sanitize name to prevent regex injection (defense in depth)
  const sanitizedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Limit name length to prevent ReDoS
  if (sanitizedName.length > 100) {
    throw new Error('Variable name too long');
  }
  const re = new RegExp(
    `static\\s+let\\s+${sanitizedName}\\s*:\\s*Double\\s*=\\s*([+-]?[0-9]*\\.?[0-9]+)`,
    'm'
  );
  const m = re.exec(swift);
  if (!m) return null;
  return parseFloat(m[1]!);
}

describe('GaitConfig Swift parity', () => {
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  // this file resides at <repoRoot>/src/test so ascend two segments to reach repo root
  const repoRoot = path.resolve(thisDir, '../..');
  const swiftPath = path.join(
    repoRoot,
    'ios',
    'HealthKitBridge',
    'Generated',
    'GaitConfig.swift'
  );
  it('Swift file exists', () => {
    expect(fs.existsSync(swiftPath)).toBe(true);
  });
  it('numeric constants match TypeScript config', () => {
    if (!fs.existsSync(swiftPath)) return;
    const swift = fs.readFileSync(swiftPath, 'utf-8');
    const checks: Array<[string, number]> = [
      [
        'stabilityRelativeSlopeThreshold',
        gaitConfig.stabilityRelativeSlopeThreshold,
      ],
      ['minimumConfidence', gaitConfig.minimumConfidence],
      ['strong', gaitConfig.magnitude.strong],
      ['moderate', gaitConfig.magnitude.moderate],
      ['relativeSlopeNormalizer', gaitConfig.momentum.relativeSlopeNormalizer],
      ['fallbackRelative', gaitConfig.momentum.fallbackRelative],
      ['upwardThreshold', gaitConfig.momentum.upwardThreshold],
      ['downwardThreshold', gaitConfig.momentum.downwardThreshold],
    ];
    for (const [swiftName, value] of checks) {
      const extracted = extractSwiftValue(swift, swiftName);
      expect(extracted).not.toBeNull();
      expect(extracted).toBeCloseTo(value, 9);
    }
  });
});
