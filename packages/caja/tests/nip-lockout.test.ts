import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  MAX_PIN_FAILURES,
  NO_LOCKOUT,
  NO_LOCKOUTS,
  PIN_LOCK_LADDER_MS,
  fraseEsperaNip,
  lockoutOf,
  parsePinLockouts,
  recordPinFailure,
  remainingLockMs,
  withLockout,
  type PinLockoutState,
} from '../src/nip';

const t0 = new Date('2026-09-16T12:00:00.000Z');
const later = (ms: number): Date => new Date(t0.getTime() + ms);

/** `n` wrong NIPs in a row, all at `at`. */
function fail(state: PinLockoutState, n: number, at: Date): PinLockoutState {
  let s = state;
  for (let i = 0; i < n; i += 1) s = recordPinFailure(s, at);
  return s;
}

describe('NIP lockout: the ladder', () => {
  it('does not lock before the fifth failure', () => {
    const s = fail(NO_LOCKOUT, MAX_PIN_FAILURES - 1, t0);
    assert.equal(s.failures, MAX_PIN_FAILURES - 1);
    assert.equal(s.level, 0);
    assert.equal(remainingLockMs(s, t0), 0);
  });

  it('locks for 30 s on the fifth failure and restarts the count', () => {
    const s = fail(NO_LOCKOUT, MAX_PIN_FAILURES, t0);
    assert.equal(remainingLockMs(s, t0), 30_000);
    assert.equal(s.failures, 0);
    assert.equal(s.level, 1);
  });

  it('makes each consecutive lockout longer, then stays at one hour', () => {
    const expected = [30_000, 60_000, 300_000, 900_000, 3_600_000, 3_600_000, 3_600_000];
    assert.deepEqual([...PIN_LOCK_LADDER_MS], expected.slice(0, 5));
    let s = NO_LOCKOUT;
    let now = t0;
    for (const ms of expected) {
      s = fail(s, MAX_PIN_FAILURES, now);
      assert.equal(remainingLockMs(s, now), ms);
      now = new Date(now.getTime() + ms);
      assert.equal(remainingLockMs(s, now), 0);
    }
  });

  it('keeps the level once the cooldown has elapsed', () => {
    const locked = fail(NO_LOCKOUT, MAX_PIN_FAILURES, t0);
    const after = later(30_000);
    assert.equal(remainingLockMs(locked, after), 0);
    const again = fail(locked, MAX_PIN_FAILURES - 1, after);
    assert.equal(again.level, 1);
    assert.equal(remainingLockMs(again, after), 0);
    assert.equal(remainingLockMs(recordPinFailure(again, after), after), 60_000);
  });

  it('never waits longer than the rung in force, whatever the stored time says', () => {
    // A clock that ran a year ahead when the lock started, then came back.
    const ahead = later(365 * 86_400_000);
    const s = fail(NO_LOCKOUT, MAX_PIN_FAILURES, ahead);
    assert.equal(remainingLockMs(s, t0), 30_000);
  });
});

describe('NIP lockout: what is stored, per NIP owner', () => {
  const ANA = '01JPRS00000000000000000002';
  const TONI = '01JPRS00000000000000000001';

  it('keeps one lockout per subject and answers a clean one for anyone else', () => {
    const locked = fail(NO_LOCKOUT, MAX_PIN_FAILURES, t0);
    const book = withLockout(NO_LOCKOUTS, ANA, locked);
    assert.deepEqual(lockoutOf(book, ANA), locked);
    assert.deepEqual(lockoutOf(book, TONI), NO_LOCKOUT);
    assert.deepEqual(lockoutOf(book, 'toString'), NO_LOCKOUT);
  });

  it('round-trips the versioned map', () => {
    const one = withLockout(NO_LOCKOUTS, ANA, fail(NO_LOCKOUT, MAX_PIN_FAILURES, t0));
    const two = withLockout(one, TONI, fail(NO_LOCKOUT, 2, t0));
    const raw = JSON.stringify(two);
    assert.deepEqual(JSON.parse(raw), {
      v: 2,
      by: {
        [ANA]: { failures: 0, lockedUntil: later(30_000).toISOString(), level: 1 },
        [TONI]: { failures: 2, lockedUntil: null, level: 0 },
      },
    });
    assert.deepEqual(parsePinLockouts(raw), two);
  });

  it('drops the entries that are clean, so the map cannot grow without limit', () => {
    const book = withLockout(NO_LOCKOUTS, ANA, fail(NO_LOCKOUT, 3, t0));
    const both = withLockout(book, TONI, fail(NO_LOCKOUT, 1, t0));
    const cleared = withLockout(both, ANA, NO_LOCKOUT);
    assert.deepEqual(Object.keys(cleared.by), [TONI]);
    assert.deepEqual(withLockout(cleared, TONI, NO_LOCKOUT), NO_LOCKOUTS);
    // A clean entry that reached the store some other way goes on the next write.
    const stale = parsePinLockouts(JSON.stringify({ v: 2, by: { [ANA]: NO_LOCKOUT } }));
    assert.deepEqual(withLockout(stale, TONI, NO_LOCKOUT), NO_LOCKOUTS);
  });

  it('keeps a served lockout: the level outlives the cooldown', () => {
    const served = { failures: 0, lockedUntil: later(-60_000).toISOString(), level: 2 };
    assert.deepEqual(withLockout(NO_LOCKOUTS, ANA, served).by, { [ANA]: served });
  });

  it('reads the shape stored before the ladder as no lockouts, without throwing', () => {
    const counting = '{"failures":3,"lockedUntil":null}';
    const locked = `{"failures":0,"lockedUntil":"${later(20_000).toISOString()}"}`;
    assert.deepEqual(parsePinLockouts(counting), NO_LOCKOUTS);
    assert.deepEqual(parsePinLockouts(locked), NO_LOCKOUTS);
  });

  it('reads the device-wide ladder shape as no lockouts, without throwing', () => {
    const wide = `{"failures":2,"lockedUntil":"${later(20_000).toISOString()}","level":3}`;
    assert.deepEqual(parsePinLockouts(wide), NO_LOCKOUTS);
  });

  it('treats missing or corrupt stored state as no lockouts', () => {
    for (const raw of [null, '', '{not json', 'null', '7', '[]', '{"v":2}', '{"v":2,"by":[]}']) {
      assert.deepEqual(parsePinLockouts(raw), NO_LOCKOUTS, String(raw));
    }
    assert.deepEqual(parsePinLockouts('{"v":3,"by":{"a":{"failures":1}}}'), NO_LOCKOUTS);
  });

  it('reads each entry defensively and forgets the ones that say nothing', () => {
    const raw = JSON.stringify({
      v: 2,
      by: {
        [ANA]: { failures: -3, lockedUntil: 7, level: 'x' },
        [TONI]: { failures: 1.5, lockedUntil: 'mañana', level: 2 },
        nadie: null,
      },
    });
    const book = parsePinLockouts(raw);
    assert.deepEqual(book.by, { [TONI]: { failures: 0, lockedUntil: 'mañana', level: 2 } });
    assert.equal(remainingLockMs(lockoutOf(book, TONI), t0), 0);
  });
});

describe('NIP lockout: the sentence', () => {
  it('counts seconds under a minute and minutes from there', () => {
    assert.equal(fraseEsperaNip(30_000), 'Demasiados intentos. Espera 30 s.');
    assert.equal(fraseEsperaNip(29_001), 'Demasiados intentos. Espera 30 s.');
    assert.equal(fraseEsperaNip(1), 'Demasiados intentos. Espera 1 s.');
    assert.equal(fraseEsperaNip(60_000), 'Demasiados intentos. Espera 1 min.');
    assert.equal(fraseEsperaNip(299_000), 'Demasiados intentos. Espera 5 min.');
    assert.equal(fraseEsperaNip(3_600_000), 'Demasiados intentos. Espera 60 min.');
  });
});
