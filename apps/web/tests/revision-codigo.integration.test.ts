import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb, withBusiness, type Db } from '@xangarro/data-pg';
import { newUlid } from '@xangarro/domain';
import { integrationSuite } from '@xangarro/testing/integration';

import { mismoCodigoPorProducto } from '../src/server/revision-codigo';

/**
 * Revisión de caja's code match (P-45, ADR-150 §4): a product the phone gave
 * an approved product's barcode, under another name and in the other GTIN
 * form, reads as a duplicate of it. An archived product, a rejected one and
 * another business's never do, nor a pending product whose code is its own.
 */
const { url, describe } = integrationSuite();
const BIZ = newUlid();
const AJENO = newUlid();

async function producto(
  db: Db,
  biz: string,
  nombre: string,
  sku: string | null,
  estado: 'pendiente' | 'aprobado' | 'rechazado',
  borrado = false,
): Promise<string> {
  const id = newUlid();
  await withBusiness(db, biz, (tx) =>
    tx.execute(sql`
      INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad, umbral_stock_bajo,
                            tipo, seguir_stock, precio_venta_centavos, estado_revision, business_id,
                            device_id, created_at, updated_at, deleted_at)
      VALUES (${id}, ${nombre}, ${sku}, 'Producto Terminado', 0, 'pza', 3, 'producto', false, 2500,
              ${estado}, ${biz}, ${biz}, now(), now(), ${borrado ? sql`now()` : null})`),
  );
  return id;
}

describe('P-45 mismoCodigoPorProducto', () => {
  let db: Db;
  let catalogo = '';
  let deCaja = '';
  let suyo = '';
  let contraArchivado = '';
  let contraRechazado = '';
  let contraAjeno = '';

  beforeAll(async () => {
    db = createDb(url as string);
    catalogo = await producto(db, BIZ, 'Refresco 600 ml', '012000001772', 'aprobado');
    deCaja = await producto(db, BIZ, 'Refresco de cola', '0012000001772', 'pendiente');
    suyo = await producto(db, BIZ, 'Agua de jamaica 1 L', '7501234500018', 'pendiente');
    await producto(db, BIZ, 'Chicle viejo', 'ABC-1', 'aprobado', true);
    contraArchivado = await producto(db, BIZ, 'Chicle', 'abc-1', 'pendiente');
    await producto(db, BIZ, 'Hielo rechazado', '7509999000011', 'rechazado');
    contraRechazado = await producto(db, BIZ, 'Hielo', '7509999000011', 'pendiente');
    await producto(db, AJENO, 'Pan ajeno', '7508888000012', 'aprobado');
    contraAjeno = await producto(db, BIZ, 'Pan', '7508888000012', 'pendiente');
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('reads the phone’s product with an approved product’s code as its duplicate', async () => {
    const m = await withBusiness(db, BIZ, (tx) => mismoCodigoPorProducto(tx, BIZ));
    assert.deepEqual(m.get(deCaja), {
      id: catalogo,
      nombre: 'Refresco 600 ml',
      codigo: '0012000001772',
    });
  });

  it('matches nothing for a code of its own, archived, rejected or another business’s', async () => {
    const m = await withBusiness(db, BIZ, (tx) => mismoCodigoPorProducto(tx, BIZ));
    for (const id of [suyo, contraArchivado, contraRechazado, contraAjeno]) {
      assert.equal(m.has(id), false, id);
    }
    assert.equal(m.size, 1);
  });

  it('lets the match go once the pending product’s code is cleared («Son distintos»)', async () => {
    await withBusiness(db, BIZ, (tx) =>
      tx.execute(sql`UPDATE products SET sku = NULL WHERE id = ${deCaja}`),
    );
    const m = await withBusiness(db, BIZ, (tx) => mismoCodigoPorProducto(tx, BIZ));
    assert.equal(m.has(deCaja), false);
  });
});
