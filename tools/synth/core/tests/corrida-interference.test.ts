import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { interference, type RunRecord } from '../src/corrida/interference';

/**
 * S-11's acceptance, checked on the corrida itself: runs that overlapped in
 * time shared nothing a run owns (tenant, CDP port, client address, browser
 * profile), and the corrida says how many ran at once.
 */
const at = (min: number) => new Date(Date.UTC(2026, 10, 21, 12, min)).toISOString();

const rec = (id: string, from: number, to: number, over: Partial<RunRecord> = {}): RunRecord => ({
  id,
  runner: 'web',
  started_at: at(from),
  ended_at: at(to),
  biz: `biz-${id}`,
  cdp_port: 9000 + id.length * 10 + from,
  address: `203.0.113.${from + 1}`,
  profile: `/tmp/p-${id}`,
  ...over,
});

describe('interference', () => {
  it('finds none when every run owned its own, and counts how many overlapped', () => {
    const r = interference([rec('a', 0, 5), rec('b', 1, 6), rec('c', 2, 7), rec('d', 6, 9)]);
    assert.deepEqual(r.issues, []);
    assert.equal(r.peak, 3);
  });

  it('reports two runs on one tenant, at any time: a tenant is a run’s for good', () => {
    const r = interference([rec('a', 0, 2), rec('b', 5, 6, { biz: 'biz-a' })]);
    assert.deepEqual(r.issues, ['a and b share tenant biz-a']);
  });

  it('reports a CDP port, address or profile shared by runs that overlapped', () => {
    const r = interference([
      rec('a', 0, 5, { cdp_port: 9222, address: '203.0.113.9', profile: '/tmp/x' }),
      rec('b', 4, 8, { cdp_port: 9222, address: '203.0.113.9', profile: '/tmp/x' }),
    ]);
    assert.deepEqual(r.issues, [
      'a and b overlapped on CDP port 9222',
      'a and b overlapped on address 203.0.113.9',
      'a and b overlapped on profile /tmp/x',
    ]);
  });

  it('lets a port come back once the run that held it ended', () => {
    const r = interference([
      rec('a', 0, 3, { cdp_port: 9222 }),
      rec('b', 3, 6, { cdp_port: 9222 }),
    ]);
    assert.deepEqual(r.issues, []);
    assert.equal(r.peak, 1);
  });

  it('leaves a phone run’s browser fields alone: it has none', () => {
    const phone = { runner: 'phone' as const, cdp_port: null, address: null, profile: null };
    const r = interference([rec('p', 0, 9, phone), rec('q', 1, 2, { ...phone, biz: 'biz-q' })]);
    assert.deepEqual(r.issues, []);
  });
});
