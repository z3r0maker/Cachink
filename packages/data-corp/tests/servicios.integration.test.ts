import assert from 'node:assert/strict';
import { afterAll, it } from 'vitest';
import {
  guardarServicio,
  registrarRecurrente,
  RegistrarMovimientoUseCase,
  RevertirMovimientoUseCase,
  type RegistrarMovimientoInput,
} from '@xangarro/application/corp';
import type { Servicio } from '@xangarro/domain/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { createRecurringTemplateRepository } from '../src/queries/recurrentes';
import { createServiceRepository } from '../src/queries/servicios';
import { cargosDeServicios, comisionesPorMes } from '../src/queries/servicios-costos';
import { crearBaseDesechable } from './base-desechable';
import { borrarLoDe } from './cleanup';

/**
 * Servicios (E-24): a service saved whole and edited, its template's charges
 * by the month they pay (a reversed one left out), and Stripe's fees by
 * month. 0011 runs old → new in a database of its own (CLAUDE.md §2.9).
 */
const { url, describe } = integrationSuite();
const AUTOR = 'f-servicios-test';

let seq = 0;
/** A month far from every other file's, so their charges never meet. */
const mesLibre = () => {
  const n = (Date.now() + seq++ * 17) % 9000;
  return `${2200 + Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, '0')}`;
};
const siguiente = (mes: string) => {
  const [a, m] = [Number(mes.slice(0, 4)), Number(mes.slice(5, 7))];
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`;
};

const azure = (id: string): Servicio => ({
  id,
  nombre: 'Azure AI Foundry',
  para: 'Claude para los agentes',
  categoria: 'costo_servicio',
  cobro: 'uso',
  estado: 'activo',
  moneda: 'MXN',
  monto: null,
  diaCargo: 3,
  renueva: null,
  tarifa: null,
  aviso: 2_500_00n,
  limite: null,
  usoPlan: null,
  unidad: null,
  gastoMes: 441_29n,
  gastoAl: '2026-10-08',
  pagaCon: 'Tarjeta •••• 4821',
  plantillaId: null,
});

const gasto = (fecha: string, subtotal: bigint): RegistrarMovimientoInput => ({
  fecha,
  projectId: null,
  concepto: `Azure ${fecha}`,
  contraparte: null,
  founderId: AUTOR,
  source: 'manual',
  sourceRef: null,
  usd: null,
  deducible: true,
  movement: {
    kind: 'gasto',
    categoria: 'costo_servicio',
    subtotal,
    iva: subtotal / 10n,
    tratamientoIva: 'acreditable',
    retencionIsr: 0n,
    retencionIva: 0n,
    pagado: true,
  },
});

describe('corp servicios', () => {
  const db = createCorpDb(url as string);
  const ledger = createCorpLedgerRepository(db);
  const deps = {
    servicios: createServiceRepository(db),
    plantillas: createRecurringTemplateRepository(db),
  };
  const id = () => `srv-${AUTOR}-${seq++}-${Date.now()}`;

  afterAll(async () => {
    await borrarLoDe(AUTOR);
    await db.$client.end({ timeout: 5 });
  });

  it('saves a usage service whole, with a template that has no fixed amount', async () => {
    const s = await guardarServicio(deps, {
      servicio: azure(id()),
      recurrente: true,
      plantillaNuevaId: `rec-${id()}`,
      hoy: '2026-10-08',
      founderId: AUTOR,
    });
    assert.deepEqual(await deps.servicios.findById(s.id), s);
    const p = await deps.plantillas.findById(s.plantillaId ?? '');
    assert.deepEqual([p?.montoEstimado, p?.diaCargo, p?.periodicidad], [0n, 3, 'mensual']);
  });

  it('writes an edit over the same row', async () => {
    const s = azure(id());
    await deps.servicios.save(s, AUTOR);
    await deps.servicios.save({ ...s, estado: 'baja', gastoMes: null, gastoAl: null }, AUTOR);
    const leido = await deps.servicios.findById(s.id);
    assert.deepEqual([leido?.estado, leido?.gastoMes], ['baja', null]);
  });

  it('refuses a way of charging the table does not know', async () => {
    await assert.rejects(
      deps.servicios.save({ ...azure(id()), cobro: 'trueque' as Servicio['cobro'] }, AUTOR),
    );
  });

  it('reads a charge by the month it pays, and leaves a reversed one out', async () => {
    const [m1, m2] = [mesLibre(), ''];
    const mes2 = siguiente(m1);
    const s = await guardarServicio(deps, {
      servicio: azure(id()),
      recurrente: true,
      plantillaNuevaId: `rec-${id()}`,
      hoy: `${m1}-01`,
      founderId: AUTOR,
    });
    const plantilla = { tipo: 'existente' as const, id: s.plantillaId ?? '' };
    const cargo = (fecha: string, mes: string, subtotal: bigint) =>
      registrarRecurrente(
        { ledger, plantillas: deps.plantillas },
        {
          movimiento: gasto(fecha, subtotal),
          nonce: id(),
          plantilla: { ...plantilla, mes },
        },
      );
    // The first month is paid on the 3rd of the next one.
    await cargo(`${mes2}-03`, m1, 1_000_00n);
    const malo = await cargo(`${mes2}-04`, mes2, 999_00n);
    await new RevertirMovimientoUseCase(ledger).execute({
      entryId: malo.entry.id,
      fecha: `${mes2}-05`,
      motivo: 'Iba al otro mes',
      founderId: AUTOR,
    });
    const cargos = (await cargosDeServicios(db, m1, mes2)).filter(
      (c) => c.plantillaId === s.plantillaId,
    );
    assert.deepEqual(
      cargos.map((c) => [c.mes, c.fecha, c.monto]),
      [[m1, `${mes2}-03`, 1_100_00n]],
    );
    assert.equal(m2, '');
    assert.deepEqual(
      (await cargosDeServicios(db, mes2, mes2)).filter((c) => c.plantillaId === s.plantillaId),
      [],
    );
  });

  it("sums Stripe's fee per month from its payouts, a reversed payout out", async () => {
    const mes = mesLibre();
    const registrar = new RegistrarMovimientoUseCase(ledger);
    const payout = (dia: string, comision: bigint) =>
      registrar.execute({
        ...gasto(`${mes}-${dia}`, 1n),
        concepto: `Depósito ${dia}`,
        movement: { kind: 'payout', bruto: 10_000_00n, comision },
      });
    await payout('10', 360_00n);
    await payout('20', 140_00n);
    const malo = await payout('21', 77_00n);
    await new RevertirMovimientoUseCase(ledger).execute({
      entryId: malo.id,
      fecha: `${mes}-22`,
      motivo: 'Duplicado',
      founderId: AUTOR,
    });
    assert.equal((await comisionesPorMes(db, mes, mes)).get(mes), 500_00n);
  });

  it('0011 adds services, the period and a zero amount to the templates of the old shape', async () => {
    const base = await crearBaseDesechable();
    try {
      await base.aplicar((f) => f < '0011');
      await base.sql`INSERT INTO corp.recurring_templates
        (id, nombre, categoria, moneda, monto_estimado, dia_cargo, desde, activo, created_at)
        VALUES ('rec-viejo', 'Vercel', 'costo_servicio', 'USD', 2000, 28, '2026-09', true, now())`;
      await assert.rejects(base.sql`UPDATE corp.recurring_templates SET monto_estimado = 0`);
      await base.aplicar((f) => f.startsWith('0011'));
      const [p] =
        await base.sql`SELECT periodicidad FROM corp.recurring_templates WHERE id = 'rec-viejo'`;
      assert.equal(p?.periodicidad, 'mensual');
      await base.sql`UPDATE corp.recurring_templates SET monto_estimado = 0 WHERE id = 'rec-viejo'`;
      await assert.rejects(base.sql`UPDATE corp.recurring_templates SET periodicidad = 'semanal'`);
      const [g] = await base.sql`
        SELECT has_table_privilege('xangarro_corp', 'corp.services', 'UPDATE') AS consola,
               has_table_privilege('xangarro_corp_agent', 'corp.services', 'SELECT') AS lee,
               has_table_privilege('xangarro_corp_agent', 'corp.services', 'INSERT') AS agente,
               has_table_privilege('xangarro_corp', 'corp.services', 'DELETE') AS borra`;
      assert.deepEqual({ ...g }, { consola: true, lee: true, agente: false, borra: false });
    } finally {
      await base.cerrar();
    }
  });
});
