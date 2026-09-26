import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, it } from 'vitest';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { ApplyPushUseCase } from '@xangarro/application';
import type { Delta } from '@xangarro/contracts';
import { committedCursor, createDb, withBusiness, type Db } from '@xangarro/data-pg';

import { PgPushStore } from '../src/server/sync/pg-push-store';

/**
 * The batched push end to end — `ApplyPushUseCase` over `PgPushStore` on real
 * Postgres under RLS (audit DB2-SYNC-01/-02; ADR-110). Needs `DATABASE_URL`
 * (app role) and `DATABASE_SUPER_URL`; `REQUIRE_DB=1` turns a missing database
 * into a failure instead of a skip, as in data-pg's suites.
 */
const url = process.env.DATABASE_URL;
if (!url && process.env.REQUIRE_DB === '1')
  throw new Error('REQUIRE_DB=1 but DATABASE_URL is unset');
const suite = url ? describe : describe.skip;

const id = () => `01PUSH${randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()}`;
const A = id();
const B = id();
const DEVICE = id();
const T1 = '2026-09-26T10:00:00.000Z';
const TOUCHED = [
  'expenses',
  'inventory_movements',
  'products',
  'sync_log',
  'sync_receipts',
  'sync_rejections',
  'sync_cursors',
  'devices',
];
let clientSeq = 0;

function delta(table: Delta['table'], row: Record<string, unknown>, biz = A): Delta {
  const full = {
    businessId: biz,
    deviceId: DEVICE,
    createdByUserId: null,
    createdAt: T1,
    updatedAt: T1,
    ...row,
  };
  clientSeq += 1;
  return {
    table,
    rowId: String(row['id']),
    op: 'insert',
    clientSeq,
    row: full,
  } as unknown as Delta;
}
const expense = (rowId: string, over: Record<string, unknown> = {}, biz = A) =>
  delta(
    'expenses',
    {
      id: rowId,
      fecha: '2026-09-26',
      concepto: 'Renta',
      categoria: 'Renta',
      monto: 150000,
      ...over,
    },
    biz,
  );
const product = (rowId: string, biz = A) =>
  delta(
    'products',
    {
      id: rowId,
      nombre: 'Café',
      categoria: 'Producto Terminado',
      costoUnitCentavos: 1000,
      unidad: 'pza',
    },
    biz,
  );
const movement = (rowId: string, productoId: string, biz = A) =>
  delta(
    'inventory_movements',
    {
      id: rowId,
      productoId,
      fecha: '2026-09-26',
      tipo: 'salida',
      cantidad: 1,
      costoUnitCentavos: 1000,
      motivo: 'Venta',
    },
    biz,
  );

suite('batched push on Postgres', () => {
  let db: Db;
  let owner: postgres.Sql;
  const errors: unknown[] = [];

  /** One push in one tenant transaction, as the route runs it, plus the backend's subxact state. */
  const push = (deltas: Delta[], biz = A) =>
    withBusiness(db, biz, async (tx) => {
      const result = await new ApplyPushUseCase(new PgPushStore(tx, biz, DEVICE), biz, (e) =>
        errors.push(e),
      ).execute({ deltas });
      const [subxact] = await tx.execute<{ overflowed: boolean }>(sql`
        SELECT subxact_overflowed AS overflowed FROM pg_stat_get_backend_subxact(
          (SELECT i FROM pg_stat_get_backend_idset() i WHERE pg_stat_get_backend_pid(i) = pg_backend_pid()))`);
      return { ...result, overflowed: subxact?.overflowed };
    });
  const cursor = (biz = A) => withBusiness(db, biz, (tx) => committedCursor(tx));

  beforeAll(async () => {
    db = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => {} });
    await owner`
      INSERT INTO devices (id, nombre, plataforma, business_id, created_at, updated_at)
      VALUES (${DEVICE}, 'Caja', 'android', ${A}, ${T1}, ${T1})`;
  });

  // Fresh tenants, removed after: nothing is left for suites that count rows.
  afterAll(async () => {
    for (const table of TOUCHED) {
      await owner?.unsafe(`DELETE FROM ${table} WHERE business_id = ANY($1::text[])`, [[A, B]]);
    }
    await db?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('takes a 500-row push in delta order, logs the HYBRID rows at their seqs, and is idempotent', async () => {
    const p = id();
    const deltas = [
      product(p),
      ...Array.from({ length: 249 }, () => movement(id(), p)),
      ...Array.from({ length: 250 }, () => expense(id())),
    ];
    const before = await cursor();
    const started = performance.now();
    const r = await push(deltas);
    const ms = performance.now() - started;

    assert.equal(r.rejected.length, 0, JSON.stringify(r.rejected.slice(0, 3)));
    assert.deepEqual(
      r.accepted.map((a) => a.serverSeq),
      deltas.map((_, i) => before + 1 + i),
    );
    assert.equal(r.overflowed, false, 'no subtransaction overflow (DB2-SYNC-02)');
    assert.ok(ms < 3000, `500 rows took ${Math.round(ms)} ms`);

    const logged = await owner`
      SELECT seq::int, table_name FROM sync_log WHERE business_id = ${A} AND seq > ${before} ORDER BY seq`;
    assert.equal(logged.length, 250, 'the product and its 249 movements, never the expenses');
    assert.deepEqual([logged[0]?.['seq'], logged[0]?.['table_name']], [before + 1, 'products']);
    assert.equal(logged.at(-1)?.['seq'], before + 250);
    const [device] =
      await owner`SELECT acknowledged_through::int AS ack FROM devices WHERE id = ${DEVICE}`;
    assert.equal(device?.['ack'], before + 500);

    const again = await push(deltas);
    assert.deepEqual(
      again.accepted.map((a) => a.serverSeq),
      r.accepted.map((a) => a.serverSeq),
    );
    assert.equal(await cursor(), before + 500, 'a re-push takes no new seqs');
  });

  it('answers a mixed push row by row: bad row, dangling reference, other tenants’ ids', async () => {
    const [theirExpense, theirMovement, p] = [id(), id(), id()];
    await push([expense(theirExpense, {}, B), movement(theirMovement, p, B)], B);
    errors.length = 0;
    const good = Array.from({ length: 30 }, () => expense(id()));
    const bad = expense(id(), { concepto: null });
    const dangling = movement(id(), id());
    const r = await push([
      ...good.slice(0, 10),
      bad,
      expense(theirExpense),
      ...good.slice(10),
      dangling,
      movement(theirMovement, p),
      product(p),
    ]);
    assert.deepEqual(
      r.rejected.map((x) => [x.rowId, x.code]),
      [
        [bad.rowId, 'INTERNAL'],
        [theirExpense, 'DUPLICATE_CONFLICT'],
        [dangling.rowId, 'FK_PRODUCT_MISSING'],
        [theirMovement, 'FK_PRODUCT_MISSING'],
      ],
    );
    assert.equal(r.accepted.length, 31, 'the 30 good expenses and the product');
    assert.equal(errors.length, 1, 'only the bad row is an error');
    const kept = await owner`SELECT business_id FROM expenses WHERE id = ${theirExpense}`;
    assert.deepEqual(
      kept.map((k) => k['business_id']),
      [B],
      'the other tenant’s row is untouched',
    );
    const saved =
      await owner`SELECT code FROM sync_rejections WHERE business_id = ${A} ORDER BY code`;
    assert.equal(saved.length, 4);
  });

  it('refuses a HYBRID insert whose id another tenant holds', async () => {
    const [theirs, p, theirProduct] = [id(), id(), id()];
    await push([product(p)]);
    const setup = await push([product(theirProduct, B), movement(theirs, theirProduct, B)], B);
    assert.equal(setup.accepted.length, 2);
    const r = await push([movement(theirs, p)]);
    assert.deepEqual(
      r.rejected.map((x) => x.code),
      ['DUPLICATE_CONFLICT'],
    );
  });
});
