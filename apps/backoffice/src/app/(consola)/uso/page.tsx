import Link from 'next/link';
import type { Route } from 'next';

import { db } from '@/server/db/client';
import { TenantError } from '@/server/tenants/errors';
import {
  listUsage,
  USAGE_FILTERS,
  type UsageFilter,
  type UsageListResult,
} from '@/server/usage/list';
import { usageCounters, type UsageCounters as Counters } from '@/server/usage/counters';
import { usageDeps } from '@/server/usage/wiring';
import { requireStaffPage } from '@/server/staff';
import { body, buttonQuiet, errorText, heading, muted } from '@/styles/ui.css';

import { chip, chipRow } from '../inbox/inbox.css';
import type { SearchParams } from '../search-params';
import { notice, wide } from '../tenants/tenants.css';
import { UsageCounters } from './counters';
import { parseUsageFilter, toUsageListInput, usageHref } from './params';
import { UsageTable } from './usage-table';

/** N-07 · Uso: each tenant's usage this month against its plan's limits (ADR-065). */
export const dynamic = 'force-dynamic';

const FILTER_LABELS: Record<UsageFilter, string> = {
  todos: 'Todos',
  sobre: 'Sobre el límite',
  dos_meses: '2 meses seguidos',
};

async function load(input: unknown): Promise<UsageListResult | TenantError> {
  try {
    return await listUsage(usageDeps(db()), input, new Date());
  } catch (error) {
    if (error instanceof TenantError && error.code !== 'STORE_FAILED') return error;
    throw error;
  }
}

/** The counters read the first unfiltered page; a failure hides them, not the page. */
async function counters(now: Date): Promise<Counters | null> {
  try {
    return usageCounters(await listUsage(usageDeps(db()), { limit: 100 }, now));
  } catch (error) {
    console.error('uso: counters failed', error);
    return null;
  }
}

function Filters({ current }: { readonly current: UsageFilter }) {
  return (
    <nav aria-label="Filtros de uso" className={chipRow}>
      {USAGE_FILTERS.map((f) => (
        <Link
          key={f}
          href={usageHref(f) as Route}
          className={chip}
          aria-current={f === current ? 'true' : undefined}
        >
          {FILTER_LABELS[f]}
        </Link>
      ))}
    </nav>
  );
}

function Results({
  result,
  filtro,
}: {
  readonly result: UsageListResult;
  readonly filtro: UsageFilter;
}) {
  return (
    <>
      {result.billingKnown ? null : (
        <p className={notice} role="note">
          Sin datos de Stripe (B-10), cada negocio se mide contra el plan gratuito salvo que tenga
          un plan regalado. Los límites son los de hoy; C-12 trae los de ADR-065.
        </p>
      )}
      <p className={muted}>
        Mes {result.period}, hora de la Ciudad de México. Una transacción es un ticket de venta, un
        gasto o un movimiento de inventario manual; cancelar no la descuenta.
      </p>
      <UsageTable rows={result.rows} />
      {result.partial ? (
        <p className={muted}>Se revisó un bloque de negocios; puede haber más en los siguientes.</p>
      ) : null}
      {result.nextCursor ? (
        <Link className={buttonQuiet} href={usageHref(filtro, result.nextCursor) as Route}>
          {result.partial ? 'Seguir buscando' : 'Siguientes'}
        </Link>
      ) : null}
    </>
  );
}

export default async function UsoPage(props: { searchParams: Promise<SearchParams> }) {
  await requireStaffPage();
  const sp = await props.searchParams;
  const filtro = parseUsageFilter(sp);
  const cursor = typeof sp.cursor === 'string' ? sp.cursor : null;
  const [result, c] = await Promise.all([
    load(toUsageListInput(filtro, cursor)),
    counters(new Date()),
  ]);

  return (
    <section className={wide} aria-labelledby="uso-title">
      <h1 id="uso-title" className={heading}>
        Uso
      </h1>
      <p className={body}>Uso del mes contra los límites del plan. Nunca se bloquea una venta.</p>
      <UsageCounters c={c} />
      <Filters current={filtro} />
      {result instanceof TenantError ? (
        <p role="alert" className={errorText}>
          Esa página ya no es válida. <Link href="/uso">Ver todos</Link>
        </p>
      ) : (
        <Results result={result} filtro={filtro} />
      )}
    </section>
  );
}
