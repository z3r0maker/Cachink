import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, withBusiness, type Db } from '../src/client';
import { writeSyncedRows } from '../src/sync/push-rows';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * Security audit 2026-11, F-05 a, on real Postgres under RLS: the newest
 * `updated_at` wins an upsert, so a device that pushed «year 2099» used to hold
 * its row against every later edit. A timestamp further ahead of the server
 * than the skew is now stored as the server's time, and a row stored in the
 * future before this change no longer outvotes anyone.
 */
const { url, describe } = integrationSuite();
const A = testId('K');
const PHONE = testId('K');
const OTHER_PHONE = testId('K');
const TOUCHED = ['expenses', 'inventory_movements'];

/** The server's clock for each write: the tests move it, the rows never read the real one. */
const NOON = new Date('2026-11-09T18:00:00.000Z');
const later = (minutes: number) => new Date(NOON.getTime() + minutes * 60_000);
const FAR = '2099-01-01T00:00:00.000Z';
const PAST = '2026-09-26T10:00:00.000Z';

const expense = (id: string, updatedAt: string, concepto: string, deviceId = PHONE) => ({
  id,
  fecha: '2026-09-26',
  concepto,
  categoria: 'Renta',
  monto: '150000',
  businessId: A,
  deviceId,
  createdAt: PAST,
  updatedAt,
});

describe('a pushed row’s clock is held to the server’s', () => {
  let db: Db;
  let owner: postgres.Sql;
  const write = (rows: Record<string, unknown>[], now: Date, table = 'expenses' as const) =>
    withBusiness(db, A, (tx) => writeSyncedRows(tx, table, rows, false, { now }));
  const stored = async (id: string) => {
    const [row] = await owner<{ concepto: string; updated: Date; created: Date }[]>`
      SELECT concepto, updated_at AS updated, created_at AS created FROM expenses WHERE id = ${id}`;
    return {
      concepto: row?.concepto,
      updatedAt: row?.updated.toISOString(),
      createdAt: row?.created.toISOString(),
    };
  };

  beforeAll(() => {
    db = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => {} });
  });

  afterAll(async () => {
    for (const table of TOUCHED) {
      await owner?.unsafe(`DELETE FROM ${table} WHERE business_id = $1`, [A]);
    }
    await db?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('stores a far-future row at the server’s time, and still stores it', async () => {
    const id = testId('K');
    assert.deepEqual(await write([expense(id, FAR, 'del futuro')], NOON), ['written']);
    assert.deepEqual(await stored(id), {
      concepto: 'del futuro',
      updatedAt: NOON.toISOString(),
      createdAt: PAST,
    });
  });

  it('a later ordinary edit from another device then wins', async () => {
    const id = testId('K');
    await write([expense(id, FAR, 'del futuro')], NOON);
    const edit = expense(id, later(10).toISOString(), 'corregido', OTHER_PHONE);
    assert.deepEqual(await write([edit], later(10)), ['written']);
    assert.deepEqual(await stored(id), {
      concepto: 'corregido',
      updatedAt: later(10).toISOString(),
      createdAt: PAST,
    });
  });

  it('leaves a past timestamp untouched, and last-write-wins between honest clocks as it was', async () => {
    const id = testId('K');
    const newer = '2026-09-26T11:00:00.000Z';
    await write([expense(id, newer, 'nuevo')], NOON);
    assert.equal((await stored(id)).updatedAt, newer);
    assert.deepEqual(await write([expense(id, PAST, 'viejo')], later(1)), ['kept']);
    assert.equal((await stored(id)).concepto, 'nuevo');
  });

  it('the same wrong clock keeps syncing: its own next edit wins over its last', async () => {
    const id = testId('K');
    await write([expense(id, FAR, 'turno abierto')], NOON);
    const next = '2099-01-01T08:00:00.000Z';
    assert.deepEqual(await write([expense(id, next, 'turno cerrado')], later(1)), ['written']);
    assert.deepEqual(
      [(await stored(id)).concepto, (await stored(id)).updatedAt],
      ['turno cerrado', later(1).toISOString()],
    );
  });

  it('a row stored in the future before this change no longer holds against an edit', async () => {
    const id = testId('K');
    await owner`
      INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos, business_id, device_id,
                            created_at, updated_at)
      VALUES (${id}, '2026-09-26', 'fijado', 'Renta', 1, ${A}, ${PHONE}, ${PAST}, ${FAR})`;
    const edit = expense(id, NOON.toISOString(), 'liberado', OTHER_PHONE);
    assert.deepEqual(await write([edit], NOON), ['written']);
    assert.deepEqual(
      [(await stored(id)).concepto, (await stored(id)).updatedAt],
      ['liberado', NOON.toISOString()],
    );
  });

  it('a clock a few minutes fast is believed, and holds only until the server passes it', async () => {
    const id = testId('K');
    const fast = later(4).toISOString();
    await write([expense(id, fast, 'adelantado')], NOON);
    assert.equal((await stored(id)).updatedAt, fast);
    assert.deepEqual(await write([expense(id, later(2).toISOString(), 'antes')], later(2)), [
      'kept',
    ]);
    assert.deepEqual(await write([expense(id, later(6).toISOString(), 'después')], later(6)), [
      'written',
    ]);
  });

  it('holds createdAt, and an insert-only row, to the same clock', async () => {
    const id = testId('K');
    await write([{ ...expense(id, FAR, 'creado en 2099'), createdAt: FAR }], NOON);
    assert.equal((await stored(id)).createdAt, NOON.toISOString());

    const move = testId('K');
    const out = await withBusiness(db, A, (tx) =>
      writeSyncedRows(
        tx,
        'inventory_movements',
        [
          {
            id: move,
            productoId: testId('K'),
            fecha: '2026-09-26',
            tipo: 'salida',
            cantidad: 1,
            costoUnitCentavos: '1000',
            motivo: 'Venta',
            businessId: A,
            deviceId: PHONE,
            createdAt: FAR,
            updatedAt: FAR,
          },
        ],
        true,
        { now: NOON },
      ),
    );
    assert.deepEqual(out, ['written']);
    const [row] = await owner<{ updated: Date; created: Date }[]>`
      SELECT updated_at AS updated, created_at AS created FROM inventory_movements WHERE id = ${move}`;
    assert.deepEqual(
      [row?.updated.toISOString(), row?.created.toISOString()],
      [NOON.toISOString(), NOON.toISOString()],
    );
  });
});
