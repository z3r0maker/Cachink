import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

/**
 * First-touch signup attribution (N-57).
 *
 * The five `utm_*` labels a marketer chose, plus the state the signup came
 * from, so "which campaign, in which region, produced a customer" is one join.
 * `geo_counters` cannot answer that — it is an aggregate by design.
 *
 * `xangarro.signup_attribution_record` is `ON CONFLICT DO NOTHING`, so calling
 * it twice for the same business is a no-op and the first campaign wins. See
 * `drizzle/0032_signup_attribution.sql`.
 */
export interface SignupAttribution {
  readonly source: string;
  readonly medium: string;
  readonly campaign: string;
  readonly term: string;
  readonly content: string;
  /** ISO 3166-1 alpha-2, `ZZ` when unknown. */
  readonly country: string;
  /** Bare ISO 3166-2 subdivision, `''` when unknown. */
  readonly region: string;
}

export async function recordSignupAttribution(
  db: Db,
  businessId: string,
  a: SignupAttribution,
): Promise<void> {
  await db.execute(
    sql`SELECT xangarro.signup_attribution_record(
      ${businessId}, ${a.source}, ${a.medium}, ${a.campaign}, ${a.term}, ${a.content},
      ${a.country}, ${a.region})`,
  );
}
