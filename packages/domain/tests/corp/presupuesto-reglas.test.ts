import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertPuedePreparar,
  assertPuedeResponderPresupuesto,
  PresupuestoError,
  presupuestoPendiente,
  presupuestoVigente,
  totalMensual,
  trimestreAPreparar,
  trimestreSiguiente,
  type Montos,
  type Presupuesto,
} from '../../src/corp/presupuesto/index.js';
import { nombreTrimestre } from '../../src/corp/socios/index.js';

const montos: Montos = {
  costo_servicio: 8_500_00n,
  ventas_marketing: 12_000_00n,
  desarrollo: 5_000_00n,
  administracion: 5_500_00n,
};

const presupuesto = (over: Partial<Presupuesto> = {}): Presupuesto => ({
  id: 'p1',
  trimestre: '2026-T4',
  montos,
  preparadoPor: 'f1',
  preparadoAt: '2026-10-01T18:00:00.000Z',
  respuesta: null,
  ...over,
});

const aprobado = presupuesto({
  respuesta: { kind: 'aprobado', founderId: 'f2', at: '2026-10-02T18:00:00.000Z' },
});

const falla = (fn: () => unknown, code: string, message?: RegExp) =>
  assert.throws(fn, (e: unknown) => {
    assert.ok(e instanceof PresupuestoError);
    assert.equal(e.code, code);
    if (message !== undefined) assert.match(e.message, message);
    return true;
  });

const preparar = {
  trimestre: '2027-T1',
  hoy: '2026-11-19',
  presupuestos: [aprobado],
  montos,
};

describe('E-22 · trimestres', () => {
  it('names a quarter the way the board does and steps to the next one', () => {
    assert.equal(nombreTrimestre('2026-T4'), '4T 2026');
    assert.equal(trimestreSiguiente('2026-T4'), '2027-T1');
    assert.equal(trimestreSiguiente('2026-T2'), '2026-T3');
  });

  it('totals the monthly amounts', () => {
    assert.equal(totalMensual(montos), 31_000_00n);
  });
});

describe('E-22 · el presupuesto que cuenta', () => {
  it('counts only once the other founder approved it, the latest approval winning', () => {
    const otro = presupuesto({
      id: 'p2',
      preparadoAt: '2026-10-05T18:00:00.000Z',
      respuesta: { kind: 'aprobado', founderId: 'f1', at: '2026-10-06T18:00:00.000Z' },
    });
    assert.equal(presupuestoVigente([aprobado, otro], '2026-T4')?.id, 'p2');
    assert.equal(presupuestoVigente([presupuesto()], '2026-T4'), null);
  });

  it('leaves a rejected budget out, and finds the one still waiting', () => {
    const rechazado = presupuesto({
      respuesta: { kind: 'rechazado', founderId: 'f2', at: '2026-10-02T18:00:00.000Z' },
    });
    assert.equal(presupuestoVigente([rechazado], '2026-T4'), null);
    assert.equal(presupuestoPendiente([rechazado], '2026-T4'), null);
    assert.equal(presupuestoPendiente([presupuesto()], '2026-T4')?.id, 'p1');
    assert.equal(presupuestoPendiente([presupuesto()], '2027-T1'), null);
  });

  it('prepares this quarter while it has none, then the next one', () => {
    assert.equal(trimestreAPreparar([], '2026-11-19'), '2026-T4');
    assert.equal(trimestreAPreparar([aprobado], '2026-11-19'), '2027-T1');
    const siguiente = presupuesto({ id: 'p3', trimestre: '2027-T1' });
    assert.equal(trimestreAPreparar([aprobado, siguiente], '2026-11-19'), null);
  });
});

describe('E-22 · preparar', () => {
  it('lets a founder prepare a quarter that has not ended', () => {
    assert.doesNotThrow(() => assertPuedePreparar(preparar));
    assert.doesNotThrow(() =>
      assertPuedePreparar({ ...preparar, trimestre: '2026-T4', presupuestos: [] }),
    );
  });

  it('refuses a quarter that is not one, or that has ended', () => {
    falla(
      () => assertPuedePreparar({ ...preparar, trimestre: '2027-T5' }),
      'PRESUPUESTO_TRIMESTRE',
    );
    falla(
      () => assertPuedePreparar({ ...preparar, trimestre: '2026-T3' }),
      'PRESUPUESTO_PASADO',
      /3T 2026/,
    );
  });

  it('refuses a quarter already approved or waiting', () => {
    falla(
      () => assertPuedePreparar({ ...preparar, trimestre: '2026-T4' }),
      'PRESUPUESTO_APROBADO',
      /4T 2026/,
    );
    const esperando = presupuesto({ trimestre: '2027-T1' });
    falla(
      () => assertPuedePreparar({ ...preparar, presupuestos: [esperando] }),
      'PRESUPUESTO_PENDIENTE',
    );
  });

  it('refuses a negative amount, or a budget of zero', () => {
    falla(
      () => assertPuedePreparar({ ...preparar, montos: { ...montos, desarrollo: -1n } }),
      'PRESUPUESTO_MONTOS',
    );
    const cero = { costo_servicio: 0n, ventas_marketing: 0n, desarrollo: 0n, administracion: 0n };
    falla(() => assertPuedePreparar({ ...preparar, montos: cero }), 'PRESUPUESTO_MONTOS');
  });
});

describe('E-22 · aprobar o rechazar el presupuesto', () => {
  it('lets the other founder answer a budget still waiting', () => {
    assert.equal(assertPuedeResponderPresupuesto(presupuesto(), 'f2').id, 'p1');
  });

  it('refuses whoever prepared it', () => {
    falla(() => assertPuedeResponderPresupuesto(presupuesto(), 'f1'), 'PRESUPUESTO_MISMO_SOCIO');
  });

  it('refuses a budget already answered', () => {
    falla(() => assertPuedeResponderPresupuesto(aprobado, 'f1'), 'PRESUPUESTO_RESPONDIDO');
  });

  it('refuses a budget that does not exist', () => {
    falla(() => assertPuedeResponderPresupuesto(undefined, 'f2'), 'PRESUPUESTO_DESCONOCIDO');
  });
});
