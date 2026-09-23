import type { GeoSource, GeoTally } from './port';

/**
 * What the map can be shaded by (N-56, ADR-092).
 *
 * Metric-first rather than source-first, because the page exists to steer
 * marketing spend and raw counts per state always favour big cities — a
 * population artefact, not an insight. "Where does a visit become a customer"
 * is the question that moves a budget.
 *
 * Two rules live here rather than in the UI, so they are unit-testable and
 * cannot be forgotten by a later screen:
 *
 * 1. **A rate needs a denominator floor.** One visit and one checkout is not a
 *    100% conversion rate, it is noise, and on a choropleth it is a bright
 *    lie. Below the floor the value is `null` — rendered as «datos
 *    insuficientes», visually distinct from a true zero.
 * 2. **A rate is shaded against the national average, not the maximum.**
 *    "Above or below average" is the actionable reading; sequential shading
 *    would just redraw the population map.
 */
export type MetricKind = 'conteo' | 'tasa';

/** The shading class for one region; `mapa.css.ts` keys its variants by these. */
export type Bucket =
  'cero' | 'b1' | 'b2' | 'b3' | 'b4' | 'insuficiente' | 'abajo' | 'igual' | 'arriba';

export interface Scale {
  /** Largest value across regions in the period. */
  readonly max: number;
  /** The national figure, used as the anchor for a rate. */
  readonly average: number;
}

export interface Metric {
  readonly id: string;
  readonly label: string;
  /** One line under the selector; says exactly what is being counted. */
  readonly help: string;
  readonly kind: MetricKind;
  /** Counts: the source to sum. Rates: numerator over denominator. */
  readonly numerator: GeoSource;
  readonly denominator?: GeoSource;
  /** Rates only: the smallest denominator worth dividing by. */
  readonly floor?: number;
}

/** Below 30 visits in the period, a conversion rate is noise rather than news. */
export const RATE_FLOOR = 30;

export const METRICS = {
  accesos: {
    id: 'accesos',
    label: 'Accesos',
    help: 'Entradas al portal, contadas por estado.',
    kind: 'conteo',
    numerator: 'login',
  },
  visitas: {
    id: 'visitas',
    label: 'Visitas al sitio',
    help: 'Visitas a la página pública.',
    kind: 'conteo',
    numerator: 'landing',
  },
  checkouts: {
    id: 'checkouts',
    label: 'Checkouts iniciados',
    help: 'Veces que alguien abrió el checkout. Aún no es un pago.',
    kind: 'conteo',
    numerator: 'compra',
  },
  conversion: {
    id: 'conversion',
    label: 'Conversión',
    help: `Visita → checkout iniciado (no pago). Se oculta con menos de ${RATE_FLOOR} visitas.`,
    kind: 'tasa',
    numerator: 'compra',
    denominator: 'landing',
    floor: RATE_FLOOR,
  },
} as const satisfies Record<string, Metric>;

export type MetricId = keyof typeof METRICS;
export const METRIC_IDS = Object.keys(METRICS) as readonly MetricId[];

const sum = (rows: readonly GeoTally[], source: GeoSource): number =>
  rows.reduce((total, r) => (r.source === source ? total + r.hits : total), 0);

/** `null` means "not enough to say", which is never the same as zero. */
export function valueOf(metric: Metric, rows: readonly GeoTally[]): number | null {
  const top = sum(rows, metric.numerator);
  if (metric.denominator === undefined) return top;
  const bottom = sum(rows, metric.denominator);
  if (bottom < (metric.floor ?? 1)) return null;
  return top / bottom;
}

function countBucket(value: number, max: number): Bucket {
  if (value <= 0 || max <= 0) return 'cero';
  const share = value / max;
  if (share >= 0.75) return 'b4';
  if (share >= 0.5) return 'b3';
  if (share >= 0.25) return 'b2';
  return 'b1';
}

export function bucketOf(metric: Metric, value: number | null, scale: Scale): Bucket {
  if (metric.kind === 'conteo') return countBucket(value ?? 0, scale.max);
  if (value === null) return 'insuficiente';
  if (value > scale.average) return 'arriba';
  if (value < scale.average) return 'abajo';
  return 'igual';
}
