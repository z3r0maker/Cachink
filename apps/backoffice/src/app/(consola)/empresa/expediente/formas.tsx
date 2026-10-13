'use client';

import { CARPETAS } from '@xangarro/domain/corp';
import { useActionState } from 'react';

import {
  adjuntarAMovimientoAction,
  subirDocumentoAction,
  subirVersionAction,
} from '@/server/actions/empresa-expediente';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { Campo, submitWith } from '../movimientos/registrar/opciones';
import { Aviso } from '../socios/formas';

/** The Expediente's uploads (E-05): a new document, a new version, a movement's proof. */
const ACCEPT = 'application/pdf,image/png,image/jpeg,application/xml,text/xml,.xml';

function Archivo() {
  return (
    <label className={d.field}>
      <span className={d.label}>Archivo</span>
      <input className={d.input} type="file" name="archivo" required accept={ACCEPT} />
      <span className={d.hint}>PDF, imagen o XML, hasta 4 MB. Se guarda 5 años.</span>
    </label>
  );
}

export function SubirDocumentoForm({ carpeta }: { readonly carpeta: string }) {
  const [state, action, pending] = useActionState(subirDocumentoAction, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <label className={d.field}>
        <span className={d.label}>Carpeta</span>
        <select className={d.input} name="carpeta" defaultValue={carpeta}>
          {CARPETAS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>
      <div className={d.fields}>
        <Campo label="Nombre del documento" name="titulo" required autoComplete="off" />
        <Campo
          label="Periodo"
          name="periodo"
          placeholder="2026-09"
          hint="Un mes, un año, o vacío."
        />
      </div>
      <Archivo />
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          Subir documento
        </button>
      </div>
    </form>
  );
}

export function NuevaVersionForm({ documentoId }: { readonly documentoId: string }) {
  const [state, action, pending] = useActionState(subirVersionAction, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <input type="hidden" name="documentoId" value={documentoId} />
      <Archivo />
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.secundario} type="submit" disabled={pending}>
          Subir nueva versión
        </button>
      </div>
    </form>
  );
}

export function AdjuntarForm(props: {
  readonly entryId: string;
  readonly titulo: string;
  readonly periodo: string;
}) {
  const [state, action, pending] = useActionState(adjuntarAMovimientoAction, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <input type="hidden" name="entryId" value={props.entryId} />
      <input type="hidden" name="titulo" value={props.titulo} />
      <input type="hidden" name="periodo" value={props.periodo} />
      <Archivo />
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.secundario} type="submit" disabled={pending}>
          Adjuntar comprobante
        </button>
      </div>
    </form>
  );
}
