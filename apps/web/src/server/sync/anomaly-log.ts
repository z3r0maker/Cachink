import type { PushAnomaly, PushAnomalyKind } from '@xangarro/application';

/**
 * One structured line for a push that carried something an honest device would
 * not (security audit 2026-11, F-05 c) — in the shape of the per-call line
 * `logApi` writes (`observability/report.ts`), so it is found the same way.
 *
 * The push is accepted exactly as before; this line is the only thing that
 * changes. It is what a later rejection or CHECK constraint will be staged on:
 * how often a row's device id is not the token's, and whether a negative ever
 * arrives where the code never writes one.
 *
 * Ids, table names and field names only — never a value (B-18's no-PII rule).
 */
export interface AnomalyScope {
  readonly businessId: string;
  readonly deviceId: string;
}

export type AnomalyLogger = (scope: AnomalyScope, anomalies: readonly PushAnomaly[]) => void;

/** Rows named in one line; a 500-row push must not write a 500-row line. */
export const MAX_LOGGED_ANOMALIES = 50;

const countBy = (anomalies: readonly PushAnomaly[]): Partial<Record<PushAnomalyKind, number>> =>
  anomalies.reduce<Partial<Record<PushAnomalyKind, number>>>(
    (acc, a) => ({ ...acc, [a.kind]: (acc[a.kind] ?? 0) + 1 }),
    {},
  );

/** The line, as data: pure, so it is tested without a console. */
export function pushAnomalyLine(
  scope: AnomalyScope,
  anomalies: readonly PushAnomaly[],
): Record<string, unknown> {
  return {
    evt: 'push_anomaly',
    endpoint: 'sync/push',
    business_id: scope.businessId,
    device_id: scope.deviceId,
    total: anomalies.length,
    kinds: countBy(anomalies),
    rows: anomalies
      .slice(0, MAX_LOGGED_ANOMALIES)
      .map((a) => ({ table: a.table, row_id: a.rowId, kind: a.kind, field: a.field })),
  };
}

/** Writes the line; nothing when the push carried no anomaly. */
export const logPushAnomalies: AnomalyLogger = (scope, anomalies) => {
  if (anomalies.length === 0) return;
  console.log(JSON.stringify(pushAnomalyLine(scope, anomalies)));
};
