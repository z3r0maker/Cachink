'use client';

import { useActionState, useId } from 'react';

import { guardarCodigosAction, validarCodigosAction } from '@/server/actions/empresa-codigos';
import type { VistaCodigos } from '@/server/empresa/codigos-view';
import * as t from '@/styles/mostrador-contador.css';
import * as d from '@/styles/mostrador-data.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

import { submitWith } from '../../movimientos/registrar/opciones';
import { Aviso } from '../../socios/formas';

/** Board CD-10e's two writes: «Marcar como validada» and «Guardar los códigos». */
export function ValidarForm(props: { readonly listaId: string; readonly hoy: string }) {
  const [state, action, pending] = useActionState(validarCodigosAction, null);
  const id = useId();
  return (
    <form onSubmit={submitWith(action)} className={m.row} data-testid="codigos-validar">
      <input type="hidden" name="listaId" value={props.listaId} />
      <span className={d.field}>
        <label className={d.label} htmlFor={id}>
          Validada por el contador el
        </label>
        <input
          id={id}
          className={d.input}
          type="date"
          name="fecha"
          required
          defaultValue={props.hoy}
          max={props.hoy}
        />
      </span>
      <button className={m.boton.primario} type="submit" disabled={pending}>
        Marcar como validada
      </button>
      <Aviso state={state} />
    </form>
  );
}

function Filas({ grupo }: { readonly grupo: VistaCodigos['grupos'][number] }) {
  return (
    <>
      <tr>
        <th scope="rowgroup" colSpan={3} className={t.grupo}>
          {grupo.nombre}
        </th>
      </tr>
      {grupo.filas.map((f) => (
        <tr key={f.cuenta} data-cuenta={f.cuenta}>
          <th scope="row" className={d.tdStrong}>
            {f.nombre}
          </th>
          <td className={d.td}>{f.naturaleza}</td>
          <td className={d.td}>
            <span className={t.conCodigo}>
              <input
                className={t.entradaCodigo[f.falta ? 'falta' : 'normal']}
                type="text"
                name={`codigo_${f.cuenta}`}
                defaultValue={f.codigo}
                placeholder="000.00"
                inputMode="decimal"
                aria-label={`Código agrupador de ${f.nombre}`}
              />
              {f.falta ? <span className={t.falta}>Falta</span> : null}
            </span>
          </td>
        </tr>
      ))}
    </>
  );
}

export function CodigosForm({ v }: { readonly v: VistaCodigos }) {
  const [state, action, pending] = useActionState(guardarCodigosAction, null);
  return (
    <form onSubmit={submitWith(action)} className={m.stack} data-testid="codigos-form">
      <div className={d.tableWrap}>
        <table className={d.table}>
          <thead>
            <tr>
              <th scope="col" className={d.th}>
                Cuenta
              </th>
              <th scope="col" className={d.th}>
                Naturaleza
              </th>
              <th scope="col" className={d.th}>
                Código agrupador
              </th>
            </tr>
          </thead>
          <tbody>
            {v.grupos.map((g) => (
              <Filas key={g.nombre} grupo={g} />
            ))}
          </tbody>
        </table>
      </div>
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          Guardar los códigos
        </button>
        <span className={i.muted}>{v.guardarTexto}</span>
        <Aviso state={state} />
      </div>
    </form>
  );
}
