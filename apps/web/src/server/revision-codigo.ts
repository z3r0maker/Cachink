/**
 * Revisión de caja's code match (P-45, ADR-150 §4; board EcRevision): a
 * pending product whose barcode an approved, live product of the catalogue
 * already has, by the canonical key 0060 stores, so UPC-A and EAN-13 meet
 * whatever the two names are. The phone registered it offline, or the caja
 * gave it a name of its own; either way it must not reach the catalogue as a
 * second product with that code.
 */

import { sql } from 'drizzle-orm';

import type { Tx } from './db';

export interface MismoCodigo {
  /** The approved product that has the code: the merge target. */
  readonly id: string;
  readonly nombre: string;
  /** The pending product's code, as the caja saved it. */
  readonly codigo: string;
}

/** Pending product id → the approved product with its code (the first by name). */
export async function mismoCodigoPorProducto(
  tx: Tx,
  businessId: string,
): Promise<Map<string, MismoCodigo>> {
  const rows = await tx.execute<{
    pendiente: unknown;
    codigo: unknown;
    id: unknown;
    nombre: unknown;
  }>(
    sql`
      SELECT p.id AS pendiente, p.sku AS codigo, q.id, q.nombre
        FROM products p
        JOIN products q
          ON q.business_id = p.business_id
         AND q.codigo_canonico = p.codigo_canonico
       WHERE p.business_id = ${businessId}
         AND p.estado_revision = 'pendiente'
         AND p.deleted_at IS NULL
         AND p.codigo_canonico IS NOT NULL
         AND q.estado_revision = 'aprobado'
         AND q.deleted_at IS NULL
       ORDER BY q.nombre, q.id`,
  );
  const m = new Map<string, MismoCodigo>();
  for (const r of rows) {
    const pendiente = String(r.pendiente);
    if (m.has(pendiente)) continue;
    m.set(pendiente, { id: String(r.id), nombre: String(r.nombre), codigo: String(r.codigo) });
  }
  return m;
}
