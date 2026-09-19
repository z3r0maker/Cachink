/**
 * The apertura valuation (N-17): Σ apertura movements (cantidad × costo) —
 * the day-one inventory value the Balance's `capitalInicial` needs. The other
 * balance inputs live in `periodBalanceInputs` (F-1).
 */

import { and, eq, isNull, sql } from 'drizzle-orm';

import { inventoryMovements } from '../schema/index.js';
import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

export async function valuacionApertura(db: Conn, businessId: string): Promise<bigint> {
  const [row] = await db
    .select({
      total: sql<bigint>`coalesce(sum(${inventoryMovements.cantidad} * ${inventoryMovements.costoUnitCentavos}), 0)`,
    })
    .from(inventoryMovements)
    .where(
      and(
        eq(inventoryMovements.businessId, businessId),
        eq(inventoryMovements.motivo, 'Apertura de inventario'),
        isNull(inventoryMovements.deletedAt),
      ),
    );
  return row?.total ?? 0n;
}
