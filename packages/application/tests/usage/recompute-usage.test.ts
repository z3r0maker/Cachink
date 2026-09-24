import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { RecomputeUsageUseCase } from '../../src/usage/index.js';
import { RecordingSupportInbox } from '../../src/support-inbox/index.js';
import {
  FakeCounts,
  FixedLimits,
  MemoryCounters,
  MemoryLedger,
  RecordingOwner,
  snap,
} from './support.js';

/** 18 Sep 2026, 03:00 in CDMX — the nightly run. */
const NOW = new Date('2026-09-18T09:00:00Z');
const FREE = { transactionsPerMonth: 50, activeProducts: null };

function harness(limits: Record<string, typeof FREE> = { a: FREE, b: FREE }) {
  const counts = new FakeCounts();
  const store = new MemoryCounters();
  const ledger = new MemoryLedger();
  const owner = new RecordingOwner();
  const inbox = new RecordingSupportInbox();
  const useCase = new RecomputeUsageUseCase({
    counts,
    store,
    limits: new FixedLimits(limits),
    ledger,
    owner,
    inbox,
    now: () => NOW,
  });
  return { counts, store, ledger, owner, inbox, useCase };
}

describe('RecomputeUsageUseCase (N-02 nightly + N-03 notices)', () => {
  it('stores the current and previous month and fires each crossed threshold once', async () => {
    const h = harness();
    h.counts.rows = [snap('a', '2026-08', 10), snap('a', '2026-09', 50), snap('b', '2026-09', 3)];
    const result = await h.useCase.execute();
    assert.deepEqual(
      [result.current, result.previous, result.businesses],
      ['2026-09', '2026-08', 2],
    );
    assert.equal(h.store.rows.size, 3);
    assert.deepEqual(
      h.owner.sent.map((n) => n.threshold),
      [80, 100],
    );
    assert.deepEqual(
      h.inbox.items.map((i) => [i.kind, i.sourceRef]),
      [['limite', 'a:2026-09:transactions:100']],
    );
    assert.equal(result.notices, 3);
  });

  it('the nightly recount corrects an injected drift in a stored counter (N-02 acceptance)', async () => {
    const h = harness();
    await h.store.save([snap('a', '2026-09', 999)], NOW.toISOString());
    h.counts.rows = [snap('a', '2026-09', 12)];
    await h.useCase.execute();
    assert.equal(h.store.rows.get('a:2026-09')?.transactions, 12);
  });

  it('a second run sends nothing already sent', async () => {
    const h = harness();
    h.counts.rows = [snap('a', '2026-09', 80)];
    await h.useCase.execute();
    const again = await h.useCase.execute();
    assert.equal(again.notices, 0);
    assert.equal(h.owner.sent.length, 2);
    assert.equal(h.inbox.items.length, 2); // 100 % and 150 %
  });

  it('two closed months over files one "sugerir upgrade" item per period', async () => {
    const h = harness();
    await h.store.save([snap('a', '2026-07', 60)]);
    h.counts.rows = [snap('a', '2026-08', 55), snap('a', '2026-09', 0)];
    await h.useCase.execute();
    await h.useCase.execute();
    const upgrades = h.inbox.items.filter((i) => i.sourceRef === 'a:2026-09:upgrade');
    assert.equal(upgrades.length, 1);
    assert.equal(h.owner.sent.length, 0);
  });

  it('an unlimited plan gets no notices, however large', async () => {
    const h = harness({});
    h.counts.rows = [snap('a', '2026-09', 1_000_000, 9_000)];
    const result = await h.useCase.execute();
    assert.equal(result.notices, 0);
    assert.equal(h.inbox.items.length, 0);
  });

  it('one business failing does not stop the others, and is retried next run', async () => {
    const h = harness();
    h.counts.rows = [snap('a', '2026-09', 50), snap('b', '2026-09', 50)];
    h.owner.failFor = 'a';
    const first = await h.useCase.execute();
    assert.deepEqual(
      first.failures.map((f) => f.businessId),
      ['a'],
    );
    assert.ok(h.owner.sent.every((n) => n.businessId === 'b'));
    h.owner.failFor = null;
    const second = await h.useCase.execute();
    assert.deepEqual(second.failures, []);
    assert.equal(h.owner.sent.filter((n) => n.businessId === 'a').length, 2);
  });

  it('fails the whole run when usage cannot be counted, storing nothing', async () => {
    const h = harness();
    h.counts.fail = new Error('db down');
    await assert.rejects(h.useCase.execute(), /db down/);
    assert.equal(h.store.rows.size, 0);
  });
});
