import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { Delta } from '@xangarro/contracts';

import { ApplyPushUseCase } from '../src/apply-push/index.js';
import { InMemoryPushStore } from './support/in-memory-push-store.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const T1 = '2026-09-11T18:30:00.000Z';
const T2 = '2026-09-11T19:30:00.000Z';

function delta(
  table: Delta['table'],
  id: string,
  over: Record<string, unknown> = {},
  op: Delta['op'] = 'insert',
  clientSeq = 1,
): Delta {
  const row = { id, businessId: BIZ, updatedAt: T1, createdByUserId: null, ...over };
  return { table, rowId: id, op, clientSeq, row } as unknown as Delta;
}

let store: InMemoryPushStore;
let errors: unknown[];
let push: (deltas: Delta[]) => ReturnType<ApplyPushUseCase['execute']>;

beforeEach(() => {
  store = new InMemoryPushStore();
  store.seed('products', { id: 'P1', updatedAt: T1 });
  errors = [];
  push = (deltas) => new ApplyPushUseCase(store, BIZ, (e) => errors.push(e)).execute({ deltas });
});

describe('ApplyPushUseCase', () => {
  it('accepts valid rows, each with its own serverSeq, and acknowledges the highest', async () => {
    const r = await push([delta('sales', 'S1', { productoId: 'P1' }), delta('expenses', 'E1')]);
    assert.deepEqual(
      r.accepted.map((a) => [a.rowId, a.serverSeq]),
      [
        ['S1', 1],
        ['E1', 2],
      ],
    );
    assert.deepEqual(r.rejected, []);
    assert.equal(store.acknowledged, 2);
    assert.equal(r.serverSeq, 2);
  });

  it('rejects one row with a missing product and still accepts the rest', async () => {
    const r = await push([delta('sales', 'S1', { productoId: 'NOPE' }), delta('expenses', 'E1')]);
    assert.deepEqual(
      r.accepted.map((a) => a.rowId),
      ['E1'],
    );
    assert.equal(r.rejected[0]?.code, 'FK_PRODUCT_MISSING');
    assert.equal(r.rejected[0]?.retryable, false);
    assert.equal(store.rejections.length, 1, 'rejections are kept, never dropped');
  });

  it('refuses a device update to a HYBRID row — edits are the portal’s', async () => {
    const r = await push([delta('products', 'P1', { updatedAt: T2 }, 'update')]);
    assert.equal(r.rejected[0]?.code, 'HYBRID_UPDATE_FORBIDDEN');
    assert.equal(store.writes, 0);
  });

  it('refuses a row for another business, non-retryable', async () => {
    const r = await push([delta('expenses', 'E1', { businessId: '01JBZN0000000000000000THER' })]);
    assert.equal(r.rejected[0]?.code, 'BUSINESS_MISMATCH');
    assert.equal(r.rejected[0]?.retryable, false);
  });

  it('is idempotent: the same row again gets the same serverSeq and is not rewritten', async () => {
    const first = await push([delta('sales', 'S1', {}, 'insert', 1)]);
    const second = await push([delta('sales', 'S1', {}, 'insert', 2)]);
    assert.equal(second.accepted[0]?.serverSeq, first.accepted[0]?.serverSeq);
    assert.equal(second.accepted[0]?.clientSeq, 2);
    assert.equal(store.writes, 1);
  });

  it('maps an id owned by another business to DUPLICATE_CONFLICT', async () => {
    store.foreign.add('sales/S9');
    const r = await push([delta('sales', 'S9'), delta('expenses', 'E1')]);
    assert.equal(r.rejected[0]?.code, 'DUPLICATE_CONFLICT');
    assert.equal(r.accepted.length, 1);
  });

  it('turns an unexpected failure into a retryable INTERNAL for that row alone, and logs it', async () => {
    store.failOn = 'S1';
    const r = await push([delta('sales', 'S1'), delta('expenses', 'E1')]);
    assert.equal(r.rejected[0]?.code, 'INTERNAL');
    assert.equal(r.rejected[0]?.retryable, true);
    assert.equal(r.accepted[0]?.rowId, 'E1');
    assert.equal(errors.length, 1, 'never swallowed silently');
  });

  it('keeps the portal’s correction when a phone re-pushes its original HYBRID insert', async () => {
    const first = await push([delta('products', 'P2')]);
    store.seed('products', { id: 'P2', updatedAt: T2, nombre: 'Corregido' });
    const again = await push([delta('products', 'P2', { updatedAt: T2 })]);
    assert.equal(again.accepted[0]?.serverSeq, first.accepted[0]?.serverSeq);
    assert.equal(store.rows.get('products/P2')?.['nombre'], 'Corregido');
  });

  it('refuses a HYBRID insert for an id it never accepted from anyone', async () => {
    const r = await push([delta('products', 'P1')]);
    assert.equal(r.rejected[0]?.code, 'DUPLICATE_CONFLICT');
  });

  it('lets a product inserted earlier in the batch satisfy a later sale', async () => {
    const r = await push([delta('products', 'P3'), delta('sales', 'S1', { productoId: 'P3' })]);
    assert.equal(r.accepted.length, 2);
  });

  it('accepts a stale update without overwriting the newer cloud row', async () => {
    await push([delta('expenses', 'E1', { updatedAt: T2, concepto: 'nuevo' })]);
    const r = await push([delta('expenses', 'E1', { concepto: 'viejo' }, 'update')]);
    assert.equal(r.accepted.length, 1);
    assert.equal(store.rows.get('expenses/E1')?.['concepto'], 'nuevo');
  });

  it('logs pushed HYBRID rows for other devices, and never UP rows', async () => {
    await push([delta('clients', 'C1'), delta('sales', 'S1')]);
    assert.deepEqual(store.logged, ['clients/C1']);
  });
});
