import { sql } from 'drizzle-orm';

import type { AttributionRange, AttributionSource, AttributionTally } from '../attribution/port';
import type { Db, Tx } from './client';

/**
 * Postgres adapter for `AttributionSource` (N-57): one call to
 * `xangarro.admin_attribution_rollup()` (admin migration 0016), which returns
 * counts already grouped. The console holds no grant on
 * `xangarro.signup_attribution` itself, so this is the whole of what it can
 * see — and a row there is one business, which is exactly why it never
 * returns rows.
 */
type Conn = Db | Tx;

interface Row extends Record<string, unknown> {
  source: string;
  medium: string;
  campaign: string;
  region: string;
  signups: string | number;
}

export function drizzleAttribution(conn: Conn): AttributionSource {
  return {
    async rollup(range: AttributionRange): Promise<AttributionTally[]> {
      const rows = await conn.execute<Row>(
        sql`SELECT * FROM xangarro.admin_attribution_rollup(${range.from}::date, ${range.to}::date)`,
      );
      return rows.map((r) => ({
        source: r.source,
        medium: r.medium,
        campaign: r.campaign,
        region: r.region,
        signups: Number(r.signups),
      }));
    },
  };
}
