/**
 * Auth result factory tests.
 */

import { describe, expect, it } from 'vitest';
import { authSuccess, authFailure } from '../src/auth/index.js';
import type { UserId } from '../src/ids/index.js';

const USER_ID = '01HZ8XQN9GZJXV8AKQ5X0C7SR1' as UserId;

describe('authSuccess', () => {
  it('returns a successful result carrying only the operator id', () => {
    expect(authSuccess(USER_ID)).toEqual({ success: true, userId: USER_ID });
  });
});

describe('authFailure', () => {
  it('returns a failed result with no user', () => {
    expect(authFailure()).toEqual({ success: false, userId: null });
  });
});
