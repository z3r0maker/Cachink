import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { Delta } from '@xangarro/contracts';

import { ApplyPushUseCase } from '../src/apply-push/index.js';
import { InMemoryPushStore } from './support/in-memory-push-store.js';
import { BIZ, T1, delta } from './support/push-deltas.js';

/**
 * Security audit 2026-11, F-05 b: a delta's `rowId` — what its receipt, its
 * pull-log entry and its answer are keyed on — must be the id of the row it
 * carries, which is what gets written. One that names a row and carries
 * another is refused alone, terminally, before anything is looked up.
 */
let store: InMemoryPushStore;
let push: (deltas: Delta[]) => ReturnType<ApplyPushUseCase['execute']>;

beforeEach(() => {
  store = new InMemoryPushStore();
  store.seed('products', { id: 'P1', updatedAt: T1 });
  push = (deltas) => new ApplyPushUseCase(store, BIZ, () => undefined).execute({ deltas });
});

/** A delta that says it is `named` and carries the row `written`. */
const disguised = (table: Delta['table'], named: string, written: string): Delta =>
  ({ ...delta(table, written), rowId: named }) as Delta;

describe('a delta names the row it carries', () => {
  it('refuses a mismatch as VALIDATION, not retryable, and still accepts the rest', async () => {
    const r = await push([
      delta('expenses', 'E1'),
      disguised('expenses', 'E2', 'E9'),
      delta('expenses', 'E3'),
    ]);
    assert.deepEqual(
      r.rejected.map((x) => [x.rowId, x.code, x.retryable]),
      [['E2', 'VALIDATION', false]],
    );
    assert.match(r.rejected[0]?.message ?? '', /rowId/);
    assert.deepEqual(
      r.accepted.map((a) => a.rowId),
      ['E1', 'E3'],
    );
  });

  it('writes neither row and leaves no receipt for either', async () => {
    await push([disguised('expenses', 'E2', 'E9')]);
    assert.equal(store.rows.has('expenses/E2'), false);
    assert.equal(store.rows.has('expenses/E9'), false);
    assert.equal(store.receiptsByKey.size, 0);
    assert.equal(store.calls.write, 0, 'refused before any lookup or write');
    assert.equal(store.rejections.length, 1, 'kept, so the portal can show it');
  });

  it('cannot overwrite a row it does not name: the victim keeps its value and its receipt', async () => {
    await push([delta('expenses', 'E9', { concepto: 'Renta' })]);
    const receipt = store.receiptsByKey.get('expenses/E9');
    const r = await push([
      {
        ...disguised('expenses', 'E2', 'E9'),
        row: {
          ...delta('expenses', 'E9').row,
          concepto: 'Robado',
          updatedAt: '2026-09-11T23:00:00.000Z',
        },
      } as Delta,
    ]);
    assert.equal(r.rejected[0]?.code, 'VALIDATION');
    assert.equal(store.rows.get('expenses/E9')?.['concepto'], 'Renta');
    assert.deepEqual(store.receiptsByKey.get('expenses/E9'), receipt);
  });

  it('refuses a row with no id at all, and an id of another type', async () => {
    const noId = {
      ...delta('expenses', 'E4'),
      row: { businessId: BIZ, updatedAt: T1 },
    } as unknown as Delta;
    const numeric = {
      ...delta('expenses', '7'),
      row: { id: 7, businessId: BIZ, updatedAt: T1 },
    } as unknown as Delta;
    const r = await push([noId, numeric]);
    assert.deepEqual(
      r.rejected.map((x) => x.code),
      ['VALIDATION', 'VALIDATION'],
    );
  });

  it('checks the business first: another tenant’s row is still BUSINESS_MISMATCH', async () => {
    const r = await push([
      {
        ...disguised('expenses', 'E2', 'E9'),
        row: { id: 'E9', businessId: 'OTRO', updatedAt: T1 },
      } as unknown as Delta,
    ]);
    assert.equal(r.rejected[0]?.code, 'BUSINESS_MISMATCH');
  });

  it('an honest delta is untouched, on every kind of table', async () => {
    const r = await push([delta('expenses', 'E1'), delta('products', 'P2'), delta('sales', 'S1')]);
    assert.equal(r.accepted.length, 3);
    assert.deepEqual(r.rejected, []);
  });
});
