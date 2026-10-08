'use client';

import { useActionState } from 'react';

import { revertirMovimiento } from '@/server/actions/empresa';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { Campo, submitWith } from '../registrar/opciones';

/**
 * «Revertir» (E-02): an entry is never edited. Its reversal posts the same
 * lines with the sides swapped, dated when the mistake was found, and the
 * founder records the right one afterwards.
 */
export function RevertirForm({ entryId, hoy }: { readonly entryId: string; readonly hoy: string }) {
  const [state, action, pending] = useActionState(revertirMovimiento, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <input type="hidden" name="entryId" value={entryId} />
      <div className={d.fields}>
        <Campo label="¿Por qué lo reviertes?" name="motivo" required autoComplete="off" />
        <Campo label="Fecha de la reversa" name="fecha" type="date" required defaultValue={hoy} />
      </div>
      {state !== null && !state.ok ? (
        <p className={d.messageBad} role="alert">
          {state.message}
        </p>
      ) : null}
      <div className={m.row}>
        <button className={m.boton.peligro} type="submit" disabled={pending}>
          Revertir movimiento
        </button>
      </div>
    </form>
  );
}
