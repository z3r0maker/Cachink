import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { FacturaRecibida } from '@xangarro/application/corp';
import type { FacturaDelMes } from '@xangarro/data-corp';
import { leerCfdi } from '@xangarro/domain/corp';
import { cfdiXml } from '@xangarro/testing/corp';

import { filaFactura } from '../src/server/empresa/facturas-view';

/** An invoice on credit, paid or cancelled (E-11, boards CD-06e and CD-06f). */
const despacho = (f: Partial<FacturaRecibida> = {}, d: Partial<FacturaDelMes> = {}) => ({
  factura: {
    cfdi: leerCfdi(
      cfdiXml({
        fecha: '2026-10-30',
        metodoPago: 'PPD',
        emisor: { rfc: 'DJU010101AB1', nombre: 'Despacho jurídico, S.C.' },
        subtotal: '4000.00',
        iva: '640.00',
        isr: '0.00',
        ivaRetenido: '0.00',
      }),
    ),
    archivo: 'f.xml',
    estado: 'registrada' as const,
    estadoSat: 'vigente' as const,
    categoria: 'administracion' as const,
    projectId: null,
    entryId: 'e2',
    pagoEntryId: null,
    ...f,
  },
  revertida: false,
  revertidaEl: null,
  pagadaEl: null,
  ...d,
});

describe('an invoice on credit (E-11, boards CD-06e and CD-06f)', () => {
  it('carries what «Registrar el pago» and the confirmation name', () => {
    const d = despacho();
    assert.deepEqual(filaFactura(d).destino, {
      tipo: 'por_pagar',
      uuid: d.factura.cfdi.uuid,
      desde: '2026-10-30',
      desdeLarga: '30 de octubre',
      saleDelBanco: '$4,640.00',
      gasto: '$4,000.00',
      iva: '$640.00',
    });
  });

  it('pays the net of withholdings, and names no IVA when there is none', () => {
    const conRetencion = despacho();
    const destino = filaFactura({
      ...conRetencion,
      factura: {
        ...conRetencion.factura,
        cfdi: { ...conRetencion.factura.cfdi, iva: 0n, retencionIsr: 400_00n, total: 3_600_00n },
      },
    }).destino;
    if (destino.tipo !== 'por_pagar') return assert.fail(`expected por_pagar, got ${destino.tipo}`);
    assert.equal(destino.saleDelBanco, '$3,600.00');
    assert.equal(destino.iva, null);
  });

  it('dates a paid one', () => {
    const f = filaFactura(despacho({ pagoEntryId: 'p1' }, { pagadaEl: '2026-10-25' }));
    assert.match(f.sub, /^RFC DJU010101AB1 · persona moral · a crédito, pagada el 25 oct/);
    assert.deepEqual(f.destino, {
      tipo: 'enlace',
      href: '/empresa/movimientos/e2',
      texto: 'Administración',
    });
  });

  it('shows a cancelled one as the SAT has it, dated and reversed', () => {
    const f = filaFactura(
      despacho({ estado: 'cancelada' }, { revertida: true, revertidaEl: '2026-10-30' }),
    );
    assert.equal(f.estado, 'Vigente', 'the supplier’s invoice still stands at the SAT');
    assert.match(f.sub, /a crédito · cancelada el 30 oct/);
    assert.deepEqual(f.destino, {
      tipo: 'enlace',
      href: '/empresa/movimientos/e2',
      texto: 'Revertido',
    });
  });

  it('keeps an upload the SAT reports cancelled as «Cancelada», never registered', () => {
    const f = filaFactura(
      despacho({ estado: 'cancelada', estadoSat: 'cancelado', entryId: null, categoria: null }),
    );
    assert.deepEqual(
      [f.estado, f.destino],
      ['Cancelada', { tipo: 'texto', texto: 'No se registró' }],
    );
  });
});
