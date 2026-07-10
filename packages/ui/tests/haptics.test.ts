/**
 * Haptics (web no-op) tests.
 *
 * These are no-op stubs on web — verify they don't throw.
 */

import { describe, expect, it } from 'vitest';
import {
  impactLight,
  impactMedium,
  notificationSuccess,
  notificationError,
} from '../src/haptics/haptics';

describe('haptics (web no-op)', () => {
  it('impactLight does not throw', () => {
    expect(() => impactLight()).not.toThrow();
  });

  it('impactMedium does not throw', () => {
    expect(() => impactMedium()).not.toThrow();
  });

  it('notificationSuccess does not throw', () => {
    expect(() => notificationSuccess()).not.toThrow();
  });

  it('notificationError does not throw', () => {
    expect(() => notificationError()).not.toThrow();
  });
});
