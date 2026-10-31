import { newUlid } from '@xangarro/domain';

import { asTenant } from './sync-phone';
import type { Tenant } from './tenant';

/**
 * The rows a spec composes onto its own tenant (`tenant.ts`).
 *
 * Every one of these takes the tenant and returns the id it wrote, so a fixture
 * reads as the rows the test is about and nothing else. Amounts are centavos
 * (CLAUDE.md §2.8); dates are `YYYY-MM-DD` strings, because the suite pins the
 * business clock to the seed's day and a fixture dated "now" would fall outside
 * every period the screens show.
 */
export interface ProductRow {
  readonly nombre?: string;
  readonly sku?: string | null;
  readonly categoria?: string;
  /** Centavos. */
  readonly costo?: number;
  /** Centavos. */
  readonly precio?: number;
  readonly unidad?: string;
  readonly seguirStock?: boolean;
  readonly umbral?: number;
}

export async function addProduct(t: Tenant, row: ProductRow = {}): Promise<string> {
  const id = newUlid();
  await asTenant(t.biz, async (sql) => {
    await sql`
      INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad,
                            umbral_stock_bajo, tipo, seguir_stock, precio_venta_centavos,
                            business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${row.nombre ?? 'Producto'}, ${row.sku ?? null},
              ${row.categoria ?? 'Producto Terminado'}, ${row.costo ?? 100}, ${row.unidad ?? 'pza'},
              ${row.umbral ?? 3}, 'producto', ${row.seguirStock ?? false}, ${row.precio ?? 500},
              ${t.biz}, ${t.deviceId}, now(), now())`;
  });
  return id;
}

export interface SaleRow {
  readonly fecha: string;
  /** Centavos. */
  readonly monto: number;
  readonly concepto?: string;
  readonly folio?: number;
  readonly metodo?: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'QR/CoDi' | 'Crédito';
  readonly estadoPago?: 'pagado' | 'pendiente';
  readonly productoId?: string | null;
  readonly cantidad?: number;
}

/** A sale is a ticket line (C-17, ADR-073): the header comes with it. */
export async function addSale(t: Tenant, row: SaleRow): Promise<string> {
  const id = newUlid();
  const concepto = row.concepto ?? 'Venta';
  await asTenant(t.biz, async (sql) => {
    await sql`
      INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago,
                           business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${row.folio ?? 1}, ${row.fecha}, ${concepto}, ${row.metodo ?? 'Efectivo'},
              ${row.estadoPago ?? 'pagado'}, ${t.biz}, ${t.deviceId}, now(), now())`;
    await sql`
      INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos, producto_id,
                         cantidad, business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${id}, ${row.fecha}, ${concepto}, 'Producto', ${row.monto},
              ${row.productoId ?? null}, ${row.cantidad ?? 1}, ${t.biz}, ${t.deviceId},
              now(), now())`;
  });
  return id;
}

export interface OperatorRow {
  readonly nombre?: string;
  /** The NIP's hash. Specs that do not type it in pass nothing. */
  readonly pinHash?: string;
  readonly active?: boolean;
  readonly permissions?: Record<string, boolean>;
}

export async function addOperator(t: Tenant, row: OperatorRow = {}): Promise<string> {
  const id = newUlid();
  await asTenant(t.biz, async (sql) => {
    await sql`
      INSERT INTO users (id, nombre, pin_hash, avatar_color, permissions, active,
                         business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${row.nombre ?? 'Operador'}, ${row.pinHash ?? 'x'}, 'blue',
              ${sql.json(row.permissions ?? {})}, ${row.active ?? true}, ${t.biz}, ${t.deviceId},
              now(), now())`;
  });
  return id;
}

/** A second device, for the specs about slots and pairing. */
export async function addDevice(t: Tenant, nombre = 'Caja norte'): Promise<string> {
  const id = newUlid();
  await asTenant(t.biz, async (sql) => {
    await sql`
      INSERT INTO devices (id, nombre, plataforma, modelo, business_id, created_at, updated_at)
      VALUES (${id}, ${nombre}, 'android', 'x', ${t.biz}, now(), now())`;
  });
  return id;
}
