import 'server-only';

import { and, eq } from 'drizzle-orm';

import { inventoryMovements, openingBalanceClientsOf, openingBalanceOf } from '@xangarro/data-pg';
import { APERTURA_MOTIVO } from '@xangarro/domain/usage';

import { withTenant } from './db';

/**
 * What the apertura screens read (N-17): the saldos iniciales as stored, and
 * whether the one-time inventario inicial was already captured.
 *
 * These take the business from their caller, so they live here and not in
 * `actions/apertura.ts` (audit F-03): every export of a `'use server'` file is
 * an endpoint anyone can call with any id, and a `server-only` module is not.
 * The pages pass the business of the session they just required.
 */
export async function saldosActuales(businessId: string) {
  return withTenant(businessId, async (tx) => ({
    header: await openingBalanceOf(tx, businessId),
    lines: await openingBalanceClientsOf(tx, businessId),
  }));
}

export async function inventarioInicialYaCapturado(businessId: string): Promise<boolean> {
  return withTenant(businessId, async (tx) => {
    const rows = await tx
      .select({ id: inventoryMovements.id })
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.businessId, businessId),
          eq(inventoryMovements.motivo, APERTURA_MOTIVO),
        ),
      )
      .limit(1);
    return rows.length > 0;
  });
}
