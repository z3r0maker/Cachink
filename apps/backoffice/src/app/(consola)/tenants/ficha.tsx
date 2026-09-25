import Link from 'next/link';
import type { Route } from 'next';

import { DonNote } from '@/components/don-cuentas/don-cuentas';
import type { TenantDetail } from '@/server/tenants/detail';
import {
  BILLING_STATUS_LABELS,
  formatDay,
  PLAN_LABELS,
  stripeCustomerUrl,
} from '@/server/tenants/labels';
import { STALE_SYNC_DAYS, tenantHealth, tenantNote } from '@/server/torre/briefing';
import { led } from '@/shell/shell.css';
import * as u from '@/styles/torre.css';

import * as s from './ficha.css';

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className={s.stat}>
      <span className={u.eyebrow}>{label}</span>
      <span className={s.statValue}>{value}</span>
      <span className={u.kpiSub}>{sub}</span>
    </div>
  );
}

const DAY_MS = 86_400_000;

/** Revoked is off; never seen is a warning; seen within the sync window is fine. */
function deviceLed(d: TenantDetail['devices'][number], now: number): string {
  if (d.revokedAt) return led.off;
  if (!d.lastSeenAt) return led.warn;
  return now - Date.parse(d.lastSeenAt) > STALE_SYNC_DAYS * DAY_MS ? led.bad : led.ok;
}

function Devices({ devices }: { readonly devices: TenantDetail['devices'] }) {
  const now = Date.now();
  if (devices.length === 0)
    return <p className={u.rowDetail}>Sin dispositivos vinculados todavía.</p>;
  return (
    <ul className={s.devices}>
      {devices.map((d) => (
        <li key={d.id} className={s.device}>
          <span className={deviceLed(d, now)} aria-hidden="true" />
          <span className={s.deviceName}>{d.nombre}</span>
          <span className={u.faint}>
            {d.revokedAt
              ? `revocado ${formatDay(d.revokedAt)}`
              : `visto ${formatDay(d.lastSeenAt)}`}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Actions({ detail }: { readonly detail: TenantDetail }) {
  const stripe = stripeCustomerUrl(detail.billing.stripeCustomerId);
  const id = detail.summary.id;
  return (
    <div className={s.actions}>
      <Link className={u.linkPrimary} href={`/tenants/${id}` as Route}>
        Ficha completa y ajustes
      </Link>
      <Link className={u.linkButton} href={`/inbox?negocio=${id}` as Route}>
        Items en Inbox
      </Link>
      {stripe ? (
        <a className={u.linkButton} href={stripe} target="_blank" rel="noreferrer">
          Ver en Stripe
        </a>
      ) : null}
    </div>
  );
}

type Row = Parameters<typeof tenantHealth>[0];

function FichaHead({ row, closeHref }: { row: Row; closeHref: string }) {
  const { summary: t, billing, plan } = row;
  return (
    <div className={s.head}>
      <div className={s.headRow}>
        <span className={led[tenantHealth(row, new Date())]} aria-hidden="true" />
        <span className={u.eyebrow}>Ficha 360°</span>
        <Link href={closeHref as Route} className={s.close} aria-label="Cerrar" scroll={false}>
          ✕
        </Link>
      </div>
      <h2 id="ficha-title" className={s.name}>
        {t.nombre}
      </h2>
      <div className={s.chips}>
        <span className={s.chip}>
          {plan.effective === null ? 'Plan sin datos' : PLAN_LABELS[plan.effective]}
        </span>
        <span className={s.chipQuiet}>{BILLING_STATUS_LABELS[billing.status]}</span>
        <span className={u.faint}>{t.ownerEmail ?? 'Sin dueño en el portal'}</span>
      </div>
    </div>
  );
}

function Stats({ row }: { row: Row }) {
  const { summary: t, billing } = row;
  return (
    <div className={`${s.section} ${s.stats}`}>
      <Stat
        label="Dispositivos"
        value={`${t.devicesActive} / ${t.devicesTotal}`}
        sub="activos / en total"
      />
      <Stat label="Última sync" value={formatDay(t.lastSyncAt)} sub="de cualquier dispositivo" />
      <Stat label="Dueño entró" value={formatDay(t.lastOwnerLoginAt)} sub="al portal" />
      <Stat
        label="Alta"
        value={formatDay(t.createdAt)}
        sub={`próximo cargo ${formatDay(billing.currentPeriodEnd)}`}
      />
    </div>
  );
}

/**
 * The tenant's side panel over the list («Ficha 360°»): health, Don Cuentas's
 * note on what needs doing, the four facts that matter, its devices, and the
 * way to the full page where plan overrides live.
 */
export function Ficha({ detail, closeHref }: { detail: TenantDetail; closeHref: string }) {
  const row: Row = { summary: detail.summary, billing: detail.billing, plan: detail.plan };
  const note = tenantNote(row, new Date());
  return (
    <>
      <Link
        href={closeHref as Route}
        className={s.scrim}
        aria-label="Cerrar ficha"
        scroll={false}
      />
      <aside className={s.panel} aria-labelledby="ficha-title">
        <FichaHead row={row} closeHref={closeHref} />
        <div className={s.section}>
          <DonNote mood={note.mood}>{note.text}</DonNote>
        </div>
        <Stats row={row} />
        <div className={s.section}>
          <span className={u.eyebrow}>Dispositivos</span>
          <Devices devices={detail.devices} />
        </div>
        <Actions detail={detail} />
      </aside>
    </>
  );
}
