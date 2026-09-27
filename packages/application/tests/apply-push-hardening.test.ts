import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { Delta } from '@xangarro/contracts';

import { ApplyPushUseCase, storableText, unstorableText } from '../src/apply-push/index.js';
import { InMemoryPushStore } from './support/in-memory-push-store.js';
import { BIZ, T1, T2, delta } from './support/push-deltas.js';

/**
 * Audit DB3-SYNC-01..04 (ADR-110 amendment): no row, and no bookkeeping, can
 * fail a whole push; a deterministic failure is terminal; a retryable one never
 * makes its dependants terminal; an overlapping retry is answered from receipts.
 */
let store: InMemoryPushStore;
let errors: unknown[];
let push: (deltas: Delta[]) => ReturnType<ApplyPushUseCase['execute']>;

beforeEach(() => {
  store = new InMemoryPushStore();
  store.seed('products', { id: 'P1', updatedAt: T1 });
  errors = [];
  push = (deltas) => new ApplyPushUseCase(store, BIZ, (e) => errors.push(e)).execute({ deltas });
});

const codes = (r: Awaited<ReturnType<typeof push>>) =>
  r.rejected.map((x) => [x.rowId, x.code, x.retryable]);

describe('text Postgres cannot store (DB3-SYNC-01 a)', () => {
  it('refuses a row with a NUL character as VALIDATION, before any write, and keeps the rest', async () => {
    const r = await push([
      delta('expenses', 'E1'),
      delta('expenses', 'E2', { concepto: 'Refresco\u0000' }),
      delta('expenses', 'E3'),
    ]);
    assert.deepEqual(codes(r), [['E2', 'VALIDATION', false]]);
    assert.deepEqual(
      r.accepted.map((a) => a.rowId),
      ['E1', 'E3'],
    );
    assert.equal(store.rows.has('expenses/E2'), false);
    assert.equal(store.calls.write, 1, 'the bad row never reached the write');
  });

  it('refuses a lone surrogate, and one nested in a structured field', async () => {
    const r = await push([
      delta('expenses', 'E1', { concepto: 'Caf\uD83D' }),
      delta('products', 'P2', { atributos: { color: ['rojo', '\uDC00'] } }),
    ]);
    assert.deepEqual(codes(r), [
      ['E1', 'VALIDATION', false],
      ['P2', 'VALIDATION', false],
    ]);
  });

  it('refuses a row id carrying a NUL', async () => {
    const r = await push([delta('expenses', 'E\u00001')]);
    assert.equal(r.rejected[0]?.code, 'VALIDATION');
  });

  it('accepts real surrogate pairs and other control-free Unicode', async () => {
    const r = await push([delta('expenses', 'E1', { concepto: 'Café ☕ 😀 niño' })]);
    assert.equal(r.accepted.length, 1);
    assert.equal(unstorableText({ a: ['😀', { b: 'ñ' }] }), null);
  });

  it('names the first offending field, and cleans a value for bookkeeping', () => {
    assert.equal(unstorableText({ ok: 'x', nota: { texto: 'a\u0000' } }), 'nota.texto');
    assert.deepEqual(storableText({ a: 'Refresco\u0000', 'k\u0000': ['x\uD800y', 3, null] }), {
      a: 'Refresco',
      k: ['x\uFFFDy', 3, null],
    });
  });
});

describe('bookkeeping never fails the push (DB3-SYNC-01 a)', () => {
  it('keeps rejections in their own savepoint', async () => {
    await push([delta('sales', 'S1', { productoId: 'NOPE' })]);
    assert.equal(store.rejections.length, 1);
    assert.equal(store.isolatedCommits, 1);
  });

  it('keeps a rejection without its payload when the payload cannot be stored', async () => {
    store.failReject = 1;
    const r = await push([delta('sales', 'S1', { productoId: 'NOPE' }), delta('expenses', 'E1')]);
    assert.equal(r.accepted.length, 1);
    assert.equal(r.rejected[0]?.code, 'FK_PRODUCT_MISSING');
    assert.deepEqual(store.rejectModes, ['bare']);
    assert.equal(store.rejections.length, 1);
    assert.equal(errors.length, 1, 'the dropped payload is logged');
  });

  it('still answers the push when no rejection can be kept at all', async () => {
    store.failReject = 2;
    const r = await push([delta('sales', 'S1', { productoId: 'NOPE' }), delta('expenses', 'E1')]);
    assert.equal(r.accepted.length, 1);
    assert.equal(r.rejected.length, 1);
    assert.equal(store.rejections.length, 0);
    assert.equal(errors.length, 2);
    assert.equal(store.acknowledged, 1, 'finish still ran');
  });
});

describe('deterministic database refusals are terminal (DB3-SYNC-01 c)', () => {
  it('answers a row whose values the database refuses VALIDATION, and stores the rest', async () => {
    store.refuseOn.set('S4', 'invalid');
    const r = await push(Array.from({ length: 8 }, (_, i) => delta('sales', `S${i}`)));
    assert.deepEqual(codes(r), [['S4', 'VALIDATION', false]]);
    assert.equal(r.accepted.length, 7);
    assert.equal(errors.length, 1, 'logged: a phone sent data the schema refuses');
  });

  it('answers a unique key another row holds DUPLICATE_CONFLICT', async () => {
    store.refuseOn.set('T2', 'duplicate');
    const r = await push([delta('tickets', 'T1'), delta('tickets', 'T2')]);
    assert.deepEqual(codes(r), [['T2', 'DUPLICATE_CONFLICT', false]]);
    assert.equal(r.accepted.length, 1);
  });

  it('still answers a failure it cannot classify INTERNAL', async () => {
    store.failOn.add('S1');
    const r = await push([delta('sales', 'S1')]);
    assert.deepEqual(codes(r), [['S1', 'INTERNAL', true]]);
  });
});

describe('a retryable reference failure stays retryable (DB3-SYNC-02)', () => {
  it('answers a sale INTERNAL when its product in the same push failed retryably', async () => {
    store.failOn.add('P5');
    const r = await push([delta('products', 'P5'), delta('sales', 'S1', { productoId: 'P5' })]);
    assert.deepEqual(codes(r), [
      ['P5', 'INTERNAL', true],
      ['S1', 'INTERNAL', true],
    ]);
  });

  it('answers a movement INTERNAL when the products write timed out', async () => {
    store.transientOn.add('P6');
    const r = await push([
      delta('products', 'P6'),
      delta('inventory_movements', 'M1', { productoId: 'P6' }),
    ]);
    assert.deepEqual(codes(r), [
      ['P6', 'INTERNAL', true],
      ['M1', 'INTERNAL', true],
    ]);
  });

  it('keeps a reference to a product nobody pushed terminal', async () => {
    store.failOn.add('P5');
    const r = await push([delta('products', 'P5'), delta('sales', 'S1', { productoId: 'P9' })]);
    assert.deepEqual(codes(r), [
      ['P5', 'INTERNAL', true],
      ['S1', 'FK_PRODUCT_MISSING', false],
    ]);
  });
});

describe('an overlapping retry is answered from receipts (DB3-SYNC-03)', () => {
  /** The original push commits while this one waits on its row lock. */
  const original =
    (table: string, id: string, seq: number, updatedAt = T1) =>
    () => {
      store.seed(table, { id, updatedAt });
      store.seq = Math.max(store.seq, seq);
      store.receiptsByKey.set(`${table}/${id}`, { seq, rowUpdatedAt: updatedAt });
    };

  it('accepts a HYBRID row the original stored, and lets its dependants point at it', async () => {
    store.racing = original('products', 'P7', 41);
    const r = await push([delta('products', 'P7'), delta('sales', 'S1', { productoId: 'P7' })]);
    assert.deepEqual(codes(r), []);
    assert.deepEqual(
      r.accepted.map((a) => [a.rowId, a.serverSeq]),
      [
        ['P7', 41],
        ['S1', 42],
      ],
    );
    assert.equal(store.calls.receipts, 2, 'one more lookup, only for the rows in doubt');
  });

  it('answers a stale UP row from the receipt that now exists, at no fresh seq', async () => {
    store.racing = original('expenses', 'E1', 41, T2);
    const r = await push([delta('expenses', 'E1')]);
    assert.deepEqual(
      r.accepted.map((a) => a.serverSeq),
      [41],
    );
    assert.equal(store.calls.accept, 0);
  });

  it('still refuses a HYBRID id nobody here ever sent', async () => {
    const r = await push([delta('products', 'P1')]);
    assert.deepEqual(codes(r), [['P1', 'DUPLICATE_CONFLICT', false]]);
  });
});
