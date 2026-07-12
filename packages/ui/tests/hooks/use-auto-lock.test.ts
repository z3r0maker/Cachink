/**
 * useAutoLock constants and options tests.
 *
 * The actual timer/AppState behavior is heavily tied to React Native
 * internals. This file tests the exported constants and option set.
 */

import { describe, it, expect } from 'vitest';
import {
  AUTO_LOCK_OPTIONS,
  DEFAULT_AUTO_LOCK_TIMEOUT,
} from '../../src/hooks/use-auto-lock';

describe('AUTO_LOCK_OPTIONS', () => {
  it('has 6 options', () => {
    expect(AUTO_LOCK_OPTIONS).toHaveLength(6);
  });

  it('includes the default timeout (5 minutes)', () => {
    const fiveMin = AUTO_LOCK_OPTIONS.find((o) => o.value === 300_000);
    expect(fiveMin).toBeDefined();
    expect(fiveMin!.labelKey).toBe('autoLock.5min');
  });

  it('includes "never" option with value 0', () => {
    const never = AUTO_LOCK_OPTIONS.find((o) => o.value === 0);
    expect(never).toBeDefined();
    expect(never!.labelKey).toBe('autoLock.never');
  });

  it('options are in ascending order of timeout', () => {
    const values = AUTO_LOCK_OPTIONS.map((o) => o.value);
    // Last value is 0 (never), all others should be ascending
    const timeouts = values.filter((v) => v > 0);
    for (let i = 1; i < timeouts.length; i++) {
      expect(timeouts[i]).toBeGreaterThan(timeouts[i - 1]!);
    }
  });
});

describe('DEFAULT_AUTO_LOCK_TIMEOUT', () => {
  it('is 5 minutes (300000ms)', () => {
    expect(DEFAULT_AUTO_LOCK_TIMEOUT).toBe(300_000);
  });
});
