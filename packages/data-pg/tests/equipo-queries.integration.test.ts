import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { cortesDeDispositivo, turnosDeOperador } from '../src/queries';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * The Equipo drawers: one device's cortes (P-06) and one operator's shifts
 * (P-05) — only theirs, newest first, capped, no deleted rows.
 */
const { url, describe } = integrationSuite();
const BIZ = testId('K');
const A = testId('A');
const B = testId('B');
const OP = testId('U');

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
      const turno = (user: string, dia: string, cerrado: boolean) =>
        tx.execute(sql`
          INSERT INTO caja_turnos (id, user_id, fecha, apertura_at, cierre_at, monto_apertura_centavos,
                                   efectivo_adicional_centavos, diferencia_centavos, business_id,
                                   device_id, created_at, updated_at)
          VALUES (${testId('T')}, ${user}, ${dia}, ${`${dia}T09:00:00Z`},
                  ${cerrado ? `${dia}T21:00:00Z` : null}, 50000, 0, ${cerrado ? -500 : null},
                  ${BIZ}, ${A}, now(), now())`);
      await turno(OP, '2026-05-11', true);
      await turno(OP, '2026-05-12', false);
      await turno(testId('V'), '2026-05-12', true);
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

  it("returns only this operator's shifts, the open one first", async () => {
    const t = await withBusiness(db, BIZ, (tx) => turnosDeOperador(tx, OP));
    assert.deepEqual(
      t.map((x) => ({ fecha: x.fecha, abierto: x.cierreAt === null, diferencia: x.diferencia })),
      [
        { fecha: '2026-05-12', abierto: true, diferencia: null },
        { fecha: '2026-05-11', abierto: false, diferencia: -500n },
      ],
    );
  });
});
