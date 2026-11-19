'use client';

import { useActionState } from 'react';

import { darDeBajaAction } from '@/server/actions/empresa-servicios';
import * as m from '@/styles/mostrador.css';

import { submitWith } from '../../movimientos/registrar/opciones';
import { Aviso } from '../../socios/formas';

/**
 * «Dar de baja» (E-24, board CD-18c): the service leaves the list and its
 * template stops suggesting; what it posted stays. «Editar» and saving brings
 * it back.
 */
export function DarDeBaja({
  servicioId,
  nombre,
}: {
  readonly servicioId: string;
  readonly nombre: string;
}) {
  const [state, action, pending] = useActionState(darDeBajaAction, null);
  return (
    <form onSubmit={submitWith(action)}>
      <input type="hidden" name="servicioId" value={servicioId} />
      <button
        className={m.boton.secundario}
        type="submit"
        disabled={pending}
        aria-label={`Dar de baja ${nombre}`}
      >
        Dar de baja
      </button>
      <Aviso state={state} />
    </form>
  );
}
