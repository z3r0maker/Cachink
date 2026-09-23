import type { GeoStateRow } from '@/server/geo/list';
import type { Bucket, Metric } from '@/server/geo/metrics';
import { MX_STATE_CODES, MX_STATES, MX_VIEWBOX } from '@/server/geo/mx-states';

import { formatValue } from './estado-table';
import { mapFrame, region } from './mapa.css';

/**
 * Mexico shaded by the chosen metric (N-59).
 *
 * Server-rendered inline SVG with **no client JavaScript and no map library**:
 * the geometry is 32 pre-projected path strings (`mx-states.ts`, ~10 KB) and
 * the fill comes from a vanilla-extract class. That is not a preference, it is
 * what the console's CSP allows — `default-src 'self'` blocks tiles, fonts and
 * MapLibre's `blob:` worker, and `style-src` has no `'unsafe-inline'`, so a
 * `style="fill:…"` attribute would silently vanish and leave every state the
 * same colour.
 *
 * The map is the glance; `EstadoTable` beneath it is the data. Each path
 * carries a `<title>`, which browsers show on hover with no script at all.
 */
function summarise(metric: Metric, rows: readonly GeoStateRow[]): string {
  const top = rows.filter((r) => r.value !== null).slice(0, 3);
  if (top.length === 0) return `Mapa de México sin datos de ${metric.label.toLowerCase()}.`;
  const named = top.map((r) => `${r.nombre} ${formatValue(metric, r.value)}`).join(', ');
  return `Mapa de México por estado. ${metric.label}, los más altos: ${named}.`;
}

export function Choropleth({
  metric,
  rows,
}: {
  readonly metric: Metric;
  readonly rows: readonly GeoStateRow[];
}) {
  const byCode = new Map(rows.map((r) => [r.code, r]));
  return (
    <svg
      className={mapFrame}
      viewBox={MX_VIEWBOX}
      role="img"
      aria-labelledby="mapa-svg-title"
      aria-describedby="mapa-svg-desc"
    >
      <title id="mapa-svg-title">{metric.label} por estado</title>
      <desc id="mapa-svg-desc">{summarise(metric, rows)}</desc>
      {MX_STATE_CODES.map((code) => {
        const row = byCode.get(code);
        const rate = metric.kind === 'tasa';
        // A state with no rows counted zero of something; it did not fail to
        // produce a rate. The two must not read the same.
        const value = row?.value ?? (rate ? null : 0);
        const bucket: Bucket = row?.bucket ?? (rate ? 'insuficiente' : 'cero');
        return (
          <path key={code} d={MX_STATES[code].d} className={region[bucket]}>
            <title>
              {MX_STATES[code].nombre}: {formatValue(metric, value)}
            </title>
          </path>
        );
      })}
    </svg>
  );
}
