import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { codigoCanonico } from '@xangarro/domain';

import { createDb, withBusiness, type Db } from '../src/client';
import { findProductosPorCodigo } from '../src/queries/productos-codigo';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * 0060: `products.codigo_canonico` (ADR-150 §5, P-44). Rows written before the
 * column get their key from the generated expression, and that expression
 * agrees with the domain's `codigoCanonico` on every fixture code: a 12-digit
 * UPC-A and its 13-digit EAN form, GTIN-8 and -14, a code with letters, blanks
 * and null. `findProductosPorCodigo` reads the live products of the tenant
 * alone: not an archived one, not another business's.
 */
const { url, describe } = integrationSuite();
const BIZ = testId('E');
const AJENO = testId('E');

/** sku → the row's id, for the parity check. */
const FIXTURES = [
  '012000001772',
  '0012000001772',
  '12345670',
  '17501055300072',
  '7501055300075',
  ' abc-128 ',
  'Code39 $/+%',
  '1234567890',
  '   ',
  '',
  null,
] as const;

async function producto(
  db: Db,
  biz: string,
  nombre: string,
  sku: string | null,
  borrado = false,
): Promise<string> {
  const id = testId('P');
  await withBusiness(db, biz, (tx) =>
    tx.execute(sql`
      INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad, umbral_stock_bajo,
                            tipo, seguir_stock, precio_venta_centavos, business_id, device_id,
                            created_at, updated_at, deleted_at)
      VALUES (${id}, ${nombre}, ${sku}, 'Producto Terminado', 500, 'pza', 3, 'producto', true, 900,
              ${biz}, ${biz}, now(), now(), ${borrado ? sql`now()` : null})`),
  );
  return id;
}

describe('0060 products.codigo_canonico', () => {
  let db: Db;
  const ids = new Map<string, string | null>();
  let refresco = '';
  let agua = '';

  beforeAll(async () => {
    db = createDb(url as string);
    for (const [i, sku] of FIXTURES.entries()) {
      ids.set(await producto(db, BIZ, `Fixture ${i}`, sku), sku);
    }
    refresco = await producto(db, BIZ, 'Refresco de cola', '750100000001');
    agua = await producto(db, BIZ, 'Agua natural', '0750100000001');
    await producto(db, BIZ, 'Refresco viejo', '750100000001', true);
    await producto(db, AJENO, 'Refresco ajeno', '750100000001');
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('agrees with codigoCanonico on every fixture code', async () => {
    const rows = await withBusiness(db, BIZ, (tx) =>
      tx.execute<{ id: string; codigo_canonico: string | null }>(
        sql`SELECT id, codigo_canonico FROM products WHERE nombre LIKE 'Fixture %'`,
      ),
    );
    assert.equal(rows.length, FIXTURES.length);
    for (const r of rows) {
      const sku = ids.get(r.id);
      assert.equal(r.codigo_canonico, codigoCanonico(sku), `sku ${JSON.stringify(sku)}`);
    }
  });

  it('finds the live products with a code, UPC-A or EAN-13, of this tenant alone', async () => {
    const clave = codigoCanonico('750100000001');
    assert.ok(clave !== null);
    const found = await withBusiness(db, BIZ, (tx) => findProductosPorCodigo(tx, clave));
    assert.deepEqual(
      found.map((p) => p.id).sort(),
      [agua, refresco].sort(),
      'not the archived one, not the other business’s',
    );
  });

  it('finds nobody for a code no live product has', async () => {
    const found = await withBusiness(db, BIZ, (tx) =>
      findProductosPorCodigo(tx, codigoCanonico('7509999999999') ?? ''),
    );
    assert.deepEqual(found, []);
  });

  it('refuses a written key: the column is generated', async () => {
    await assert.rejects(
      withBusiness(db, BIZ, (tx) =>
        tx.execute(sql`UPDATE products SET codigo_canonico = 'X' WHERE id = ${refresco}`),
      ),
    );
  });
});
