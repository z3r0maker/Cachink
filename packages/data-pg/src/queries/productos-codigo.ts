/**
 * Which live products of the business have a barcode (P-44, ADR-150): by the
 * canonical key 0060 stores, so UPC-A and EAN-13 meet. Runs inside the tenant
 * transaction: RLS scopes it, never an argument. Archived products are left
 * out, as the partial index is.
 */
import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

export interface ProductoConCodigo {
  readonly id: string;
  readonly nombre: string;
}

/** `clave` is `codigoCanonico(raw)`, never the raw code. */
export async function findProductosPorCodigo(
  tx: Conn,
  clave: string,
): Promise<readonly ProductoConCodigo[]> {
  const rows = await tx.execute<{ id: unknown; nombre: unknown }>(sql`
    SELECT id, nombre FROM products
     WHERE codigo_canonico = ${clave} AND deleted_at IS NULL
     ORDER BY nombre, id`);
  return rows.map((r) => ({ id: String(r.id), nombre: String(r.nombre) }));
}
