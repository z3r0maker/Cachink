import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { IngresoDelPeriodo } from '@xangarro/data-pg';

import { emitidasDelMes } from '../src/server/empresa/emitidas-view';
import { pagoDeXangarro } from '../src/server/empresa/ingresos-fuente';

/** E-10, board CD-06i: a month of Xangarro's issued invoices, in the board's words. */
const ingreso = (o: Partial<IngresoDelPeriodo>): IngresoDelPeriodo => ({
  paymentId: 'in_1',
  paidAt: '2026-10-30T18:00:00.000Z',
  totalCentavos: 499_00n,
  route: 'individual_pue',
  status: 'stamped',
  formaPago: '04',
  description: 'Plan Negocio',
  receptorRfc: 'TAQ010101AB1',
  receptorNombre: 'Taquería E2E',
  invoiceUuid: 'U1',
  complementUuid: null,
  globalUuid: null,
  notasDeCreditoCentavos: 0n,
  ...o,
});

const mes = [
  ingreso({}),
  ingreso({
    paymentId: 'in_2',
    paidAt: '2026-10-28T18:00:00.000Z',
    route: 'individual_ppd',
    formaPago: '03',
    complementUuid: 'C2',
  }),
  ingreso({
    paymentId: 'in_3',
    paidAt: '2026-10-25T18:00:00.000Z',
    route: 'global',
    status: 'pending_global',
    totalCentavos: 230_00n,
    receptorRfc: null,
    receptorNombre: null,
    invoiceUuid: null,
    description: 'Plan Básico',
  }),
  ingreso({
    paymentId: 'in_4',
    paidAt: '2026-10-20T18:00:00.000Z',
    status: 'manual',
    invoiceUuid: null,
  }),
  ingreso({
    paymentId: 'in_5',
    paidAt: '2026-10-12T18:00:00.000Z',
    status: 'cancelled',
    notasDeCreditoCentavos: 499_00n,
  }),
];
const cobros = new Map([
  ['in_1', { id: 'E1', revertida: false }],
  ['in_5', { id: 'E5', revertida: true }],
]);
const bandeja = new Map([
  ['in_4', 'S4'],
  ['cfdi-global:2026-10', 'SG'],
]);
const vista = () => emitidasDelMes(mes, { mes: '2026-10', cobros, bandeja });

describe('emitidasDelMes (CD-06i)', () => {
  it('adds up what was collected, without IVA and with it, leaving out the refunded', () => {
    assert.deepEqual(vista().resumen, {
      pagos: 4,
      cobradoConIva: 1_727_00n,
      cobradoSinIva: 1_488_79n,
      iva: 238_21n,
      porEmitir: 1,
      canceladas: 1,
    });
  });

  it('names each row’s customer, plan and how it paid, and its CFDI', () => {
    const [timbrada, ppd, global, manual, cancelada] = vista().filas;
    assert.ok(timbrada && ppd && global && manual && cancelada);
    assert.deepEqual(
      [timbrada.fecha, timbrada.cliente, timbrada.sub, timbrada.estado, timbrada.total],
      [
        '30 oct',
        'Taquería E2E',
        'RFC TAQ010101AB1 · Plan Negocio · tarjeta',
        'Timbrada',
        '$499.00',
      ],
    );
    assert.deepEqual([timbrada.subtotal, timbrada.iva], ['$430.17', '$68.83']);
    assert.deepEqual(
      [ppd.sub, ppd.nota],
      ['RFC TAQ010101AB1 · Plan Negocio · transferencia', 'Con su complemento de pago'],
    );
    assert.deepEqual(
      [global.cliente, global.sub, global.estado, global.nota],
      [
        'Público en general',
        'Sin datos fiscales · Plan Básico · tarjeta',
        'En la global',
        'Factura global de octubre',
      ],
    );
    assert.deepEqual([manual.estado, manual.emitirHref], ['Por emitir', '/inbox/S4']);
    assert.deepEqual(
      [cancelada.estado, cancelada.nota],
      ['Cancelada', 'Reembolso · nota de crédito por $499.00'],
    );
  });

  it('links each row to its cobro, «Revertido» once reversed, or says it is not imported yet', () => {
    const [timbrada, ppd, , , cancelada] = vista().filas;
    assert.deepEqual(timbrada?.movimiento, { href: '/empresa/movimientos/E1', texto: 'Cobro' });
    assert.deepEqual(cancelada?.movimiento, {
      href: '/empresa/movimientos/E5',
      texto: 'Revertido',
    });
    assert.deepEqual(ppd?.movimiento, { href: null, texto: 'Se importa mañana' });
    // Refunded before the import ever saw it: no cobro, and none coming.
    const nunca = emitidasDelMes([ingreso({ paymentId: 'in_9', status: 'cancelled' })], {
      mes: '2026-10',
      cobros,
      bandeja,
    });
    assert.deepEqual(nunca.filas[0]?.movimiento, { href: null, texto: 'No se registró' });
  });

  it('sums the month’s global, still to issue from the inbox, then stamped with its folio', () => {
    assert.deepEqual(vista().global, {
      pagos: 1,
      total: '$230.00',
      timbrada: false,
      uuid: null,
      bandejaHref: '/inbox/SG',
    });
    const timbrada = emitidasDelMes(
      [ingreso({ route: 'global', status: 'in_global', globalUuid: 'G1', receptorNombre: null })],
      { mes: '2026-10', cobros, bandeja: new Map() },
    );
    assert.deepEqual(timbrada.global, {
      pagos: 1,
      total: '$499.00',
      timbrada: true,
      uuid: 'G1',
      bandejaHref: null,
    });
  });

  it('has no global strip, rows or totals in a month without payments', () => {
    const vacio = emitidasDelMes([], { mes: '2026-10', cobros, bandeja });
    assert.deepEqual([vacio.global, vacio.filas, vacio.resumen.pagos], [null, [], 0]);
  });
});

describe('pagoDeXangarro (E-10)', () => {
  it('dates the payment in Mexico City and names the customer, or nobody for the global', () => {
    const tarde = pagoDeXangarro(ingreso({ paidAt: '2026-11-01T03:30:00.000Z' }));
    assert.deepEqual(
      [tarde.pagadoEl, tarde.cliente, tarde.total, tarde.reembolsado],
      ['2026-10-31', 'Taquería E2E', 499_00n, false],
    );
    assert.equal(pagoDeXangarro(ingreso({ receptorNombre: null })).cliente, null);
  });

  it('is refunded once cancelled, or once its credit notes add up to it, not before', () => {
    assert.equal(pagoDeXangarro(ingreso({ status: 'cancelled' })).reembolsado, true);
    assert.equal(pagoDeXangarro(ingreso({ notasDeCreditoCentavos: 499_00n })).reembolsado, true);
    assert.equal(pagoDeXangarro(ingreso({ notasDeCreditoCentavos: 100_00n })).reembolsado, false);
  });
});
