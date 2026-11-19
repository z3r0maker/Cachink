import assert from 'node:assert/strict';
import postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';
import {
  pedirGasto,
  prepararPresupuesto,
  responderPresupuesto,
  responderSolicitud,
} from '@xangarro/application/corp';
import type { Montos } from '@xangarro/domain/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import {
  createPresupuestoRepository,
  listarPresupuestos,
  listarSolicitudes,
} from '../src/queries/presupuesto';
import { borrarLoDe } from './cleanup';

/**
 * Presupuesto's storage (E-22) against rows the seed does not have: a budget
 * prepared, refused to its own founder by the trigger and approved by the
 * other; spending requests approved on their own inside the Límite, two at
 * once never both; and the other founder's answer. In a quarter and months no
 * other run writes.
 */
const { url, describe } = integrationSuite();
const F1 = 'f-presupuesto-1';
const F2 = 'f-presupuesto-2';

const n = (Date.now() % 4_000) + 1;
const ANIO = 7000 + Math.floor(n / 4);
const TRIMESTRE = `${ANIO}-T${(n % 4) + 1}`;
const HOY = `${ANIO}-${String((n % 4) * 3 + 1).padStart(2, '0')}-10`;

const montos: Montos = {
  costo_servicio: 8_500_00n,
  ventas_marketing: 12_000_00n,
  desarrollo: 5_000_00n,
  administracion: 5_500_00n,
};

describe('corp presupuesto', () => {
  let corp: postgres.Sql;
  const db = () => createCorpDb(url as string);
  const deps = () => ({
    presupuesto: createPresupuestoRepository(db()),
    ingresoPromedio: async () => 15_600_00n,
  });

  beforeAll(() => {
    corp = postgres(url as string, { max: 1, onnotice: () => {} });
  });

  afterAll(async () => {
    await corp.end();
    await borrarLoDe(F1);
    await borrarLoDe(F2);
  });

  it('keeps a budget with its four lines, and the other founder approves it', async () => {
    const id = await prepararPresupuesto(deps(), {
      trimestre: TRIMESTRE,
      montos,
      founderId: F1,
      hoy: HOY,
    });
    await assert.rejects(
      corp`INSERT INTO corp.budget_answers (budget_id, kind, founder_id, at)
           VALUES (${id}, 'aprobado', ${F1}, now())`,
      /other founder/,
    );
    await responderPresupuesto(deps(), { id, aprobar: true, founderId: F2 });
    const p = (await listarPresupuestos(db())).find((x) => x.id === id);
    assert.deepEqual(p?.montos, montos);
    assert.equal(p?.respuesta?.kind, 'aprobado');
    assert.equal(p?.respuesta?.founderId, F2);
  });

  it('refuses a second budget for an approved quarter in the database too', async () => {
    await assert.rejects(
      corp`INSERT INTO corp.budgets (id, quarter, prepared_by, prepared_at)
           VALUES (${`x-${n}`}, ${TRIMESTRE}, ${F2}, now())`,
      /already has a budget/,
    );
  });

  it('approves on its own what fits in the Límite, never two past it at once', async () => {
    const pedir = (monto: bigint) =>
      pedirGasto(deps(), {
        concepto: 'Canva',
        categoria: 'ventas_marketing',
        monto,
        founderId: F1,
        hoy: HOY,
      });
    const [a, b] = await Promise.all([pedir(1_000_00n), pedir(1_000_00n)]);
    assert.deepEqual([a.automatica, b.automatica].sort(), [false, true]);
    const delMes = await listarSolicitudes(db(), HOY.slice(0, 7));
    assert.equal(delMes.filter((s) => s.founderId === F1).length, 2);
  });

  it('records the other founder approving less, and refuses the requester', async () => {
    const s = await pedirGasto(deps(), {
      concepto: 'Campaña de video',
      categoria: 'ventas_marketing',
      monto: 6_000_00n,
      founderId: F2,
      hoy: HOY,
    });
    assert.equal(s.automatica, false);
    await assert.rejects(
      corp`INSERT INTO corp.spend_request_answers (request_id, kind, monto, founder_id, at)
           VALUES (${s.id}, 'aprobada', 6000000, ${F1}, now())`,
      /not the other founder/,
    );
    await assert.rejects(
      corp`INSERT INTO corp.spend_request_answers (request_id, kind, monto, founder_id, at)
           VALUES (${s.id}, 'aprobada', 600000, ${F2}, now())`,
      /not the other founder/,
    );
    await responderSolicitud(deps(), { id: s.id, aprobar: true, monto: 3_000_00n, founderId: F1 });
    const leida = (await listarSolicitudes(db())).find((x) => x.id === s.id);
    assert.equal(leida?.respuesta?.monto, 3_000_00n);
    assert.equal(typeof leida?.monto, 'bigint');
  });
});
