import { one, oneOf, type SearchParams } from '../search-params';
import { GEO_RANGES, type GeoRange } from '@/server/geo/list';
import { METRIC_IDS, type MetricId } from '@/server/geo/metrics';

/**
 * The map's state lives in the URL (N-56), like every other console list, so
 * a view is shareable and needs no script. An unknown value falls back to the
 * default rather than erroring — a hand-edited URL shows the default view.
 */
export function parseMetric(sp: SearchParams): MetricId {
  return oneOf(one(sp, 'metrica'), METRIC_IDS) ?? 'accesos';
}

export function parseRange(sp: SearchParams): GeoRange {
  return oneOf(one(sp, 'rango'), GEO_RANGES) ?? '30d';
}

export function mapaHref(metrica: MetricId, rango: GeoRange): string {
  return `/mapa?metrica=${metrica}&rango=${rango}`;
}
