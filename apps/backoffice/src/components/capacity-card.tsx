import {
  formatBytes,
  formatCount,
  formatMetric,
  METRIC_LABELS,
  STATUS_LABELS,
} from '@/server/capacity/labels';
import { snapshotOf, type CapacityReading } from '@/server/capacity/port';
import { capacityMetrics, worstStatus, type CapacityMetric } from '@/server/capacity/status';
import { heading, muted } from '@/styles/ui.css';

import { name, sub, table, tableWrap, td, th } from '@/app/(consola)/tenants/tenants.css';
import { capacityCard, grid, tile, tileLabel, tileMeta, tileValue } from './capacity.css';

function Tile({
  m,
  table: tableName,
}: {
  readonly m: CapacityMetric;
  readonly table: string | null;
}) {
  return (
    <div className={tile[m.status]}>
      <span className={tileLabel}>
        {METRIC_LABELS[m.key]} · {m.stage}
      </span>
      <span className={tileValue}>{formatMetric(m.key, m.value)}</span>
      <span className={tileMeta}>
        {STATUS_LABELS[m.status]} · umbral {formatMetric(m.key, m.trigger)}
        {m.key === 'largestTableRows' && tableName ? ` · ${tableName}` : ''}
        {m.key === 'syncP95' ? ' · llega con B-18' : ''}
      </span>
    </div>
  );
}

function TopTables({ reading }: { readonly reading: CapacityReading }) {
  if (reading.topTables.length === 0) return null;
  return (
    <div className={tableWrap}>
      <table className={table}>
        <thead>
          <tr>
            <th className={th} scope="col">
              Tabla
            </th>
            <th className={th} scope="col">
              Filas (estimadas)
            </th>
            <th className={th} scope="col">
              Tamaño
            </th>
          </tr>
        </thead>
        <tbody>
          {reading.topTables.map((t) => (
            <tr key={t.name}>
              <td className={td}>
                <span className={name}>{t.name}</span>
              </td>
              <td className={td}>{formatCount(t.approxRows)}</td>
              <td className={td}>{formatBytes(t.bytes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The capacity card (N-07, ADR-068): each scaling trigger against today's
 * measurement, amber from 80 % and red at the trigger. Reviewed monthly.
 */
export function CapacityCard({ reading }: { readonly reading: CapacityReading | null }) {
  if (reading === null) {
    return (
      <section className={capacityCard} aria-labelledby="capacidad-title">
        <h2 id="capacidad-title" className={heading}>
          Capacidad
        </h2>
        <p className={muted}>No se pudo medir la base de datos ahora.</p>
      </section>
    );
  }
  const snapshot = snapshotOf(reading);
  const metrics = capacityMetrics(snapshot);
  return (
    <section className={capacityCard} aria-labelledby="capacidad-title">
      <h2 id="capacidad-title" className={heading}>
        Capacidad · {STATUS_LABELS[worstStatus(metrics)]}
      </h2>
      <p className={muted}>
        Umbrales de ADR-068: S2 (particionar, réplica de lectura) y S3 (modelo analítico). Se
        revisan cada mes. Filas estimadas por el planificador de Postgres.
      </p>
      <div className={grid}>
        {metrics.map((m) => (
          <Tile key={m.key} m={m} table={snapshot.largestTable?.name ?? null} />
        ))}
      </div>
      <TopTables reading={reading} />
      <span className={sub}>
        Medido{' '}
        {new Date(reading.measuredAt).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
      </span>
    </section>
  );
}
