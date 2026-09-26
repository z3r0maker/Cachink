import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  RUN_BACKOFF_BASE_MS,
  RUN_BACKOFF_MAX_MS,
  RunBackoff,
  equalJitter,
  spread,
} from '../src/backoff.js';

describe('jitter', () => {
  it('equal jitter lands between half and all of the delay', () => {
    assert.equal(
      equalJitter(1_000, () => 0),
      500,
    );
    assert.equal(
      equalJitter(1_000, () => 1),
      1_000,
    );
  });

  it('spread moves a period by ±fraction', () => {
    assert.equal(
      spread(1_000, 0.2, () => 0),
      800,
    );
    assert.equal(
      spread(1_000, 0.2, () => 0.5),
      1_000,
    );
    assert.equal(
      spread(1_000, 0.2, () => 1),
      1_200,
    );
  });
});

describe('RunBackoff', () => {
  const error = { code: 'INTERNAL', status: 503 };

  it('doubles per consecutive failure up to its cap, and resets on success', () => {
    const b = new RunBackoff(() => 1);
    assert.equal(b.failed(error, 0), RUN_BACKOFF_BASE_MS);
    assert.equal(b.failed(error, 0), RUN_BACKOFF_BASE_MS * 2);
    for (let i = 0; i < 20; i += 1) b.failed(error, 0);
    assert.equal(b.failed(error, 0), RUN_BACKOFF_MAX_MS);
    b.succeeded();
    assert.equal(b.blockedUntil(0, false), null);
    assert.equal(b.failed(error, 0), RUN_BACKOFF_BASE_MS);
  });

  it('blocks automatic runs until the backoff ends and manual ones only for Retry-After', () => {
    const b = new RunBackoff(() => 0);
    b.failed({ ...error, retryAfterMs: 30_000 }, 1_000);
    assert.equal(b.blockedUntil(2_000, false), 31_000);
    assert.equal(b.blockedUntil(2_000, true), 31_000);
    assert.equal(b.blockedUntil(31_000, true), null);
    b.failed(error, 40_000);
    assert.equal(b.blockedUntil(40_001, true), null);
    // Second failure in a row: 10 s, equal jitter at its floor = 5 s.
    assert.equal(b.blockedUntil(40_001, false), 40_000 + RUN_BACKOFF_BASE_MS);
    assert.deepEqual(b.lastError, error);
  });

  it('never trusts a Retry-After longer than an hour', () => {
    const b = new RunBackoff(() => 0);
    assert.equal(b.failed({ ...error, retryAfterMs: 86_400_000 }, 0), 3_600_000);
  });
});
