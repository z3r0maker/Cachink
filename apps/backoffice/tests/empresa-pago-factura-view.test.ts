import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { FacturaRecibida } from '@xangarro/application/corp';
import { leerCfdi } from '@xangarro/domain/corp';
import { cfdiXml } from '@xangarro/testing/corp';

import { diaDeMes, mensajeMesCerrado, pagoFactura } from '../src/server/empresa/pago-factura-view';

/** E-11, board CD-06e: paying an invoice on credit on the day the money left. */
const honorarios = (): FacturaRecibida => ({
  cfdi: leerCfdi(cfdiXml({ fecha: '2026-10-28', metodoPago: 'PPD' })),
  archivo: 'f.xml',
  estado: 'registrada',
  estadoSat: 'vigente',
  categoria: 'administracion',
  projectId: null,
  entryId: 'e1',
  pagoEntryId: null,
});

describe('pagoFactura (CD-06e)', () => {
  it('shows the net that leaves the bank, the IVA and the withholdings owed', () => {
    const p = pagoFactura(honorarios());
    assert.deepEqual([p.desde, p.desdeTexto], ['2026-10-28', '28 de octubre']);
    assert.deepEqual(p.montos, [
      { label: 'Sale del banco', value: '$3,336.67' },
      { label: 'IVA acreditable', value: '$560.00' },
      { label: 'Retenciones al SAT', value: '$723.33' },
    ]);
  });
});

describe('diaDeMes', () => {
  it('words a day of the month, and leaves what is no date as it came', () => {
    assert.equal(diaDeMes('2026-12-01'), '1 de diciembre');
    assert.equal(diaDeMes('2026-13-01'), '2026-13-01');
    assert.equal(diaDeMes(''), '');
  });
});

describe('mensajeMesCerrado', () => {
  it('names the closed month, or asks for a date when there is none', () => {
    assert.equal(
      mensajeMesCerrado('2026-09-20'),
      'Septiembre ya está cerrado. Elige otra fecha de pago.',
    );
    assert.equal(mensajeMesCerrado('2026-13-01'), 'Elige una fecha de pago válida.');
    assert.equal(mensajeMesCerrado(''), 'Elige una fecha de pago válida.');
  });
});
