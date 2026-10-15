'use client';

import { useActionState } from 'react';

import { dejarDeRepetir } from '@/server/actions/empresa-recurrentes';
import * as d from '@/styles/mostrador-data.css';
import * as mv from '@/styles/mostrador-movimientos.css';
import * as m from '@/styles/mostrador.css';

import { submitWith } from './registrar/opciones';

/** «Dejar de repetir» (E-02): the template stops suggesting; its past charges stay. */
export function DejarDeRepetir({
  plantillaId,
  nombre,
}: {
  readonly plantillaId: string;
  readonly nombre: string;
}) {
  const [state, action, pending] = useActionState(dejarDeRepetir, null);
  return (
    <form className={mv.enLinea} onSubmit={submitWith(action)}>
      <input type="hidden" name="plantillaId" value={plantillaId} />
      <button
        className={m.boton.quieto}
        type="submit"
        disabled={pending}
        aria-label={`Dejar de repetir ${nombre}`}
      >
        Dejar de repetir
      </button>
      {state !== null && !state.ok ? (
        <p className={d.messageBad} role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
