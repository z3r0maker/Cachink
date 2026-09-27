import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { MAX_PUSH_ROW_BYTES, type Delta } from '@xangarro/contracts';

import { ApplyPushUseCase } from '../src/apply-push/index.js';
import { InMemoryPushStore } from './support/in-memory-push-store.js';
import { BIZ, T1, delta } from './support/push-deltas.js';

/**
 * Audit DB3-SYNC-01 (b): a runaway free-form field (products.atributos, a
 * note) is refused per row as terminal VALIDATION, before any write — it can
 * no longer grow a push past the request limit or a pull page past it.
 */
let store: InMemoryPushStore;
let push: (deltas: Delta[]) => ReturnType<ApplyPushUseCase['execute']>;

beforeEach(() => {
  store = new InMemoryPushStore();
  store.seed('products', { id: 'P1', updatedAt: T1 });
  push = (deltas) => new ApplyPushUseCase(store, BIZ, () => undefined).execute({ deltas });
});

const big = (bytes: number): string => 'x'.repeat(bytes);

describe('the size of a pushed row (DB3-SYNC-01 b)', () => {
  it('refuses an oversized product as VALIDATION, before any write, and keeps the rest', async () => {
    const r = await push([
      delta('expenses', 'E1'),
      delta('products', 'P2', { atributos: { color: big(MAX_PUSH_ROW_BYTES) } }),
      delta('expenses', 'E2'),
    ]);
    assert.deepEqual(
      r.rejected.map((x) => [x.rowId, x.code, x.retryable]),
      [['P2', 'VALIDATION', false]],
    );
    assert.match(r.rejected[0]?.message ?? '', /bytes/);
    assert.deepEqual(
      r.accepted.map((a) => a.rowId),
      ['E1', 'E2'],
    );
    assert.equal(store.rows.has('products/P2'), false);
  });

  it('refuses a runaway note on any table', async () => {
    const r = await push([delta('expenses', 'E1', { concepto: big(20_000) })]);
    assert.equal(r.rejected[0]?.code, 'VALIDATION');
  });

  it('accepts a row just under the limit', async () => {
    const r = await push([delta('expenses', 'E1', { concepto: big(MAX_PUSH_ROW_BYTES - 200) })]);
    assert.deepEqual(r.rejected, []);
    assert.equal(r.accepted.length, 1);
  });

  it('lets an inventory count carry a line per product', async () => {
    const lineas = big(200_000);
    const r = await push([delta('auditorias_inventario', 'A1', { lineas })]);
    assert.deepEqual(r.rejected, []);
  });
});
