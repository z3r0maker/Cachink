import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertPuedePedir,
  assertPuedeResponderSolicitud,
  cabeEnElLimite,
  estadoDeSolicitud,
  LIMITE_MINIMO,
  limiteDeGasto,
  mesesDelLimite,
  montoAprobado,
  PresupuestoError,
  usadoDelLimite,
  type SolicitudGasto,
} from '../../src/corp/presupuesto/index.js';

const solicitud = (over: Partial<SolicitudGasto> = {}): SolicitudGasto => ({
  id: 's1',
  periodo: '2026-11',
  founderId: 'f2',
  concepto: 'Campaña de video para Instagram',
  categoria: 'ventas_marketing',
  monto: 6_000_00n,
  automatica: false,
  at: '2026-11-17T18:00:00.000Z',
  respuesta: null,
  ...over,
});

const falla = (fn: () => unknown, code: string) =>
  assert.throws(fn, (e: unknown) => {
    assert.ok(e instanceof PresupuestoError);
    assert.equal(e.code, code);
    return true;
  });

describe('E-22 · el Límite de gasto sin consultar', () => {
  it('applies the fixed $1,000.00 with no income', () => {
    assert.equal(LIMITE_MINIMO, 1_000_00n);
    assert.equal(limiteDeGasto(0n), 1_000_00n);
  });

  it('keeps the fixed amount while 10 % of the income is below it', () => {
    assert.equal(limiteDeGasto(9_999_00n), 1_000_00n);
  });

  it('scales with income: 10 % of the average without IVA', () => {
    assert.equal(limiteDeGasto(15_600_00n), 1_560_00n);
  });

  it('averages the three whole months before, across a year', () => {
    assert.deepEqual(mesesDelLimite('2027-02'), ['2026-11', '2026-12', '2027-01']);
  });

  it('never goes below the fixed amount on a loss-making average', () => {
    assert.equal(limiteDeGasto(-5_000_00n), 1_000_00n);
  });
});

describe('E-22 · solicitudes fuera del presupuesto', () => {
  const canva = solicitud({
    id: 's0',
    founderId: 'f1',
    concepto: 'Canva',
    monto: 279_00n,
    automatica: true,
  });

  it('approves on its own what fits in what is left of the Límite', () => {
    assert.equal(cabeEnElLimite({ monto: 1_281_00n, limite: 1_560_00n, usado: 279_00n }), true);
    assert.equal(cabeEnElLimite({ monto: 1_281_01n, limite: 1_560_00n, usado: 279_00n }), false);
  });

  it('counts only what each founder had approved on its own in the month', () => {
    const otroMes = solicitud({ ...canva, id: 's9', periodo: '2026-10' });
    const todas = [canva, otroMes, solicitud()];
    assert.equal(usadoDelLimite(todas, 'f1', '2026-11'), 279_00n);
    assert.equal(usadoDelLimite(todas, 'f2', '2026-11'), 0n);
  });

  it('reads each request state and the amount it was approved for', () => {
    const aprobada = solicitud({
      respuesta: { kind: 'aprobada', monto: 3_000_00n, founderId: 'f1', at: 'x' },
    });
    const rechazada = solicitud({
      respuesta: { kind: 'rechazada', monto: null, founderId: 'f1', at: 'x' },
    });
    assert.deepEqual([canva, solicitud(), aprobada, rechazada].map(estadoDeSolicitud), [
      'automatica',
      'pendiente',
      'aprobada',
      'rechazada',
    ]);
    assert.deepEqual([canva, solicitud(), aprobada, rechazada].map(montoAprobado), [
      279_00n,
      0n,
      3_000_00n,
      0n,
    ]);
  });

  it('asks for a concept, an amount above zero and a category', () => {
    const ok = { concepto: 'Canva Pro', categoria: 'ventas_marketing', monto: 279_00n };
    assert.doesNotThrow(() => assertPuedePedir(ok));
    falla(() => assertPuedePedir({ ...ok, concepto: '  ' }), 'SOLICITUD_CONCEPTO');
    falla(() => assertPuedePedir({ ...ok, monto: 0n }), 'SOLICITUD_MONTO');
    falla(() => assertPuedePedir({ ...ok, categoria: 'financiero' }), 'SOLICITUD_CATEGORIA');
  });
});

describe('E-22 · responder una solicitud', () => {
  it('lets the other founder approve it whole or for less', () => {
    assert.doesNotThrow(() => assertPuedeResponderSolicitud(solicitud(), 'f1', null));
    assert.doesNotThrow(() => assertPuedeResponderSolicitud(solicitud(), 'f1', 3_000_00n));
  });

  it('refuses whoever asked', () => {
    falla(() => assertPuedeResponderSolicitud(solicitud(), 'f2', null), 'SOLICITUD_MISMO_SOCIO');
  });

  it('refuses a request answered, approved on its own, or unknown', () => {
    const respondida = solicitud({
      respuesta: { kind: 'rechazada', monto: null, founderId: 'f1', at: 'x' },
    });
    falla(() => assertPuedeResponderSolicitud(respondida, 'f1', null), 'SOLICITUD_RESPONDIDA');
    falla(
      () => assertPuedeResponderSolicitud(solicitud({ automatica: true }), 'f1', null),
      'SOLICITUD_RESPONDIDA',
    );
    falla(() => assertPuedeResponderSolicitud(undefined, 'f1', null), 'SOLICITUD_DESCONOCIDA');
  });

  it('takes another amount only above zero and below what was asked', () => {
    falla(() => assertPuedeResponderSolicitud(solicitud(), 'f1', 0n), 'SOLICITUD_OTRO_MONTO');
    falla(
      () => assertPuedeResponderSolicitud(solicitud(), 'f1', 6_000_00n),
      'SOLICITUD_OTRO_MONTO',
    );
  });
});
