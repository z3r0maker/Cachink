import { recentAudit, type AuditEntry } from '@/server/db/audit-feed';
import { db } from '@/server/db/client';
import { snapshotOf } from '@/server/capacity/port';
import { capacityMetrics } from '@/server/capacity/status';
import { requireStaffPage } from '@/server/staff';
import { listTenants, type TenantListResult } from '@/server/tenants/list';
import { tenantDeps } from '@/server/tenants/wiring';
import { briefing } from '@/server/torre/briefing';
import { capacityNow, openInboxItems } from '@/server/torre/readings';
import { listUsage, type UsageListResult } from '@/server/usage/list';
import { usageDeps } from '@/server/usage/wiring';
import * as u from '@/styles/torre.css';

import { RevisarForm } from './revisar-form';
import * as s from './inicio.css';
import { Attention, Bitacora, BriefCard, Kpi } from './turno';

/** Every reading on this page is live: nothing here may be a cached number. */
export const dynamic = 'force-dynamic';

const DAY = 86_400_000;

async function soft<T>(what: string, run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    // Inicio stays usable with one panel short; the panel says it could not read.
    console.error(`inicio: ${what} failed`, error);
    return null;
  }
}

function tenantKpi(r: TenantListResult | null, now: Date) {
  if (r === null) return { value: '—', sub: 'no se pudo leer' };
  const fresh = r.tenants.filter((t) => now.getTime() - Date.parse(t.summary.createdAt) < 7 * DAY);
  return {
    value: `${r.tenants.length}${r.nextCursor ? '+' : ''}`,
    sub: `${fresh.length} ${fresh.length === 1 ? 'alta' : 'altas'} en 7 días`,
  };
}

function billingKpi(r: TenantListResult | null) {
  if (r === null) return { value: '—', sub: 'no se pudo leer' };
  if (!r.billingKnown) return { value: '—', sub: 'el estado de Stripe llega con B-10' };
  const active = r.tenants.filter((t) => t.billing.status === 'active').length;
  const trial = r.tenants.filter((t) => t.billing.status === 'trialing').length;
  return { value: String(active), sub: `activas${trial > 0 ? ` · ${trial} en prueba` : ''}` };
}

function usageKpi(r: UsageListResult | null) {
  if (r === null) return { value: '—', sub: 'no se pudo leer' };
  const now = r.rows.reduce((a, x) => a + x.current.transactions.value, 0);
  const prev = r.rows.reduce((a, x) => a + (x.previous?.transactions ?? 0), 0);
  return {
    value: now.toLocaleString('es-MX'),
    sub: `mes ${r.period} · el anterior: ${prev.toLocaleString('es-MX')}`,
  };
}

async function load(now: Date) {
  const [tenants, usage, open, cap, audit] = await Promise.all([
    soft('tenants', () => listTenants(tenantDeps(db()), { limit: 100 }, now)),
    soft('usage', () => listUsage(usageDeps(db()), { limit: 100 }, now)),
    openInboxItems(),
    capacityNow(),
    soft<AuditEntry[]>('audit', () => recentAudit(db(), 6)),
  ]);
  const b = briefing({
    tenants: tenants?.tenants ?? [],
    openItems: open ?? [],
    capacity: cap === null ? null : capacityMetrics(snapshotOf(cap)),
    now,
  });
  return { b, audit, t: tenantKpi(tenants, now), bill: billingKpi(tenants), use: usageKpi(usage) };
}

export default async function InicioPage() {
  await requireStaffPage();
  const { b, audit, t, bill, use } = await load(new Date());
  return (
    <div className={u.page}>
      <header className={u.pageHead}>
        <div>
          <span className={u.eyebrow}>Inicio</span>
          <h1 className={u.title}>Turno de hoy</h1>
        </div>
      </header>
      <div className={s.top}>
        <BriefCard b={b} />
        <Kpi label="Negocios" value={t.value} sub={t.sub} />
        <Kpi label="Suscripciones" value={bill.value} sub={bill.sub} />
        <Kpi label="Transacciones del mes" value={use.value} sub={use.sub} />
      </div>
      <div className={s.split}>
        <Attention b={b} />
        <Bitacora entries={audit}>
          <RevisarForm />
        </Bitacora>
      </div>
    </div>
  );
}
