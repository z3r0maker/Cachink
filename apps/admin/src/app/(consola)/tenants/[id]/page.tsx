import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';

import { db } from '@/server/db/client';
import { loadTenant, type TenantDetail } from '@/server/tenants/detail';
import { TenantError } from '@/server/tenants/errors';
import { BILLING_STATUS_LABELS, formatDay, stripeCustomerUrl } from '@/server/tenants/labels';
import { tenantDeps } from '@/server/tenants/wiring';
import { requireStaffPage } from '@/server/staff';
import { heading, label, muted, stack } from '@/styles/ui.css';

import { facts, meta, pill } from '../../inbox/inbox.css';
import { sections, wide } from '../tenants.css';
import { OverrideForms } from './override-forms';
import { Devices, Entitlement, Members, OverrideHistory } from './sections';

/** N-06 · one tenant: who, which devices, what plan, and the audited overrides. */
export const dynamic = 'force-dynamic';

async function find(id: string): Promise<TenantDetail> {
  try {
    return await loadTenant(tenantDeps(db()), id, new Date());
  } catch (error) {
    if (error instanceof TenantError && error.code !== 'STORE_FAILED') notFound();
    throw error;
  }
}

function Billing({ detail }: { readonly detail: TenantDetail }) {
  const { billing, summary } = detail;
  const stripe = stripeCustomerUrl(billing.stripeCustomerId);
  return (
    <dl className={facts}>
      <dt className={label}>Suscripción</dt>
      <dd>{BILLING_STATUS_LABELS[billing.status]}</dd>
      <dt className={label}>Próximo cargo</dt>
      <dd>{formatDay(billing.currentPeriodEnd)}</dd>
      <dt className={label}>Cliente en Stripe</dt>
      <dd>
        {stripe ? (
          <a href={stripe} target="_blank" rel="noreferrer">
            Abrir en Stripe
          </a>
        ) : (
          <span className={muted}>Disponible con B-10</span>
        )}
      </dd>
      <dt className={label}>Inbox</dt>
      <dd>
        <Link href={`/inbox?negocio=${summary.id}` as Route}>Items de este negocio</Link>
      </dd>
      <dt className={label}>Alta</dt>
      <dd>{formatDay(summary.createdAt)}</dd>
    </dl>
  );
}

export default async function TenantPage(props: { params: Promise<{ id: string }> }) {
  await requireStaffPage();
  const detail = await find((await props.params).id);
  const { summary } = detail;
  return (
    <section className={wide} aria-labelledby="tenant-title">
      <Link href="/tenants" className={muted}>
        ← Tenants
      </Link>
      <h1 id="tenant-title" className={heading}>
        {summary.nombre}
      </h1>
      <div className={meta}>
        <span className={pill}>{summary.id}</span>
        <span>{summary.ownerEmail ?? 'Sin dueño en el portal'}</span>
      </div>
      <Billing detail={detail} />
      <div className={sections}>
        <Entitlement detail={detail} />
        <Members members={detail.members} />
        <Devices devices={detail.devices} />
      </div>
      <div className={sections}>
        <div className={stack}>
          <OverrideForms businessId={summary.id} nombre={summary.nombre} />
        </div>
        <OverrideHistory overrides={detail.overrides} />
      </div>
    </section>
  );
}
