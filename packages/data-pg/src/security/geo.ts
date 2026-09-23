import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

/**
 * Geographic counters by Mexican state (N-55, ADR-092).
 *
 * The table is an aggregate from birth — one row per day, source and region,
 * holding a count. There is no per-event row, no IP, no city and no user id,
 * so nothing here can be traced back to a person. `xangarro.geo_record` is
 * the only way in; see `drizzle/0030_geo_counters.sql`.
 */
export const GEO_SOURCES = ['login', 'compra', 'landing'] as const;
export type GeoSource = (typeof GEO_SOURCES)[number];

/**
 * `country` is ISO 3166-1 alpha-2 (`ZZ` when unknown) and `region` the bare
 * ISO 3166-2 subdivision (`''` when unknown). The function normalises and
 * validates both again server-side, so a bad value becomes "unknown" rather
 * than a new spelling.
 */
export async function recordGeoCount(
  db: Db,
  source: GeoSource,
  country: string,
  region: string,
): Promise<void> {
  await db.execute(sql`SELECT xangarro.geo_record(${source}, ${country}, ${region})`);
}
