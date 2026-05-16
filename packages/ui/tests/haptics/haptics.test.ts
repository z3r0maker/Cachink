/**
 * Haptics — web no-op tests.
 *
 * Verifies that the web-stub haptic functions are callable and don't
 * throw. Vitest resolves the `.ts` (web) variant since it runs in
 * Node / jsdom — never the `.native.ts` variant.
 */
import { describe, expect, it } from 'vitest';
import {
  impactLight,
  impactMedium,
  notificationSuccess,
  notificationError,
} from '../../src/haptics/index';

describe('haptics (web no-op)', () => {
  it('impactLight is callable and does not throw', () => {
    expect(() => impactLight()).not.toThrow();
  });

  it('impactMedium is callable and does not throw', () => {
    expect(() => impactMedium()).not.toThrow();
  });

  it('notificationSuccess is callable and does not throw', () => {
    expect(() => notificationSuccess()).not.toThrow();
  });

  it('notificationError is callable and does not throw', () => {
    expect(() => notificationError()).not.toThrow();
  });
});
