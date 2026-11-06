import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { recurrentesDelMes, type PlantillaRecurrente } from '../../src/corp/ledger/index.js';

/**
 * E-11, board CD-01f: a supplier who invoices every month. Its template knows
 * the supplier's RFC; the month counts as registered once an invoice of that
 * RFC dated in it is registered, and until then it asks for the invoice.
 */
const contadora: PlantillaRecurrente = {
  id: 'rec-contadora',
  nombre: 'Contadora',
  contraparte: 'ANA LÓPEZ MARTÍNEZ',
  rfc: 'LOMA800101AB2',
  categoria: 'administracion',
  moneda: 'MXN',
  montoEstimado: 3_336_67n,
  diaCargo: 3,
  projectId: null,
  deducible: true,
  activo: true,
  desde: '2026-10',
};

const none = new Map<string, string>();
const factura = (entryId: string, fecha: string) =>
  new Map([['rec-contadora', { entryId, fecha }]]);

describe('recurrentesDelMes with a supplier that invoices (CD-01f)', () => {
  it('asks for the invoice once its day has come and none is registered', () => {
    const [r] = recurrentesDelMes([contadora], none, '2026-11', '2026-11-05');
    assert.deepEqual([r?.estado, r?.entryId, r?.facturaDel], ['falta_factura', null, null]);
  });

  it('counts the month as registered by an invoice of its RFC, with its date', () => {
    const [r] = recurrentesDelMes(
      [contadora],
      none,
      '2026-11',
      '2026-11-05',
      factura('E7', '2026-11-02'),
    );
    assert.deepEqual([r?.estado, r?.entryId, r?.facturaDel], ['registrado', 'E7', '2026-11-02']);
  });

  it('is still to come before its day, unless the invoice already came', () => {
    assert.equal(
      recurrentesDelMes([contadora], none, '2026-11', '2026-11-01')[0]?.estado,
      'proximo',
    );
    const temprano = recurrentesDelMes(
      [contadora],
      none,
      '2026-11',
      '2026-11-01',
      factura('E8', '2026-11-01'),
    );
    assert.equal(temprano[0]?.estado, 'registrado');
  });

  it('lists a stopped one only in a month its invoice came', () => {
    const parada = { ...contadora, activo: false };
    assert.deepEqual(recurrentesDelMes([parada], none, '2026-11', '2026-11-05'), []);
    const conFactura = recurrentesDelMes(
      [parada],
      none,
      '2026-11',
      '2026-11-05',
      factura('E9', '2026-11-02'),
    );
    assert.equal(conFactura[0]?.estado, 'registrado');
  });

  it('leaves a template without an RFC as it was: suggested, never asking for an invoice', () => {
    const sinRfc = { ...contadora, id: 'rec-vercel', rfc: null };
    const [r] = recurrentesDelMes([sinRfc], none, '2026-11', '2026-11-05');
    assert.deepEqual([r?.estado, r?.facturaDel], ['sugerido', null]);
  });
});
