'use client';

import { useActionState } from 'react';

import { pagarMitad, pedirFondeo } from '@/server/actions/empresa-socios';
import type { FormState } from '@/server/actions/form-state';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { Campo, submitWith } from '../movimientos/registrar/opciones';

/** Socios' small forms (E-03): ask for funding by halves, record a half. */
export function Aviso({ state }: { readonly state: FormState }) {
  if (state === null) return null;
  return (
    <p className={state.ok ? d.messageOk : d.messageBad} role={state.ok ? 'status' : 'alert'}>
      {state.message}
    </p>
  );
}

export function PedirFondeoForm({ hoy }: { readonly hoy: string }) {
  const [state, action, pending] = useActionState(pedirFondeo, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <div className={d.fields}>
        <Campo label="Para qué es" name="concepto" required autoComplete="off" />
        <Campo label="Monto total" name="total" inputMode="decimal" required />
        <Campo label="Fecha límite" name="vence" type="date" required min={hoy} />
      </div>
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          Pedir fondeo por mitades
        </button>
      </div>
    </form>
  );
}

export function PagarMitadForm(props: {
  readonly callId: string;
  readonly socio: 1 | 2;
  readonly hoy: string;
}) {
  const [state, action, pending] = useActionState(pagarMitad, null);
  return (
    <form onSubmit={submitWith(action)} className={m.row}>
      <input type="hidden" name="callId" value={props.callId} />
      <input type="hidden" name="socio" value={props.socio} />
      <input type="hidden" name="fecha" value={props.hoy} />
      <button className={m.boton.secundario} type="submit" disabled={pending}>
        Registrar mitad de F{props.socio}
      </button>
      <Aviso state={state} />
    </form>
  );
}
