import Link from 'next/link';
import type { Route } from 'next';
import { FALLBACK_PLAN } from '@xangarro/domain';

import { PLAN_LABELS } from '@/server/tenants/labels';
import type { MetricUsage } from '@/server/usage/limits';
import type { UsageRow } from '@/server/usage/row';
import { muted } from '@/styles/ui.css';

import { name, sub, table, tableWrap, tag, td, th } from '../tenants/tenants.css';
import { badge } from './uso.css';

const HEADERS = ['Negocio', 'Plan', 'Transacciones del mes', 'Productos activos', 'Mes anterior'];

const BAND_LABELS = { 80: '80 %', 100: 'Límite', 150: '150 %' } as const;

const count = new Intl.NumberFormat('es-MX');

function MetricCell({ m }: { readonly m: MetricUsage }) {
  return (
    <td className={td}>
      {count.format(m.value)}
      {m.band !== null ? <span className={badge[m.band]}>{BAND_LABELS[m.band]}</span> : null}
      <span className={sub}>
        {m.limit === null ? 'Sin límite' : `${m.percent ?? 0} % de ${count.format(m.limit)}`}
      </span>
    </td>
  );
}

function Row({ row }: { readonly row: UsageRow }) {
  const t = row.tenant;
  const plan = row.plan.effective;
  return (
    <tr>
      <td className={td}>
        <Link href={`/tenants/${t.id}` as Route} className={name}>
          {t.nombre}
        </Link>
        {row.twoMonthsOver ? <span className={badge.upgrade}>2 meses sobre el límite</span> : null}
      </td>
      <td className={td}>
        {PLAN_LABELS[plan ?? FALLBACK_PLAN]}
        {plan === null ? <span className={tag}>sin datos de Stripe</span> : null}
      </td>
      <MetricCell m={row.current.transactions} />
      <MetricCell m={row.current.activeProducts} />
      <td className={td}>
        {row.previous === null ? '—' : count.format(row.previous.transactions)}
        <span className={sub}>transacciones</span>
      </td>
    </tr>
  );
}

export function UsageTable({ rows }: { readonly rows: readonly UsageRow[] }) {
  if (rows.length === 0) return <p className={muted}>Ningún negocio en esta vista.</p>;
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
            <Row key={r.tenant.id} row={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
