'use client';

import { useActionState } from 'react';

import { FormStatus } from '@/components/form-status';
import { marcarRevisado } from '@/server/actions/revision';
import { button, field, input, label, stack } from '@/styles/ui.css';

export function RevisarForm() {
  const [state, action, pending] = useActionState(marcarRevisado, null);
  return (
    <form action={action} className={stack}>
      <label className={field}>
        <span className={label}>Nota (opcional)</span>
        <input className={input} name="nota" maxLength={280} />
      </label>
      <FormStatus state={state} />
      <button className={button} type="submit" disabled={pending}>
        {pending ? 'Registrando…' : 'Marcar como revisado'}
      </button>
    </form>
  );
}
