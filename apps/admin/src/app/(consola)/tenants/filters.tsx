import { PLAN_IDS } from '@xangarro/domain';

import { BILLING_STATUSES } from '@/server/billing/port';
import { BILLING_STATUS_LABELS, PLAN_LABELS } from '@/server/tenants/labels';
import { STALE_AFTER_DAYS } from '@/server/tenants/list';
import { buttonQuiet, field, input, label } from '@/styles/ui.css';

import { select } from '../inbox/inbox.css';
import type { TenantView } from './params';
import { check, filters } from './tenants.css';

function BillingSelects({ view }: { readonly view: TenantView }) {
  return (
    <>
      <label className={field}>
        <span className={label}>Plan</span>
        <select className={select} name="plan" defaultValue={view.plan ?? ''}>
          <option value="">Todos</option>
          {PLAN_IDS.map((p) => (
            <option key={p} value={p}>
              {PLAN_LABELS[p]}
            </option>
          ))}
        </select>
      </label>
      <label className={field}>
        <span className={label}>Suscripción</span>
        <select className={select} name="estado" defaultValue={view.estado ?? ''}>
          <option value="">Todas</option>
          {BILLING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {BILLING_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

/**
 * The tenant list's filters as a plain GET form: submitting it writes the URL,
 * and the URL is the state, so every view is shareable and needs no script.
 */
export function TenantFilters({ view }: { readonly view: TenantView }) {
  return (
    <form method="get" action="/tenants" className={filters} role="search">
      <label className={field}>
        <span className={label}>Buscar</span>
        <input
          className={input}
          type="search"
          name="q"
          defaultValue={view.q ?? ''}
          placeholder="Nombre, correo del dueño o id"
          maxLength={100}
        />
      </label>
      <BillingSelects view={view} />
      <label className={check}>
        <input type="checkbox" name="sin_sync" value="1" defaultChecked={view.sinSync} />
        Sin sincronizar &gt; {STALE_AFTER_DAYS} días
      </label>
      <button className={buttonQuiet} type="submit">
        Filtrar
      </button>
    </form>
  );
}
