import { describe, expect, it } from 'vitest';
import {
  API_TIMING,
  MOTION,
  TOAST_DURATION,
  WS_TIMING,
} from '../../lib/motion-tokens';

describe('Motion Tokens', () => {
  describe('MOTION (UI animation durations)', () => {
    it('should define fast, base, and slow durations', () => {
      expect(MOTION.fast).toBe(120);
      expect(MOTION.base).toBe(180);
      expect(MOTION.slow).toBe(300);
    });

    it('should have durations in ascending order', () => {
      expect(MOTION.fast).toBeLessThan(MOTION.base);
      expect(MOTION.base).toBeLessThan(MOTION.slow);
    });
  });

  describe('TOAST_DURATION', () => {
    it('should define default, short, and long durations', () => {
      expect(TOAST_DURATION.default).toBe(5_000);
      expect(TOAST_DURATION.short).toBe(3_000);
      expect(TOAST_DURATION.long).toBe(8_000);
    });

    it('should have durations in ascending order', () => {
      expect(TOAST_DURATION.short).toBeLessThan(TOAST_DURATION.default);
      expect(TOAST_DURATION.default).toBeLessThan(TOAST_DURATION.long);
    });
  });

  describe('WS_TIMING (WebSocket timing)', () => {
    it('should define reconnect, ping, connection, and throttle values', () => {
      expect(WS_TIMING.reconnectDelay).toBe(2_000);
      expect(WS_TIMING.pingInterval).toBe(30_000);
      expect(WS_TIMING.connectionTimeout).toBe(10_000);
      expect(WS_TIMING.connectionThrottle).toBe(5_000);
    });

    it('should have reconnectDelay shorter than connectionTimeout', () => {
      expect(WS_TIMING.reconnectDelay).toBeLessThan(
        WS_TIMING.connectionTimeout
      );
    });
  });

  describe('API_TIMING', () => {
    it('should define a default fetch timeout', () => {
      expect(API_TIMING.timeout).toBe(10_000);
    });
  });
});
