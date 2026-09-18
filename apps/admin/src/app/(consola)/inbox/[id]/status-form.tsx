'use client';

import { useActionState } from 'react';
import { SUPPORT_STATUSES, type SupportStatus } from '@xangarro/domain';

import { FormStatus } from '@/components/form-status';
import { cambiarEstado } from '@/server/actions/inbox';
import { STATUS_LABELS } from '@/server/inbox/labels';
import { button, field, input, label, muted, stack } from '@/styles/ui.css';

import { select } from '../inbox.css';

interface Props {
  readonly id: string;
  readonly status: SupportStatus;
  /** Only `factura` items ("pagos sin CFDI") carry the folio fiscal field. */
  readonly factura: boolean;
  readonly cfdiUuid: string | null;
}

function CfdiField({ cfdiUuid }: { readonly cfdiUuid: string | null }) {
  return (
    <label className={field}>
      <span className={label}>UUID del CFDI (folio fiscal)</span>
      <input
        className={input}
        name="cfdiUuid"
        defaultValue={cfdiUuid ?? ''}
        placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
        pattern="[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}"
        autoComplete="off"
        spellCheck={false}
        maxLength={36}
      />
      <span className={muted}>Obligatorio para marcarlo como resuelto.</span>
    </label>
  );
}

export function StatusForm(props: Props) {
  const [state, action, pending] = useActionState(cambiarEstado, null);
  return (
    <form action={action} className={stack}>
      <input type="hidden" name="id" value={props.id} />
      <label className={field}>
        <span className={label}>Estado</span>
        <select className={select} name="status" defaultValue={props.status}>
          {SUPPORT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      {props.factura ? <CfdiField cfdiUuid={props.cfdiUuid} /> : null}
      <button className={button} type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar estado'}
      </button>
      <FormStatus state={state} />
    </form>
  );
}
