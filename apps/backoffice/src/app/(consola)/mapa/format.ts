import type { Metric } from '@/server/geo/metrics';

/** A count as a whole number, a rate as a percent with one decimal; «—» when a rate is hidden. */
export function formatValue(metric: Metric, value: number | null): string {
  if (value === null) return metric.kind === 'tasa' ? '—' : '0';
  return metric.kind === 'tasa' ? `${(value * 100).toFixed(1)} %` : value.toLocaleString('es-MX');
}
