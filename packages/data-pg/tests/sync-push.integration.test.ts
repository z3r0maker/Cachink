import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { allocateSeqs, committedCursor, logChanges } from '../src/sync/cursor';
import { finishPush, receiptsOf, receiptsQuery, saveReceipts } from '../src/sync/push';
import { resolveRejections, saveRejections } from '../src/sync/rejections';
import { existingIds, writeSyncedRows } from '../src/sync/push-rows';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * The batched push's SQL (audit DB2-SYNC-01; ADR-110), on real Postgres under
 * RLS: one statement per table, the cursor taken as a block, receipts matched on
 * their primary key, and another tenant's id refused rather than overwritten.
 */
const { url, describe } = integrationSuite();
const A = testId('Y');
const B = testId('Y');
const DEVICE = testId('Y');
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
const T2 = '2026-09-26T11:00:00.000Z';

const expense = (biz: string, id: string, updatedAt = T1, concepto = 'Renta') => ({
  id,
  fecha: '2026-09-26',
  concepto,
  categoria: 'Renta',
  monto: '150000',
  businessId: biz,
  deviceId: DEVICE,
  createdAt: T1,
  updatedAt,
});

const movement = (biz: string, id: string) => ({
  id,
  productoId: testId('Y'),
  fecha: '2026-09-26',
  tipo: 'salida',
  cantidad: 1,
  costoUnitCentavos: '1000',
  motivo: 'Venta',
  businessId: biz,
  deviceId: DEVICE,
  createdAt: T1,
  updatedAt: T1,
});

describe('batched push SQL', () => {
  let db: Db;
  let owner: postgres.Sql;
  const inA = <T>(fn: Parameters<typeof withBusiness<T>>[2]) => withBusiness(db, A, fn);

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

  it('writes 500 rows of a table in one statement, and keeps the newer row on an older push', async () => {
    const ids = Array.from({ length: 500 }, () => testId('Y'));
    const first = await inA((tx) =>
      writeSyncedRows(
        tx,
        'expenses',
        ids.map((id) => expense(A, id, T2, 'nuevo')),
        false,
      ),
    );
    assert.deepEqual(new Set(first), new Set(['written']));
    const older = await inA((tx) =>
      writeSyncedRows(
        tx,
        'expenses',
        ids.map((id) => expense(A, id, T1, 'viejo')),
        false,
      ),
    );
    assert.deepEqual(new Set(older), new Set(['kept']));
    const [row] = await owner`SELECT concepto FROM expenses WHERE id = ${ids[0] as string}`;
    assert.equal(row?.['concepto'], 'nuevo');
  });

  it('leaves out a field a row does not carry, rather than nulling it', async () => {
    const id = testId('Y');
    await inA((tx) =>
      writeSyncedRows(tx, 'expenses', [{ ...expense(A, id), proveedor: 'Don Beto' }], false),
    );
    const out = await inA((tx) =>
      writeSyncedRows(tx, 'expenses', [expense(A, id, T2, 'otro')], false),
    );
    assert.deepEqual(out, ['written']);
    const [row] = await owner`SELECT proveedor, concepto FROM expenses WHERE id = ${id}`;
    assert.deepEqual({ ...row }, { proveedor: 'Don Beto', concepto: 'otro' });
  });

  it('refuses an upsert batch holding another tenant’s id (42501), and writes none of it', async () => {
    const theirs = testId('Y');
    await withBusiness(db, B, (tx) => writeSyncedRows(tx, 'expenses', [expense(B, theirs)], false));
    const mine = testId('Y');
    await assert.rejects(
      inA((tx) =>
        writeSyncedRows(tx, 'expenses', [expense(A, mine, T2), expense(A, theirs, T2)], false),
      ),
      (e: unknown) => (e as { cause?: { code?: string } }).cause?.code === '42501',
    );
    const rows = await owner`SELECT business_id FROM expenses WHERE id IN (${mine}, ${theirs})`;
    assert.deepEqual(
      rows.map((r) => r['business_id']),
      [B],
    );
  });

  it('answers insert-only rows: new ones written, ours kept, another tenant’s invisible', async () => {
    const [ours, theirs, fresh] = [testId('Y'), testId('Y'), testId('Y')];
    await inA((tx) => writeSyncedRows(tx, 'inventory_movements', [movement(A, ours)], true));
    await withBusiness(db, B, (tx) =>
      writeSyncedRows(tx, 'inventory_movements', [movement(B, theirs)], true),
    );
    const out = await inA((tx) =>
      writeSyncedRows(
        tx,
        'inventory_movements',
        [movement(A, ours), movement(A, theirs), movement(A, fresh)],
        true,
      ),
    );
    assert.deepEqual(out, ['kept', 'invisible', 'written']);
    assert.deepEqual(
      await inA((tx) => existingIds(tx, 'inventory_movements', [ours, theirs])),
      new Set([ours]),
    );
  });

  it('takes a block of consecutive seqs in one bump, and logs them in one insert', async () => {
    const before = await inA((tx) => committedCursor(tx));
    const first = await inA(async (tx) => {
      const start = await allocateSeqs(tx, A, 3);
      await logChanges(tx, A, [
        { seq: start, tableName: 'products', rowId: 'p1', op: 'insert' },
        { seq: start + 2, tableName: 'inventory_movements', rowId: 'm1', op: 'insert' },
      ]);
      return start;
    });
    assert.equal(first, before + 1);
    assert.equal(await inA((tx) => committedCursor(tx)), before + 3);
    const log = await owner`
      SELECT seq::int, table_name FROM sync_log WHERE business_id = ${A} AND seq > ${before} ORDER BY seq`;
    assert.deepEqual(
      log.map((r) => [r['seq'], r['table_name']]),
      [
        [before + 1, 'products'],
        [before + 3, 'inventory_movements'],
      ],
    );
  });

  it('matches receipts on (table, row) — the same id in another table is not its receipt', async () => {
    const id = testId('Y');
    await inA((tx) =>
      saveReceipts(tx, A, DEVICE, [{ tableName: 'sales', rowId: id, seq: 7, rowUpdatedAt: T1 }]),
    );
    const got = await inA((tx) =>
      receiptsOf(tx, A, [
        { table: 'sales', rowId: id },
        { table: 'expenses', rowId: id },
      ]),
    );
    assert.deepEqual(got, [{ tableName: 'sales', rowId: id, seq: 7, rowUpdatedAt: T1 }]);
  });

  it('looks receipts up through the primary key on both columns, never by id alone', async () => {
    // A tenant with history, so the planner costs it as one: on an empty
    // tenant any plan is cheap and the test would prove nothing.
    await owner`
      INSERT INTO sync_receipts (table_name, row_id, seq, device_id, row_updated_at, received_at, business_id)
      SELECT 'sales', 'hist-' || g, g, ${DEVICE}, ${T1}, ${T1}, ${A} FROM generate_series(1, 20000) g`;
    await owner`ANALYZE sync_receipts`;
    const plan = await inA(async (tx) => {
      const keys = [
        { table: 'sales', rowId: 'hist-1' },
        { table: 'expenses', rowId: 'hist-2' },
      ];
      const rows = await tx.execute(sql`EXPLAIN ${receiptsQuery(A, keys)}`);
      return rows.map((r) => String((r as Record<string, unknown>)['QUERY PLAN'])).join('\n');
    });
    assert.match(plan, /Index (Only )?Scan using sync_receipts_\w*pk/);
    assert.match(
      plan,
      /Index Cond: \(\(business_id = .*\) AND \(table_name = k\.t\) AND \(row_id = k\.id\)\)/,
    );
  });

  it('keeps one rejection per row: the later answer in a push wins, and a retry updates it', async () => {
    const id = testId('Y');
    const rejection = (code: string) => ({
      tableName: 'sales',
      rowId: id,
      clientSeq: 1,
      code,
      message: code,
      payload: '{"preview":"Venta"}',
    });
    await inA((tx) =>
      saveRejections(tx, A, DEVICE, [rejection('INTERNAL'), rejection('FK_PRODUCT_MISSING')]),
    );
    await inA((tx) => saveRejections(tx, A, DEVICE, [rejection('FK_CLIENT_MISSING')]));
    const rows = await owner`SELECT code FROM sync_rejections WHERE row_id = ${id}`;
    assert.deepEqual(
      rows.map((r) => r['code']),
      ['FK_CLIENT_MISSING'],
    );
  });

  it('closes only this device’s open rejections of the accepted rows (DB3-SYNC-04)', async () => {
    const [kept, closed, other] = [testId('Y'), testId('Y'), testId('Y')];
    const OTHER_DEVICE = testId('Y');
    const rejection = (rowId: string, payload: string | null = null) => ({
      tableName: 'expenses',
      rowId,
      clientSeq: 1,
      code: 'INTERNAL',
      message: 'retry',
      payload,
    });
    await inA((tx) =>
      saveRejections(tx, A, DEVICE, [rejection(kept), rejection(closed, '{"preview":"Gasto"}')]),
    );
    await inA((tx) => saveRejections(tx, A, OTHER_DEVICE, [rejection(closed)]));
    await inA((tx) =>
      resolveRejections(tx, A, DEVICE, [
        { table: 'expenses', rowId: closed },
        { table: 'sales', rowId: kept }, // same id, another table: not this rejection
        { table: 'expenses', rowId: other }, // no rejection at all
      ]),
    );
    const rows = await owner`
      SELECT row_id, device_id, payload, resolved_at IS NOT NULL AS resolved
      FROM sync_rejections WHERE row_id = ANY(${[kept, closed]}) ORDER BY row_id, device_id`;
    const state = (rowId: string, device: string) =>
      rows.find((r) => r['row_id'] === rowId && r['device_id'] === device);
    assert.equal(state(closed, DEVICE)?.['resolved'], true);
    assert.equal(state(closed, OTHER_DEVICE)?.['resolved'], false, 'another device’s stays open');
    assert.equal(state(kept, DEVICE)?.['resolved'], false);
    assert.equal(state(kept, DEVICE)?.['payload'], null, 'a rejection may keep no payload');
  });

  it('records the acknowledgement and returns the cursor, never moving it back', async () => {
    const cursor = await inA((tx) => finishPush(tx, DEVICE, 40));
    assert.equal(cursor, await inA((tx) => committedCursor(tx)));
    await inA((tx) => finishPush(tx, DEVICE, 12));
    const [row] =
      await owner`SELECT acknowledged_through::int AS ack, last_push_at FROM devices WHERE id = ${DEVICE}`;
    assert.equal(row?.['ack'], 40);
    assert.notEqual(row?.['last_push_at'], null);
  });
});
