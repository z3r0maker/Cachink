/**
 * Health thresholds for financial KPIs.
 *
 * Hardcoded sensible defaults for Mexican small businesses. The UI shows
 * the ranges being used and offers a "Configurar en Ajustes" link for
 * future customisation.
 *
 * Metrics evaluated as "inverted" (lower = healthier) use the
 * `invertedScale` flag: `diasPromedioCobranza` where 30 days is better
 * than 60 days.
 */

import { z } from 'zod';

export interface MetricThreshold {
  /** At or above this value → healthy. */
  readonly healthy: number;
  /** At or above this value (but below healthy) → warning. Below → critical. */
  readonly warning: number;
}

export interface HealthThresholds {
  readonly margenBruto: MetricThreshold;
  readonly margenOperativo: MetricThreshold;
  readonly margenNeto: MetricThreshold;
  readonly razonDeLiquidez: MetricThreshold;
  readonly rotacionInventario: MetricThreshold;
  /** Inverted scale: healthy ≤ 30, warning ≤ 60, critical > 60. */
  readonly diasPromedioCobranza: MetricThreshold;
}

/** Zod schema for persisting health thresholds to AppConfig. */
const MetricThresholdSchema = z.object({
  healthy: z.number(),
  warning: z.number(),
});

export const HealthThresholdsSchema = z.object({
  margenBruto: MetricThresholdSchema,
  margenOperativo: MetricThresholdSchema,
  margenNeto: MetricThresholdSchema,
  razonDeLiquidez: MetricThresholdSchema,
  rotacionInventario: MetricThresholdSchema,
  diasPromedioCobranza: MetricThresholdSchema,
});

export const DEFAULT_HEALTH_THRESHOLDS: HealthThresholds = {
  margenBruto: { healthy: 0.20, warning: 0.10 },
  margenOperativo: { healthy: 0.10, warning: 0.05 },
  margenNeto: { healthy: 0.08, warning: 0.03 },
  razonDeLiquidez: { healthy: 1.5, warning: 1.0 },
  rotacionInventario: { healthy: 4.0, warning: 2.0 },
  diasPromedioCobranza: { healthy: 30, warning: 60 },
} as const;

export type HealthTone = 'healthy' | 'warning' | 'critical';

/**
 * Evaluate a metric value against its threshold.
 *
 * @param value       The computed metric value. `null` → returns `null`.
 * @param threshold   The threshold pair (healthy / warning).
 * @param invertedScale If `true`, lower values are healthier (e.g. days).
 */
export function evaluateHealth(
  value: number | null,
  threshold: MetricThreshold,
  invertedScale?: boolean,
): HealthTone | null {
  if (value === null) return null;

  if (invertedScale) {
    // Lower is better: healthy ≤ threshold.healthy, warning ≤ threshold.warning
    if (value <= threshold.healthy) return 'healthy';
    if (value <= threshold.warning) return 'warning';
    return 'critical';
  }

  // Normal scale: higher is better
  if (value >= threshold.healthy) return 'healthy';
  if (value >= threshold.warning) return 'warning';
  return 'critical';
}
