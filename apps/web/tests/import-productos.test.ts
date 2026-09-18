import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { planImport } from '../src/lib/import-plan';
import { MAX_IMPORT_ROWS, parseProductSheet, TEMPLATE_HEADERS } from '../src/lib/import-productos';

/** P-07's parser acceptance: valid, missing header, bad number, duplicate SKU, > 5 000 rows. */
const HEAD = [...TEMPLATE_HEADERS];

/** The i-th row, or a failed test — never a silently skipped assertion. */
function at<T>(rows: readonly T[], i: number): T {
  const r = rows[i];
  if (r === undefined) throw new Error(`no row ${i}`);
  return r;
}
const row = (over: Partial<Record<(typeof TEMPLATE_HEADERS)[number], unknown>> = {}) =>
  HEAD.map((h) => (h in over ? over[h] : DEFAULTS[h]));
const DEFAULTS: Record<(typeof TEMPLATE_HEADERS)[number], unknown> = {
  sku: 'TAC-009',
  nombre: 'Taco de suadero',
  categoria: 'Producto Terminado',
  unidad: 'pza',
  costo_unitario: 9.8,
  precio_venta: '25',
  seguir_stock: 'sí',
  umbral_stock_bajo: 5,
  icono: '',
};

describe('parseProductSheet', () => {
  it('reads a valid sheet into typed rows, money in centavos', () => {
    const r = parseProductSheet([
      HEAD,
      row(),
      row({ sku: '', nombre: 'Agua', seguir_stock: 'no', icono: 'leaf' }),
    ]);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    const a = at(r.rows, 0).values;
    const b = at(r.rows, 1).values;
    assert.deepEqual(at(r.rows, 0).errors, []);
    assert.equal(at(r.rows, 0).line, 2);
    assert.equal(a?.costoUnitCentavos, 980n);
    assert.equal(a?.precioVentaCentavos, 2500n);
    assert.equal(a?.seguirStock, true);
    assert.equal(b?.sku, undefined);
    assert.equal(b?.seguirStock, false);
    assert.equal(b?.icono, 'leaf');
  });

  it('refuses the whole file when a required header is missing, naming it', () => {
    const r = parseProductSheet([HEAD.filter((h) => h !== 'precio_venta'), ['x']]);
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.message, /precio_venta/);
  });

  it('marks a bad number, a bad category and a bad icon on their row, and keeps the rest', () => {
    const r = parseProductSheet([
      HEAD,
      row({ costo_unitario: 'doce' }),
      row({ sku: 'X-2', categoria: 'Comida' }),
      row({ sku: 'X-3', icono: 'unicornio' }),
      row({ sku: 'X-4' }),
    ]);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.match(r.rows[0]?.errors.join() ?? '', /costo_unitario/);
    assert.match(r.rows[1]?.errors.join() ?? '', /categoria/);
    assert.match(r.rows[2]?.errors.join() ?? '', /icono/);
    assert.deepEqual(r.rows[3]?.errors, []);
  });

  it('marks every row of a SKU repeated in the file', () => {
    const r = parseProductSheet([HEAD, row(), row({ nombre: 'Otro' })]);
    assert.equal(r.ok, true);
    if (r.ok) for (const x of r.rows) assert.match(x.errors.join(), /repetido/);
  });

  it(`refuses a file over ${MAX_IMPORT_ROWS} rows`, () => {
    const r = parseProductSheet([
      HEAD,
      ...Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => row({ sku: `S${i}` })),
    ]);
    assert.equal(r.ok, false);
  });

  it('skips blank rows', () => {
    const r = parseProductSheet([HEAD, row(), ['', null, undefined]]);
    assert.equal(r.ok && r.rows.length, 1);
  });
});

describe('planImport', () => {
  const existing = new Map([
    [
      'TAC-009',
      {
        id: 'P1',
        nombre: 'Taco de suadero',
        categoria: 'Producto Terminado',
        unidad: 'pza',
        costoUnitCentavos: 980n,
        precioVentaCentavos: 2500n,
        seguirStock: true,
        umbralStockBajo: 5,
        icono: null,
      },
    ],
  ]);

  it('classifies new, update and error rows', () => {
    const parsed = parseProductSheet([
      HEAD,
      row({ precio_venta: '26' }),
      row({ sku: 'NEW-1' }),
      row({ sku: 'BAD', costo_unitario: 'x' }),
    ]);
    assert.ok(parsed.ok);
    const plan = planImport(parsed.rows, existing);
    assert.deepEqual(
      plan.map((p) => p.kind),
      ['actualizar', 'nuevo', 'error'],
    );
  });

  it('refuses to change an existing product’s cost, on that row', () => {
    const parsed = parseProductSheet([HEAD, row({ costo_unitario: 11 })]);
    assert.ok(parsed.ok);
    const [p] = planImport(parsed.rows, existing);
    assert.equal(p?.kind, 'error');
    assert.match(p?.errors.join() ?? '', /costo/);
  });

  it('refuses to switch stock tracking on an existing product, on that row', () => {
    const parsed = parseProductSheet([HEAD, row({ seguir_stock: 'no' })]);
    assert.ok(parsed.ok);
    const [p] = planImport(parsed.rows, existing);
    assert.equal(p?.kind, 'error');
    assert.match(p?.errors.join() ?? '', /existencias/);
  });

  it('a row identical to the product is «sin cambios», not an update (P-07 acceptance)', () => {
    const parsed = parseProductSheet([HEAD, row(), row({ sku: 'NEW-2' })]);
    assert.ok(parsed.ok);
    assert.deepEqual(
      planImport(parsed.rows, existing).map((p) => p.kind),
      ['sin-cambios', 'nuevo'],
    );
  });
});
