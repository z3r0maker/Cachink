import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  IMPORTADOR_COBROS,
  importarCobros,
  type PagoDeXangarro,
  type RevenueSource,
} from '../../src/corp/index.js';
import { cuenta } from './facturas-escenario.js';
import { FakeLedger } from './fake-ledger.js';

/**
 * E-10: each Stripe payment of Xangarro becomes its own «Cobro» in the corp
 * ledger, keyed by its id (owner decision, 2026-11-09): run again, nothing
 * new; refunded in full, that very entry is reversed. A card payment waits in
 * «Stripe por depositar» until its payout (not imported yet).
 */
const pago = (o: Partial<PagoDeXangarro> = {}): PagoDeXangarro => ({
  paymentId: 'in_1',
  pagadoEl: '2026-10-30',
  total: 499_00n,
  cliente: 'Taquería E2E',
  reembolsado: false,
  ...o,
});

class FakeIngresos implements RevenueSource {
  constructor(readonly pagos: Record<string, PagoDeXangarro[]>) {}
  async pagosDelPeriodo(periodo: string) {
    return this.pagos[periodo] ?? [];
  }
}

const setup = (pagos: Record<string, PagoDeXangarro[]>) => ({
  ledger: new FakeLedger(),
  ingresos: new FakeIngresos(pagos),
});

const importar = (d: ReturnType<typeof setup>, periodos = ['2026-10'], hoy = '2026-11-09') =>
  importarCobros(d, { periodos, hoy });

describe('importarCobros (E-10)', () => {
  it('posts each payment as its own cobro: subtotal and IVA split, waiting in Stripe', async () => {
    const d = setup({ '2026-10': [pago()] });
    assert.deepEqual(await importar(d), { registrados: 1, revertidos: 0, omitidos: 0 });
    const [e] = d.ledger.entries;
    assert.ok(e);
    assert.deepEqual(
      [e.kind, e.fecha, e.concepto, e.contraparte, e.source, e.sourceRef, e.projectId, e.createdBy],
      [
        'cobro',
        '2026-10-30',
        'Cobro · Taquería E2E',
        'Taquería E2E',
        'billing',
        'in_1',
        'xangarro',
        IMPORTADOR_COBROS,
      ],
    );
    assert.equal(cuenta(e.lines, 'stripe_por_depositar')?.debe, 499_00n);
    assert.equal(cuenta(e.lines, 'iva_trasladado')?.haber, 68_83n);
  });

  it('posts nothing new when run again, and adds a payment that arrived late', async () => {
    const d = setup({ '2026-10': [pago()] });
    await importar(d);
    assert.deepEqual(await importar(d), { registrados: 0, revertidos: 0, omitidos: 0 });
    d.ingresos.pagos['2026-10']?.push(pago({ paymentId: 'in_2', pagadoEl: '2026-10-29' }));
    assert.deepEqual(await importar(d), { registrados: 1, revertidos: 0, omitidos: 0 });
    assert.equal(d.ledger.entries.length, 2);
  });

  it('reverses exactly the refunded payment, once, on the day it learns of it', async () => {
    const d = setup({ '2026-10': [pago(), pago({ paymentId: 'in_2' })] });
    await importar(d);
    d.ingresos.pagos['2026-10'] = [pago({ reembolsado: true }), pago({ paymentId: 'in_2' })];
    assert.deepEqual(await importar(d), { registrados: 0, revertidos: 1, omitidos: 0 });
    assert.deepEqual(await importar(d), { registrados: 0, revertidos: 0, omitidos: 0 });
    const reversa = d.ledger.entries.find((e) => e.reversesEntryId !== null);
    assert.deepEqual(
      [reversa?.fecha, reversa?.reversesEntryId],
      ['2026-11-09', d.ledger.entries[0]?.id],
    );
  });

  it('never posts a payment refunded before it was imported', async () => {
    const d = setup({ '2026-10': [pago({ reembolsado: true })] });
    assert.deepEqual(await importar(d), { registrados: 0, revertidos: 0, omitidos: 0 });
    assert.equal(d.ledger.entries.length, 0);
  });

  it('skips a payment in a closed month, counted, and goes on with the rest', async () => {
    const d = setup({
      '2026-08': [pago({ paymentId: 'in_viejo', pagadoEl: '2026-08-31' })],
      '2026-10': [pago()],
    });
    assert.deepEqual(await importar(d, ['2026-08', '2026-10']), {
      registrados: 1,
      revertidos: 0,
      omitidos: 1,
    });
  });

  it('names a payment without fiscal data as the general public', async () => {
    const d = setup({ '2026-10': [pago({ cliente: null })] });
    await importar(d);
    assert.equal(d.ledger.entries[0]?.concepto, 'Cobro · Público en general');
  });
});
