import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { ForeignRowError, RowRefusedError, TransientWriteError } from '@xangarro/application';
import type { Delta } from '@xangarro/contracts';

import { storeError } from '../src/server/sync/store-error';

/** How a failed batched write reaches `ApplyPushUseCase` (ADR-118). */
const one = [{ table: 'sales', rowId: 'S1' }] as unknown as Delta[];
const two = [...one, { table: 'sales', rowId: 'S2' }] as unknown as Delta[];
// Drizzle wraps the driver's error; the code is on `cause`.
const wrapped = (code: string, constraint_name?: string) =>
  Object.assign(new Error('Failed query'), { cause: { code, constraint_name } });
const reason = (e: unknown) => (e instanceof RowRefusedError ? e.reason : 'not refused');

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

  it('refuses bad values for good: class 22, NOT NULL and CHECK are VALIDATION (DB3-SYNC-01 c)', () => {
    for (const code of [
      '22021', // NUL / bad encoding
      '22P02', // invalid text representation
      '22P05', // unsupported Unicode escape
      '22001', // string too long
      '22003', // numeric out of range
      '22007', // bad datetime format
      '22008', // datetime out of range
      '23502', // not null
      '23514', // check
    ]) {
      assert.equal(reason(storeError(wrapped(code), 'sales', two)), 'invalid', code);
    }
  });

  it('refuses a unique key another row holds as a duplicate, but not the table’s own id', () => {
    const folio = storeError(wrapped('23505', 'idx_tickets_device_folio'), 'tickets', two);
    assert.equal(reason(folio), 'duplicate');
    assert.ok((folio as RowRefusedError).cause, 'the driver error travels along, for the log');
    const pk = wrapped('23505', 'tickets_pkey');
    assert.equal(storeError(pk, 'tickets', two), pk, 'a race on the id is not the row’s fault');
  });

  it('passes a failure it cannot classify through, for the use case to isolate', () => {
    const fk = wrapped('23503');
    assert.equal(storeError(fk, 'sales', two), fk);
    const plain = new Error('no code at all');
    assert.equal(storeError(plain, 'sales', two), plain);
  });
});
