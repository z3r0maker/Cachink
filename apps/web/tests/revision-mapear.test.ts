import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { mapearProductos } from '../src/server/revision-mapear';

/**
 * Revisión de caja's product rows (O-37, P-45): the duplicate offered for a
 * merge is the approved product with the same barcode when there is one, over
 * one with the same name; approving then waits (`porCodigo`).
 */
const fila = (id: string, nombre: string, sku: string | null) => ({
  id,
  nombre,
  precio: 2_500n,
  sku,
  creado: '2026-11-19T18:00:00.000Z',
});

const porNombre = new Map([['refresco de cola', { id: 'N1', nombre: 'Refresco de cola' }]]);
const porCodigo = new Map([
  ['P1', { id: 'C1', nombre: 'Refresco 600 ml', codigo: '0012000001772' }],
]);

describe('mapearProductos', () => {
  it('offers the product with the same code over the one with the same name', () => {
    const [p] = mapearProductos(
      [fila('P1', 'Refresco de cola', '0012000001772')],
      new Map([['P1', { n: 3, monto: 7_500n }]]),
      porNombre,
      porCodigo,
    );
    assert.equal(p?.pareceA, 'Refresco 600 ml');
    assert.equal(p?.pareceAId, 'C1');
    assert.equal(p?.porCodigo, true);
    assert.equal(p?.codigo, '0012000001772');
    assert.equal(p?.vendidas, 3);
  });

  it('keeps the name match, approvable, when no code matches', () => {
    const [p] = mapearProductos(
      [fila('P2', 'Refresco de cola', null)],
      new Map(),
      porNombre,
      porCodigo,
    );
    assert.equal(p?.pareceAId, 'N1');
    assert.equal(p?.porCodigo, false);
    assert.equal(p?.codigo, null);
    assert.equal(p?.vendidas, 0);
  });

  it('offers nothing when neither the code nor the name matches', () => {
    const [p] = mapearProductos([fila('P3', 'Hielo', '  ')], new Map(), porNombre, porCodigo);
    assert.equal(p?.pareceA, null);
    assert.equal(p?.porCodigo, false);
    assert.equal(p?.codigo, null, 'a blank code is no code');
  });
});
