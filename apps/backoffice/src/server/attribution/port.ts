/**
 * What the console can learn about which campaigns brought businesses in
 * (N-57, ADR-092). Counts only — a row in the underlying table is one
 * business, so the source hands back groups, never rows.
 */
export interface AttributionTally {
  readonly source: string;
  readonly medium: string;
  readonly campaign: string;
  /** Bare ISO 3166-2 subdivision; `''` when the state was not resolved. */
  readonly region: string;
  readonly signups: number;
}

export interface AttributionRange {
  readonly from: string;
  readonly to: string;
}

export interface AttributionSource {
  rollup(range: AttributionRange): Promise<AttributionTally[]>;
}
