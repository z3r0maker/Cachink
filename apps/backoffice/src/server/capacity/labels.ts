import type { CapacityMetricKey, CapacityStatus } from './status';

/** Spanish copy for the capacity card (N-07). */
export const METRIC_LABELS: Record<CapacityMetricKey, string> = {
  dbSizeS2: 'Tamaño de la base',
  largestTableRows: 'Tabla más grande (filas)',
  syncP95: 'Sincronización p95',
  dbSizeS3: 'Tamaño de la base',
  activeTenants: 'Negocios activos (30 días)',
};

export const STATUS_LABELS: Record<CapacityStatus, string> = {
  ok: 'Bien',
  amber: 'Cerca del umbral',
  red: 'Umbral alcanzado',
  'sin-datos': 'Sin datos',
};

const GB = 1024 ** 3;
const MB = 1024 ** 2;
const number = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });

export function formatBytes(bytes: number): string {
  if (bytes >= GB) return `${number.format(bytes / GB)} GB`;
  return `${number.format(bytes / MB)} MB`;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${number.format(n / 1_000_000)} M`;
  return number.format(n);
}

/** A metric's value or trigger in its own unit. */
export function formatMetric(key: CapacityMetricKey, value: number | null): string {
  if (value === null) return 'sin datos';
  if (key === 'dbSizeS2' || key === 'dbSizeS3') return formatBytes(value);
  if (key === 'syncP95') return `${number.format(value)} ms`;
  return formatCount(value);
}
