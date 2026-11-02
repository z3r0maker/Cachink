import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { FacturaRecibida } from '@xangarro/application/corp';
import type { FacturaDelMes, Movimiento } from '@xangarro/data-corp';
import { leerCfdi } from '@xangarro/domain/corp';
import { cfdiXml, type CfdiDePrueba } from '@xangarro/testing/corp';

import {
  esSinCfdi,
  filaFactura,
  filaSinCfdi,
  resumenFacturas,
} from '../src/server/empresa/facturas-view';

/** E-11, board CD-06b: the received invoices of a month, in the board's words. */
const factura = (o: CfdiDePrueba, f: Partial<FacturaRecibida> = {}): FacturaRecibida => ({
  cfdi: leerCfdi(cfdiXml(o)),
  archivo: 'f.xml',
  estado: 'registrada',
  estadoSat: 'vigente',
  categoria: 'administracion',
  projectId: null,
  entryId: 'e1',
  pagoEntryId: null,
  ...f,
});
const delMes = (
  f: FacturaRecibida,
  revertida = false,
  fechas: Partial<Pick<FacturaDelMes, 'pagadaEl' | 'revertidaEl'>> = {},
): FacturaDelMes => ({
  factura: f,
  revertida,
  pagadaEl: null,
  revertidaEl: null,
  ...fechas,
});

const honorarios = delMes(factura({ fecha: '2026-10-28' }));
const despacho = delMes(
  factura(
    {
      fecha: '2026-10-30',
      metodoPago: 'PPD',
      emisor: { rfc: 'DJU010101AB1', nombre: 'Despacho jurídico, S.C.' },
      subtotal: '4000.00',
      iva: '640.00',
      isr: '0.00',
      ivaRetenido: '0.00',
    },
    { entryId: 'e2' },
  ),
);
const cancelada = delMes(
  factura(
    { fecha: '2026-10-09' },
    { estado: 'cancelada', estadoSat: 'cancelado', entryId: null, categoria: null },
  ),
);

const vercel: Movimiento = {
  id: 'm9',
  fecha: '2026-10-03',
  projectId: 'xangarro',
  kind: 'gasto',
  concepto: 'Hosting',
  contraparte: 'Vercel Inc.',
  moneda: 'USD',
  montoOriginal: 20_00n,
  tipoCambio: '18.42',
  deducible: false,
  source: 'recurring',
  sourceRef: 'rec-1:2026-10:n',
  reversesEntryId: null,
  payload: { reversal: true, motivo: '' },
  createdBy: 'f1',
  createdAt: '2026-10-03T12:00:00Z',
  reversedBy: null,
  lines: [
    { cuenta: 'costo_servicio', debe: 368_40n, haber: 0n },
    { cuenta: 'bancos', debe: 0n, haber: 368_40n },
  ],
};

describe('filaFactura (E-11)', () => {
  it('shows a paid invoice with its withholdings and a link to its movement', () => {
    const f = filaFactura(honorarios);
    assert.deepEqual(
      [f.fecha, f.proveedor, f.subtotal, f.iva, f.retenciones, f.estado],
      ['28 oct', 'ANA LÓPEZ MARTÍNEZ', '$3,500.00', '$560.00', '−$723.33', 'Vigente'],
    );
    assert.equal(f.sub, 'RFC LOMA800101AB2 · persona física · Honorarios contables de octubre');
    assert.deepEqual(f.destino, {
      tipo: 'enlace',
      href: '/empresa/movimientos/e1',
      texto: 'Administración',
    });
  });

  it('offers «Registrar pago» and «Cancelar» for an invoice on credit still owed', () => {
    const f = filaFactura(despacho);
    assert.deepEqual(f.destino, {
      tipo: 'por_pagar',
      pago: {
        uuid: despacho.factura.cfdi.uuid,
        desde: '2026-10-30',
        desdeTexto: '30 de octubre',
        montos: [
          { label: 'Sale del banco', value: '$4,640.00' },
          { label: 'IVA acreditable', value: '$640.00' },
        ],
      },
    });
    assert.match(f.sub, /a crédito \(PPD\)/);
    assert.equal(f.retenciones, '$0.00');
  });

  it('says when an invoice on credit was paid (board CD-06e)', () => {
    const pagada = delMes({ ...despacho.factura, pagoEntryId: 'p1' }, false, {
      pagadaEl: '2026-11-05',
    });
    assert.match(filaFactura(pagada).sub, /a crédito, pagada el 5 nov/);
  });

  it('flags a cancelled invoice as never registered, and a reversed one as reversed', () => {
    assert.deepEqual(
      [filaFactura(cancelada).estado, filaFactura(cancelada).destino],
      ['Cancelada', { tipo: 'texto', texto: 'No se registró' }],
    );
    assert.deepEqual(filaFactura(delMes(despacho.factura, true)).destino, {
      tipo: 'enlace',
      href: '/empresa/movimientos/e2',
      texto: 'Revertido',
    });
  });

  it('says when an invoice on credit was cancelled, linking its reversed expense (CD-06f)', () => {
    const f = filaFactura(
      delMes({ ...despacho.factura, estado: 'cancelada' }, true, { revertidaEl: '2026-10-31' }),
    );
    assert.match(f.sub, /a crédito, cancelada el 31 oct/);
    assert.deepEqual(f.destino, {
      tipo: 'enlace',
      href: '/empresa/movimientos/e2',
      texto: 'Revertido',
    });
  });

  it('shows an expense without an XML as «Sin CFDI», in dollars when it was', () => {
    assert.equal(esSinCfdi(vercel), true);
    assert.equal(esSinCfdi({ ...vercel, source: 'cfdi' }), false);
    assert.equal(esSinCfdi({ ...vercel, reversedBy: 'm10' }), false);
    const f = filaSinCfdi(vercel);
    assert.deepEqual(
      [f.proveedor, f.sub, f.subtotal, f.iva, f.estado],
      ['Vercel Inc.', 'Sin CFDI · extranjero · Hosting', 'USD 20.00', '$0.00', 'Sin CFDI'],
    );
  });
});

describe('resumenFacturas (E-11)', () => {
  it('counts what is owed, and IVA and withholdings only of what was paid', () => {
    const r = resumenFacturas([despacho, honorarios, cancelada], [vercel]);
    assert.deepEqual(r, {
      recibidas: 4,
      porPagar: 1,
      debido: 4_640_00n,
      ivaAcreditable: 560_00n,
      retenciones: 723_33n,
      canceladas: 1,
    });
  });

  it('counts a paid invoice on credit, and nothing of an empty month', () => {
    const pagada = delMes({ ...despacho.factura, pagoEntryId: 'p1' });
    assert.equal(resumenFacturas([pagada], []).ivaAcreditable, 640_00n);
    assert.deepEqual(resumenFacturas([], []), {
      recibidas: 0,
      porPagar: 0,
      debido: 0n,
      ivaAcreditable: 0n,
      retenciones: 0n,
      canceladas: 0,
    });
  });
});
