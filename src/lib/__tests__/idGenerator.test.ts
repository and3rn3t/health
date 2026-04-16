import { describe, expect, it } from 'vitest';
import { generateSecureId, generateSecureUUID } from '../idGenerator';

describe('generateSecureId', () => {
  it('returns a string with default prefix', () => {
    const id = generateSecureId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('includes custom prefix', () => {
    const id = generateSecureId('test');
    expect(id.startsWith('test-')).toBe(true);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateSecureId()));
    expect(ids.size).toBe(50);
  });
});

describe('generateSecureUUID', () => {
  it('returns a valid UUID format', () => {
    const uuid = generateSecureUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('generates unique UUIDs', () => {
    const uuids = new Set(
      Array.from({ length: 50 }, () => generateSecureUUID())
    );
    expect(uuids.size).toBe(50);
  });
});
