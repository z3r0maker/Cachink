import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  MAX_PIN_FAILURES,
  NO_LOCKOUT,
  PIN_COOLDOWN_MS,
  parsePinLockout,
  recordPinFailure,
  remainingLockMs,
} from '../../src/app/pin-lockout';

const t0 = new Date('2026-09-16T12:00:00.000Z');

function failTimes(n: number) {
  let s = NO_LOCKOUT;
  for (let i = 0; i < n; i += 1) s = recordPinFailure(s, t0);
  return s;
}

describe('pin lockout', () => {
  it('does not lock before the fifth failure', () => {
    const s = failTimes(MAX_PIN_FAILURES - 1);
    assert.equal(s.failures, MAX_PIN_FAILURES - 1);
    assert.equal(remainingLockMs(s, t0), 0);
  });

  it('locks for 30 s on the fifth failure and restarts the count', () => {
    const s = failTimes(MAX_PIN_FAILURES);
    assert.equal(remainingLockMs(s, t0), PIN_COOLDOWN_MS);
    assert.equal(s.failures, 0);
  });

  it('unlocks once the cooldown elapses', () => {
    const s = failTimes(MAX_PIN_FAILURES);
    assert.equal(remainingLockMs(s, new Date(t0.getTime() + PIN_COOLDOWN_MS)), 0);
  });

  it('treats missing or corrupt stored state as no lockout', () => {
    assert.deepEqual(parsePinLockout(null), NO_LOCKOUT);
    assert.deepEqual(parsePinLockout('{not json'), NO_LOCKOUT);
    assert.deepEqual(parsePinLockout('{"failures":-3,"lockedUntil":7}'), NO_LOCKOUT);
  });
});
