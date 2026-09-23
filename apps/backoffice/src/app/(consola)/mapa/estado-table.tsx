import type { GeoStateRow } from '@/server/geo/list';
import type { Metric } from '@/server/geo/metrics';
import { muted } from '@/styles/ui.css';

import { table, tableWrap, td, th } from '../tenants/tenants.css';
import { faint, swatch, value as valueClass } from './mapa.css';

/**
 * The ranked table (N-56). It ships before the choropleth and stays after it:
 * the map is the glance, this is the data — sortable by eye, copy-pasteable,
 * printable, and the reason colour is never the only signal (uso.css.ts:15).
 */
const HEADERS = ['Estado', 'Valor', 'Participación'] as const;

export function formatValue(metric: Metric, value: number | null): string {
  if (value === null) return 'Datos insuficientes';
  return metric.kind === 'tasa'
    ? `${(value * 100).toFixed(1)} %`
    : value.toLocaleString('es-MX');
}

function share(metric: Metric, row: GeoStateRow, total: number | null): string {
  // A share of a rate is meaningless — percentages do not add up to a country.
  if (metric.kind === 'tasa' || total === null || total <= 0 || row.value === null) return '—';
  return `${((row.value / total) * 100).toFixed(1)} %`;
}

function Row({
  metric,
  row,
  national,
}: {
  readonly metric: Metric;
  readonly row: GeoStateRow;
  readonly national: number | null;
}) {
  return (
    <tr>
      <th className={td} scope="row">
        <span className={swatch[row.bucket]} aria-hidden="true" />
        {row.nombre} <span className={faint}>{row.code}</span>
      </th>
      <td className={td}>
        <span className={valueClass}>{formatValue(metric, row.value)}</span>
      </td>
      <td className={td}>{share(metric, row, national)}</td>
    </tr>
  );
}

export function EstadoTable({
  metric,
  rows,
  national,
}: {
  readonly metric: Metric;
  readonly rows: readonly GeoStateRow[];
  readonly national: number | null;
}) {
  if (rows.length === 0) {
    return <p className={muted}>Todavía no hay datos de ningún estado en este periodo.</p>;
  }
  return (
    <div className={tableWrap}>
      <table className={table}>
        <thead>
          <tr>
            {HEADERS.map((h) => (
              <th key={h} className={th} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Row key={row.code} metric={metric} row={row} national={national} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
