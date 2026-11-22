import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { runAddress } from '../src/runner/address';

/**
 * Each run's client address (owner decision 3, «a fresh throttle IP»): the
 * portal's throttles key on `x-forwarded-for`, so two runs from one address
 * would spend each other's signup and sign-in attempts.
 */
describe('runAddress', () => {
  it('gives each run of a corrida its own TEST-NET-3 address', () => {
    const all = Array.from({ length: 40 }, (_, i) => runAddress(i));
    assert.equal(new Set(all).size, 40);
    for (const a of all) assert.match(a, /^203\.0\.113\.(\d{1,3})$/);
    assert.equal(runAddress(0), '203.0.113.1');
  });

  it('stays inside the 254 usable hosts, refusing an index it cannot give', () => {
    assert.equal(runAddress(253), '203.0.113.254');
    assert.throws(() => runAddress(254), /254/);
    assert.throws(() => runAddress(-1), /254/);
  });
});
