import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAIT_ANALYTICS_VERSION, gaitConfig } from '../gaitConfig';

/** Parity between TS gaitConfig, JSON export, and Swift generated artifact version. */
describe('gaitConfig Swift parity', () => {
  const jsonPath = path.resolve(
    __dirname,
    '../../fixtures/gait-config-export.json'
  );
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  it('JSON artifact matches in-memory config shape & values', () => {
    expect(json.config).toEqual(gaitConfig);
  });

  it('JSON artifact version hash matches computed hash', () => {
    expect(json.version).toBe(GAIT_ANALYTICS_VERSION);
  });
});
