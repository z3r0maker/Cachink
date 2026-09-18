import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * Archive the tenant of `tx` (P-08): soft-delete the business, revoke every
 * device, end every portal session. Runs inside `withBusiness`/`withTenant` —
 * the function reads the tenant from the transaction, never from an argument.
 */
export async function archiveCurrentBusiness(tx: Tx): Promise<void> {
  await tx.execute(sql`SELECT xangarro.business_archive()`);
}
