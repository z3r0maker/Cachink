'use client';

import { MAX_TRIAL_EXTENSION_DAYS } from '@xangarro/domain';

import { ConfirmForm } from '@/components/confirm-form';
import { aplicarAjuste } from '@/server/actions/tenants';
import { field, input, label, muted } from '@/styles/ui.css';

import { select } from '../../inbox/inbox.css';
import { sectionTitle } from '../tenants.css';

interface Tenant {
  readonly businessId: string;
  readonly nombre: string;
}

const PAID = [
  ['xangarro', 'Xangarro'],
  ['xangarrote', 'Xangarrote'],
] as const;

const str = (form: FormData, key: string) => String(form.get(key) ?? '');

function Hidden({ businessId, kind }: { readonly businessId: string; readonly kind: string }) {
  return (
    <>
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="kind" value={kind} />
    </>
  );
}

function ExtendTrial({ businessId, nombre }: Tenant) {
  return (
    <ConfirmForm
      action={aplicarAjuste}
      trigger="Extender prueba…"
      describe={(f) =>
        `${nombre} tendrá ${str(f, 'days')} días más de prueba. Queda en la bitácora.`
      }
    >
      <Hidden businessId={businessId} kind="extend_trial" />
      <label className={field}>
        <span className={label}>Días extra de prueba</span>
        <input
          className={input}
          type="number"
          name="days"
          min={1}
          max={MAX_TRIAL_EXTENSION_DAYS}
          defaultValue={7}
          required
        />
      </label>
    </ConfirmForm>
  );
}

function CompFields() {
  return (
    <>
      <label className={field}>
        <span className={label}>Plan</span>
        <select className={select} name="planId" defaultValue="xangarrote">
          {PAID.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className={field}>
        <span className={label}>Hasta (inclusive)</span>
        <input className={input} type="date" name="hasta" required />
      </label>
      <label className={field}>
        <span className={label}>Motivo</span>
        <input className={input} name="reason" minLength={3} maxLength={500} required />
      </label>
    </>
  );
}

function CompPlan({ businessId, nombre }: Tenant) {
  const describe = (f: FormData) =>
    `${nombre} tendrá ${str(f, 'planId')} sin costo hasta el ${str(f, 'hasta')} (inclusive). ` +
    `Motivo: «${str(f, 'reason')}». Queda en la bitácora y vence solo.`;
  return (
    <ConfirmForm action={aplicarAjuste} trigger="Regalar plan…" describe={describe}>
      <Hidden businessId={businessId} kind="comp_plan" />
      <CompFields />
    </ConfirmForm>
  );
}

function Reissue({ businessId, nombre }: Tenant) {
  const describe = () =>
    `Cada dispositivo de ${nombre} recibirá una licencia firmada nueva en su próxima ` +
    'sincronización. El plan no cambia.';
  return (
    <ConfirmForm action={aplicarAjuste} trigger="Reemitir licencia…" describe={describe}>
      <Hidden businessId={businessId} kind="reissue_entitlement" />
      <p className={muted}>Fuerza una licencia firmada nueva; no cambia el plan.</p>
    </ConfirmForm>
  );
}

/** The three audited, expiring overrides (N-06), each behind a confirmation. */
export function OverrideForms(props: Tenant) {
  return (
    <>
      <h2 className={sectionTitle}>Nuevo ajuste</h2>
      <ExtendTrial {...props} />
      <CompPlan {...props} />
      <Reissue {...props} />
    </>
  );
}
