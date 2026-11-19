'use client';

import { useActionState, useId } from 'react';

import {
  cerrarMesAction,
  responderReaperturaAction,
  subirEstadosAction,
} from '@/server/actions/empresa-cierre';
import * as d from '@/styles/mostrador-data.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

import { submitWith } from '../movimientos/registrar/opciones';
import { Aviso } from '../socios/formas';
import { useEnvioConArchivo } from '../subida-directa';

/** The month's buttons on board CD-10: «Cerrar», the statements' upload, «Rechazar». */
const nombre = (mes: string) =>
  new Intl.DateTimeFormat('es-MX', { month: 'long', timeZone: 'UTC' }).format(
    new Date(`${mes}-15T12:00:00Z`),
  );

function Candado() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function CerrarForm({ mes, puede }: { readonly mes: string; readonly puede: boolean }) {
  const [state, action, pending] = useActionState(cerrarMesAction, null);
  return (
    <form onSubmit={submitWith(action)} className={m.row}>
      <input type="hidden" name="periodo" value={mes} />
      <button
        className={puede ? m.boton.primario : m.boton.quieto}
        type="submit"
        disabled={!puede || pending}
      >
        <Candado />
        {`Cerrar ${nombre(mes)}`}
      </button>
      <Aviso state={state} />
    </form>
  );
}

export function SubirEstados({ mes, otra }: { readonly mes: string; readonly otra: boolean }) {
  const [state, action, pending] = useActionState(subirEstadosAction, null);
  const { onSubmit, subiendo } = useEnvioConArchivo(action);
  const id = useId();
  return (
    <form onSubmit={onSubmit} className={m.row}>
      <input type="hidden" name="periodo" value={mes} />
      <label className={d.label} htmlFor={id}>
        {otra ? 'Otra versión' : 'Archivo'}
      </label>
      <input
        id={id}
        className={i.archivo}
        type="file"
        name="archivo"
        required
        accept="application/pdf,image/png,image/jpeg"
      />
      <button
        className={otra ? m.boton.quieto : m.boton.primario}
        type="submit"
        disabled={pending || subiendo}
      >
        Subir
      </button>
      <Aviso state={state} />
    </form>
  );
}

export function RechazarForm({ mes }: { readonly mes: string }) {
  const [state, action, pending] = useActionState(responderReaperturaAction, null);
  return (
    <form onSubmit={submitWith(action)} className={m.row}>
      <input type="hidden" name="periodo" value={mes} />
      <input type="hidden" name="respuesta" value="rechazar" />
      <button className={m.boton.secundario} type="submit" disabled={pending}>
        Rechazar
      </button>
      <Aviso state={state} />
    </form>
  );
}
