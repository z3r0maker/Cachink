import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertMesTerminado,
  ContadorError,
  comprobantesDelMes,
  emitidasCsv,
  nombreDelPaquete,
  rutasDelPaquete,
  type DocumentoDelMes,
} from '../../src/corp/contador/index.js';

const doc = (over: Partial<DocumentoDelMes>): DocumentoDelMes => ({
  id: 'd1',
  periodo: '2026-10',
  carpeta: 'sat',
  obligacionId: 'o1',
  entryId: null,
  reemplazaA: null,
  ...over,
});

const code = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof ContadorError, String(e));
    return e.code;
  }
  throw new Error('did not throw');
};

describe('paquete para el contador (E-43)', () => {
  it('comes out of a finished month only', () => {
    assert.doesNotThrow(() => assertMesTerminado('2026-10', '2026-11-19'));
    assert.equal(
      code(() => assertMesTerminado('2026-11', '2026-11-19')),
      'PAQUETE_SIN_TERMINAR',
    );
    assert.equal(
      code(() => assertMesTerminado('2026-12', '2026-11-19')),
      'PAQUETE_SIN_TERMINAR',
    );
    assert.equal(
      code(() => assertMesTerminado('2026-13', '2026-11-19')),
      'PAQUETE_MES',
    );
  });

  it('is named by the month and whether it is final', () => {
    assert.equal(nombreDelPaquete('2026-10', 'final'), 'mexia-2026-10-final.zip');
    assert.equal(nombreDelPaquete('2026-10', 'preliminar'), 'mexia-2026-10-preliminar.zip');
  });

  it("takes the month's obligation evidence and the statements not tied to a movement", () => {
    const docs = [
      doc({ id: 'acuse' }),
      doc({ id: 'estado', carpeta: 'comprobantes', obligacionId: null }),
      doc({ id: 'factura', carpeta: 'comprobantes', obligacionId: null, entryId: 'e1' }),
      doc({ id: 'otro-mes', periodo: '2026-09' }),
      doc({ id: 'contrato', carpeta: 'contratos', obligacionId: null }),
      doc({ id: 'estados', carpeta: 'estados_financieros', obligacionId: null }),
    ];
    assert.deepEqual(
      comprobantesDelMes(docs, '2026-10').map((d) => d.id),
      ['acuse', 'estado'],
    );
  });

  it('takes only the current version of a replaced document', () => {
    const docs = [doc({ id: 'v1' }), doc({ id: 'v2', reemplazaA: 'v1' })];
    assert.deepEqual(
      comprobantesDelMes(docs, '2026-10').map((d) => d.id),
      ['v2'],
    );
  });

  it('gives every file a safe, unique path in its folder', () => {
    assert.deepEqual(rutasDelPaquete('acuses', ['acuse.pdf', 'acuse.pdf', '../x/y.pdf', '']), [
      'acuses/acuse.pdf',
      'acuses/acuse (2).pdf',
      'acuses/_x_y.pdf',
      'acuses/archivo',
    ]);
  });

  it('lists the issued CFDIs with their folio fiscal, guarding a name against a formula', () => {
    const csv = emitidasCsv([
      {
        uuid: 'AAAA',
        tipo: 'Factura',
        rfc: 'XAXX010101000',
        nombre: '=HYPERLINK("x")',
        fecha: '2026-10-03',
        total: 1_160_00n,
      },
    ]);
    const lineas = csv.split('\r\n');
    assert.equal(lineas[0], '﻿Folio fiscal,Tipo,RFC del receptor,Receptor,Fecha,Total');
    assert.equal(lineas[1], 'AAAA,Factura,XAXX010101000,"\'=HYPERLINK(""x"")",2026-10-03,1160.00');
  });
});
