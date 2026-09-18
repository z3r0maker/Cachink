import { Fragment } from 'react';
import type { PlanOverride } from '@xangarro/domain';

import { formatInstant } from '@/server/inbox/labels';
import type { TenantDetail } from '@/server/tenants/detail';
import { formatDay, OVERRIDE_LABELS, PLAN_LABELS, ROLE_LABELS } from '@/server/tenants/labels';
import { label, muted, stack } from '@/styles/ui.css';

import { facts } from '../../inbox/inbox.css';
import { sectionTitle, sub, table, td, th } from '../tenants.css';

export function Members({ members }: { readonly members: TenantDetail['members'] }) {
  return (
    <div className={stack}>
      <h2 className={sectionTitle}>Miembros del portal</h2>
      {members.length === 0 ? <p className={muted}>Sin miembros.</p> : null}
      <dl className={facts}>
        {members.map((m) => (
          <Fragment key={m.userId}>
            <dt className={label}>{ROLE_LABELS[m.role]}</dt>
            <dd>{m.email ?? m.userId}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}

export function Devices({ devices }: { readonly devices: TenantDetail['devices'] }) {
  return (
    <div className={stack}>
      <h2 className={sectionTitle}>Dispositivos</h2>
      {devices.length === 0 ? (
        <p className={muted}>Ningún dispositivo vinculado.</p>
      ) : (
        <table className={table}>
          <thead>
            <tr>
              <th className={th} scope="col">
                Nombre
              </th>
              <th className={th} scope="col">
                Visto
              </th>
              <th className={th} scope="col">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td className={td}>
                  {d.nombre}
                  <span className={sub}>{d.plataforma}</span>
                </td>
                <td className={td}>{d.lastSeenAt ? formatInstant(d.lastSeenAt) : 'Nunca'}</td>
                <td className={td}>
                  {d.revokedAt ? `Revocado ${formatDay(d.revokedAt)}` : 'Activo'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function Entitlement({ detail }: { readonly detail: TenantDetail }) {
  const { plan, limits } = detail;
  const effective = plan.effective === null ? 'Sin datos de Stripe' : PLAN_LABELS[plan.effective];
  return (
    <div className={stack}>
      <h2 className={sectionTitle}>Plan y licencia</h2>
      <dl className={facts}>
        <dt className={label}>Plan en Stripe</dt>
        <dd>{plan.base === null ? 'Sin datos (B-10)' : PLAN_LABELS[plan.base]}</dd>
        <dt className={label}>Plan efectivo</dt>
        <dd>
          {effective}
          {plan.effect.compedUntil ? ` · regalo hasta ${formatDay(plan.effect.compedUntil)}` : ''}
        </dd>
        <dt className={label}>Prueba extendida</dt>
        <dd>
          {plan.effect.trialExtensionDays > 0 ? `+${plan.effect.trialExtensionDays} días` : 'No'}
        </dd>
        <dt className={label}>Reemisión pedida</dt>
        <dd>
          {plan.effect.reissueRequestedAt ? formatInstant(plan.effect.reissueRequestedAt) : 'No'}
        </dd>
        <dt className={label}>Operadores / dispositivos</dt>
        <dd>
          {limits.operators} / {limits.devices}
        </dd>
        <dt className={label}>Funciones</dt>
        <dd>{limits.features.length === 0 ? 'Ninguna' : limits.features.join(', ')}</dd>
        <dt className={label}>Asesor</dt>
        <dd>{limits.capabilities.asesor}</dd>
      </dl>
    </div>
  );
}

function describe(o: PlanOverride): string {
  if (o.kind === 'extend_trial') return `+${o.days} días`;
  if (o.kind === 'comp_plan') return `${PLAN_LABELS[o.planId]} — ${o.reason}`;
  return 'Licencia nueva en la próxima sincronización';
}

export function OverrideHistory({ overrides }: { readonly overrides: readonly PlanOverride[] }) {
  return (
    <div className={stack}>
      <h2 className={sectionTitle}>Ajustes</h2>
      {overrides.length === 0 ? <p className={muted}>Ningún ajuste.</p> : null}
      <ul className={muted}>
        {overrides.map((o) => (
          <li key={o.id}>
            <strong>{OVERRIDE_LABELS[o.kind]}</strong> · {describe(o)} ·{' '}
            {formatInstant(o.createdAt)}
            {o.expiresAt ? ` · vence ${formatDay(o.expiresAt)}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
