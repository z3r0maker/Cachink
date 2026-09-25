import Link from 'next/link';
import type { Route } from 'next';

import { BILLING_STATUS_LABELS, formatDay, PLAN_LABELS } from '@/server/tenants/labels';
import type { TenantRow } from '@/server/tenants/list';
import { syncIsStale, tenantHealth, type Health } from '@/server/torre/briefing';
import { led } from '@/shell/shell.css';
import { muted } from '@/styles/ui.css';

import { healthCell, name, stale, sub, table, tableWrap, tag, td, th } from './tenants.css';

const HEALTH_LABEL: Readonly<Record<Health, string>> = {
  ok: 'Sin pendientes',
  warn: 'Revisar',
  bad: 'Requiere atención',
  off: 'Detalle menor',
};

const HEADERS = [
  'Salud',
  'Negocio',
  'Plan',
  'Suscripción',
  'Dispositivos',
  'Última sincronización',
  'Último acceso del dueño',
  'Alta',
] as const;

function PlanCell({ row }: { readonly row: TenantRow }) {
  const { effective, effect } = row.plan;
  return (
    <td className={td}>
      {effective === null ? '—' : PLAN_LABELS[effective]}
      {effect.compedBy !== null ? <span className={tag}>regalo</span> : null}
      {effect.trialExtensionDays > 0 ? (
        <span className={tag}>+{effect.trialExtensionDays} d prueba</span>
      ) : null}
    </td>
  );
}

function Row({ row, now }: { readonly row: TenantRow; readonly now: Date }) {
  const s = row.summary;
  const health = tenantHealth(row, now);
  return (
    <tr>
      <td className={`${td} ${healthCell}`}>
        <span className={led[health]} role="img" aria-label={HEALTH_LABEL[health]} />
      </td>
      <td className={td}>
        <Link href={`/tenants/${s.id}` as Route} className={name}>
          {s.nombre}
        </Link>
        <span className={sub}>{s.ownerEmail ?? 'Sin dueño en el portal'}</span>
      </td>
      <PlanCell row={row} />
      <td className={td}>{BILLING_STATUS_LABELS[row.billing.status]}</td>
      <td className={td}>
        {s.devicesActive} activos
        <span className={sub}>{s.devicesTotal} en total</span>
      </td>
      <td className={syncIsStale(row, now) ? `${td} ${stale}` : td}>{formatDay(s.lastSyncAt)}</td>
      <td className={td}>{formatDay(s.lastOwnerLoginAt)}</td>
      <td className={td}>{formatDay(s.createdAt)}</td>
    </tr>
  );
}

export function TenantTable({ rows }: { readonly rows: readonly TenantRow[] }) {
  if (rows.length === 0) {
    return (
      <p className={muted}>
        No hay negocios con estos filtros. Don Cuentas revisó dos veces, y eso que cobra por hora.
      </p>
    );
  }
  const now = new Date();
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
          {rows.map((r) => (
            <Row key={r.summary.id} row={r} now={now} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
