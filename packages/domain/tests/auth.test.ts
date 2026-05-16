/**
 * Auth result factory tests.
 */

import { describe, expect, it } from 'vitest';
import { authSuccess, authFailure } from '../src/auth/index.js';
import type { UserId } from '../src/ids/index.js';

const USER_ID = '01HZ8XQN9GZJXV8AKQ5X0C7SR1' as UserId;

describe('authSuccess', () => {
  it('returns a successful result with user data', () => {
    const result = authSuccess(USER_ID, 'director', false);
    expect(result.success).toBe(true);
    expect(result.userId).toBe(USER_ID);
    expect(result.role).toBe('director');
    expect(result.mustChangePin).toBe(false);
  });

  it('preserves mustChangePin flag', () => {
    const result = authSuccess(USER_ID, 'operativo', true);
    expect(result.success).toBe(true);
    expect(result.mustChangePin).toBe(true);
    expect(result.role).toBe('operativo');
  });
});

describe('authFailure', () => {
  it('returns a failed result with null fields', () => {
    const result = authFailure();
    expect(result.success).toBe(false);
    expect(result.userId).toBeNull();
    expect(result.role).toBeNull();
    expect(result.mustChangePin).toBe(false);
  });
});
