/**
 * LogStats — aggregate statistics for the Telemetría dashboard header.
 */

export interface LogStats {
  readonly totalAuditEvents: number;
  readonly totalErrors: number;
  readonly errorsBySource: Record<string, number>;
  readonly operationCounts: Record<string, number>;
  readonly lastErrorAt: string | null;
}
