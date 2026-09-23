import { allSubscriptions, businesses, subscriptionsOfBusinesses } from '@xangarro/data-pg';
import type { BusinessId } from '@xangarro/domain';

import type { BillingStatusSource } from '../billing/port';
import { matchesFilter, snapshotsFor } from '../billing/snapshot';
import type { Db, Tx } from './client';

/**
 * The console's `BillingStatusSource` over B-10's webhook-maintained
 * `subscriptions` (N-06), read as `xangarro_admin` (migration 0017). It never
 * calls Stripe. A filter is answered over every business, so «free» — no
 * subscription at all — is a status the list can filter by.
 */
export function drizzleBillingSource(conn: Db | Tx): BillingStatusSource {
  return {
    known: true,
    async snapshots(ids) {
      return snapshotsFor(ids, await subscriptionsOfBusinesses(conn, ids));
    },
    async matching(filter) {
      if (filter.plan === undefined && filter.status === undefined) return { kind: 'all' };
      const ids = (await conn.select({ id: businesses.id }).from(businesses)).map(
        (r) => r.id as BusinessId,
      );
      const snaps = snapshotsFor(ids, await allSubscriptions(conn));
      return {
        kind: 'only',
        businessIds: ids.filter((id) => {
          const s = snaps.get(id);
          return s !== undefined && matchesFilter(s, filter);
        }),
      };
    },
  };
}
