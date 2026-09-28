import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { newEntityId, type BusinessId, type ProductId } from '@xangarro/domain';

import { DrizzleProductsRepository } from '../../src/repositories/drizzle/index.js';
import { products } from '../../src/schema/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';
import type { XangarroDatabase } from '../../src/repositories/drizzle/_db.js';

/**
 * What the shared contract does not reach: the create defaults a capture
 * leans on, the per-field guards of `update` (and the stamp-only save that
 * exercises none of them), a patch against a row that is not there, the
 * soft-delete the listings must respect, and a stored atributos blob that is
 * not JSON — which maps to empty, never throws.
 */

const BIZ = newEntityId<BusinessId>();

function repo(db: XangarroDatabase): DrizzleProductsRepository {
  return new DrizzleProductsRepository(db, TEST_DEVICE_ID);
}

const base = {
  nombre: 'Queso Oaxaca',
  categoria: 'Producto Terminado' as const,
  costoUnitCentavos: 120_00n,
  unidad: 'kg' as const,
  precioVentaCentavos: 180_00n,
  businessId: BIZ,
  estadoRevision: 'aprobado' as const,
};

describe('DrizzleProductsRepository · edges', () => {
  it('a minimal create takes every default the capture leans on', async () => {
    const db = makeFreshDb();
    const p = await repo(db).create(base);
    assert.equal(p.sku, null);
    assert.equal(p.umbralStockBajo, 3);
    assert.equal(p.tipo, 'producto');
    assert.equal(p.seguirStock, true);
    assert.deepEqual(p.atributos, {});
    assert.equal(p.colorFondo, 'white');
    assert.equal(p.usoProducto, 'venta');
    assert.equal(p.icono, null);
    assert.equal(p.fusionadoConId, null);
  });

  it('a full create keeps every optional field as given', async () => {
    const db = makeFreshDb();
    const fusion = newEntityId<ProductId>();
    const p = await repo(db).create({
      ...base,
      sku: 'QUESO-001',
      umbralStockBajo: 5,
      tipo: 'servicio',
      seguirStock: false,
      atributos: { origen: 'Etla' },
      colorFondo: 'yellow',
      usoProducto: 'ambos',
      icono: 'beef',
      estadoRevision: 'pendiente',
      fusionadoConId: fusion,
    });
    assert.equal(p.sku, 'QUESO-001');
    assert.equal(p.umbralStockBajo, 5);
    assert.equal(p.tipo, 'servicio');
    assert.equal(p.seguirStock, false);
    assert.deepEqual(p.atributos, { origen: 'Etla' });
    assert.equal(p.colorFondo, 'yellow');
    assert.equal(p.usoProducto, 'ambos');
    assert.equal(p.icono, 'beef');
    assert.equal(p.estadoRevision, 'pendiente');
    assert.equal(p.fusionadoConId, fusion);
  });

  it('a patch carries only the fields it names; a stamp-only save touches nothing else', async () => {
    const db = makeFreshDb();
    const r = repo(db);
    const p = await r.create({ ...base, sku: 'QUESO-001' });
    const antes = await r.findById(p.id);

    const cambiado = await r.update(p.id, { nombre: 'Quesillo', precioVentaCentavos: 190_00n });
    assert.equal(cambiado?.nombre, 'Quesillo');
    assert.equal(cambiado?.precioVentaCentavos, 190_00n);
    // What the patch did not name is untouched.
    assert.equal(cambiado?.sku, 'QUESO-001');
    assert.equal(cambiado?.categoria, 'Producto Terminado');

    const sellado = await r.update(p.id, {});
    assert.equal(sellado?.nombre, 'Quesillo');
    assert.equal(sellado?.updatedAt >= (antes?.updatedAt ?? ''), true);
  });

  it('every patchable field travels, one at a time', async () => {
    const db = makeFreshDb();
    const r = repo(db);
    const p = await r.create(base);
    const pasos = [
      { sku: 'Q-2' },
      { categoria: 'Materia Prima' as const },
      { unidad: 'pza' as const },
      { umbralStockBajo: 9 },
      { colorFondo: 'green' as const },
      { usoProducto: 'materia-prima' as const },
      { icono: 'apple' as const },
      { costoUnitCentavos: 130_00n },
      { nombre: 'Queso fresco' },
    ];
    for (const paso of pasos) {
      const out = await r.update(p.id, paso);
      assert.deepEqual(
        Object.entries(paso).every(([k, v]) => (out as Record<string, unknown>)[k] === v),
        true,
        `paso ${Object.keys(paso)[0]}`,
      );
    }
  });

  it('a patch against a row that is not there is null, not an error', async () => {
    const db = makeFreshDb();
    assert.equal(await repo(db).update(newEntityId<ProductId>(), { nombre: 'X' }), null);
  });

  it('a deleted product is gone from find, list, sku and count alike', async () => {
    const db = makeFreshDb();
    const r = repo(db);
    const p = await r.create({ ...base, sku: 'QUESO-001' });
    await r.delete(p.id);
    assert.equal(await r.findById(p.id), null);
    assert.equal(await r.findBySku('QUESO-001', BIZ), null);
    assert.deepEqual(await r.listForBusiness(BIZ), []);
    assert.equal(await r.count(BIZ), 0);
  });

  it('a stored atributos blob that is not JSON maps to empty, never throws', async () => {
    const db = makeFreshDb();
    const r = repo(db);
    const p = await r.create(base);
    db.update(products).set({ atributos: 'no-es-json' }).where(eq(products.id, p.id)).run();
    const leido = await r.findById(p.id);
    assert.deepEqual(leido?.atributos, {});
  });
});
