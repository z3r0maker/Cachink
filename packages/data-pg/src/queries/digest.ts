import { and, count, gte, isNull } from 'drizzle-orm';

import type { Db } from '../client.js';
import { syncRejections } from '../schema/sync.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * The daily rejection digest (B-18): unresolved rejections received since
 * `since`, by code, most frequent first. Counts only — never the rows.
 */
export async function rejectionDigest(tx: Tx, since: string) {
  const rows = await tx
    .select({ code: syncRejections.code, n: count() })
    .from(syncRejections)
    .where(and(isNull(syncRejections.resolvedAt), gte(syncRejections.receivedAt, since)))
    .groupBy(syncRejections.code);
  return rows.sort((a, b) => b.n - a.n || a.code.localeCompare(b.code));
}
