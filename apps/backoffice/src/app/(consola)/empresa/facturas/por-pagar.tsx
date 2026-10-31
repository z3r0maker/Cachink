'use client';

import { useActionState } from 'react';

import { cancelarFacturaAction, registrarPagoAction } from '@/server/actions/empresa-facturas';
import type { FormState } from '@/server/actions/form-state';
import * as mf from '@/styles/mostrador-facturas.css';
import * as d from '@/styles/mostrador-data.css';
import * as mv from '@/styles/mostrador-movimientos.css';
import * as m from '@/styles/mostrador.css';

import { submitWith } from '../movimientos/registrar/opciones';

type Accion = (prev: FormState, form: FormData) => Promise<FormState>;

/** One of the row's two buttons, with its own pending state and its error. */
function Boton({
  uuid,
  accion,
  texto,
  aria,
  clase,
}: {
  readonly uuid: string;
  readonly accion: Accion;
  readonly texto: string;
  readonly aria: string;
  readonly clase: string;
}) {
  const [state, action, pending] = useActionState(accion, null);
  return (
    <form className={mv.enLinea} onSubmit={submitWith(action)}>
      <input type="hidden" name="uuid" value={uuid} />
      <button className={clase} type="submit" disabled={pending} aria-label={aria}>
        {texto}
      </button>
      {state !== null && !state.ok ? (
        <p className={d.messageBad} role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

/**
 * An invoice on credit still owed (owner decision 9, board CD-06b): «Registrar
 * pago» posts today's bank outflow and makes its IVA creditable; «Cancelar»
 * reverses its expense when the supplier cancelled it or it came wrong.
 */
export function PorPagar({
  uuid,
  proveedor,
}: {
  readonly uuid: string;
  readonly proveedor: string;
}) {
  return (
    <div className={mf.porPagar}>
      <span className={`${m.tagBase} ${mf.tono.aviso}`}>Por pagar</span>
      <Boton
        uuid={uuid}
        accion={registrarPagoAction}
        texto="Registrar pago"
        aria={`Registrar pago a ${proveedor}`}
        clase={m.boton.primario}
      />
      <Boton
        uuid={uuid}
        accion={cancelarFacturaAction}
        texto="Cancelar"
        aria={`Cancelar la factura de ${proveedor}`}
        clase={m.boton.secundario}
      />
    </div>
  );
}
