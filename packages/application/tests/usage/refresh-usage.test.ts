import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { RefreshUsageUseCase, UsageRefreshError } from '../../src/usage/index.js';
import { FakeCounts, MemoryCounters, snap } from './support.js';

/** N-02: the push-time recount — one business, the open month, same count as the nightly job. */
const NOW = new Date('2026-09-18T15:00:00Z');
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

function harness() {
  const counts = new FakeCounts();
  const store = new MemoryCounters();
  return { counts, store, useCase: new RefreshUsageUseCase({ counts, store, now: () => NOW }) };
}

describe('RefreshUsageUseCase (N-02 push-time)', () => {
  it('recounts only the pushing business, only the open month, and stores it', async () => {
    const h = harness();
    h.counts.rows = [snap('a', '2026-08', 5), snap('a', '2026-09', 42), snap('b', '2026-09', 7)];
    const row = await h.useCase.execute('a');
    assert.equal(row?.transactions, 42);
    assert.deepEqual(h.counts.asked, [['a']]);
    assert.deepEqual([...h.store.rows.keys()], ['a:2026-09']);
  });

  it('corrects a drifted counter rather than adding to it', async () => {
    const h = harness();
    await h.store.save([snap('a', '2026-09', 999)], ago(5 * 60_000));
    h.counts.rows = [snap('a', '2026-09', 43)];
    await h.useCase.execute('a');
    assert.equal(h.store.rows.get('a:2026-09')?.transactions, 43);
  });

  it('stores nothing for a business the count does not know', async () => {
    const h = harness();
    assert.equal(await h.useCase.execute('ghost'), null);
    assert.equal(h.store.rows.size, 0);
  });

  it('refuses an empty business id, and lets a failed count surface', async () => {
    const h = harness();
    await assert.rejects(() => h.useCase.execute(' '), UsageRefreshError);
    h.counts.fail = new Error('db down');
    await assert.rejects(() => h.useCase.execute('a'), /db down/);
    assert.equal(h.store.rows.size, 0);
  });

  // Audit DB2-USE-01: a phone pushing per sale must not recount per sale.
  describe('at most once a minute per business', () => {
    it('skips the recount when the open month was counted under a minute ago', async () => {
      const h = harness();
      await h.store.save([snap('a', '2026-09', 40)], ago(59_000));
      h.counts.rows = [snap('a', '2026-09', 41)];
      assert.equal(await h.useCase.execute('a'), null);
      assert.deepEqual(h.counts.asked, [], 'no count ran');
      assert.equal(h.store.rows.get('a:2026-09')?.transactions, 40);
    });

    it('recounts once the last count is a minute old', async () => {
      const h = harness();
      await h.store.save([snap('a', '2026-09', 40)], ago(60_000));
      h.counts.rows = [snap('a', '2026-09', 41)];
      assert.equal((await h.useCase.execute('a'))?.transactions, 41);
    });

    it('recounts a month never counted, and one counted only for another month', async () => {
      const h = harness();
      await h.store.save([snap('a', '2026-08', 12)], ago(1_000));
      h.counts.rows = [snap('a', '2026-09', 3)];
      assert.equal((await h.useCase.execute('a'))?.transactions, 3);
    });

    it('does not trust a count stamped in the future (a skewed clock): it recounts', async () => {
      const h = harness();
      await h.store.save(
        [snap('a', '2026-09', 40)],
        new Date(NOW.getTime() + 3_600_000).toISOString(),
      );
      h.counts.rows = [snap('a', '2026-09', 41)];
      assert.equal((await h.useCase.execute('a'))?.transactions, 41);
    });

    it('lets a failed freshness read surface, like a failed count', async () => {
      const h = harness();
      h.store.computedAt = () => Promise.reject(new Error('metering down'));
      await assert.rejects(() => h.useCase.execute('a'), /metering down/);
    });
  });
});
