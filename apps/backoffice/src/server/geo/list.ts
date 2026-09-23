import { z } from 'zod';

import { invalidTenantInput, tenantStore } from '../tenants/errors';
import { bucketOf, METRIC_IDS, METRICS, valueOf, type Bucket, type Metric } from './metrics';
import { stateName } from './mx-states';
import type { GeoRollupSource, GeoTally } from './port';

export const GEO_RANGES = ['30d', '90d', '12m'] as const;
export type GeoRange = (typeof GEO_RANGES)[number];

const DAYS: Readonly<Record<GeoRange, number>> = { '30d': 30, '90d': 90, '12m': 365 };

export const GeoViewInputSchema = z.object({
  rango: z.enum(GEO_RANGES).default('30d'),
  metrica: z.enum(METRIC_IDS as [string, ...string[]]).default('accesos'),
});
export type GeoViewInput = z.input<typeof GeoViewInputSchema>;

export interface GeoStateRow {
  readonly code: string;
  readonly nombre: string;
  /** `null` for a rate whose denominator is below the floor. */
  readonly value: number | null;
  readonly bucket: Bucket;
}

export interface GeoView {
  readonly metric: Metric;
  readonly rango: GeoRange;
  readonly rows: readonly GeoStateRow[];
  /** The national figure: a total for a count, a rate for a rate. */
  readonly national: number | null;
  /** Hits whose region Vercel could not resolve — shown, never guessed. */
  readonly sinEstado: number;
  /** Hits from outside Mexico, kept off the map and out of the national rate. */
  readonly fueraDeMexico: number;
}

export interface GeoDeps {
  readonly geo: GeoRollupSource;
}

const DAY_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * CDMX-time day string, the same calendar `geo_record` stamps rows with.
 * Parts are looked up by type, never by position: the order of an
 * `Intl.DateTimeFormat` part list is a locale's business, not ours.
 */
function mexicoDay(at: Date, minusDays = 0): string {
  const parts = DAY_FORMAT.formatToParts(new Date(at.getTime() - minusDays * 86_400_000));
  const of = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${of('year')}-${of('month')}-${of('day')}`;
}

function groupByRegion(tallies: readonly GeoTally[]): Map<string, GeoTally[]> {
  const byRegion = new Map<string, GeoTally[]>();
  for (const t of tallies) {
    if (t.country !== 'MX' || t.region === '') continue;
    const list = byRegion.get(t.region) ?? [];
    list.push(t);
    byRegion.set(t.region, list);
  }
  return byRegion;
}

const hitsWhere = (rows: readonly GeoTally[], keep: (t: GeoTally) => boolean): number =>
  rows.reduce((total, t) => (keep(t) ? total + t.hits : total), 0);

export async function geoView(
  deps: GeoDeps,
  raw: GeoViewInput,
  now: Date,
): Promise<GeoView> {
  const parsed = GeoViewInputSchema.safeParse(raw);
  if (!parsed.success) throw invalidTenantInput('Filtro no válido.');
  const { rango, metrica } = parsed.data;
  const metric = METRICS[metrica as keyof typeof METRICS];

  const range = { from: mexicoDay(now, DAYS[rango]), to: mexicoDay(now, -1) };
  const tallies = await tenantStore(() => deps.geo.rollup(range));

  const national = valueOf(metric, tallies.filter((t) => t.country === 'MX'));
  const byRegion = groupByRegion(tallies);
  const values = [...byRegion].map(([code, rows]) => ({ code, value: valueOf(metric, rows) }));
  const max = values.reduce((m, v) => Math.max(m, v.value ?? 0), 0);
  const scale = { max, average: national ?? 0 };

  const rows = values
    .map(({ code, value }) => ({
      code,
      nombre: stateName(code),
      value,
      bucket: bucketOf(metric, value, scale),
    }))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1) || a.nombre.localeCompare(b.nombre, 'es'));

  return {
    metric,
    rango,
    rows,
    national,
    sinEstado: hitsWhere(tallies, (t) => t.country === 'MX' && t.region === ''),
    fueraDeMexico: hitsWhere(tallies, (t) => t.country !== 'MX'),
  };
}
