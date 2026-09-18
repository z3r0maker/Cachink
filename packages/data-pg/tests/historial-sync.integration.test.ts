import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { historialSync } from '../src/queries';
import { logChange } from '../src/sync/cursor';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * P-11's Historial, derived from receipts, rejections and the change log, on a
 * throwaway tenant: one push of 3 rows is one «envio» line, a refused row one
 * «rechazo», and 2 portal edits one «portal» line.
 */
const { url, describe } = integrationSuite();
const BIZ = testId('H');
const DEV = testId('D');

describe('historialSync', () => {
  let db: Db;

  beforeAll(async () => {
    db = createDb(url as string);
    await withBusiness(db, BIZ, async (tx) => {
      await tx.execute(sql`
        INSERT INTO devices (id, nombre, plataforma, modelo, business_id, created_at, updated_at)
        VALUES (${DEV}, 'Caja mostrador', 'android', 'x', ${BIZ}, now(), now())`);
      for (const row of ['p1', 'p2', 'p3']) {
        const seq = await logChange(tx, BIZ, 'products', row, 'insert');
        await tx.execute(sql`
          INSERT INTO sync_receipts (table_name, row_id, seq, device_id, row_updated_at, received_at, business_id)
          VALUES ('products', ${row}, ${seq}, ${DEV}, now(), now(), ${BIZ})`);
      }
      await tx.execute(sql`
        INSERT INTO sync_rejections (id, device_id, table_name, row_id, code, received_at, business_id, created_at, updated_at)
        VALUES (${testId('R')}, ${DEV}, 'sales', 's1', 'PRODUCT_NOT_FOUND', now(), ${BIZ}, now(), now())`);
      await logChange(tx, BIZ, 'businesses', BIZ, 'update');
      await logChange(tx, BIZ, 'employees', 'e1', 'insert');
    });
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('groups each kind per device per minute, newest first', async () => {
    const h = await withBusiness(db, BIZ, (tx) => historialSync(tx));
    const byTipo = Object.fromEntries(h.map((e) => [e.tipo, e]));
    assert.equal(h.length, 3);
    assert.deepEqual(
      { dispositivo: byTipo.envio?.dispositivo, registros: byTipo.envio?.registros },
      { dispositivo: 'Caja mostrador', registros: 3 },
    );
    assert.equal(byTipo.rechazo?.registros, 1);
    assert.deepEqual(
      { dispositivo: byTipo.portal?.dispositivo, registros: byTipo.portal?.registros },
      { dispositivo: null, registros: 2 },
    );
    assert.match(byTipo.portal?.at ?? '', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00Z$/);
  });

  it('honours the limit', async () => {
    assert.equal((await withBusiness(db, BIZ, (tx) => historialSync(tx, 1))).length, 1);
  });

  it('another tenant sees none of it', async () => {
    const other = await withBusiness(db, testId('O'), (tx) => historialSync(tx));
    assert.deepEqual(other, []);
  });
});
