import Link from 'next/link';
import type { Route } from 'next';

import { db } from '@/server/db/client';
import { TenantError } from '@/server/tenants/errors';
import { loadTenant, type TenantDetail } from '@/server/tenants/detail';
import { listTenants, type TenantListResult } from '@/server/tenants/list';
import { tenantDeps } from '@/server/tenants/wiring';
import { requireStaffPage } from '@/server/staff';
import { body, buttonQuiet, errorText, heading } from '@/styles/ui.css';

import type { SearchParams } from '../search-params';
import { Ficha } from './ficha';
import { TenantFilters } from './filters';
import { parseTenantView, tenantsHref, toTenantListInput, type TenantView } from './params';
import { TenantTable } from './tenant-table';
import { notice, wide } from './tenants.css';

/** N-06 · Tenants: every business, its plan, Stripe state, devices and last sync. */
export const dynamic = 'force-dynamic';

async function load(input: unknown): Promise<TenantListResult | TenantError> {
  try {
    return await listTenants(tenantDeps(db()), input, new Date());
  } catch (error) {
    if (error instanceof TenantError && error.code !== 'STORE_FAILED') return error;
    throw error;
  }
}

/** The open side panel's tenant; an unknown or malformed id just closes it. */
async function ficha(id: string | null): Promise<TenantDetail | null> {
  if (id === null) return null;
  try {
    return await loadTenant(tenantDeps(db()), id, new Date());
  } catch (error) {
    if (error instanceof TenantError && error.code !== 'STORE_FAILED') return null;
    throw error;
  }
}

function BillingNotice({ known }: { readonly known: boolean }) {
  if (known) return null;
  return (
    <p className={notice} role="note">
      El estado de Stripe llega con B-10. Mientras tanto la suscripción se muestra como «Sin datos»,
      el plan solo aparece si hay un regalo activo, y los filtros de plan y suscripción no
      encuentran negocios.
    </p>
  );
}

function Results({
  result,
  view,
}: {
  readonly result: Awaited<ReturnType<typeof load>>;
  readonly view: TenantView;
}) {
  if (result instanceof TenantError) {
    return (
      <p role="alert" className={errorText}>
        {result.code === 'INVALID_CURSOR'
          ? 'Esa página ya no es válida.'
          : 'Ese filtro no es válido.'}{' '}
        <Link href="/tenants">Ver todos</Link>
      </p>
    );
  }
  return (
    <>
      <BillingNotice known={result.billingKnown} />
      <TenantTable rows={result.tenants} view={view} />
      {result.nextCursor ? (
        <Link className={buttonQuiet} href={tenantsHref(view, {}, result.nextCursor) as Route}>
          Siguientes
        </Link>
      ) : null}
    </>
  );
}

export default async function TenantsPage(props: { searchParams: Promise<SearchParams> }) {
  await requireStaffPage();
  const sp = await props.searchParams;
  const view = parseTenantView(sp);
  const cursor = typeof sp.cursor === 'string' ? sp.cursor : null;
  const [result, detail] = await Promise.all([
    load(toTenantListInput(view, cursor)),
    ficha(view.ficha),
  ]);

  return (
    <section className={wide} aria-labelledby="tenants-title">
      <h1 id="tenants-title" className={heading}>
        Tenants
      </h1>
      <p className={body}>
        Negocios, licencias y ajustes. Stripe es la fuente de verdad del cobro.
      </p>
      <TenantFilters view={view} />
      <Results result={result} view={view} />
      {detail === null ? null : (
        <Ficha
          detail={detail}
          closeHref={tenantsHref({ ...view, ficha: null }, {}, cursor ?? undefined)}
        />
      )}
    </section>
  );
}
