import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { ForeignRowError, TransientWriteError } from '@xangarro/application';
import type { Delta } from '@xangarro/contracts';

import { storeError } from '../src/server/sync/store-error';

/** How a failed batched write reaches `ApplyPushUseCase` (ADR-110). */
const one = [{ table: 'sales', rowId: 'S1' }] as unknown as Delta[];
const two = [...one, { table: 'sales', rowId: 'S2' }] as unknown as Delta[];
// Drizzle wraps the driver's error; the code is on `cause`.
const wrapped = (code: string) => Object.assign(new Error('Failed query'), { cause: { code } });

describe('storeError', () => {
  it('turns RLS 42501 into ForeignRowError, naming the row when there is one', () => {
    const e = storeError(wrapped('42501'), 'sales', one);
    assert.ok(e instanceof ForeignRowError);
    assert.equal(e.rowId, 'S1');
    assert.equal((storeError(wrapped('42501'), 'sales', two) as ForeignRowError).rowId, '*');
  });

  it('marks timeouts, lock waits, deadlocks and lost connections transient', () => {
    for (const code of [
      '57014',
      '55P03',
      '40P01',
      '40001',
      '08006',
      '53300',
      'CONNECTION_CLOSED',
    ]) {
      assert.ok(storeError(wrapped(code), 'sales', two) instanceof TransientWriteError, code);
    }
  });

  it('passes a row-shaped failure through, for the use case to isolate', () => {
    const notNull = wrapped('23502');
    assert.equal(storeError(notNull, 'sales', two), notNull);
    const plain = new Error('no code at all');
    assert.equal(storeError(plain, 'sales', two), plain);
  });
});
