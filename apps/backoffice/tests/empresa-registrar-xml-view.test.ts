import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { FacturaRecibida } from '@xangarro/application/corp';
import { leerCfdi } from '@xangarro/domain/corp';
import { cfdiXml, type CfdiDePrueba } from '@xangarro/testing/corp';

import {
  mensajeDeRechazo,
  notaRetenciones,
  panelXml,
} from '../src/server/empresa/registrar-xml-view';

/** E-11, board CD-06d: Registrar gasto with one XML attached. */
const UUID = 'AAAAAAAA-0000-4000-8000-000000000001';
const factura = (o: CfdiDePrueba = {}, f: Partial<FacturaRecibida> = {}): FacturaRecibida => ({
  cfdi: leerCfdi(cfdiXml({ uuid: UUID, fecha: '2026-10-28', ...o })),
  archivo: 'contador.xml',
  estado: 'por_revisar',
  estadoSat: 'vigente',
  categoria: null,
  projectId: null,
  entryId: null,
  pagoEntryId: null,
  ...f,
});

const lineas = (p: ReturnType<typeof panelXml>) =>
  p.montos.map((m) => `${m.label} ${m.value} ${m.tono}`);

describe('panelXml (E-11, CD-06d)', () => {
  it('shows the board’s honorarios: read, valid, withholdings owed and what left the bank', () => {
    const p = panelXml(factura(), null);
    assert.equal(p.titulo, 'contador.xml leído · vigente en el SAT');
    assert.equal(p.sub, `Folio fiscal ${UUID} · pagada en una exhibición (PUE)`);
    assert.equal(p.proveedor, 'ANA LÓPEZ MARTÍNEZ · RFC LOMA800101AB2');
    assert.deepEqual(
      [p.subtotal, p.fecha, p.pagada, p.conRetenciones],
      ['$3,500.00', '2026-10-28', true, true],
    );
    assert.deepEqual(lineas(p), [
      'Subtotal $3,500.00 normal',
      'IVA $560.00 normal',
      'ISR retenido −$350.00 debe',
      'IVA retenido −$373.33 debe',
      'Salió del banco $3,336.67 total',
    ]);
    assert.deepEqual(
      [p.categoria, p.proyecto, p.nota],
      [null, '', 'Elige una; la recordamos para este RFC.'],
    );
  });

  it('opens on the category and project the supplier had last time', () => {
    const p = panelXml(factura(), { categoria: 'administracion', projectId: 'xangarro' });
    assert.deepEqual(
      [p.categoria, p.proyecto, p.nota],
      ['administracion', 'xangarro', 'Como sus facturas anteriores.'],
    );
  });

  it('an invoice on credit has no payment date and ends on what is owed', () => {
    const p = panelXml(factura({ metodoPago: 'PPD', isr: '0.00', ivaRetenido: '0.00' }), null);
    assert.equal(p.sub, `Folio fiscal ${UUID} · a crédito (PPD): queda por pagar`);
    assert.equal(p.pagada, false);
    assert.equal(p.conRetenciones, false);
    assert.deepEqual(lineas(p), [
      'Subtotal $3,500.00 normal',
      'IVA $560.00 normal',
      'Por pagar $4,060.00 total',
    ]);
  });

  it('says so when the SAT did not answer, and falls back to the RFC without a name', () => {
    const p = panelXml(
      factura({ emisor: { rfc: 'XAXX010101000', nombre: '' } }, { estadoSat: 'sin_verificar' }),
      null,
    );
    assert.equal(p.titulo, 'contador.xml leído · sin verificar en el SAT');
    assert.equal(p.proveedor, 'RFC XAXX010101000');
  });
});

describe('notaRetenciones (E-11, CD-06d)', () => {
  it('names the next month’s declaration for a paid invoice', () => {
    assert.equal(
      notaRetenciones('2026-10-28', true),
      'Las retenciones no son gasto: MEXIA las debe al SAT y las paga con la declaración del 17 de noviembre.',
    );
  });

  it('rolls December into January', () => {
    assert.match(notaRetenciones('2026-12-03', true), /del 17 de enero\.$/);
  });

  it('an invoice on credit owes them only once it is paid', () => {
    assert.equal(
      notaRetenciones('2026-10-28', false),
      'Las retenciones no son gasto: MEXIA las deberá al SAT cuando pague la factura.',
    );
  });

  it('a date still being typed gives the general rule', () => {
    assert.equal(
      notaRetenciones('2026-1', true),
      'Las retenciones no son gasto: MEXIA las debe al SAT y las paga con la declaración del mes siguiente.',
    );
  });
});

describe('mensajeDeRechazo (E-11, CD-06d)', () => {
  it('puts the label before the reason', () => {
    assert.equal(
      mensajeDeRechazo({
        archivo: 'p.xml',
        motivo: 'otro_rfc',
        proveedor: 'Papelería',
        fecha: '2026-10-15',
        entryId: null,
      }),
      'No es de MEXIA. Está a nombre de otro RFC, no de MEXIA. Pídele al proveedor que la emita a MEXIA, S.A.S.',
    );
  });

  it('explains a file that is not an invoice', () => {
    const m = mensajeDeRechazo({
      archivo: 'x.xml',
      motivo: 'no_es_cfdi',
      proveedor: null,
      fecha: null,
      entryId: null,
    });
    assert.match(m, /^No es una factura\. /);
  });
});
