import { describe, expect, it } from 'vitest';
import {
  VitalSenseColors,
  HealthColorMap,
  getVitalSenseClasses,
} from '../vitalsense-colors';

describe('VitalSenseColors', () => {
  it('exports primary color palette', () => {
    expect(VitalSenseColors.primary).toBeDefined();
    expect(VitalSenseColors.primary.main).toBeDefined();
    expect(typeof VitalSenseColors.primary.main).toBe('string');
  });

  it('exports all required palettes', () => {
    expect(VitalSenseColors.teal).toBeDefined();
    expect(VitalSenseColors.success).toBeDefined();
    expect(VitalSenseColors.warning).toBeDefined();
    expect(VitalSenseColors.error).toBeDefined();
  });
});

describe('HealthColorMap', () => {
  it('has heartRate zone mappings', () => {
    expect(HealthColorMap.heartRate).toBeDefined();
  });

  it('has fallRisk level mappings', () => {
    expect(HealthColorMap.fallRisk).toBeDefined();
  });
});

describe('getVitalSenseClasses', () => {
  it('exposes bg, text, and border class maps', () => {
    expect(getVitalSenseClasses.bg).toBeDefined();
    expect(getVitalSenseClasses.text).toBeDefined();
    expect(getVitalSenseClasses.border).toBeDefined();
  });

  it('maps primary to a Tailwind utility class', () => {
    expect(getVitalSenseClasses.bg.primary).toMatch(/^bg-vitalsense/);
  });
});
