/**
 * The owner's display name for the caja (`xangarro.owner_nombre`, 0044): the
 * bootstrap and every device pull send it so the register says «Pedro»
 * instead of «el dueño». Runs inside the tenant transaction: the function
 * reads the business from the request's claim, never from an argument.
 */

import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

/** Null when the business has no owner account or the owner set no name. */
export async function ownerNombre(tx: Conn): Promise<string | null> {
  const rows = await tx.execute<{ nombre: string | null }>(
    sql`SELECT xangarro.owner_nombre() AS nombre`,
  );
  return rows[0]?.nombre ?? null;
}
