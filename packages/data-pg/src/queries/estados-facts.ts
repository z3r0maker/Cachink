/**
 * The apertura valuation (N-17): Σ apertura movements (cantidad × costo) —
 * the day-one inventory value the Balance's `capitalInicial` needs. The other
 * balance inputs live in `periodBalanceInputs` (F-1).
 */

import { and, eq, isNull, sql } from 'drizzle-orm';

import { inventoryMovements } from '../schema/index.js';
import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * Postgres answers `sum()` over bigint with a **numeric**, which the driver
 * hands back as text — the same rule `dashboard.ts` writes down. Typing that
 * text as `bigint` was a lie the compiler could not catch, and the damage was
 * silent rather than loud: `bigint + string` is legal JavaScript, so the
 * Balance's `capitalInicial` concatenated instead of adding and «Total
 * capital» read -$640,885,164,500.00. Parse at the boundary, never past it.
 */
export async function valuacionApertura(db: Conn, businessId: string): Promise<bigint> {
  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${inventoryMovements.cantidad} * ${inventoryMovements.costoUnitCentavos}), 0)`,
    })
    .from(inventoryMovements)
    .where(
      and(
        eq(inventoryMovements.businessId, businessId),
        eq(inventoryMovements.motivo, 'Apertura de inventario'),
        isNull(inventoryMovements.deletedAt),
      ),
    );
  return row === undefined ? 0n : BigInt(String(row.total));
}
