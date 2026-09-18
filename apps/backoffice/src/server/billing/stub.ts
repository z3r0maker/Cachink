import type { BusinessId } from '@xangarro/domain';

import { UNKNOWN_BILLING, type BillingStatusSource } from './port';

/**
 * The billing source until B-10: nothing is known about anyone. It never
 * calls Stripe. A filter that asks for a known plan or status therefore
 * matches no tenant, and only "no filter" or `status = unknown` keeps them all
 * — the list says so instead of guessing.
 */
export const unknownBillingSource: BillingStatusSource = {
  known: false,
  snapshots(ids) {
    return Promise.resolve(
      new Map(ids.map((id): [BusinessId, typeof UNKNOWN_BILLING] => [id, UNKNOWN_BILLING])),
    );
  },
  matching(filter) {
    const unfiltered = filter.plan === undefined && (filter.status ?? 'unknown') === 'unknown';
    return Promise.resolve(unfiltered ? { kind: 'all' } : { kind: 'only', businessIds: [] });
  },
};
