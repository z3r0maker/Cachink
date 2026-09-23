import { desc, eq, isNull, sql } from 'drizzle-orm';

import { inventoryMovements, products } from '../schema/catalog.js';
import type { Db } from '../client.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

const big = (v: unknown): bigint => (v === null || v === undefined ? 0n : BigInt(String(v)));

/* ── Productos ───────────────────────────────────────────────────────── */

export interface ProductoRow {
  readonly id: string;
  readonly nombre: string;
  readonly sku: string;
  readonly categoria: string;
  readonly precio: bigint;
  readonly costo: bigint;
  readonly stock: number;
  readonly umbral: number;
  readonly sigueStock: boolean;
  /** For the edit sheet (P-07): the rest of what the create sheet sets. */
  readonly unidad: string;
  readonly tipo: string;
  readonly usoProducto: string;
  readonly colorFondo: string;
  readonly icono: string | null;
}

function toProductoRow(r: ProductoSqlRow): ProductoRow {
  return {
    id: r.id,
    nombre: r.nombre,
    sku: r.sku ?? '',
    categoria: r.categoria,
    precio: big(r.precio),
    costo: big(r.costo),
    stock: Number(r.stock),
    umbral: r.umbral,
    sigueStock: r.sigue_stock,
    unidad: r.unidad,
    tipo: r.tipo,
    usoProducto: r.uso_producto,
    colorFondo: r.color_fondo,
    icono: r.icono,
  };
}

/** Stock is derived from movements and signed by `tipo` — never stored. */
type ProductoSqlRow = {
  id: string;
  nombre: string;
  sku: string | null;
  categoria: string;
  precio: string;
  costo: string;
  stock: string;
  umbral: number;
  sigue_stock: boolean;
  unidad: string;
  tipo: string;
  uso_producto: string;
  color_fondo: string;
  icono: string | null;
};

export async function listProductos(tx: Tx): Promise<readonly ProductoRow[]> {
  const rows = await tx.execute<ProductoSqlRow>(sql`
    SELECT p.id, p.nombre, p.sku, p.categoria,
           p.precio_venta_centavos::text AS precio,
           p.costo_unit_centavos::text   AS costo,
           COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN -m.cantidad ELSE m.cantidad END), 0)::text AS stock,
           p.umbral_stock_bajo AS umbral,
           p.seguir_stock AS sigue_stock,
           p.unidad, p.tipo, p.uso_producto, p.color_fondo, p.icono
      FROM ${products} p
      LEFT JOIN ${inventoryMovements} m ON m.producto_id = p.id AND m.deleted_at IS NULL
     WHERE p.deleted_at IS NULL
     GROUP BY p.id
     ORDER BY p.nombre`);
  return [...rows].map(toProductoRow);
}

export interface MovimientoInvRow {
  readonly id: string;
  readonly fecha: string;
  readonly producto: string;
  readonly tipo: string;
  readonly motivo: string;
  readonly cambio: number;
}

export async function listMovimientosInventario(tx: Tx): Promise<readonly MovimientoInvRow[]> {
  const rows = await tx
    .select({
      id: inventoryMovements.id,
      fecha: inventoryMovements.fecha,
      producto: products.nombre,
      tipo: inventoryMovements.tipo,
      motivo: inventoryMovements.motivo,
      cantidad: inventoryMovements.cantidad,
    })
    .from(inventoryMovements)
    .leftJoin(products, eq(products.id, inventoryMovements.productoId))
    .where(isNull(inventoryMovements.deletedAt))
    .orderBy(desc(inventoryMovements.fecha))
    .limit(50);
  return rows.map((r) => ({
    id: r.id,
    fecha: r.fecha ?? '',
    producto: r.producto ?? '—',
    tipo: r.tipo ?? '',
    motivo: r.motivo ?? '',
    cambio: r.tipo === 'salida' ? -(r.cantidad ?? 0) : (r.cantidad ?? 0),
  }));
}
