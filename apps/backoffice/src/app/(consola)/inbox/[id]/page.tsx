import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import type { StaffMemberId, SupportItem } from '@xangarro/domain';

import { db } from '@/server/db/client';
import { drizzleSupportItems } from '@/server/db/support-items';
import { SupportItemError } from '@/server/inbox/errors';
import { formatDueDay, formatInstant, KIND_LABELS, STATUS_LABELS } from '@/server/inbox/labels';
import { loadItem } from '@/server/inbox/load';
import { requireStaffPage } from '@/server/staff';
import { heading, label, muted } from '@/styles/ui.css';

import { actions, bodyText, facts, meta, pill, urgentBadge, wide } from '../inbox.css';
import { AssignForm } from './assign-form';
import { StatusForm } from './status-form';

/** N-08 · one inbox item: what was reported, by whom, and the two things staff do with it. */
export const dynamic = 'force-dynamic';

async function find(id: string): Promise<SupportItem> {
  try {
    return await loadItem(drizzleSupportItems(db()), id);
  } catch (error) {
    if (error instanceof SupportItemError && error.code !== 'STORE_FAILED') notFound();
    throw error;
  }
}

function Facts({ item, me }: { readonly item: SupportItem; readonly me: StaffMemberId }) {
  const owner =
    item.ownerStaffId === null
      ? 'Sin asignar'
      : item.ownerStaffId === me
        ? 'Tú'
        : item.ownerStaffId;
  return (
    <dl className={facts}>
      <dt className={label}>Negocio</dt>
      <dd>
        {item.businessId ? (
          <Link href={`/tenants/${item.businessId}` as Route}>{item.businessId}</Link>
        ) : (
          '—'
        )}
      </dd>
      <dt className={label}>Responsable</dt>
      <dd>{owner}</dd>
      <dt className={label}>Origen</dt>
      <dd>
        {item.source} · {item.sourceRef}
      </dd>
      <KindFacts item={item} />
      <dt className={label}>Recibido</dt>
      <dd>{formatInstant(item.createdAt)}</dd>
    </dl>
  );
}

/** The rows only some kinds carry: a factura's payment and CFDI, an ARCO deadline. */
function KindFacts({ item }: { readonly item: SupportItem }) {
  const row = (term: string, value: string) => (
    <>
      <dt className={label}>{term}</dt>
      <dd>{value}</dd>
    </>
  );
  return (
    <>
      {item.paymentRef ? row('Pago', item.paymentRef) : null}
      {item.dueAt
        ? row(
            'Responder antes del',
            `${formatDueDay(item.dueAt)} · 20 días hábiles; ejecutar en 15 más`,
          )
        : null}
      {item.cfdiUuid ? row('CFDI', item.cfdiUuid) : null}
    </>
  );
}

function Attachments({ paths }: { readonly paths: readonly string[] }) {
  if (paths.length === 0) return null;
  return (
    <div>
      <span className={label}>Adjuntos</span>
      <ul className={muted}>
        {paths.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

export default async function InboxItemPage(props: { params: Promise<{ id: string }> }) {
  const { staff } = await requireStaffPage();
  const item = await find((await props.params).id);
  return (
    <section className={wide} aria-labelledby="item-title">
      <Link href="/inbox" className={muted}>
        ← Inbox
      </Link>
      <h1 id="item-title" className={heading}>
        {item.title}
      </h1>
      <div className={meta}>
        {item.urgent ? <span className={urgentBadge}>Urgente</span> : null}
        <span className={pill}>{KIND_LABELS[item.kind]}</span>
        <span className={pill}>{STATUS_LABELS[item.status]}</span>
      </div>
      <p className={bodyText}>{item.body === '' ? 'Sin descripción.' : item.body}</p>
      <Attachments paths={item.attachments} />
      <Facts item={item} me={staff.id} />
      <div className={actions}>
        {item.status === 'resuelto' ? null : (
          <AssignForm id={item.id} mine={item.ownerStaffId === staff.id} />
        )}
        <StatusForm
          id={item.id}
          status={item.status}
          factura={item.kind === 'factura'}
          cfdiUuid={item.cfdiUuid}
        />
      </div>
    </section>
  );
}
