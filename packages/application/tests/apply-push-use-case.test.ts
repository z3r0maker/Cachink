import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { Delta } from '@xangarro/contracts';

import { ApplyPushUseCase } from '../src/apply-push/index.js';
import { InMemoryPushStore } from './support/in-memory-push-store.js';
import { BIZ, T1, T2, delta } from './support/push-deltas.js';

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

  it('accepts an operator reply to a message this business holds (C-19)', async () => {
    store.seed('mensajes_operador', { id: 'M1', updatedAt: T1 });
    const r = await push([
      delta('respuestas_operador', 'R1', { mensajeId: 'M1', texto: 'Faltó cambio, ya lo tengo' }),
    ]);
    assert.equal(r.accepted.length, 1);
    assert.equal(r.rejected.length, 0);
  });

  it('rejects a reply to a message nobody sent, without retry (C-19)', async () => {
    const r = await push([delta('respuestas_operador', 'R1', { mensajeId: 'GONE' })]);
    assert.equal(r.rejected[0]?.code, 'FK_MENSAJE_MISSING');
    assert.equal(r.rejected[0]?.retryable, false);
  });

  it('turns an unexpected failure into a retryable INTERNAL for that row alone, and logs it', async () => {
    store.failOn.add('S1');
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

/** Audit DB2-SYNC-01 / -02 (ADR-119): a push costs statements per table, not per row. */
describe('ApplyPushUseCase — batched', () => {
  const sales = (n: number, over: Record<string, unknown> = {}) =>
    Array.from({ length: n }, (_, i) => delta('sales', `S${i}`, { productoId: 'P1', ...over }));

  it('looks up, writes and accepts a 500-row push in a constant number of calls', async () => {
    store.seed('users', { id: 'U1', updatedAt: T1 });
    const deltas = [
      ...sales(250, { createdByUserId: 'U1' }),
      ...Array.from({ length: 250 }, (_, i) => delta('inventory_movements', `M${i}`)),
    ];
    const r = await push(deltas);
    assert.equal(r.accepted.length, 500);
    assert.deepEqual(store.calls, {
      receipts: 1,
      existing: 2, // products, users — once each, not once per row
      write: 2, // one per table
      accept: 1, // one cursor bump
      reject: 0,
      finish: 1,
    });
    assert.equal(store.isolatedCommits, 2, 'one savepoint per table, far below 64');
  });

  it('hands out seqs in delta order across tables', async () => {
    const r = await push([
      delta('sales', 'S1', { productoId: 'P1' }),
      delta('clients', 'C1'),
      delta('expenses', 'E1'),
      delta('inventory_movements', 'M1', { productoId: 'P1' }),
    ]);
    assert.deepEqual(
      r.accepted.map((a) => [a.rowId, a.serverSeq]),
      [
        ['S1', 1],
        ['C1', 2],
        ['E1', 3],
        ['M1', 4],
      ],
    );
    assert.deepEqual(store.logged, ['clients/C1', 'inventory_movements/M1']);
  });

  it('isolates one bad row in a batched write: the rest of its table is stored', async () => {
    store.failOn.add('S7');
    const r = await push(sales(20));
    assert.equal(r.accepted.length, 19);
    assert.deepEqual(
      r.rejected.map((x) => [x.rowId, x.code, x.retryable]),
      [['S7', 'INTERNAL', true]],
    );
    assert.equal(errors.length, 1, 'logged once, for the row that failed');
    assert.equal(store.rows.has('sales/S7'), false);
    assert.equal(store.rows.has('sales/S19'), true);
  });

  it('finds the one foreign id in an upsert batch and answers only it DUPLICATE_CONFLICT', async () => {
    store.foreign.add('sales/S3');
    const r = await push(sales(10));
    assert.equal(r.accepted.length, 9);
    assert.deepEqual(
      r.rejected.map((x) => [x.rowId, x.code]),
      [['S3', 'DUPLICATE_CONFLICT']],
    );
    assert.equal(errors.length, 0, 'a collision is an answer, not an error');
  });

  it('answers a foreign HYBRID insert DUPLICATE_CONFLICT without splitting the batch', async () => {
    store.foreign.add('inventory_movements/M2');
    const r = await push([delta('inventory_movements', 'M1'), delta('inventory_movements', 'M2')]);
    assert.deepEqual(
      r.rejected.map((x) => [x.rowId, x.code]),
      [['M2', 'DUPLICATE_CONFLICT']],
    );
    assert.equal(store.calls.write, 1);
  });

  it('does not split a write that timed out: every row of it is retryable', async () => {
    store.transientOn.add('S2');
    const r = await push([...sales(4), delta('expenses', 'E1')]);
    assert.deepEqual(
      r.rejected.map((x) => [x.rowId, x.code, x.retryable]),
      ['S0', 'S1', 'S2', 'S3'].map((id) => [id, 'INTERNAL', true]),
    );
    assert.deepEqual(
      r.accepted.map((a) => a.rowId),
      ['E1'],
    );
    assert.equal(store.calls.write, 2, 'one try per table, no bisection');
    assert.equal(errors.length, 1);
  });

  it('stops splitting before the savepoint cache overflows; the rest retry later', async () => {
    const deltas = sales(200);
    for (let i = 0; i < 200; i += 3) store.failOn.add(`S${i}`);
    const r = await push(deltas);
    assert.ok(
      store.isolatedCommits <= 61,
      `${store.isolatedCommits} kept: 60 for writes, 1 for rejections`,
    );
    assert.equal(r.accepted.length + r.rejected.length, 200, 'every row still gets an answer');
    assert.ok(r.rejected.every((x) => x.code === 'INTERNAL' && x.retryable));
    assert.ok(r.accepted.length > 0);
  });

  it('applies the same row twice in one push in order: insert, then its update', async () => {
    const r = await push([
      delta('caja_turnos', 'T1', {}, 'insert', 1),
      delta('caja_turnos', 'T1', { updatedAt: T2, estado: 'cerrado' }, 'update', 2),
    ]);
    assert.deepEqual(
      r.accepted.map((a) => [a.clientSeq, a.serverSeq]),
      [
        [1, 1],
        [2, 2],
      ],
    );
    assert.equal(store.rows.get('caja_turnos/T1')?.['estado'], 'cerrado');
  });

  it('answers a row repeated verbatim in one push from its own receipt', async () => {
    const r = await push([
      delta('sales', 'S1', {}, 'insert', 1),
      delta('sales', 'S1', {}, 'insert', 2),
    ]);
    assert.deepEqual(
      r.accepted.map((a) => a.serverSeq),
      [1, 1],
    );
    assert.equal(store.writes, 1);
  });

  it('still refuses a sale that comes before the new product it points at', async () => {
    const r = await push([delta('sales', 'S1', { productoId: 'P3' }), delta('products', 'P3')]);
    assert.deepEqual(
      r.rejected.map((x) => [x.rowId, x.code]),
      [['S1', 'FK_PRODUCT_MISSING']],
    );
    assert.deepEqual(
      r.accepted.map((a) => a.rowId),
      ['P3'],
    );
  });

  it('does not let a refused product satisfy a sale later in the push', async () => {
    store.foreign.add('products/P4');
    const r = await push([delta('products', 'P4'), delta('sales', 'S1', { productoId: 'P4' })]);
    assert.deepEqual(
      r.rejected.map((x) => [x.rowId, x.code]),
      [
        ['P4', 'DUPLICATE_CONFLICT'],
        ['S1', 'FK_PRODUCT_MISSING'],
      ],
    );
  });

  it('keeps every rejection of the push in one call', async () => {
    const r = await push([
      delta('sales', 'S1', { productoId: 'NOPE' }),
      delta('expenses', 'E1', { businessId: '01JBZN0000000000000000THER' }),
    ]);
    assert.equal(r.rejected.length, 2);
    assert.equal(store.calls.reject, 1);
    assert.equal(store.rejections.length, 2);
  });
});
