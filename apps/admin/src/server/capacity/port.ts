/**
 * What the capacity card reads (N-07). `../db/capacity.ts` measures Postgres;
 * tests pass a literal. Estimates, not counts: `reltuples` is refreshed by
 * ANALYZE / autovacuum, which is accurate enough to watch a 50 M-row trigger
 * and costs nothing, where `count(*)` at that size would take seconds.
 */
import type { CapacitySnapshot } from './status';

export interface TableSize {
  readonly name: string;
  /** `pg_class.reltuples`, 0 for a table never analysed. */
  readonly approxRows: number;
  /** `pg_total_relation_size`: heap + indexes + TOAST. */
  readonly bytes: number;
}

export interface CapacityReading {
  readonly dbBytes: number;
  /** Largest first by estimated rows; at most ten. */
  readonly topTables: readonly TableSize[];
  readonly activeTenants: number;
  /** Null until B-18 logs sync request timings. */
  readonly syncP95Ms: number | null;
  /** When it was measured, ISO-8601. */
  readonly measuredAt: string;
}

export interface CapacityProbe {
  read(): Promise<CapacityReading>;
}

export function snapshotOf(r: CapacityReading): CapacitySnapshot {
  const largest = r.topTables.reduce<TableSize | null>(
    (best, t) => (best === null || t.approxRows > best.approxRows ? t : best),
    null,
  );
  return {
    dbBytes: r.dbBytes,
    largestTable: largest === null ? null : { name: largest.name, approxRows: largest.approxRows },
    activeTenants: r.activeTenants,
    syncP95Ms: r.syncP95Ms,
  };
}
