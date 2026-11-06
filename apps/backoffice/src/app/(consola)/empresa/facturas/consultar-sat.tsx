'use client';

import { useActionState, type ReactNode } from 'react';

import { consultarSatAction } from '@/server/actions/empresa-factura-sat';
import * as ms from '@/styles/mostrador-sat.css';
import * as m from '@/styles/mostrador.css';

import { submitWith } from '../movimientos/registrar/opciones';

/**
 * «Consultar al SAT» next to a «Sin verificar» tag (board CD-06g). The answer
 * that settles it reloads the list; no answer says why, in place.
 */
export function ConsultarSat({
  uuid,
  mes,
  proveedor,
  children,
}: {
  readonly uuid: string;
  readonly mes: string;
  readonly proveedor: string;
  /** The «Sin verificar» tag. */
  readonly children: ReactNode;
}) {
  const [state, action, pending] = useActionState(consultarSatAction, null);
  return (
    <form className={ms.consulta} onSubmit={submitWith(action)}>
      <input type="hidden" name="uuid" value={uuid} />
      <input type="hidden" name="mes" value={mes} />
      <div className={ms.fila}>
        {children}
        {pending ? (
          <span className={ms.consultando} role="status">
            Consultando al SAT…
          </span>
        ) : (
          <button
            className={m.boton.secundario}
            type="submit"
            aria-label={`Consultar al SAT la factura de ${proveedor}`}
          >
            Consultar al SAT
          </button>
        )}
      </div>
      {state !== null && !state.ok && !pending ? (
        <span className={ms.falla} role="alert">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
