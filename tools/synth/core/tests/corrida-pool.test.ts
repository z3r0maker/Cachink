import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';

import { describe, it } from 'vitest';

import { runPool } from '../src/corrida/pool';

/**
 * The corrida's pool (S-11): web runs up to `web` at a time, phone runs one at
 * a time, both lanes at once. A failed run never stops the others, and once
 * the cost cap is reached no further run starts.
 */
type Job = { readonly id: string; readonly runner: 'web' | 'phone' };
const job = (id: string, runner: Job['runner'] = 'web'): Job => ({ id, runner });

function tracker() {
  const live = { web: 0, phone: 0 };
  const peak = { web: 0, phone: 0 };
  const work = async (j: Job) => {
    live[j.runner] += 1;
    peak[j.runner] = Math.max(peak[j.runner], live[j.runner]);
    await sleep(5);
    live[j.runner] -= 1;
    return j.id;
  };
  return { peak, work };
}

describe('runPool', () => {
  it('runs each lane up to its limit, the two lanes side by side, results in job order', async () => {
    const jobs = [job('a'), job('b'), job('p1', 'phone'), job('c'), job('d'), job('p2', 'phone')];
    const t = tracker();
    const out = await runPool(jobs, { web: 3, phone: 1 }, t.work, { canStart: () => true });
    assert.deepEqual(t.peak, { web: 3, phone: 1 });
    assert.deepEqual(
      out.map((r) => (r.status === 'done' ? r.value : r.status)),
      ['a', 'b', 'p1', 'c', 'd', 'p2'],
    );
  });

  it('records a run that throws and goes on with the rest', async () => {
    const out = await runPool(
      [job('a'), job('boom'), job('c')],
      { web: 1, phone: 1 },
      async (j) => {
        if (j.id === 'boom') throw new Error('Chromium did not start');
        return j.id;
      },
      { canStart: () => true },
    );
    assert.deepEqual(
      out.map((r) => r.status),
      ['done', 'failed', 'done'],
    );
    const failed = out[1];
    assert.ok(failed?.status === 'failed' && /Chromium/.test(failed.error));
  });

  it('starts nothing more once the cost cap is reached, and says so for each run left', async () => {
    let started = 0;
    const out = await runPool(
      [job('a'), job('b'), job('c')],
      { web: 1, phone: 1 },
      async (j) => {
        started += 1;
        return j.id;
      },
      { canStart: () => started < 2 },
    );
    assert.deepEqual(
      out.map((r) => r.status),
      ['done', 'done', 'skipped'],
    );
    const skipped = out[2];
    assert.ok(skipped?.status === 'skipped' && /cost cap/.test(skipped.reason));
  });

  it('hands each job its index in the corrida, the same whatever lane it ran in', async () => {
    const seen: number[] = [];
    await runPool(
      [job('a'), job('p', 'phone'), job('b')],
      { web: 2, phone: 1 },
      async (_j, index) => {
        seen.push(index);
        return index;
      },
      { canStart: () => true },
    );
    assert.deepEqual([...seen].sort(), [0, 1, 2]);
  });

  it('answers at once for an empty corrida', async () => {
    assert.deepEqual(
      await runPool([], { web: 3, phone: 1 }, async () => 1, { canStart: () => true }),
      [],
    );
  });
});
