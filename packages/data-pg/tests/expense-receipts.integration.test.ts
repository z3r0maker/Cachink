import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { latestExpenseReceipt, receiptsOfGastos } from '../src/queries/expense-receipts';
import { writeSyncedRows } from '../src/sync/push-rows';
import { integrationSuite } from './support/db';
import { ABSENT_ID, testId } from './support/test-ids';

/**
 * 0059: `expense_receipts` (ADR-149, M-18). The seed has no receipts, so this
 * builds them: a gasto pushed twice (the newest wins), a gasto with one
 * receipt from a register, a gasto with none, and a receipt in a second
 * tenant. It proves the push lands the base64 as bytea, the two reads the
 * portal makes, RLS between tenants and the table's checks.
 */
const { url, describe } = integrationSuite();

/** Drizzle wraps the Postgres error; the reason is on its `cause`. */
const refusedWith = (pattern: RegExp) => (e: unknown) => {
  const cause = (e as { cause?: { message?: string } }).cause;
  assert.match(String(cause?.message ?? (e as Error).message), pattern);
  return true;
};

const BIZ = testId('E');
const OTHER = testId('E');
const CAJA = testId('D');
const GASTO_TWICE = testId('X');
const GASTO_ONCE = testId('X');
const GASTO_NONE = testId('X');
const OLD_BYTES = Buffer.from('RIFF....WEBPVP8 old', 'latin1').toString('base64');
const NEW_BYTES = Buffer.from('RIFF....WEBPVP8 new!', 'latin1').toString('base64');
const AT = { now: new Date('2026-11-20T00:00:00.000Z') };
const T_LATE = '2026-11-19T19:00:00.000Z';

function receipt(businessId: string, gastoId: string, at: string, bytes = NEW_BYTES) {
  return {
    id: testId('R'),
    gastoId,
    mime: 'image/webp',
    bytes,
    width: 768,
    height: 1024,
    businessId,
    deviceId: CAJA,
    createdByUserId: null,
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
  };
}

describe('0059 expense_receipts', () => {
  let db: Db;
  const older = receipt(BIZ, GASTO_TWICE, '2026-11-19T16:00:00.000Z', OLD_BYTES);
  const newer = receipt(BIZ, GASTO_TWICE, '2026-11-19T16:05:00.000Z');
  const once = receipt(BIZ, GASTO_ONCE, '2026-11-19T17:30:00.000Z');
  const theirs = receipt(OTHER, GASTO_ONCE, '2026-11-19T18:00:00.000Z');

  beforeAll(async () => {
    db = createDb(url as string);
    await withBusiness(db, BIZ, async (tx) => {
      const now = '2026-11-01T00:00:00.000Z';
      await tx.execute(sql`
        INSERT INTO devices (id, nombre, plataforma, modelo, business_id, created_at, updated_at)
        VALUES (${CAJA}, 'Caja 1', 'ios', 'iPhone 12', ${BIZ}, ${now}, ${now})`);
      await writeSyncedRows(tx, 'expense_receipts', [older, newer, once], false, AT);
    });
    await withBusiness(db, OTHER, (tx) =>
      writeSyncedRows(tx, 'expense_receipts', [theirs], false, AT),
    );
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('lands a pushed receipt as bytea and reads it back as the same base64', async () => {
    const raw = await withBusiness(db, BIZ, (tx) =>
      tx.execute<{ n: string }>(
        sql`SELECT octet_length(bytes)::text AS n FROM expense_receipts WHERE id = ${newer.id}`,
      ),
    );
    assert.equal(raw[0]?.n, String(Buffer.from(NEW_BYTES, 'base64').byteLength));
    const got = await withBusiness(db, BIZ, (tx) => latestExpenseReceipt(tx, GASTO_ONCE));
    assert.equal(got?.bytes, NEW_BYTES);
    assert.equal(got?.mime, 'image/webp');
  });

  it('serves the newest receipt of a gasto, with the hash of its bytes', async () => {
    const got = await withBusiness(db, BIZ, (tx) => latestExpenseReceipt(tx, GASTO_TWICE));
    assert.equal(got?.id, newer.id);
    const sha = createHash('sha256').update(Buffer.from(NEW_BYTES, 'base64')).digest('hex');
    assert.equal(got?.hash, sha);
  });

  it('answers null for a gasto with no receipt', async () => {
    assert.equal(await withBusiness(db, BIZ, (tx) => latestExpenseReceipt(tx, GASTO_NONE)), null);
    assert.equal(await withBusiness(db, BIZ, (tx) => latestExpenseReceipt(tx, ABSENT_ID)), null);
  });

  it('says which gastos of a page have a receipt, when and on which register', async () => {
    const rows = await withBusiness(db, BIZ, (tx) =>
      receiptsOfGastos(tx, [GASTO_TWICE, GASTO_ONCE, GASTO_NONE]),
    );
    const byGasto = new Map(rows.map((r) => [r.gastoId, r]));
    assert.equal(rows.length, 2);
    assert.deepEqual(byGasto.get(GASTO_TWICE), {
      gastoId: GASTO_TWICE,
      id: newer.id,
      tomadaEl: '2026-11-19T16:05:00.000Z',
      caja: 'Caja 1',
    });
    assert.equal(byGasto.has(GASTO_NONE), false);
    assert.deepEqual(await withBusiness(db, BIZ, (tx) => receiptsOfGastos(tx, [])), []);
  });

  it('never shows another tenant’s receipt, under RLS', async () => {
    const mine = await withBusiness(db, BIZ, (tx) => latestExpenseReceipt(tx, GASTO_ONCE));
    assert.equal(mine?.id, once.id);
    const seen = await withBusiness(db, OTHER, (tx) =>
      receiptsOfGastos(tx, [GASTO_TWICE, GASTO_ONCE]),
    );
    assert.deepEqual(
      seen.map((r) => r.id),
      [theirs.id],
    );
    assert.equal(seen[0]?.caja, null, 'BIZ’s register is invisible to OTHER');
    await assert.rejects(
      withBusiness(db, OTHER, (tx) =>
        writeSyncedRows(tx, 'expense_receipts', [receipt(BIZ, GASTO_NONE, T_LATE)], false, AT),
      ),
      refusedWith(/row-level security/),
    );
  });

  it('refuses a PNG, a photo over 96 KB, a side over 1024 px and a row without bytes', async () => {
    const bad = (over: Record<string, unknown>) =>
      withBusiness(db, BIZ, (tx) =>
        tx.execute(sql`
          INSERT INTO expense_receipts (id, gasto_id, mime, bytes, width, height,
                                        business_id, device_id, created_at, updated_at)
          VALUES (${testId('R')}, ${GASTO_NONE}, ${over['mime'] ?? 'image/webp'},
                  ${over['bytes'] === undefined ? Buffer.from('RIFF') : over['bytes']}::bytea,
                  ${over['width'] ?? 100}, 100, ${BIZ}, ${CAJA}, now(), now())`),
      );
    await assert.rejects(bad({ mime: 'image/png' }), refusedWith(/mime/));
    await assert.rejects(bad({ bytes: Buffer.alloc(98_305, 1) }), refusedWith(/bytes/));
    await assert.rejects(bad({ width: 1025 }), refusedWith(/width/));
    await assert.rejects(bad({ bytes: null }), refusedWith(/null value|bytes/));
  });
});
