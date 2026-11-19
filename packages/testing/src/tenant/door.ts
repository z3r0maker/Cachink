import { newUlid } from '@xangarro/domain';

import { asOwner, asTenant } from './connection.js';
import { BIZ, DEV } from './wire.js';

/**
 * The database half of the operator door (O-38): what has to be true before a
 * browser walks the real Acceso on the seeded tenant.
 */

/**
 * Empties the throttle table. Activation's per-IP throttle (5 tries / 15 min)
 * cannot take a door per test, and its keys are sha256-hashed, so the reset is
 * the whole table: the same throwaway-database reset the backoffice suite's
 * global setup does.
 */
export async function resetThrottle(): Promise<void> {
  await asOwner((sql) => sql`DELETE FROM xangarro.throttle`);
}

/** A product the door's bootstrap will carry into the register's database. */
export interface ProductoPuerta {
  readonly nombre: string;
  /** Centavos. */
  readonly precioCentavos: number;
  readonly sku: string;
}

/**
 * Products on the seeded tenant, inserted before activating so the bootstrap
 * carries them into the register's OPFS. Once per sku: `products` has no unique
 * sku, so there is no ON CONFLICT target, and a second call adds nothing.
 */
export async function seedDoorProducts(productos: readonly ProductoPuerta[]): Promise<void> {
  if (productos.length === 0) return;
  await asTenant(BIZ, async (sql) => {
    for (const p of productos) {
      await sql`
        INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad,
                              umbral_stock_bajo, tipo, seguir_stock, precio_venta_centavos,
                              business_id, device_id, created_at, updated_at)
        SELECT ${newUlid()}, ${p.nombre}, ${p.sku}, 'Producto Terminado', 100, 'pza', 3,
               'producto', true, ${p.precioCentavos},
               ${BIZ}, ${DEV}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM products WHERE business_id = ${BIZ} AND sku = ${p.sku})`;
    }
  });
}
