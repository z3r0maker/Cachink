/**
 * What the console can learn about where its users are (N-56, ADR-092).
 *
 * The source hands back counts already grouped — never a row, never a
 * per-event timestamp — because `xangarro.geo_counters` is an aggregate by
 * design and this port is the only way in.
 */
export const GEO_SOURCES = ['login', 'compra', 'landing'] as const;
export type GeoSource = (typeof GEO_SOURCES)[number];

export interface GeoTally {
  readonly source: GeoSource;
  /** ISO 3166-1 alpha-2; `ZZ` when the request carried no usable geo header. */
  readonly country: string;
  /** Bare ISO 3166-2 subdivision (`JAL`); `''` when unknown. */
  readonly region: string;
  readonly hits: number;
}

export interface GeoRange {
  /** Inclusive, `YYYY-MM-DD` in CDMX time. */
  readonly from: string;
  /** Exclusive. */
  readonly to: string;
}

export interface GeoRollupSource {
  rollup(range: GeoRange): Promise<GeoTally[]>;
}
