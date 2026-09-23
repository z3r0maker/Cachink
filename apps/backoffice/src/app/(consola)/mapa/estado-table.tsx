import type { GeoStateRow } from '@/server/geo/list';
import { METRICS, METRIC_IDS, type Metric, type MetricId } from '@/server/geo/metrics';
import { muted } from '@/styles/ui.css';

import { table, tableWrap, td, th } from '../tenants/tenants.css';
import { faint, selectedCol, swatch, value as valueClass } from './mapa.css';

/**
 * The detail grid (N-56, widened after the first real data landed).
 *
 * It ships before the choropleth and stays after it, because at low volumes a
 * shade is nearly invisible — two visits and four visits look identical on a
 * map. Every metric gets a column rather than only the selected one, so
 * reading four numbers does not mean changing the filter four times; the
 * selected one is marked, and the map above is the glance.
 */
export function formatValue(metric: Metric, value: number | null): string {
  if (value === null) return metric.kind === 'tasa' ? '—' : '0';
  return metric.kind === 'tasa' ? `${(value * 100).toFixed(1)} %` : value.toLocaleString('es-MX');
}

function Row({ row, selected }: { readonly row: GeoStateRow; readonly selected: MetricId }) {
  return (
    <tr>
      <th className={td} scope="row">
        <span className={swatch[row.bucket]} aria-hidden="true" />
        {row.nombre} <span className={faint}>{row.code}</span>
      </th>
      {METRIC_IDS.map((id) => (
        <td key={id} className={id === selected ? `${td} ${selectedCol}` : td}>
          <span className={id === selected ? valueClass : undefined}>
            {formatValue(METRICS[id], row.detail[id])}
          </span>
        </td>
      ))}
    </tr>
  );
}

function Header({ selected }: { readonly selected: MetricId }) {
  return (
    <thead>
      <tr>
        <th className={th} scope="col">
          Estado
        </th>
        {METRIC_IDS.map((id) => (
          <th
            key={id}
            className={id === selected ? `${th} ${selectedCol}` : th}
            scope="col"
            aria-sort={id === selected ? 'descending' : undefined}
          >
            {METRICS[id].label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function EstadoTable({
  metric,
  rows,
}: {
  readonly metric: Metric;
  readonly rows: readonly GeoStateRow[];
}) {
  if (rows.length === 0) {
    return <p className={muted}>Todavía no hay datos de ningún estado en este periodo.</p>;
  }
  return (
    <div className={tableWrap}>
      <table className={table}>
        <caption className={muted}>
          Todas las métricas por estado; la columna marcada es la que pinta el mapa.
        </caption>
        <Header selected={metric.id as MetricId} />
        <tbody>
          {rows.map((row) => (
            <Row key={row.code} row={row} selected={metric.id as MetricId} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
