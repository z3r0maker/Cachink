import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb, withBusiness, type Db } from '@xangarro/data-pg';
import { newUlid } from '@xangarro/domain';
import { integrationSuite } from '@xangarro/testing/integration';

import { TEMPLATE_HEADERS } from '../src/lib/import-productos';
import { planFromFile } from '../src/server/import/plan-productos';

/**
 * The product import reads the catalogue by barcode (ADR-150): a sheet's
 * EAN-13 updates the product saved with its UPC-A, a code two catalogue
 * products already share is refused on its row, and an archived product's
 * code is free again.
 */
const { url, describe } = integrationSuite();
const BIZ = newUlid();

async function producto(db: Db, nombre: string, sku: string, borrado = false): Promise<string> {
  const id = newUlid();
  await withBusiness(db, BIZ, (tx) =>
    tx.execute(sql`
      INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad, umbral_stock_bajo,
                            tipo, seguir_stock, precio_venta_centavos, business_id, device_id,
                            created_at, updated_at, deleted_at)
      VALUES (${id}, ${nombre}, ${sku}, 'Producto Terminado', 980, 'pza', 5, 'producto', true, 2500,
              ${BIZ}, ${BIZ}, now(), now(), ${borrado ? sql`now()` : null})`),
  );
  return id;
}

/** A sheet row in the template's columns, cost and stock as the product has them. */
const linea = (sku: string, nombre: string) =>
  [sku, nombre, 'Producto Terminado', 'pza', '9.80', '26', 'sí', '5', ''].join(',');

const hoja = (...lineas: string[]) =>
  new File([[TEMPLATE_HEADERS.join(','), ...lineas].join('\n')], 'productos.csv', {
    type: 'text/csv',
  });

describe('import · barcode match', () => {
  let db: Db;
  let refresco = '';

  beforeAll(async () => {
    db = createDb(url as string);
    refresco = await producto(db, 'Refresco 600 ml', '012000001772');
    await producto(db, 'Agua A', '7501055300075');
    await producto(db, 'Agua B', '07501055300075');
    await producto(db, 'Chicle viejo', 'ABC-1', true);
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('updates the product by its code in the other form, refuses a shared one, frees an archived one', async () => {
    const plan = await withBusiness(db, BIZ, (tx) =>
      planFromFile(
        tx,
        hoja(
          linea('0012000001772', 'Refresco 600 ml'),
          linea('7501055300075', 'Agua'),
          linea('abc-1', 'Chicle'),
        ),
      ),
    );
    const [cola, agua, chicle] = plan;
    assert.equal(cola?.kind, 'actualizar');
    assert.equal(cola?.id, refresco);
    assert.equal(agua?.kind, 'error');
    assert.match(agua?.errors.join() ?? '', /lo tienen 2 o más productos/);
    assert.equal(chicle?.kind, 'nuevo');
  });
});
