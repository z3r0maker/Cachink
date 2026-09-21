/** The conformance tenant: an isolated business with free device slots. */

import { hash } from 'bcryptjs';
import type { Sql } from 'postgres';

import { BIZ, CONFORMANCE, CREATED, DEV } from './seed-data.js';

/** See `CONFORMANCE` in seed-data.ts: an isolated tenant with free device slots. */
export async function seedConformance(sql: Sql): Promise<void> {
  const c = CONFORMANCE;
  await sql`SELECT set_config('xangarro.business_id', ${c.businessId}, false)`;
  await sql`
    INSERT INTO businesses (id, nombre, regimen_fiscal, regimen_sat, isr_tasa, business_id, device_id, created_at, updated_at)
    VALUES (${c.businessId}, 'Conformance', 'RESICO', '626', 125, ${c.businessId}, ${DEV}, ${CREATED}, ${CREATED})
    ON CONFLICT (id) DO NOTHING`;
  await sql`
    INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad, umbral_stock_bajo, tipo,
                          seguir_stock, precio_venta_centavos, business_id, device_id, created_at, updated_at)
    VALUES (${c.productId}, 'Producto de prueba', 'CNF-001', 'Producto Terminado', 100, 'pza', 3, 'producto',
            true, 200, ${c.businessId}, ${DEV}, ${CREATED}, ${CREATED})
    ON CONFLICT (id) DO NOTHING`;
  const pin = await hash('0000', 10);
  await sql`
    INSERT INTO users (id, nombre, pin_hash, avatar_color, permissions, active,
                       business_id, device_id, created_at, updated_at)
    VALUES (${c.userId}, 'Operador de prueba', ${pin}, '#3B6FFF', '{}', true,
            ${c.businessId}, ${DEV}, ${CREATED}, ${CREATED})
    ON CONFLICT (id) DO NOTHING`;
  await sql`SELECT set_config('xangarro.business_id', ${BIZ}, false)`;
}
