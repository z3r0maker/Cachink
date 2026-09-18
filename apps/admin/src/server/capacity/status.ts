/**
 * The capacity card's arithmetic (N-07, ADR-068). Pure: the adapter measures,
 * this scores. Each measurement is compared with the trigger that moves the
 * database to its next stage — amber from 80 % of it, red at it.
 *
 * Sizes are bytes with GB = 1024³, the unit `pg_size_pretty` and the
 * Supabase dashboard use. The triggers themselves are ADR-068's and are not
 * tuned here: moving one is an ADR amendment.
 */

export type CapacityStatus = 'ok' | 'amber' | 'red' | 'sin-datos';

const GB = 1024 ** 3;

export const CAPACITY_TRIGGERS = {
  /** S2: DB > 25 GB. */
  dbBytesS2: 25 * GB,
  /** S3: DB > 500 GB. */
  dbBytesS3: 500 * GB,
  /** S2: any table > 50 M rows. */
  tableRows: 50_000_000,
  /** S2: sync p95 > 800 ms (measured by B-18). */
  syncP95Ms: 800,
  /** S3: > 10 000 active tenants. */
  activeTenants: 10_000,
} as const;

/** Share of a trigger at which the card turns amber, in percent. */
export const AMBER_AT_PERCENT = 80;

export class CapacityInputError extends Error {
  readonly code = 'INVALID_CAPACITY_INPUT' as const;

  constructor(
    readonly field: 'value' | 'trigger',
    readonly received: number,
  ) {
    super(`Medición de capacidad inválida (${field}): ${received}`);
    this.name = 'CapacityInputError';
  }
}

/**
 * Where `value` stands against `trigger`. `null` means "not measured" and is
 * never reported as healthy. Compared as `value * 100 >= trigger * 80` so no
 * division rounds a byte count across the line.
 */
export function capacityStatus(value: number | null, trigger: number): CapacityStatus {
  if (!Number.isFinite(trigger) || trigger <= 0) throw new CapacityInputError('trigger', trigger);
  if (value === null) return 'sin-datos';
  if (!Number.isFinite(value) || value < 0) throw new CapacityInputError('value', value);
  if (value >= trigger) return 'red';
  if (value * 100 >= trigger * AMBER_AT_PERCENT) return 'amber';
  return 'ok';
}

/** What the adapter measures. */
export interface CapacitySnapshot {
  readonly dbBytes: number;
  /** The table with the most estimated rows; null when there are none. */
  readonly largestTable: { readonly name: string; readonly approxRows: number } | null;
  /** Tenants with a non-revoked device that pushed in the last 30 days. */
  readonly activeTenants: number;
  /**
   * Sync p95 in ms over the last 24 h; null until B-18's per-call `ms`
   * (logged to stdout only) is persisted where the console can query it.
   */
  readonly syncP95Ms: number | null;
}

export type CapacityMetricKey =
  | 'dbSizeS2'
  | 'largestTableRows'
  | 'syncP95'
  | 'dbSizeS3'
  | 'activeTenants';

export interface CapacityMetric {
  readonly key: CapacityMetricKey;
  readonly stage: 'S2' | 'S3';
  readonly value: number | null;
  readonly trigger: number;
  readonly status: CapacityStatus;
}

function metric(
  key: CapacityMetricKey,
  stage: 'S2' | 'S3',
  value: number | null,
  trigger: number,
): CapacityMetric {
  return { key, stage, value, trigger, status: capacityStatus(value, trigger) };
}

/** Every ADR-068 trigger, S2 first, each scored once. */
export function capacityMetrics(s: CapacitySnapshot): CapacityMetric[] {
  const t = CAPACITY_TRIGGERS;
  return [
    metric('dbSizeS2', 'S2', s.dbBytes, t.dbBytesS2),
    metric('largestTableRows', 'S2', s.largestTable?.approxRows ?? 0, t.tableRows),
    metric('syncP95', 'S2', s.syncP95Ms, t.syncP95Ms),
    metric('dbSizeS3', 'S3', s.dbBytes, t.dbBytesS3),
    metric('activeTenants', 'S3', s.activeTenants, t.activeTenants),
  ];
}

const RANK: Record<CapacityStatus, number> = { 'sin-datos': 0, ok: 1, amber: 2, red: 3 };

/** The card's headline: the worst measured status, or sin-datos when nothing was measured. */
export function worstStatus(metrics: readonly CapacityMetric[]): CapacityStatus {
  let worst: CapacityStatus = 'sin-datos';
  for (const m of metrics) if (RANK[m.status] > RANK[worst]) worst = m.status;
  return worst;
}
