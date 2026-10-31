'use client';

import type { FormState } from '@/server/actions/form-state';
import * as d from '@/styles/mostrador-data.css';
import * as pp from '@/styles/mostrador-por-pagar.css';
import * as m from '@/styles/mostrador.css';

/** «No, regresar» closes the panel; the other button confirms (boards CD-06e, CD-06f). */
export function Botones({
  confirmar,
  clase,
  pending,
  onCerrar,
  enfocarRegreso = false,
}: {
  readonly confirmar: string;
  readonly clase: string;
  readonly pending: boolean;
  readonly onCerrar: () => void;
  /** Cancelling is the riskier panel: its focus starts on the way back. */
  readonly enfocarRegreso?: boolean;
}) {
  return (
    <div className={m.row}>
      <button
        className={m.boton.quieto}
        type="button"
        autoFocus={enfocarRegreso}
        onClick={onCerrar}
      >
        No, regresar
      </button>
      <button className={clase} type="submit" disabled={pending}>
        {confirmar}
      </button>
    </div>
  );
}

export function Falla({ state }: { readonly state: FormState }) {
  if (state === null || state.ok) return null;
  return (
    <p className={`${d.messageBad} ${pp.error}`} role="alert">
      {state.message}
    </p>
  );
}
