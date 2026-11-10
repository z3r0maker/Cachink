import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { clampRowClock, futureLimit, MAX_CLOCK_SKEW_MS } from '../src/sync/push-clock';

/**
 * Security audit 2026-11, F-05 a: a pushed row's timestamps are the device's,
 * and the newest `updated_at` wins a write. A device that says «year 2099»
 * would hold its row against every later edit, so a timestamp further ahead
 * of the server than a small skew is stored as the server's time. Never
 * refused: a phone with a wrong clock still syncs (CLAUDE.md §2.2).
 */
const NOW = new Date('2026-11-09T18:00:00.000Z');
const at = (ms: number) => new Date(NOW.getTime() + ms).toISOString();
const row = (over: Record<string, unknown> = {}) => ({
  id: 'R1',
  concepto: 'Renta',
  createdAt: at(-60_000),
  updatedAt: at(-60_000),
  deletedAt: null,
  ...over,
});

describe('clampRowClock', () => {
  it('allows five minutes of skew, and no more', () => {
    assert.equal(MAX_CLOCK_SKEW_MS, 5 * 60 * 1000);
    assert.equal(futureLimit(NOW), '2026-11-09T18:05:00.000Z');
  });

  it('leaves a past timestamp untouched, however old', () => {
    const old = row({
      createdAt: '2019-01-01T00:00:00.000Z',
      updatedAt: '2019-01-02T00:00:00.000Z',
    });
    assert.deepEqual(clampRowClock(old, NOW), old);
    assert.equal(clampRowClock(old, NOW), old, 'the same object: nothing was rewritten');
  });

  it('leaves a clock that runs a little fast alone, up to the skew exactly', () => {
    const fast = row({ updatedAt: at(MAX_CLOCK_SKEW_MS) });
    assert.equal(clampRowClock(fast, NOW).updatedAt, at(MAX_CLOCK_SKEW_MS));
  });

  it('stores a far-future updatedAt as the server’s time, not as the limit', () => {
    const far = row({ updatedAt: '2099-01-01T00:00:00.000Z' });
    const out = clampRowClock(far, NOW);
    assert.equal(out.updatedAt, NOW.toISOString());
    assert.equal(out.createdAt, far.createdAt, 'an honest field of the same row stays');
    assert.equal(far.updatedAt, '2099-01-01T00:00:00.000Z', 'the pushed row is not mutated');
  });

  it('one millisecond past the skew is already the server’s time', () => {
    const out = clampRowClock(row({ updatedAt: at(MAX_CLOCK_SKEW_MS + 1) }), NOW);
    assert.equal(out.updatedAt, NOW.toISOString());
  });

  it('holds createdAt and deletedAt to the same clock', () => {
    const out = clampRowClock(
      row({ createdAt: '2099-01-01T00:00:00.000Z', deletedAt: '2099-01-03T00:00:00.000Z' }),
      NOW,
    );
    assert.equal(out.createdAt, NOW.toISOString());
    assert.equal(out.deletedAt, NOW.toISOString());
  });

  it('touches nothing else: other fields, a null, an absent field', () => {
    const far = { id: 'R1', fecha: '2099-01-01', updatedAt: '2099-01-01T00:00:00.000Z' };
    const out = clampRowClock(far, NOW);
    assert.deepEqual(Object.keys(out), ['id', 'fecha', 'updatedAt']);
    assert.equal(out.fecha, '2099-01-01', 'a business date is not an audit clock');
  });

  it('leaves what is not a timestamp for the database to refuse', () => {
    const odd = row({ updatedAt: '2026-13-45T99:00:00.000Z', createdAt: 7 });
    assert.deepEqual(clampRowClock(odd, NOW), odd);
  });
});
