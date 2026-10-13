import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { TipoCambioInvalidoError } from '@xangarro/domain/corp';

import { leerCaptura } from '../src/server/empresa/captura';

/** E-02's Registrar form: typed fields become the use case's input, or a message. */
const form =
  (fields: Record<string, string>) =>
  (name: string): string =>
    fields[name] ?? '';

const gasto = {
  tipo: 'gasto',
  fecha: '2026-10-05',
  concepto: 'Vercel',
  contraparte: 'Vercel Inc.',
  moneda: 'USD',
  monto: '20',
  tipoCambio: '18.42',
  categoria: 'costo_servicio',
  deducible: 'si',
  proyecto: 'xangarro',
  nonce: 'n-1',
};

describe('leerCaptura', () => {
  it('turns a USD expense into a converted gasto with its original amount', () => {
    const r = leerCaptura(form(gasto), 'f-1');
    assert.ok(r.ok);
    assert.equal(r.input.movement.kind, 'gasto');
    assert.deepEqual(r.input.usd, { montoOriginal: 20_00n, tipoCambio: '18.42' });
    assert.equal(r.input.sourceRef, 'n-1');
    assert.equal(r.input.projectId, 'xangarro');
    if (r.input.movement.kind === 'gasto') assert.equal(r.input.movement.subtotal, 368_40n);
  });

  it('records a bank fee with just the amount', () => {
    const r = leerCaptura(form({ tipo: 'comision', fecha: '2026-10-05', monto: '12.50' }), 'f-1');
    assert.ok(r.ok);
    assert.deepEqual(r.input.movement, { kind: 'comision_bancaria', monto: 12_50n });
    assert.equal(r.input.projectId, null);
  });

  it('records partner money with its partner and kind, outside any project', () => {
    const r = leerCaptura(
      form({
        tipo: 'socios',
        fecha: '2026-10-05',
        concepto: 'Préstamo para el IMPI',
        socio: '2',
        clase: 'prestamo_socio',
        monto: '5000',
        proyecto: 'xangarro',
      }),
      'f-1',
    );
    assert.ok(r.ok);
    assert.deepEqual(r.input.movement, { kind: 'prestamo_socio', socio: 2, monto: 5_000_00n });
    assert.equal(r.input.projectId, null);
    assert.equal(r.input.deducible, null);
  });

  it('asks whose money it is, and what kind', () => {
    const base = { tipo: 'socios', fecha: '2026-10-05', monto: '10' };
    assert.deepEqual(leerCaptura(form({ ...base, clase: 'prestamo_socio' }), 'f-1'), {
      ok: false,
      message: 'Elige de qué socio es el dinero.',
    });
    assert.deepEqual(leerCaptura(form({ ...base, socio: '1', clase: 'fondeo_mitades' }), 'f-1'), {
      ok: false,
      message: 'Elige qué tipo de dinero es.',
    });
  });

  it('asks for a number when the amount is not one', () => {
    const r = leerCaptura(form({ ...gasto, monto: '20 dólares' }), 'f-1');
    assert.equal(r.ok, false);
  });

  it('asks for the category of an expense', () => {
    const r = leerCaptura(form({ ...gasto, categoria: 'ingresos' }), 'f-1');
    assert.deepEqual(r, { ok: false, message: 'Elige la categoría del gasto.' });
  });

  it('asks for the payment date', () => {
    const r = leerCaptura(form({ ...gasto, fecha: '' }), 'f-1');
    assert.deepEqual(r, { ok: false, message: 'Elige la fecha de pago.' });
  });

  it('leaves a USD charge without a rate to the domain to refuse', () => {
    assert.throws(
      () => leerCaptura(form({ ...gasto, tipoCambio: '' }), 'f-1'),
      TipoCambioInvalidoError,
    );
  });
});
