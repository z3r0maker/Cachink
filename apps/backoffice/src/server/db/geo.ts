import { sql } from 'drizzle-orm';

import type { GeoRange, GeoRollupSource, GeoSource, GeoTally } from '../geo/port';
import type { Db, Tx } from './client';

/**
 * Postgres adapter for `GeoRollupSource` (N-56): one call to
 * `xangarro.admin_geo_rollup()` (admin migration 0015), which returns counts
 * already grouped by source, country and region.
 *
 * There is no row-level read of `xangarro.geo_counters` anywhere in the
 * console — the console holds no grant on that table at all — so this is the
 * whole of what the staff side can learn.
 */
type Conn = Db | Tx;

interface Row extends Record<string, unknown> {
  source: string;
  country: string;
  region: string;
  hits: string | number;
}

export function drizzleGeoRollup(conn: Conn): GeoRollupSource {
  return {
    async rollup(range: GeoRange): Promise<GeoTally[]> {
      const rows = await conn.execute<Row>(
        sql`SELECT * FROM xangarro.admin_geo_rollup(${range.from}::date, ${range.to}::date)`,
      );
      return rows.map((r) => ({
        source: r.source as GeoSource,
        country: r.country,
        region: r.region,
        // `sum()` is bigint, which the driver hands back as a string.
        hits: Number(r.hits),
      }));
    },
  };
}
