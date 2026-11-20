import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertNuevaTarjeta,
  assertPuedeCotizar,
  assertPuedeEnviar,
  assertPuedeProponer,
  assertPuedeQuitar,
  assertPuedeResponderPlan,
  estadoDelPlan,
  limiteDelPlan,
  TableroError,
  type EventoPlan,
} from '../../src/corp/tablero/index.js';
import { ev, tarjeta } from './tablero-fixture.js';

const codigo = (code: string) => (e: unknown) => e instanceof TableroError && e.code === code;

const enviado: EventoPlan = {
  trimestre: '2027-T1',
  tipo: 'enviado',
  socio: 2,
  fecha: '2026-12-20',
};
const aprobado: EventoPlan = {
  trimestre: '2027-T1',
  tipo: 'aprobado',
  socio: 1,
  fecha: '2027-01-02',
};
const plan = (...e: EventoPlan[]) => estadoDelPlan(e, '2027-T1');

describe("the quarter's plan (OD-4 §5)", () => {
  it('is a draft, then sent, then approved; a rejection returns it to draft', () => {
    assert.equal(plan().fase, 'borrador');
    assert.deepEqual(plan(enviado), { fase: 'enviado', por: 2, el: '2026-12-20' });
    assert.deepEqual(plan(enviado, aprobado), { fase: 'aprobado', por: 1, el: '2027-01-02' });
    const r = plan(enviado, { ...aprobado, tipo: 'rechazado' });
    assert.equal(r.fase, 'borrador');
  });

  it('is approved until day 10 of its quarter', () => {
    assert.equal(limiteDelPlan('2027-T1'), '2027-01-10');
    assert.equal(limiteDelPlan('2026-T4'), '2026-10-10');
  });

  it('is sent once, as a draft, by day 10', () => {
    assertPuedeEnviar({ trimestre: '2027-T1', plan: plan(), hoy: '2026-12-20' });
    assert.throws(
      () => assertPuedeEnviar({ trimestre: '2027-T1', plan: plan(enviado), hoy: '2026-12-21' }),
      codigo('PLAN_ESTADO'),
    );
    assert.throws(
      () => assertPuedeEnviar({ trimestre: '2027-T1', plan: plan(), hoy: '2027-01-11' }),
      codigo('PLAN_FUERA_DE_PLAZO'),
    );
  });

  it('is approved by the other partner, only with every deliverable valued', () => {
    const base = {
      trimestre: '2027-T1',
      plan: plan(enviado),
      hoy: '2027-01-02',
      sinValor: 0,
      aprobar: true,
    };
    assertPuedeResponderPlan({ ...base, socio: 1 });
    assert.throws(() => assertPuedeResponderPlan({ ...base, socio: 2 }), codigo('PLAN_EL_OTRO'));
    assert.throws(
      () => assertPuedeResponderPlan({ ...base, socio: 1, sinValor: 2 }),
      codigo('PLAN_SIN_VALORES'),
    );
    assertPuedeResponderPlan({ ...base, socio: 1, sinValor: 2, aprobar: false });
    assert.throws(
      () => assertPuedeResponderPlan({ ...base, socio: 1, hoy: '2027-01-11' }),
      codigo('PLAN_FUERA_DE_PLAZO'),
    );
    assert.throws(
      () => assertPuedeResponderPlan({ ...base, socio: 1, plan: plan() }),
      codigo('PLAN_ESTADO'),
    );
  });
});

describe('cards in a plan', () => {
  const nueva = {
    trimestre: '2027-T1',
    hoy: '2026-12-20',
    tipo: 'entregable' as const,
    titulo: ' Integración con el SAT ',
    criterio: 'Las facturas recibidas llegan solas del buzón.',
    vence: '2027-03-31',
    valor: 30_000_00n,
  };

  it('a new card goes to this quarter or the next plan, inside its dates', () => {
    assert.equal(assertNuevaTarjeta(nueva).titulo, 'Integración con el SAT');
    assert.throws(
      () => assertNuevaTarjeta({ ...nueva, trimestre: '2027-T2' }),
      codigo('TARJETA_TRIMESTRE'),
    );
    assert.throws(
      () => assertNuevaTarjeta({ ...nueva, vence: '2027-04-01' }),
      codigo('TARJETA_VENCE'),
    );
    assert.throws(() => assertNuevaTarjeta({ ...nueva, titulo: ' ' }), codigo('TARJETA_TITULO'));
  });

  it("a deliverable needs its criterion and the creator's value; a task needs neither", () => {
    assert.throws(() => assertNuevaTarjeta({ ...nueva, criterio: '' }), codigo('TARJETA_CRITERIO'));
    assert.throws(() => assertNuevaTarjeta({ ...nueva, valor: 0n }), codigo('TARJETA_VALOR'));
    const t = assertNuevaTarjeta({ ...nueva, tipo: 'tarea', criterio: '', valor: null });
    assert.equal(t.valor, null);
  });

  it('values change until the plan is approved; after it, only while one is missing', () => {
    const sinUno = tarjeta({ trimestre: '2027-T1', valores: { 1: null, 2: 30_000_00n } });
    assertPuedeProponer(sinUno, {
      plan: plan(enviado, aprobado),
      valor: 30_000_00n,
      hoy: '2027-01-03',
    });
    const completa = tarjeta({ trimestre: '2027-T1' });
    assertPuedeProponer(completa, { plan: plan(enviado), valor: 1n, hoy: '2026-12-21' });
    assert.throws(
      () =>
        assertPuedeProponer(completa, {
          plan: plan(enviado, aprobado),
          valor: 1n,
          hoy: '2027-01-03',
        }),
      codigo('TARJETA_CONGELADA'),
    );
  });

  it('a value is frozen once work starts, and is never zero', () => {
    const iniciada = tarjeta({ trimestre: '2027-T1', eventos: [ev('iniciada', '2026-12-21', 1)] });
    assert.throws(
      () => assertPuedeProponer(iniciada, { plan: plan(), valor: 1n, hoy: '2026-12-22' }),
      codigo('TARJETA_CONGELADA'),
    );
    assert.throws(
      () => assertPuedeProponer(tarjeta(), { plan: plan(), valor: 0n, hoy: '2026-12-22' }),
      codigo('TARJETA_VALOR'),
    );
  });

  it('a quote is for a card whose values differ over 2×, with its document', () => {
    const radio = tarjeta({ valores: { 1: 10_000_00n, 2: 40_000_00n } });
    assertPuedeCotizar(radio, { monto: 30_000_00n, documentoId: 'd1' });
    assert.throws(
      () => assertPuedeCotizar(tarjeta(), { monto: 1n, documentoId: 'd1' }),
      codigo('COTIZACION_NO_REQUERIDA'),
    );
    assert.throws(
      () => assertPuedeCotizar(radio, { monto: 1n, documentoId: null }),
      codigo('COTIZACION_DOCUMENTO'),
    );
  });

  it('a card not started leaves an unapproved plan, carried ones included', () => {
    const vieja = tarjeta({ trimestre: '2026-T4' });
    assertPuedeQuitar(vieja, { trimestre: '2027-T1', plan: plan(enviado), hoy: '2026-12-21' });
    assert.throws(
      () =>
        assertPuedeQuitar(vieja, {
          trimestre: '2027-T1',
          plan: plan(enviado, aprobado),
          hoy: '2027-01-03',
        }),
      codigo('PLAN_ESTADO'),
    );
    const empezada = tarjeta({ eventos: [ev('iniciada', '2026-12-01', 1)] });
    assert.throws(
      () => assertPuedeQuitar(empezada, { trimestre: '2027-T1', plan: plan(), hoy: '2026-12-21' }),
      codigo('TARJETA_ESTADO'),
    );
  });
});
