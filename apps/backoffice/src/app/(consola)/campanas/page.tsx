import Link from 'next/link';
import type { Route } from 'next';

import {
  attributionView,
  ATTRIBUTION_RANGES,
  type AttributionRangeId,
  type AttributionView,
} from '@/server/attribution/list';
import { attributionDeps } from '@/server/attribution/wiring';
import { classifyInfraFailure, infraFailureMessage } from '@/server/auth/infra-failure';
import { db } from '@/server/db/client';
import { dbFingerprint } from '@/server/db/fingerprint';
import { requireStaffPage } from '@/server/staff';
import { TenantError } from '@/server/tenants/errors';
import { body, errorText, heading, muted } from '@/styles/ui.css';

import { chip, chipRow } from '../inbox/inbox.css';
import { one, oneOf, type SearchParams } from '../search-params';
import { table, tableWrap, td, th, wide } from '../tenants/tenants.css';

/**
 * N-57 · Campañas: which campaign brought each business in, and from where.
 *
 * The companion to /mapa. The map answers "where are people"; this answers
 * "what did we pay for", which is the question a budget actually turns on.
 * First touch, so a campaign is credited with the businesses it brought, not
 * with whoever clicked a link on the way back in.
 */
export const dynamic = 'force-dynamic';

const RANGE_LABELS: Record<AttributionRangeId, string> = {
  '30d': '30 días',
  '90d': '90 días',
  '12m': '12 meses',
};

const HEADERS = ['Campaña', 'Origen', 'Altas', 'Estado principal'] as const;

async function load(rango: AttributionRangeId): Promise<AttributionView | string> {
  try {
    return await attributionView(attributionDeps(db()), rango, new Date());
  } catch (error) {
    if (error instanceof TenantError && error.code !== 'STORE_FAILED') {
      return 'Esa vista no es válida.';
    }
    const failure = classifyInfraFailure(error);
    console.error(`[campanas] ${failure.cause}/${failure.detail} db=${dbFingerprint()}`, error);
    return infraFailureMessage(failure, {
      on: process.env.ADMIN_DIAGNOSTICS === '1',
      db: dbFingerprint(),
    });
  }
}

function Ranges({ current }: { readonly current: AttributionRangeId }) {
  return (
    <nav aria-label="Periodo" className={chipRow}>
      {ATTRIBUTION_RANGES.map((r) => (
        <Link
          key={r}
          href={`/campanas?rango=${r}` as Route}
          className={chip}
          aria-current={r === current ? 'true' : undefined}
        >
          {RANGE_LABELS[r]}
        </Link>
      ))}
    </nav>
  );
}

function Rows({ view }: { readonly view: AttributionView }) {
  if (view.rows.length === 0) {
    return <p className={muted}>Todavía no hay altas en este periodo.</p>;
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
          {view.rows.map((r) => (
            <tr key={`${r.campaign}|${r.source}|${r.medium}`}>
              <th className={td} scope="row">
                {r.campaign}
              </th>
              <td className={td}>
                {r.direct ? '—' : [r.source, r.medium].filter(Boolean).join(' / ') || '—'}
              </td>
              <td className={td}>{r.signups.toLocaleString('es-MX')}</td>
              <td className={td}>{r.topRegion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function CampanasPage(props: { searchParams: Promise<SearchParams> }) {
  await requireStaffPage();
  const sp = await props.searchParams;
  const rango = oneOf(one(sp, 'rango'), ATTRIBUTION_RANGES) ?? '30d';
  const result = await load(rango);

  return (
    <section className={wide} aria-labelledby="campanas-title">
      <h1 id="campanas-title" className={heading}>
        Campañas
      </h1>
      <p className={body}>
        De dónde llegaron los negocios que se registraron. Primer contacto: se acredita la campaña
        que los trajo, no el último enlace que abrieron.
      </p>
      <Ranges current={rango} />
      {typeof result === 'string' ? (
        <p role="alert" className={errorText}>
          {result} <Link href="/campanas">Ver 30 días</Link>
        </p>
      ) : (
        <>
          <p className={muted}>
            {result.total.toLocaleString('es-MX')} altas en el periodo;{' '}
            {result.directTotal.toLocaleString('es-MX')} sin campaña.
          </p>
          <Rows view={result} />
        </>
      )}
    </section>
  );
}
