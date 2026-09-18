import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { cortesDeDispositivo } from '../src/queries';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/** P-06's drawer: one device's cortes only, newest first, capped, no deleted ones. */
const { url, describe } = integrationSuite();
const BIZ = testId('K');
const A = testId('A');
const B = testId('B');

describe('cortesDeDispositivo', () => {
  let db: Db;

  beforeAll(async () => {
    db = createDb(url as string);
    await withBusiness(db, BIZ, async (tx) => {
      const corte = (dev: string, fecha: string, deleted = false) =>
        tx.execute(sql`
          INSERT INTO day_closes (id, fecha, efectivo_esperado_centavos, efectivo_contado_centavos,
                                  diferencia_centavos, cerrado_por, business_id, device_id,
                                  created_at, updated_at, deleted_at)
          VALUES (${testId('C')}, ${fecha}, 100000, 99000, -1000, 'Operativo', ${BIZ}, ${dev},
                  now(), now(), ${deleted ? sql`now()` : null})`);
      for (const f of [
        '2026-05-08',
        '2026-05-09',
        '2026-05-10',
        '2026-05-11',
        '2026-05-12',
        '2026-05-13',
      ]) {
        await corte(A, f);
      }
      await corte(A, '2026-05-14', true);
      await corte(B, '2026-05-15');
    });
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('returns only this device, newest first, five at most', async () => {
    const c = await withBusiness(db, BIZ, (tx) => cortesDeDispositivo(tx, A));
    assert.deepEqual(
      c.map((x) => x.fecha),
      ['2026-05-13', '2026-05-12', '2026-05-11', '2026-05-10', '2026-05-09'],
    );
    assert.deepEqual(
      { esperado: c[0]?.esperado, contado: c[0]?.contado, diferencia: c[0]?.diferencia },
      { esperado: 100000n, contado: 99000n, diferencia: -1000n },
    );
  });

  it('a device with no cortes has none', async () => {
    assert.deepEqual(await withBusiness(db, BIZ, (tx) => cortesDeDispositivo(tx, testId('N'))), []);
  });
});
