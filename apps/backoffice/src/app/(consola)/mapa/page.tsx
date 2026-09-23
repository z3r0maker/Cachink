import Link from 'next/link';
import type { Route } from 'next';

import { db } from '@/server/db/client';
import { geoView, GEO_RANGES, type GeoRange, type GeoView } from '@/server/geo/list';
import { METRICS, METRIC_IDS, type MetricId } from '@/server/geo/metrics';
import { geoDeps } from '@/server/geo/wiring';
import { requireStaffPage } from '@/server/staff';
import { TenantError } from '@/server/tenants/errors';
import { body, errorText, heading, muted } from '@/styles/ui.css';

import { chip, chipRow } from '../inbox/inbox.css';
import type { SearchParams } from '../search-params';
import { wide } from '../tenants/tenants.css';
import { EstadoTable, formatValue } from './estado-table';
import { legend, swatch } from './mapa.css';
import { mapaHref, parseMetric, parseRange } from './params';

/**
 * N-56 · Mapa: where people log in, buy and arrive from, by state.
 *
 * Metric-first, because the page exists to steer marketing spend and raw
 * counts per state always favour big cities — a population artefact, not an
 * insight. The choropleth itself is N-59; this ships the data first, since a
 * map drawn over three days of data is an empty country.
 */
export const dynamic = 'force-dynamic';

const RANGE_LABELS: Record<GeoRange, string> = {
  '30d': '30 días',
  '90d': '90 días',
  '12m': '12 meses',
};

async function load(metrica: MetricId, rango: GeoRange): Promise<GeoView | TenantError> {
  try {
    return await geoView(geoDeps(db()), { metrica, rango }, new Date());
  } catch (error) {
    if (error instanceof TenantError && error.code !== 'STORE_FAILED') return error;
    throw error;
  }
}

function Picker({ metrica, rango }: { readonly metrica: MetricId; readonly rango: GeoRange }) {
  return (
    <>
      <nav aria-label="Métrica" className={chipRow}>
        {METRIC_IDS.map((id) => (
          <Link
            key={id}
            href={mapaHref(id, rango) as Route}
            className={chip}
            aria-current={id === metrica ? 'true' : undefined}
          >
            {METRICS[id].label}
          </Link>
        ))}
      </nav>
      <nav aria-label="Periodo" className={chipRow}>
        {GEO_RANGES.map((r) => (
          <Link
            key={r}
            href={mapaHref(metrica, r) as Route}
            className={chip}
            aria-current={r === rango ? 'true' : undefined}
          >
            {RANGE_LABELS[r]}
          </Link>
        ))}
      </nav>
    </>
  );
}

/** The legend states the anchor as a number, so a shade is never the only cue. */
function Legend({ view }: { readonly view: GeoView }) {
  const rate = view.metric.kind === 'tasa';
  const items = rate
    ? ([
        ['abajo', 'Bajo el promedio'],
        ['igual', 'En el promedio'],
        ['arriba', 'Sobre el promedio'],
        ['insuficiente', 'Datos insuficientes'],
      ] as const)
    : ([
        ['cero', 'Sin actividad'],
        ['b1', 'Hasta 25%'],
        ['b2', '25–50%'],
        ['b3', '50–75%'],
        ['b4', 'Más de 75% del máximo'],
      ] as const);
  return (
    <ul className={legend}>
      {items.map(([bucket, label]) => (
        <li key={bucket}>
          <span className={swatch[bucket]} aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}

function Totals({ view }: { readonly view: GeoView }) {
  const national = formatValue(view.metric, view.national);
  return (
    <p className={muted}>
      {view.metric.kind === 'tasa' ? 'Promedio nacional' : 'Total nacional'}: {national}.{' '}
      {view.sinEstado > 0
        ? `${view.sinEstado.toLocaleString('es-MX')} sin estado identificado. `
        : ''}
      {view.fueraDeMexico > 0
        ? `${view.fueraDeMexico.toLocaleString('es-MX')} desde fuera de México.`
        : ''}
    </p>
  );
}

export default async function MapaPage(props: { searchParams: Promise<SearchParams> }) {
  await requireStaffPage();
  const sp = await props.searchParams;
  const metrica = parseMetric(sp);
  const rango = parseRange(sp);
  const result = await load(metrica, rango);

  return (
    <section className={wide} aria-labelledby="mapa-title">
      <h1 id="mapa-title" className={heading}>
        Mapa
      </h1>
      <p className={body}>{METRICS[metrica].help}</p>
      <Picker metrica={metrica} rango={rango} />
      {result instanceof TenantError ? (
        <p role="alert" className={errorText}>
          Esa vista no es válida. <Link href="/mapa">Ver accesos</Link>
        </p>
      ) : (
        <>
          <Totals view={result} />
          <Legend view={result} />
          <EstadoTable metric={result.metric} rows={result.rows} national={result.national} />
          <p className={muted}>
            Ubicación aproximada, derivada de la conexión. Nunca se guarda la dirección IP ni la
            ciudad: sólo un conteo diario por estado.
          </p>
        </>
      )}
    </section>
  );
}
