import type { GeoRange, GeoRollupSource, GeoTally } from './port';

/**
 * An in-memory `GeoRollupSource` for the use-case tests. Holds tallies with
 * the day they belong to and filters the same half-open way the SQL does
 * (`day >= from AND day < to`), so an off-by-one in the range shows up here.
 */
export interface DatedTally extends GeoTally {
  readonly day: string;
}

export class InMemoryGeoRollup implements GeoRollupSource {
  constructor(private readonly tallies: readonly DatedTally[] = []) {}

  rollup(range: GeoRange): Promise<GeoTally[]> {
    const inRange = this.tallies.filter((t) => t.day >= range.from && t.day < range.to);
    const merged = new Map<string, GeoTally>();
    for (const t of inRange) {
      const key = `${t.source}|${t.country}|${t.region}`;
      const found = merged.get(key);
      merged.set(key, {
        source: t.source,
        country: t.country,
        region: t.region,
        hits: (found?.hits ?? 0) + t.hits,
      });
    }
    return Promise.resolve([...merged.values()]);
  }
}

/** A source that fails, for the STORE_FAILED path. */
export const failingGeoRollup: GeoRollupSource = {
  rollup: () => Promise.reject(new Error('no database')),
};
