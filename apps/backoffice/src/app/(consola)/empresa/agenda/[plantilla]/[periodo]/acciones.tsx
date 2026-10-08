'use client';

import { TIPOS_EVIDENCIA, type TipoEvidencia } from '@xangarro/domain/corp';
import { useActionState, useState } from 'react';

import { marcarObligacionAction, subirEvidenciaAction } from '@/server/actions/empresa-agenda';
import { NOMBRE_DOCUMENTO, type Accion } from '@/server/empresa/obligacion-view';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { Opciones, submitWith } from '../../../movimientos/registrar/opciones';
import { Aviso } from '../../../socios/formas';

/** An obligation's buttons and its upload (E-04): each step posts, each file uploads. */
interface Clave {
  readonly plantilla: string;
  readonly periodo: string;
}

function Marcar({ clave, accion }: { readonly clave: Clave; readonly accion: Accion }) {
  const [state, action, pending] = useActionState(marcarObligacionAction, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <input type="hidden" name="plantilla" value={clave.plantilla} />
      <input type="hidden" name="periodo" value={clave.periodo} />
      <input type="hidden" name="nuevo" value={accion.nuevo} />
      <input type="hidden" name="sinPago" value={accion.sinPago ? 'si' : 'no'} />
      <button
        className={accion.sinPago ? m.boton.secundario : m.boton.primario}
        type="submit"
        disabled={pending || accion.bloqueada !== null}
      >
        {accion.label}
      </button>
      {accion.bloqueada === null ? null : <span className={d.hint}>{accion.bloqueada}</span>}
      <Aviso state={state} />
    </form>
  );
}

export function Acciones(props: Clave & { readonly acciones: readonly Accion[] }) {
  if (props.acciones.length === 0) return null;
  return (
    <div className={m.row}>
      {props.acciones.map((a) => (
        <Marcar key={`${a.nuevo}-${a.sinPago}`} clave={props} accion={a} />
      ))}
    </div>
  );
}

export function Subir(props: Clave & { readonly tipos: readonly TipoEvidencia[] }) {
  const [state, action, pending] = useActionState(subirEvidenciaAction, null);
  const [tipo, setTipo] = useState<string>(props.tipos[0] ?? 'otro');
  const opciones = props.tipos
    .filter((t) => TIPOS_EVIDENCIA.includes(t))
    .map((t) => ({ value: t, title: NOMBRE_DOCUMENTO[t] }));
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <input type="hidden" name="plantilla" value={props.plantilla} />
      <input type="hidden" name="periodo" value={props.periodo} />
      <Opciones
        legend="¿Qué documento es?"
        name="tipo"
        opciones={opciones}
        value={tipo}
        onChange={setTipo}
      />
      <label className={d.field}>
        <span className={d.label}>Archivo</span>
        <input
          className={d.input}
          type="file"
          name="archivo"
          required
          accept="application/pdf,image/png,image/jpeg,application/xml,text/xml,.xml"
        />
        <span className={d.hint}>PDF, imagen o XML del SAT, hasta 4 MB. Se guarda 5 años.</span>
      </label>
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.secundario} type="submit" disabled={pending}>
          Subir documento
        </button>
      </div>
    </form>
  );
}
