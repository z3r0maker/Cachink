'use client';

import { useActionState } from 'react';

import { FormStatus } from '@/components/form-status';
import { asignarme } from '@/server/actions/inbox';
import { button, stack } from '@/styles/ui.css';

/** «Asignármelo» — takes the item; the audit row records who had it before. */
export function AssignForm(props: { readonly id: string; readonly mine: boolean }) {
  const [state, action, pending] = useActionState(asignarme, null);
  return (
    <form action={action} className={stack}>
      <input type="hidden" name="id" value={props.id} />
      <button className={button} type="submit" disabled={pending || props.mine}>
        {props.mine ? 'Ya es tuyo' : pending ? 'Asignando…' : 'Asignármelo'}
      </button>
      <FormStatus state={state} />
    </form>
  );
}
